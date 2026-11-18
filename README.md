# Plaza English / 广场英语

A static, VRChat-style plaza for beginner–intermediate English practice. Avatars, signs, and props are procedural (Three.js). There is no build step, no copyrighted asset pack, and no API key in this repo.

一个静态的、类似 VRChat 的英语练习广场，面向初学者到中级学习者。人物、路牌和道具都用 Three.js 程序化生成。不需要构建，不使用受版权保护的资源包，仓库里也不放任何 API key。

## Features / 功能

- Leveled group chats and 1-on-1 talks. Reply by tapping a choice, typing, or holding Space to speak. 小组对话和一对一，分初级和中级。可以点选项、打字，或按住空格说话。
- Listen & Repeat scores each word. Contractions match their expanded form (`I'd` / `I would`, `don't` / `do not`). 跟读练习按词打分。缩写和完整形式算同一句。
- A phrase notebook (N) saves useful lines, with Chinese when we have it. 笔记本（N）保存好用的句子，并带中文。
- Three daily missions, with a streak when you finish all of them. On a phone they collapse to a `Today 0/3` pill. 每天三个任务。手机上收成 `Today 0/3` 小胶囊。
- Avatar panel in Settings: display name (default You), body color, and hair style, saved on this browser. 设置里的形象：名字（默认 You）、衣服颜色、发型，存在本地。
- A short 3-step tip the first time you close the help card. 第一次关掉帮助后，有三步可跳过的提示。
- Groups take turns. One person speaks at a time, listeners look at the speaker, and someone may nod or say a short “Mm-hm.” With no browser voice, a line stays up long enough to read (at least about a second and a half, a bit longer for a long sentence). With read-aloud on, the line stays up until that voice finishes, using your speaking-speed setting (about 2.6–3 words a second at a normal speed). If the voice never finishes, the chat still moves on. The pause after a line is usually about half a second to a second and a half, and a little longer after a question. Joining waits until the current line has finished, then a welcome. Leaving says a short goodbye and the chat continues from the next scene. When it is your turn, the panel glows with “Your turn — take your time.” There is no countdown. After a quiet moment, someone may say “Take your time.” 小组轮流说话。一次只有一个人说，其他人看着说话的人，有时会点头或轻轻说 “Mm-hm”。浏览器没有语音时，每句会停够你看完（大约至少一秒半，长句再久一点）。打开朗读后，这句会停到声音说完，并跟着你的语速（正常语速大约每秒 2.6–3 个词）。如果声音一直不结束，对话也会继续往下走。句与句之间通常大约停半秒到一秒半，问句后面会稍长一点。加入时会等当前这句说完，再打招呼。离开时有一句短告别，然后从下一小段接着聊。轮到你时，面板会轻轻发光，并显示 “Your turn — take your time”。没有倒计时。安静一会儿后，可能会有人说 “Take your time.”。
- Skits you can watch, then join. A small 🎭 Skit spot in the cafe and the classroom plays a short scene. Watch it (replay, 0.8× speed, show the words, or skip ahead), pick a role, optionally shadow your lines, then perform. Hints can shrink from the full line to a blank. Any real try counts. You always hear “Nice!” and “Another way to say it,” whether or not your words match the script. The scene continues. There is no fail. If you stay quiet for about ten seconds, someone offers the line (“Maybe: …”) and a Skip this line button appears, so the scene never gets stuck. The curtain call only says how many lines you spoke, and saves a few phrases to the notebook. 可以先看再加入的小剧场。咖啡店和教室各有一个 🎭 标记。先看一遍（重播、0.8 倍速、显示单词，或跳到选角色），再选一个角色，可以先跟读自己的台词，然后上台。提示可以从整句收到空白。只要你开口或打字就算数。不管跟原句像不像，都会听到 “Nice!”，并看到 “Another way to say it”。剧情继续。没有失败。安静大约十秒后，会有人把这句递给你（“Maybe: …”），并出现 Skip this line，场景不会卡住。谢幕只告诉你说了几句，并把几句有用的话记进笔记本。

## Run / 运行

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

然后在浏览器打开 `http://localhost:8000`。请用本地静态服务器打开，不要直接双击 `index.html`（ES module 与麦克风 API 都需要 http/https）。

## Controls / 操作

