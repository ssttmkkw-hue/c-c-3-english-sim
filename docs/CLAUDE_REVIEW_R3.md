# Round 3 Review (d3fec6a..3e894fb)

**中文摘要：** 第 3 轮把 R2 的大部分要求都做了。有 10 秒后 NPC 补台词并提供跳过、"Nice! Another way to say it" 的柔和反馈、区域表、淡入淡出传送门、带座位和演出时间表的剧场、带真实分支的酒店入住剧本，还有分区更新和 High/Low 画质。这些都符合"会英语但不敢开口"的学习者：先看、可跳过、没有失败状态。剩下的风险有四个。第一，仍然没有自动化测试，也没有走完所有剧本的脚本。第二，缺少私人练习空间和按尝试次数计分的任务。第三，内容还偏少。第四，AI 对话还没接入。**注意：** 我没有运行游戏，下面的结论来自阅读已提交的代码。

## How it serves the design value

The loop is watch → pick a role → shadow → speak, and it never penalises silence. R2's two biggest gaps are closed:

- **Cover line.** `SkitPlayer.js` has `COVER_MS = 10000` and `COVER_SKIP_MS = 8000`. `watchCover` shows `Maybe: <line>`, calls `opts.coverLine`, then sets `offerSkip`. A frozen learner no longer stalls the scene, and the skip is offered rather than forced.
- **Tone.** The mismatch feedback is now `Nice! Another way to say it: …` (`SkitPlayer.js:290`). The player no longer feels graded.
- **A real branch.** `check-in.js` has the `pick` beat. Saying "double", "two" or "twin" leads to `double-ok`, and anything else leads to `single-ok`. The Clerk's reply now depends on what the learner said, so speaking is rewarded. The skit also has a `quick: true` line for "Thank you."
- **World structure.**
  - Zones are table-driven (`zones.js`, `hotel.js`).
  - Teleport uses a chained fade (`fadeMove`, `main.js:1642`), and `place()` now fades too (`main.js:162`). That closes R2 item 6.
  - The Playhouse seat watch has no role pressure.

## Remaining issues and risks

1. **No automated tests.** I found no `tests/` folder and no test script in `package.json` or the README. R2 item 8 is still open. Skits now have timers, branches, a cover line and a seat-watch mode. A script that drives every skit through `__sim` is the cheapest safety net, and it should assert that no phase gets stuck and no lines overlap.
2. **Cast and group check.** The cast uses `Player: Guest_Ana` and `Player: Guest_Ben`. `Guest_Ana` is defined in `characters.js:25`, in group `hotel`. I did not confirm that `Guest_Ben` exists. I also did not check that `toLine` handles a missing speaker safely. Test this explicitly.
3. **Cover-line timing uses wall-clock `setTimeout`.** `pause()` at `SkitPlayer.js:11` ignores `timeScale`. This can make automated runs flaky, and it affects slow mode.
4. **Branch matching is brittle.** The branch keywords are plain substrings ("two", "twin", "double"). Phrases like "a room for two" would take the double path, which is acceptable, but "no double" would too. For a low-pressure game, wrong routing is cheap. Keep the default path graceful and do not claim a match.
5. **Only one branching skit.** The other skits are still straight lines. Variety is thin overall: three skits, five zones' worth of ambient conversation.
6. **Quality setting.** Low quality caps the pixel ratio at 1 and turns off shadows (`main.js:1098-1103`). That is a good start. There is no frame-time check on real phones beyond what `__sim.perf` reports, so the target is unproven.
7. **Zone-scoped ticking adds state risk.** Parked directors are suspended and released through `session.suspendedGroup` and `asideDirectors` (`main.js:609-640`). Interactions between teleport, an open skit and suspension need a test. A teleport during a skit is the likely failure.

## Prioritized next steps

1. **Test harness (small, high value).** Add a script that plays every skit end to end through `__sim`. Cover teleport during a skit, the cover-line path, and both branches of `check-in`. Run it before each round.
2. **Private rehearsal room.** A zone with no NPC observers, where the learner can repeat any skit line freely, replay the model audio, and record themselves with no score. This is the biggest low-pressure aid still missing.
3. **Attempt-based missions.** Reward trying, not accuracy. Examples: "Say anything in 3 scenes", "Stay for a whole show", "Use one phrase from your notebook". Show progress only upward, with no fail state.
4. **Encouragement layer.** Short, varied, warm reactions from NPCs after a spoken turn. Make the first success of the day visible. Offer "try with fewer hints" automatically after a clean run (R2 item 2 is still open).
5. **Content.** Add 3–4 skits, each with a branch, in the Playhouse schedule. Use airport, pharmacy and restaurant. Add ambient conversations for the hotel zone.
6. **More zones.** Reuse the zone table: airport, market, classroom. Keep each zone to one skit and one desk NPC.
7. **Mobile pass.** Measure real-device frame time, then tune NPC counts per quality level.
8. **AI hookup (later).** Put it behind the existing `lineMatched` and `branch` interfaces. Let the model pick a branch and write one warm reply. Keep skit scripts as the fallback, so a network failure never leaves a learner stuck.
