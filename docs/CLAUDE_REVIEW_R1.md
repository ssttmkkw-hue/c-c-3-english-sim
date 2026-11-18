# Round 1 Review: Turn-taking (c2bb1bb..f091339)

**中文摘要:** 第 1 轮基本达成了 R0 的目标。`SceneDirector` 状态机 `gap → leadIn → speaking → tail`、"一次只有一个主气泡"、TTS 排队、听众视线、点头、插话和按场景恢复都已落地。剩下的风险主要有三点。第一，`SceneDirector.js` 已有 849 行，加入小剧场和玩家角色前需要先拆分。第二，状态太多，靠 `mode` 和 `state` 的组合再加一堆定时器来控制，容易出现死锁或错乱。第三，真人语音下的时长同步还没有实测。下一轮应该把 Director 抽成通用的"剧本播放器"，再做小剧场。

---

## What round 1 got right

- **Floor ownership.** `beginSpeaking` fades every other main bubble (`SceneDirector.js:368-371`) and `sampleOverlap` counts violations. The counter is exposed as `__sim.overlaps()`, so there's an assertable invariant. This is R0's "one bubble per group" rule, made testable.
- **Gap by speech act.** `drawGap` (`:103-114`) gives a longer pause after a question, a short one before a quick reply, and a per-line `gapAfter` override. This matches R0.
- **TTS no longer chops lines.** `speech.js` now has foreground and ambient lanes. `pump` and `dropAmbient` (`:157-225`) cancel only when a foreground line preempts an ambient one. `speakLine` resolves on `onend`, with `onerror`, a length cap (`utteranceCapMs`) and a `voicesReady()` guard. The "missing voice holds the speaker" case (commit 8207fff) is handled.
- **Line-boundary-safe join and leave.** `requestJoin` waits for the line to end (`joinCut` at `:318`), plays a welcome line, and `notePark`/`finishFarewell` resume at the next scene rather than a random index. The patience nudge (6 s nod, 8 s "Take your time", `:322-343`) is a good no-pressure touch.
- **Stall resilience.** The watchdog (`minDur*1.5`), `armed()` using wall clock as well as sim time, and the join, play and suspend timers cover stalled lines and clocks (commit f091339).
- **Gaze, nods and backchannels.** There is a 15% glance, per-line `react[]`, and an 8 s backchannel cooldown that skips speaking NPCs.
- **Scenes as data.** Ambient chat is now scenes with lines (`conversations.js`, +236 lines), which is the right shape for skits.

## Remaining issues and risks

1. **Size and complexity.** `SceneDirector.js` is 849 lines with about 40 closure variables. Behaviour depends on `mode` (`ambient|join|dialogue|farewell|aside|idle`) crossed with `state`, and `onTail` (`:451-520`) and `onGap` (`:522-574`) are long, hand-ordered `if` chains. Skit beats, role slots, hint ladders and curtain calls will make this brittle. Sketch a `beats → player slot → beats` runner on top of it. Don't keep adding modes.
2. **Several overlapping time sources.** The director uses `arm`/`stateUntil`, wall-clock `waitMark`, `playTimer`, `joinTimer`, `suspendTimer`, and `hurry`. `tick` also flips `held → gap` when `hurry` is set (`:602-606`). It works, but a bug here would show as a stuck group, so every new path needs a "no stuck state" test.
3. **Duration drift.** `estimateLineDuration` is 4.6 words/s plus 0.08 (`:15`). A normal TTS voice at rate 0.96 is nearer 2.5–3 words/s. `serviceSpeaking` ends on `elapsed >= watchdog` (`:319`), where `watchdog = minDur*1.5`, so a long line can still be cut off visually while TTS is mid-sentence. The speech cap (`utteranceCapMs`) is the same value and may call `speechSynthesis.cancel()` on a slow voice. Calibrate from the measured `onend` time, or scale the estimate by the chosen `rate`.
4. **Ambient TTS is gated on proximity.** `onSpeak` returns `null` unless `nearestSpeechGroup() === group` and there's no session (`main.js:107-111`). With TTS off or the group out of range, timing depends only on the estimate. That is fine, but the estimate is then the real clock, so it must be tuned for reading, not listening.
5. **Join cap is fragile.** `requestJoin` resolves via `joinTimer` after at least 2.2 s (`:650-656`), even if the welcome never played. A player can then enter a dialogue while the NPC is still mid-line. This is an edge case, but skits will hit it often.
6. **Backchannels bypass the floor.** `fireBack` calls `npc.say(..., 'back')` and may play TTS. `main.js` doesn't route it through `onSpeak`, so it is silent. That is good for now, but a skit with audible audience reactions will need a policy.
7. **Content is thin.** `grep` finds `gapAfter`/`back` only in `conversations.js`, and only a handful of uses. `to` and `react` are lightly used, so gaze and reactions are rarely visible.
8. **No automated tests.** There is `__sim.overlaps()` and `getDirector`, but no test in the repo that drives it, and no check of the stuck-state cases above.

## Adjusted priority list

**Round 2 — Skit engine (watch → join).**
- First, extract a thin `SkitPlayer` that feeds beats into a Director through `playLines`/the floor. Don't add skit logic inside `SceneDirector`. Move shared timing (`estimateLineDuration`, gap rules) into a small module.
- Schema: `cast`, `beats` with `role`, `hint`, `accept`, `alt`. Watch mode has replay, slow and "show words". After watching, the player picks a role.
- Hint ladder (full → first words → keywords → blank), "say anything" acceptance (any attempt ≥ 1 s or ≥ 2 words advances), an NPC cover line after about 8 s, and a curtain call showing positives only.
- Ship 2 skits first (cafe order, class late). Add a `__sim` skit hook and a no-stuck/no-overlap test.
- Fix items 3 and 5 here, because skits make both visible.

**Round 3 — Theater and portals.**
- Playhouse zone (stage, seats, curtains, show schedule, sit-to-watch) and teleport portals with zone-scoped directors: tick only the current and neighbouring zones. Add the third skit.

**Round 4 — New zone and speaking aids.**
- One more zone (Airport/Hotel desk or Open-mic Lounge) with scenes and a skit.
- Aids: private rehearsal with shadowing before performing, attempt-based missions, and soft streaks with encouraging English and Chinese copy.

**Round 5 — Polish and scale.**
- Several groups per zone, audible audience reactions, optional AI after-show chat, and a phone performance pass.
