# Review: Plaza English, a low-pressure speaking sim

**中文摘要:** 这个项目的底子不错：免费、静态、手机能跑，有脚本对话、语音匹配、跟读和笔记本。但它离"让不敢开口的人自然开口"还有距离。三个主要问题如下。
1. 环境对话会互相打断。根因是调度器按"开始时间"计时，不是按"说完时间"，而且 TTS 会用 `speechSynthesis.cancel()` 切掉上一句。
2. 玩家只能"加入"，不能先"看"。
3. 没有表演或角色扮演，也没有任何"说什么都算数"的兜底。

建议第 1 轮先做轮流发言调度器，然后做"先看后演"的小剧场，再加剧院和传送门。

---

## 1. Evaluation against the design value

**Strengths**
- **Zero setup, zero cost.** There is no backend, no key, and procedural avatars. A reluctant learner can open a link and walk around.
- **Typing and tapping are first-class.** Replies work by tap, typing, or push-to-talk. The `ScriptedProvider` / `match.js` fuzzy matching (synonyms, Levenshtein, "Did you mean…?") forgives imperfect speech.
- **Ambient lines are visible before you join.** Nearby chat shows via `hud.setAmbient(group.recent.slice(-2))` and 3D bubbles. This is the seed of "watch first."
- **Good learning scaffolding.** It has Chinese toggles, hints, a notebook with ☆, Listen & Repeat with per-word colour, and daily missions.
- **`DialogueEngine` is provider-agnostic**, so scripted content can later be swapped for an AI provider.

**Weaknesses**
- **Ambient chat is a 6-line loop.** `AMBIENT[...]` in `data/conversations.js` repeats forever, cannot be joined mid-flow, and has no story. It is background noise, not something worth watching.
- **Joining is a cold start.** `openChooser(group)` has the player pick a conversation from a menu and then answer immediately. There is no observing, no "your turn soon" ramp, and no rehearsal. That is high pressure for the target user.
- **Replies are a closed set.** The three or so choices per turn are scored, and a miss yields "rephrase." A shy speaker who says something slightly different gets a rejection signal. Voice scoring (`match.js` confidence, `stats.voiceMatches`) rewards accuracy rather than attempting.
- **Missions reward volume and voice use, not courage.** There is no "spoke at all" streak and no private mode. Listen & Repeat is private, which is good, but it is a separate silo.
- **Only 4 zones with one group each.** The `GROUP_ZONE` / `groups[...]` structure assumes one group per zone and one ambient script per zone.
- **NPC gaze is crude.** The `state.look` / `lookHeadAt` hook exists in `npc.js`, but the ambient loop only calls `npc.face(anchor)`, so listeners are never made to look at the speaker.

---

## 2. Interruption problem

### Root causes (`main.js: updateAmbient`, `npc.js: say`)
1. **Timer starts at line start, not line end.** `group.timer = 2.2–4.3 s (+1.3–2.9 s 22% of the time)` is set at emission. The bubble holds `min(4.2, 1.6 + len*0.035)`. A 70-character line holds about 4 s, so a 2.2 s pause fires the next speaker mid-line. The `group.focus` window (`hold + 0.5`) is overwritten too.
2. **`say()` hard-replaces the bubble.** `setBubbleText` and `bubbleUntil` are overwritten, so the first speaker's text vanishes. Two bubbles may also show at once, because each NPC owns its own bubble.
3. **TTS is not sequenced.** `speakLine` calls `speechSynthesis.cancel()` and then `speak()`. Each new line chops the previous one. The utterance has no `onend` hook, so the scheduler cannot wait for it. Utterance length also differs from `len*0.035`.
4. **No state beyond a counter.** A group has `index`/`timer`/`paused`. There is no "who holds the floor," no listeners, and no notion of the visit/join interactions. The wandering `updateVisitors` NPCs walk into the group but never take part.
5. **Pause/resume is abrupt.** `group.paused = true` on join stops the loop mid-line. Leaving resumes at a random index, so conversations start mid-thread.

### Design: per-group `Scene Director` (turn-taking scheduler)

**Data model**
```js
// script line
{ id, speaker, text, zh, dur?,        // dur optional; else estimate
  to?: 'Noah',                        // addressee (gaze target), default: group
  gapAfter?: [0.5, 1.2],              // seconds of silence after
  react?: [{ who:'Noah', kind:'nod', at:0.6 }],       // listener reactions, relative to line start
  back?:  [{ who:'Priya', text:'Mm-hm', at:0.55 }]    // backchannels (overlap allowed)
}
// runtime per group
group.floor = { speaker, lineId, startAt, endAt, state }
group.state = 'idle' | 'speaking' | 'gap' | 'held'
```

**State machine (one per group, ticked in `updateAmbient`):**
`gap → (pick next) → leadIn (listeners turn, 0.3 s) → speaking → tail (0.2 s) → gap → …`

