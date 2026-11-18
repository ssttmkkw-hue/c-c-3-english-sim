# Round 4 Review (8dd0ae2)

**中文摘要：** 第 3 轮要求的东西基本都有了，镜头和坐姿修复也到位：坐下后镜头在身后看向舞台，传送到达会面向各区的 `lookAt`。现在最大的缺口是**练习本身**。没有不被围观的私人练习间。每日任务只奖励"完成对话/语音"，小剧场里开口不计入任何任务（`missions.js` 没有 skit 类事件）。分支剧本只有一个（酒店入住）。下一轮建议：①私人排练间；②"开口即算数"的任务；③机场、药店、餐厅三个分支剧本；④再补一个轻量的剧本检查脚本。**说明：**我没有运行游戏，结论来自读代码。

## 1. How the current build serves the design value

The loop is still watch → pick a role → shadow → speak, with no fail state. From R3's list, these are now done:

- **Camera and sit fix.**
  - `sitDown` (`main.js:290`) snaps the avatar to the seat, calls `setSit(true)`, and faces the stage with `faceToward(..., true)`.
  - The seated camera branch (`main.js:1274`) sits at `yaw + π` behind the player (`yaw` is set so the camera is behind the avatar), at height 2.42, and looks 84% toward the stage.
  - `standUp` is called from `releaseFloor`, so leaving a show always restores walking.
  - `arriveInZone` faces `lookAt || anchor`, and it is used for both `teleport` and `teleportTo`. The hotel desk is in view on arrival. I see no remaining defect beyond the nits below.
- **Cover line and tone.** The 10 s `Maybe: …` offer with a skip, and the "Nice! Another way to say it" feedback, are in `SkitPlayer.js`.
- **Real branch.** The `branch` on beat `pick` in `check-in.js` makes the clerk's reply depend on what the learner said.
- **World structure.** Zones are table-driven. Teleport fades. The Playhouse has a schedule and a role-free watch mode. There is a High/Low quality setting and zone-scoped ticking.
- **Cast check.** `missingCast` exists in `data/skits/index.js`. `Guest_Ben` exists (`characters.js:26`), so R3 risk 2 is closed.

## 2. Remaining issues and risks

1. **Speaking in skits earns nothing.** `missions.js` only has `group-end`, `voice`, `solo-new` and `practice`. The skit's `linesSaid` counter is never reported. The most natural speaking activity is invisible to progress. Missions also reward finishing a whole chat, which favours confident learners.
2. **No private practice space.** Every practice happens in front of NPCs, or in Listen & Repeat, which is scored with stars. Reluctant speakers need a place with no audience and no score, where they can say a line ten times.
3. **Thin content.** There are three skits and one branch. The Playhouse loops only those three (`SHOW_SECONDS = 180`). Seeing the same three shows repeatedly weakens the "watch, then join" hook.
4. **Seat nits (minor).**
   - `standUp` resets only `y`. The avatar stays at `seat.z + 0.06`, which is inside the chair, so a stand-up can clip into it. Nudge it forward (to the aisle side) by about 0.5.
   - The seated camera ignores the player's orbit input and `dist`/`pitch` (it uses `max(5.4, dist)`). That is fine, but it should be documented.
5. **Branching is substring-only.** "Two", "twin" and "double" are plain substrings. That is acceptable, but a new skit author needs a convention: the default path must read naturally for any answer. This matters more once there are three more skits.
6. **No automated checks.** There is still no `tests/` folder and no `package.json`. Content will grow this round, so a small script is worth it. It should validate skit data and walk skits through `__sim`. It is not worth building a large harness.
7. **Wall-clock timers.** `pause()` in `SkitPlayer.js` ignores slow mode. This carries over from R3 and is still open.

## 3. Prioritized next steps for this round

