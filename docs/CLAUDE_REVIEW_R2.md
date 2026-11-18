# Round 2 Review: Watch-then-join skits (c6c434c, 3a5f8b7)

**中文摘要:** 第 2 轮抓住了核心价值：先看、再选角色、可以跟读、说什么都算数、没有失败状态，对"会英语但不敢开口"的学习者很友好，`SkitPlayer` 也没有往 `SceneDirector` 里加新模式。问题在于四点。第一，R1 要求的"约 8 秒后 NPC 补台词"、提示阶梯自动降级、`__sim` 测试钩子都没有做，玩家沉默时场景会一直等下去。第二，答错时显示 "Nice try — one way to say it"，对害羞的人仍像纠错。第三，两个剧本都只有一条直线，没有真正用到 `branch`，而且最后一幕要求玩家说话的节奏偏快。第四，没有自动化测试。下一轮应做 Theater 区域、传送门、演出时间表、第三个剧本、新区域和手机端性能。

## What works

- **Layering.** `SkitPlayer` only calls `playLines`, `suspend`, `holdForPlayer` and `releaseFloor` (`main.js` skit options). R1 asked for this, and `SceneDirector` gained no modes.
- **Shared timing.** `timing.js` now holds listening pace (2.8 words/s) and reading pace. This fixes R1 item 3, and `skitSay` and the director use the same code.
- **Safe flow for shy learners.**
  - The phases run watch → roles → perform, with an optional `rehearse` shadowing step.
  - Skip is always allowed.
  - The hint ladder (`LADDER`) goes full → first words → keywords → blank, with `fewerHints` and `tapRead`.
  - The curtain message when `linesSaid === 0` ("You stayed for the whole scene") is exactly the right tone.
  - `savePhrases` adds key phrases to the notebook.
- **"Say anything" works.** `lineMatched` only decides the feedback text. The skit moves on after any input (`runPerform` calls `nextAfterSay` regardless).
- **Mic use.**
  - `skitWantsMic` opens the mic only on the player's turn, so there is no always-on listening.
  - A spoken single word gets the gentle "A few more words is plenty" message.
  - Space and the `#skit-mic` button both work, and touch is covered.
- **Stale-run safety.** The `token`/`run` counter makes every await abandon cleanly after `leave`, `replay` or `pickRole`.

## Issues and risks

1. **R1's "NPC cover line after ~8 s" was dropped.**
   - `playerTurn` awaits `waitForLine` with no timeout. `armPatience` only calls `holdForPlayer` and `setPatience`, which nods and nudges but never advances.
   - A frozen learner stalls the scene forever, and "no stuck state" was R1's explicit test item.
   - Fix: after about 10–12 s, an NPC offers the line ("Maybe: …"), then offers to skip this line (the player never fails).
2. **The hint ladder is manual only.** Nothing steps it down automatically as the player succeeds. Fix: after a perform run with no "full" hint used, offer "Try with fewer hints".
3. **Mismatch feedback sounds like grading.**
   - `playerTurn` shows `Nice try — one way to say it: ${beat.text}` when `lineMatched` is false. Many mismatches will be fine answers, such as "Coffee please" for the latte.
   - For this audience, always say something like "Nice!" and show the model line as "Another way to say it". Never separate matched from unmatched in tone.
4. **Branching is unused.** `defaultNext` and `nextAfterSay` support `branch`, but latte.js and late-class.js are straight lines. The player's choice never changes the NPC reply, so "say anything" feels the same as saying the line. One real branch per skit would reward speaking, and the third skit should have one.
5. **Fake players as cast.** The cast has `npc: 'Player: Mika_88'` and `'Player: Hana_studies'`. If these names have no avatar in the group, `toLine` addresses a speaker who isn't there. I could not tell from the code whether `playLines` falls back safely, so this needs a test.
6. **`place()` moves the avatar without a fade.** `player.avatar.root.position.set(spot.x, 0, spot.z + 1.15)` is a hard cut and can drop the player into a wall. It would do the same for the new zones, so use the same fade as the portals.
7. **Slow mode patches global time.** `setSlow` changes `timeScale` and keeps `skitBaseScale` in `main.js`. If `leave()` runs while another feature also changes `timeScale`, the restore can set a stale value. Better to pass a rate multiplier to timing only.
8. **No tests or `__sim` skit hook.** `main.js` has 66 `skit` references and `__sim` has none. R1 asked for a no-stuck/no-overlap test. There is still no `tests/` folder or script at all.
9. **`__sim.timeScale` x skit watch timers.** `delay(620)` and the `curtain` timing use wall-clock `setTimeout`, while the rest of the sim honours `timeScale`. This hurts automated runs, not users.

## Spec for round 3 (Theater + portals + more content)

1. **Zone table.**
   - Add `playhouse`, `airport` or `hotel` to `zones.js`, with `{ id, bounds, spawn, groupId }`.
   - Move `ZONE_GROUP` and `SKIT_SPOTS` into the zone data. Delete the hardcoded map in `skits/index.js`.
2. **Teleport portals.**
   - Add a glowing ring prop at each zone edge, plus a `T` key / touch button that opens a teleport menu.
   - Selecting a destination runs a fade-out, move, and fade-in (about 400 ms each, using a CSS overlay).
   - Reuse this fade in `place()`.
3. **Theater.**
   - The stage has a curtain, 8 or more seats and a lectern.
   - A show schedule has 2–3 shows on a loop (for example every 3 simulated minutes). A "Now showing / next at" board is visible at the door.
   - Press E at a seat to sit. A `watch` phase then plays the skit with no role chosen.
   - At the end, the director asks "Want to take a role next time?", then calls `pickRole`.
4. **Third skit.** A hotel or airport desk check-in (for example `check-in-desk`) with one real `branch` (room type or seat choice) and one `quick` line. It is level beginner-plus, and the Theater schedule includes it.
5. **At least one more zone with a skit.** Airport or hotel desk, with a front-desk NPC and 2 ambient scenes (`conversations.js`).
6. **Zone-scoped updates.** The `tick` loop should update only the player's zone and neighbouring zones. Park far directors with `suspend` rather than running them. This is also the phone-performance pass.
7. **Phone performance.**
   - Cap pixel ratio at 1.5, and use cheaper shadows and fewer animated NPCs outside the active zone.
   - Add a quality toggle in settings.
   - Measure frame time with a `__sim.perf()` helper.
8. **Fix R2 items 1, 3, 5 and 8 first.** Add the cover line, soften the mismatch copy, check the cast, and add a script that drives all skits end to end and asserts no overlaps and no stuck phase.