- **Only the scheduler grants the floor.** NPCs never call `say()` directly; they call `group.floor.request()`.
- **Duration:** `dur = max(1.4, words/2.6 s)` as the baseline, or, with TTS on, `utter.onend` ends the state. Use `max(onend, minDur)` and a watchdog of `dur*1.8`. Make `speakLine` return a Promise.
- **Gap:** `gapAfter` is drawn from a distribution, e.g. 0.5–1.2 s normally, 1.5–2.5 s after a question (so a player could answer), and 0.2–0.4 s when the next line is a quick reply.
- **One bubble per group visible at a time**, with the previous bubble fading over 0.4 s, not instantly, and a short "dim" for the last speaker.
- **Backchannels** are the only allowed overlap. Rules: at most one at a time, no more than one per 8 s, never during the first 0.8 s of a line, `max 2 words`, and the bubble is small and faded, never from the current speaker. TTS is skipped for backchannels, or played at low volume if the API permits, so they never cut the main utterance.
- **Listener gaze.** At `leadIn`, every non-speaker calls `look(speakerPos)` (existing `state.look`). Add jitter: 15% of the time a listener glances at a third member or away for 0.6 s. The speaker looks at the `to` target.
- **Reactions** (`nod`, `wave`) are scheduled by the line's `react[]` or, by default, one random listener nods around 60% through the line.