1. **Skit speaking counts toward missions (P0, small).** Add `noteSkitLine()` to `missions.js` and mission kinds `skit-lines` and `skit-any`. Call it from the skit player when a line is spoken. The pool should include "Say 3 lines in skits" and "Watch a whole show in the Playhouse". Reward the attempt, not accuracy.
2. **Private Rehearsal Room (P0).** A portal zone with no NPCs. The learner picks any skit and any role. They hear the model line, repeat it freely, and there are no stars and no feedback beyond "Nice!". The skit player already supports rehearse and shadow, so the room can reuse it with no cast on stage.
3. **Three new branching skits (P0).** Airport check-in, pharmacy, restaurant. Each has 8–10 beats, one branch with a graceful default, and `keyPhrases`. Add them to `SKITS` and to the Playhouse schedule. Each needs a zone or a skit spot. If a new zone is too much work, put airport and pharmacy skit spots in existing zones for now, and keep restaurant in the cafe.
4. **Auto-offer "fewer hints" after a clean run (carried from R2).** On the end screen, if the player spoke at least 75% of lines, preselect the next hint level.
5. **Small data check script.** One Node file with no dependencies that imports `data/skits/index.js`. It asserts that every branch target exists, every beat `role` is in the `cast`, every `keyPhrases` entry is non-empty, and `missingCast` is empty. Add a README line showing how to run it.
6. **Seat nit.** Fix the `standUp` offset, and clip-check it in all twelve seats via `__sim.sit(i)`.

## 4. Spec for round 4 (top 3)

### A. Skit speaking missions

- **Data.**
  - Add to `MISSION_POOL` entries like `{ id: 'skit-3', kind: 'skit-line', goal: 3, title: 'Say 3 lines in skits', titleZh: '在小剧场里说 3 句话' }` and `{ id: 'show-1', kind: 'show', goal: 1, … }`.
  - Add `noteSkitLine()` and `noteShow()` to `createMissions`. They call `bump('skit-line')` and `bump('show')`.
  - `view()` keeps its current shape.
- **Hooks.** Add an `opts.onLine(beat)` callback to `createSkitPlayer`, called inside `perform` where `linesSaid += 1` happens (`SkitPlayer.js:289`). Wire it in `main.js` as `refreshMissions(missions.noteSkitLine())`. Call `noteShow()` when a theater skit ends normally, not when the player leaves early.
- **Counting rule.** A line counts when the learner spoke or typed. A cover line or a skip does not count. Never count accuracy.
- **Don't break.** Mission keys stay stable. The pool-pick order changes, so tests that expect a particular day's missions must be updated. The streak logic is unchanged. `__sim.missions.get()` keeps its shape.

### B. Private Rehearsal Room

- **Zone.** Add `rehearsal` to `zones.js`: a small room with a mirror prop and a desk, `spawn`, `lookAt`, `neighbors`, and an entry in the teleport list. It has no NPCs and no ambient director.
- **Flow.** A "Practice a skit" button, opened with **G** or the skit button. It lists all skits, then the roles. The player runs the existing rehearse/shadow phase, then `perform` with the other roles voiced by narration only (no avatars). Any speech counts. The end screen says "N lines spoken" and nothing else.
- **UI.** Reuse `hud.renderSkit`. Add a `private: true` flag to the model, which hides the stage and the "audience" text, and shows "Just you. Take your time." / "只有你，慢慢来。"
- **`__sim`.** `rehearse(skitId, role)` starts it. `getState().zone` becomes `'rehearsal'`. `teleport('rehearsal')` works.
- **Don't break.** The existing `skit.start(id, opts)` signature (add `opts.private`, don't change `opts.theater`). `place()` must skip `fadeMove` into a spot when private. Teleport during a private run must call `releaseFloor` cleanly. Ambient muting must be restored on exit (`unmute()`), and zone-scoped ticking must not suspend a director that was never claimed.

### C. New branching skits

- **Shape (same as `check-in.js`).** `{ id, title, titleZh, level, zone, cast: [{ role, npc, playerCanTake }], beats: [{ id, role, text, zh, hint, accept, alt, gap, branch?, altPath?, quick?, cue? }], keyPhrases }`.
- **Branch rules.** Each skit has one `branch` on a learner beat with a `default` target and one or two `options` with keywords. Both paths must rejoin at a shared closing beat. The default path must read naturally for any answer, and no beat may claim a match.
- **Content suggestions.** Airport: "Window or aisle?" Pharmacy: "Do you have a headache or a cough?" Restaurant: "Here or to go?" or "Fish or chicken?"
- **Cast.** Every `npc` must exist in `characters.js`, so add clerks and guests there, or reuse existing ones. `missingCast` must return `[]`.
- **Registration.** Add each skit to `SKITS`. If it sits in a new zone, add the zone's `skitSpots` (the spot `id` equals the skit `id`) and a `groupIdForZone` entry.
- **Don't break.** The Playhouse schedule uses `SKITS.length`, so the show rotation changes. `__sim.show()` and any hardcoded `nextId` expectations need updating. The skit list in the join chooser and the minimap markers are driven by `skitSpots`.