- **Walk / 移动:** WASD or arrow keys. Hold Shift to run. On a touch device, a joystick appears.
- **Camera / 镜头:** Drag with the mouse to orbit. Scroll the wheel to zoom. The camera eases behind you, and it pulls back to frame a conversation.
- **Emotes / 表情:** `1` wave, `2` nod, `3` jump.
- **Join / 加入:** Near a group, press **E** (or Join). A chooser lists that zone’s conversations with a title and a level (Beginner or Intermediate), then any skits in that zone. Pick one. If someone is mid-sentence, they finish the whole line, then say hello. Members walk into a circle with you and turn inward. Nearby ambient chat is a few short scenes, and the group remembers where it left off. 靠近人群按 E，先看到标题和难度，下面还有本区的小剧场。如果有人说到一半，会等这句说完再打招呼。旁边的闲聊是几段小对话，离开后从下一段接着说。
- **Skit / 小剧场:** Near the 🎭 sign, press **G** (or the Skit button). You can also open one from the conversation list. **A Latte for Mika** (cafe) and **Late to Class** (classroom) are the first two. Watch, then take a role such as Customer or Student. Rehearse is optional and is never scored. On your line, use the hint buttons, **Tap to read**, the box, or hold to speak. After about eight quiet seconds someone says “Take your time.” After about ten seconds they offer the line (“Maybe: …”) and you can skip that line. Every try gets the same warm “Nice!” plus “Another way to say it.” The end screen offers Replay, Try with fewer hints, and Leave. Esc leaves the skit. 靠近 🎭 按 G（或 Skit 按钮），也可以从对话列表打开。《给 Mika 的一杯拿铁》（咖啡店）和《上课迟到了》（教室）。先看，再扮演顾客或学生。跟读可以跳过，也不打分。轮到你时可以用提示、点一下朗读、打字，或按住说话。安静大约八秒后会有人说 “Take your time.”。大约十秒后会有人说出这句（“Maybe: …”），你可以跳过这一句。每次开口都是同样的 “Nice!”，并附上 “Another way to say it.”。结束时可以重看、少一点提示再来，或离开。Esc 也会退出小剧场。
- **1-on-1 / 一对一:** Near a person with a personal chat, press **F** (or Talk). They turn to face you. Extra people stand around the plaza: Tourist Nina (directions), Librarian Ada (a short grammar exercise), Musician Jo, and Customer Bea (shop-counter phrases). 广场上还有游客 Nina、图书管理员 Ada、街头乐手 Jo、商店顾客 Bea。
- **Reply / 回答:** Choice buttons, the text box, or push-to-talk (hold **Space** or the mic button). On a narrow screen the mic button is an icon plus **Talk**, and the buttons sit on two rows. NPC lines in a chat also take turns. The “…” mark means someone is still speaking; it does not stay up if the voice engine is silent. 窄屏上麦克风按钮是图标加 Talk，按钮分成两行。对话里的 NPC 也轮流说。“…” 表示还有人在说；如果语音引擎没有声音，它也不会一直停在那里。
- **Your turn / 轮到你:** A soft glow and the words “Your turn — take your time” (轮到你了，慢慢来). Nobody counts down. If you are quiet for a bit, an NPC says “Take your time.” 没有倒计时。你安静一会儿，会有人说 “Take your time.”。
- **Hint / 提示:** Shows the first words of the replies you can give. 显示可用回答的前几个词。
- **Retry / 再说:** Say your line again. If the script is asking “Did you mean …?”, Retry cancels that guess. 再讲一次；如果正在确认，就取消这次猜测。
- **Leave / 离开:** **Esc** or **Leave**. The group goes back to its own ambient chat. Esc also closes the chooser, practice, notebook, settings, the help card, and a skit. Starting or leaving a conversation closes the chooser too. Esc 也会关闭选择列表、跟读、笔记本、设置、帮助和小剧场。开始或离开对话时，选择列表会关掉。
- **Listen & Repeat / 跟读练习:** At the end of a chat, each useful phrase has **Practice**. The notebook has the same button. The app reads the line with your voice and speed settings (`speechSynthesis`). Hold **Space** or **Hold to speak**, or type the line if there is no microphone. Matched words turn green, missed words turn red, and you get a star rating. 对话结束或在笔记本里点 Practice。应用按你的语音和语速朗读，然后你按住说话或打字。对上的词是绿色，没对上的是红色，并给出星级。
- **Notebook / 笔记本:** **N** or the book button. Useful phrases from a finished chat are saved automatically. **☆** on an NPC line or a reply saves that line too. Each entry shows Chinese (when we have it), where it came from, how many times you practiced it, and your best score. You can practice or delete it. Saved in `localStorage`. 按 N 或笔记本按钮。完成对话后的好用句子会自动记下，聊天里点 ☆ 也能保存。
- **Daily missions / 每日任务:** Three missions for the local day, chosen from a fixed pool (for example a beginner cafe chat, three voice replies, a new 1-on-1, two listen-and-repeat phrases, or an intermediate chat). A small panel shows progress. On a narrow screen it is a pill labeled `Today 0/3` that opens the list when tapped, and Nearby talk is a single line, so the two do not cover each other. Finishing one shows a toast and a short burst of confetti. Progress resets the next local day. A streak counts days you clear all three. 每天三个任务。窄屏上是 `Today 0/3` 胶囊，点开才看到列表；附近对话收成一行，避免叠在一起。完成时有提示和一点彩纸。第二天重置，连续完成会记天数。
- **Settings / 设置:** The gear button. Read-aloud on/off, an English voice, speaking speed, 3D subtitle bubbles, **中文翻译**, a difficulty preference, and an **Avatar** panel (name, body color, hair). Saved in `localStorage`. The same voice and speed are used for Listen & Repeat. The name tag above you uses the name you pick (default You). 齿轮按钮：朗读、英语语音、语速、立体字幕、中文翻译、难度偏好，以及形象（名字、衣服颜色、发型），都存在本地。跟读练习用同一套语音和语速。头顶名字用你选的名字，默认是 You。
- **Tips / 入门提示:** The first time you close this help card, three short tips appear: walk to a group, press E, then reply by voice or by tapping a choice. Skip or Esc remembers that you finished them. 第一次关闭帮助后，会出现三步提示：走到人群、按 E、用语音或点击回答。跳过或按 Esc 之后不再出现。
- **Read aloud / 朗读:** Uses `speechSynthesis`. Off by default. The header checkbox and the settings panel stay in sync. 默认关闭。顶栏和设置面板是同一个开关。
- **中文翻译:** Off by default. When it is on, each NPC line and each reply choice shows Chinese underneath. 默认关闭。打开后，每句 NPC 台词和每个回答选项下面都会显示中文。
- **Minimap / 小地图:** Top-right. Zones, group anchors, skit spots, other people, and you. 右上角。区域、人群、小剧场标记、其他人和你。