**Player interaction**
- **Approaching** (within ~7 m): no change except showing subtitles. The conversation keeps going.
- **Joining** at a `gap`: scheduler transitions to `held`. If a line is mid-play, it finishes first (never `paused=true` mid-line). The group plays a short `welcomeIn` line (e.g. "Oh, hi! Join us.") and turns to face the player, and then the `ScriptedProvider` graph takes over using the same turn rules (NPCs speak sequentially; the player's slot is the floor with a "your turn" glow).
- **Leaving:** a farewell line, then the scheduler resumes at the next unplayed script *scene*, not a random index. Add a short `resumeFrom` marker per scene, and pick the next scene so loops never restart mid-thread.
- **Player speaking slot:** while the player holds the floor, the NPC idle gaze rests on the player, and a patient "waiting" nod/smile appears after 6 s with no pressure text.
- Also fix `updateVisitors`: arrivals queue behind a gap and wait to be introduced, rather than walking in silently.

---

## 3. Watch-then-join skits / role-play

**Data format** (`src/data/skits/*.js`)
```js
{
  id: 'cafe.firstOrder', title, titleZh, level: 'beginner', zone: 'cafe',
  cast: [{ role:'Barista', npc:'Barista Tom' }, { role:'Customer', npc:'Mika', playerCanTake:true },
         { role:'Friend', npc:'Leo', playerCanTake:true }],
  beats: [
    { id:'b1', role:'Barista', text:'Hi! What can I get you?', zh,
      cue:{ wave:true } , gap:[0.6,1] },
    { id:'b2', role:'Customer', text:'Can I have a small latte, please?', zh,
      hint:'Can I have …, please?',        // shown when player has this role
      accept:['latte','coffee','small','please'], // loose keywords ("say anything" mode)
      alt:['I would like a latte.'],       // acceptable variants
      branch:{ 'tea':'b3b', default:'b3' }  // optional
    },
    ...
  ],
  keyPhrases:[ 'Can I have…, please?' ]
}
```
The skit player reuses the Scene Director from §2 (same turn-taking), so ambient and skit share one engine.

**Flow**
1. **Watch** (3–5 min per skit, 6–10 beats): the cast performs with bubbles, subtitles, and optional Chinese. Controls: replay, pause, slow (0.8×), "show words," and "skip to my part." The stage has a nearby "seat" the player can sit in as audience.
2. **Pick a role** (or "Just watch again"). Show 1–2 roles with an easy first role (short lines).
3. **Rehearse** with *shadowing*: the line is spoken by the NPC first, then the player repeats it (Listen & Repeat engine), no scoring pressure; a "Skip" is always available.
4. **Perform:** the player's lines come with a hint ladder: full line visible → first words only → keyword only → blank. Beat advances on *any attempt* (see §5). Cast adjusts if the player is slow (an NPC covers with "Take your time…").
5. **Feedback:** a curtain call with applause. Show only positives: "You said 4 of 5 lines." Offer key phrases to the notebook, a "replay my performance" option (local audio optional), and "try next level of hints."

**Three example skits for reluctant speakers**
1. **"A Latte for Mika" (Cafe, beginner):** Customer orders a latte, barista offers oat milk, customer asks the price. 8 beats. Player role: Customer. Targets *ordering politely* and *Can I… / How much…*
2. **"Late to Class" (Classroom, beginner→intermediate):** a student arrives late, apologizes, teacher says it's okay, the student introduces a classmate. Targets *apologizing, thanking, introductions*. Low stakes: the teacher is warm and every apology is accepted. Branching: honest excuse vs. a funny one.
3. **"The Wrong Jacket" (Shop, intermediate):** a customer wants a different size, disagrees politely on price, and asks for a discount. Targets *polite disagreement and negotiation*. Branch: accept the price vs. leave to "think about it," which tests refusal language people find hard to say.

---

## 4. Theater zone, portals, new zones

**Theater zone (the Playhouse)**
- A stage, 3 rows of seats, curtains (plain boxes and one cloth plane). Shows run on a loop schedule ("Next show in 0:45"). A player can *sit* (a seat marker) to watch and press **E** to open "Take a role" for the current play. The audience shows light backchannel from NPCs ("Ha, nice!").
- The theater hosts the skits of §3. The "rehearsal room" behind it is a private empty room (§5).

**Teleport portals**
- A glowing ring prop at each zone entrance and in the Plaza center: a menu lists Cafe, Park, Classroom, Shop, Theater, plus Rehearsal Room. Implement as `zones.js` entries with `portal: {x,z}` and `spawn`; reuse `window.__sim.teleportTo`. Fade-to-black for 0.3 s. Only the destination zone's NPCs run their directors, which saves CPU.

**More zones**
- **Airport / Hotel front desk** (check-in, directions, complaints): the highest practical value for travellers.
- **Open-mic Lounge:** a tiny low-stakes stage where the player speaks one sentence ("Today I…") into the mic to a cheering audience.
- **Rehearsal Room (private):** an empty room, no other avatars. It has a mirror NPC (a practice buddy that repeats and answers) for private warmups.

**Lightness on phones**
- Keep zones as small colliders and primitive meshes; share materials and geometries via instancing. Limit active NPC directors to the zone the player is in plus neighbours. Dispose zone-specific objects on teleport or lazily build them. Cap pixel ratio at 1.5–2, drop shadows on mobile, and use sprite bubbles only for the nearest 2–3 speakers. Lazy-load skit data per zone with dynamic `import()`.

---

## 5. Low-pressure speaking aids

- **No-fail:** nothing ever says "wrong." A miss becomes "Nice try — here's one way to say it," and the story proceeds. Don't gate progress behind confidence thresholds.
- **"Say anything" mode:** any voiced attempt of ≥ 1 s or ≥ 2 words advances the scene (`accept` loosely); the model line is shown afterward as a *model*, not a correction. Count attempts in missions, not accuracy.
- **Hint ladder:** full line → first words → keywords → free. The player chooses the level; it can be raised any time.
- **Shadowing before performing:** the NPC says it, the player echoes (existing Listen & Repeat), in slow or normal speed.
- **Gradual exposure ladder:** Watch → Tap a choice → Type → Whisper/speak into the mic with a "private" label (not shown to others) → Speak in front of the cast → Improvise. Show it as a gentle "badge path," not a test.
- **Private practice:** a rehearsal room, plus a mic check mode with no scoring and no audio saved.
- **Encouragement copy:** warm and brief in English plus Chinese ("说出来就已经很棒了"). Celebrate *attempts* ("Spoke 3 times today!") and make streaks forgiving (1 skip day free).
- **Pacing control:** NPCs wait; "Take your time" after 8 s; a visible "Skip / Hear it again" button; never a countdown.
- **Reduce social cost:** an option to hide the player's name and avatar bubble while speaking, voice input only locally (state it clearly: nothing is uploaded).

---

## 6. Roadmap (one coding-agent session each)

**Round 1: Turn-taking (fixes the bug).**
- Add `src/dialogue/SceneDirector.js` with the state machine, per-group floor, gap distribution, and one-bubble rule.
- Make `speakLine` return a Promise with `onend` and stop calling `cancel()` for ambient lines.
- Add listener gaze via `state.look`, plus nod reactions and backchannels (max 1 per 8 s).
- Make join and leave transitions line-boundary-safe, and resume at the next scene.
- Extend `AMBIENT` to add `gapAfter`, `to`, and `back` fields. Test with `window.__sim` hooks: assert no two bubbles in a group overlap in time.

**Round 2: Watch-then-join skit engine.**
- Add the skit data schema and a loader. Run skits on the Director.
- Build the watch mode UI: subtitles, replay, slow, show-Chinese, "pick a role."
- Ship one skit ("A Latte for Mika") in the cafe, with perform mode and hint ladder, "say anything" acceptance, and a curtain-call summary.

**Round 3: Theater and portals.**
- Add the theater zone (stage, seats, curtains), the show schedule, and sit/audience mode.
- Add portals and a teleport menu, with per-zone activation/disposal for phone performance.
- Wire in the skits from Round 2 and add the other two skits.

**Round 4: Low-pressure ladder and private practice.**
- Add the rehearsal room with a mirror-buddy NPC.
- Add the shadowing step before every performed line and the exposure-ladder badges.
- Change missions to reward attempts, add soft streaks, and add encouragement copy in English and Chinese.

**Round 5: More zones and content.**
- Add Airport/Hotel and the Open-mic Lounge, with 2 skits each.
- Add branching skit paths and multiple groups per zone, so the Director supports several concurrent conversations.
- Optionally wire `AIProvider` (through a proxy) for a free-talk "after-show chat" with the cast.