## Speech recognition / 语音识别

Push-to-talk uses the browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`, `en-US`).

- **Works / 可用:** Chrome or Edge, on `localhost` or `https`.
- **Unavailable / 不可用:** Firefox, and plain `http` pages that are not localhost. The mic button shows **Mic unavailable** and a tooltip that explains this. You can still type or tap a choice.
- While listening, the chat panel shows the interim transcript. After you release the key, a **Heard: …** line shows the words, the matched reply, and a confidence percent. 松开后会显示听到的话、匹配到的回答，以及置信度。
- Matching normalizes contractions, punctuation, and number words, then scores token overlap, a small synonym list, and Levenshtein typos. 匹配前会整理缩写、标点和数字，再用词重叠、同义词和编辑距离打分。
- A strong match advances. A weak match asks **Did you mean: …?** with **Yes** and **Try again**. A miss asks you to rephrase and shows a keyword hint. 把握大就继续；把握不大会问“你是想说……吗？”；完全对不上就请你再说。

## Project structure / 目录

- `index.html`, `style.css` — page, HUD, favicon (inline SVG, so `/favicon.ico` is not requested).
- `src/main.js` — loop, camera, groups, `window.__sim`.
- `src/world/` — plaza zones, props, entrance signs.
- `src/avatars/` — procedural bodies (hair, face, clothes), idle/walk, emotes, a glow under whoever is speaking, speech bubbles.
- `src/input/` — keyboard (`event.code`, with `event.key` fallback), mouse orbit, touch stick, speech.
- `src/ui/hud.js` — zone, chat log, choices, mic state, chooser, settings, notebook, practice, daily missions.
- `src/dialogue/` — engine, providers, `SceneDirector.js` (turn-taking), `timing.js` (how long a line stays up), and `match.js` (reply scores and listen-and-repeat word alignment).
- `src/skits/SkitPlayer.js` — watch, then perform. Scripts live in `src/data/skits/`. 小剧场播放器。剧本在 `src/data/skits/`。
- `src/progress/` — notebook and daily missions (`localStorage`).
- `src/world/ambience.js` — day sky, clouds, park leaves, cafe steam.
- `src/data/` — characters, the conversation catalog, legacy Chinese lines, and zone scripts in `src/data/zones/`.

## Dialogue architecture / 对话架构

`DialogueEngine` only calls a `ConversationProvider`:

- `start(context) -> Promise<Turn>`
- `respond(userText, context) -> Promise<Turn>`

`context` is `{ conversationId, zoneId, speakers, mode }` where `mode` is `group` or `solo`.

A `Turn` is `{ npcLines, choices, ended, reaction?, phrases?, heard?, confirm? }`. NPC lines and choices may include `zh`. `heard` is `{ input, match, confidence }` when a reply was scored. The HUD never reads the script files itself.

The plaza uses a daytime sky, a few clouds, falling leaves in the park, and steam above the cafe machine. NPCs sometimes check a phone or stretch while they stand. These are cheap meshes and sprites, not a weather system.

广场是白天的天空，有几朵云、公园里落下的叶子，以及咖啡机上的热气。站着的人物偶尔会看手机或伸个懒腰。这些都是很少的面片，不是天气系统。

The live provider is `ScriptedProvider`. It walks the graphs in `src/data/` and scores typed or spoken text with `match.js`. Each zone group has two or three joinable chats (beginner and intermediate), each about four to six turns, with two or three choices. Listen & Repeat uses the same `normalize` path to mark each word.

当前用的是 `ScriptedProvider`。四个区域各有两三段可加入的小组对话，分初级和中级，每段大约四到六个回合，每回合两到三个选项。一对一脚本和新人物的数据在 `src/data/zones/`。跟读练习用同一套 `normalize` 给每个词上色。

`AIProvider` (`src/dialogue/AIProvider.js`) is an unwired stub. To plug in a real model later:

1. Keep the key on a server you control. Do not put it in this public static site.
2. Implement `start` / `respond` so they `fetch` your proxy and return the same `Turn` shape.
3. Construct `new DialogueEngine(new AIProvider())` instead of `ScriptedProvider`.

`DialogueEngine` stays the same.

## Debug hook / 调试接口

`window.__sim` (for headless checks):

- `getState()` → `{ zone, playerPos, nearby, inConversation, conversationId, lastNpcLine, choices, confirming, chooserOpen, practiceOpen, notebookOpen, settings }`
- `notebook.list()` / `notebook.add({ text, zh, source })` / `notebook.remove(id)`
- `missions.get()` → `{ date, streak, missions: [{ id, title, titleZh, progress, goal, done }] }`
- `practice(phraseText)` opens Listen & Repeat for that line
- `teleportTo(zoneOrGroupId)` — `cafe`, `park`, `classroom` / `class`, `shop`, `plaza`, or an NPC id
- `listConversations(zone)` → `{ id, title, level, zone }[]` for that zone (`cafe`, `park`, `classroom` / `class`, `shop`). An empty zone lists every group chat.
- `joinConversation(id)` — starts that group chat, or a 1-on-1 when `id` is a character id
- `join()` opens the chooser for the nearest group. `chat()`, `say(text)`, `choose(index)`, `leave()`, `chatWith(name)`
- `getSettings()` / `setSettings(partial)` — `tts`, `voiceURI`, `rate`, `subtitles`, `zh`, `difficulty` (`any`, `beginner`, `intermediate`)
- `getDirector(groupId)` for `cafe`, `park`, `class`, `shop` → `{ state, mode, speaker, lineId, sceneId, overlapsDetected }` (`state` is `gap`, `leadIn`, `speaking`, `tail`, or `held`; `mode` is `ambient`, `dialogue`, `join`, `farewell`, `aside`, or `idle`)
- `mainBubbleOverlaps()` → how many times two main speaking bubbles in one group were visible together (stays `0`)
- `timeScale` — sim clock multiplier (default `1`, clamped from `0.25` to `40`). `now()` reads sim time. `setTimeScale(n)` / `getTimeScale()` do the same as the property.
- `requestVisitor(groupId, text)` queues a wanderer’s line for the next gap. `bubbleOf(name)` → `{ text, kind, main }`
- `listSkits()` → `{ id, title, titleZh, level, zone }[]`
- `startSkit(id)` starts that skit in watch mode. `skipToRoles()`, `pickRole(role)`, `rehearse(role)`, `skitSay(text)`
- `skitState()` → `{ phase, beat, role, hintLevel, linesSaid, ended }` (`phase` is `idle`, `watch`, `roles`, `rehearse`, `perform`, or `curtain`)
