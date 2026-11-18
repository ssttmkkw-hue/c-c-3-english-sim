# Plaza English / 广场英语

A static, VRChat-style plaza for beginner–intermediate English practice. Avatars, signs, and props are procedural (Three.js). There is no build step, no copyrighted asset pack, and no API key in this repo.

一个静态的、类似 VRChat 的英语练习广场，面向初学者到中级学习者。人物、路牌和道具都用 Three.js 程序化生成。不需要构建，不使用受版权保护的资源包，仓库里也不放任何 API key。

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
- **Join / 加入:** Near a group, press **E** (or Join). A chooser lists that zone’s conversations with a title and a level (Beginner or Intermediate). Pick one. Members walk into a circle with you and turn inward. 靠近人群按 E，先看到标题和难度，再加入。
- **1-on-1 / 一对一:** Near a person with a personal chat, press **F** (or Talk). They turn to face you. Extra people stand around the plaza: Tourist Nina (directions), Librarian Ada (a short grammar exercise), Musician Jo, and Customer Bea (shop-counter phrases). 广场上还有游客 Nina、图书管理员 Ada、街头乐手 Jo、商店顾客 Bea。
- **Reply / 回答:** Choice buttons, the text box, or push-to-talk (hold **Space** or **Hold to talk**).
- **Hint / 提示:** Shows the first words of the replies you can give. 显示可用回答的前几个词。
- **Retry / 再说:** Say your line again. If the script is asking “Did you mean …?”, Retry cancels that guess. 再讲一次；如果正在确认，就取消这次猜测。
- **Leave / 离开:** **Esc** or **Leave**. The group goes back to its own ambient chat. Esc also closes the chooser, settings, and the help card. Esc 也会关闭选择列表、设置和帮助。
- **Settings / 设置:** The gear button. Read-aloud on/off, an English voice, speaking speed, 3D subtitle bubbles, **中文翻译**, and a difficulty preference. Saved in `localStorage`. 齿轮按钮：朗读、英语语音、语速、立体字幕、中文翻译、难度偏好，都存在本地。
- **Read aloud / 朗读:** Uses `speechSynthesis`. Off by default. The header checkbox and the settings panel stay in sync. 默认关闭。顶栏和设置面板是同一个开关。
- **中文翻译:** Off by default. When it is on, each NPC line and each reply choice shows Chinese underneath. 默认关闭。打开后，每句 NPC 台词和每个回答选项下面都会显示中文。
- **Minimap / 小地图:** Top-right. Zones, group anchors, other people, and you.

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
- `src/avatars/` — procedural bodies, idle/walk, emotes, speech bubbles.
- `src/input/` — keyboard (`event.code`, with `event.key` fallback), mouse orbit, touch stick, speech.
- `src/ui/hud.js` — zone, chat log, choices, mic state, chooser, settings.
- `src/dialogue/` — engine, providers, and `match.js`.
- `src/data/` — characters, the conversation catalog, legacy Chinese lines, and zone scripts in `src/data/zones/`.

## Dialogue architecture / 对话架构

`DialogueEngine` only calls a `ConversationProvider`:

- `start(context) -> Promise<Turn>`
- `respond(userText, context) -> Promise<Turn>`

`context` is `{ conversationId, zoneId, speakers, mode }` where `mode` is `group` or `solo`.

A `Turn` is `{ npcLines, choices, ended, reaction?, phrases?, heard?, confirm? }`. NPC lines and choices may include `zh`. `heard` is `{ input, match, confidence }` when a reply was scored. The HUD never reads the script files itself.

The live provider is `ScriptedProvider`. It walks the graphs in `src/data/` and scores typed or spoken text with `match.js`. Each zone group has two or three joinable chats (beginner and intermediate), each about four to six turns, with two or three choices.

当前用的是 `ScriptedProvider`。四个区域各有两三段可加入的小组对话，分初级和中级，每段大约四到六个回合，每回合两到三个选项。一对一脚本和新人物的数据在 `src/data/zones/`。

`AIProvider` (`src/dialogue/AIProvider.js`) is an unwired stub. To plug in a real model later:

1. Keep the key on a server you control. Do not put it in this public static site.
2. Implement `start` / `respond` so they `fetch` your proxy and return the same `Turn` shape.
3. Construct `new DialogueEngine(new AIProvider())` instead of `ScriptedProvider`.

`DialogueEngine` stays the same.

## Debug hook / 调试接口

`window.__sim` (for headless checks):

- `getState()` → `{ zone, playerPos, nearby, inConversation, conversationId, lastNpcLine, choices, confirming, chooserOpen, settings }`
- `teleportTo(zoneOrGroupId)` — `cafe`, `park`, `classroom` / `class`, `shop`, `plaza`, or an NPC id
- `listConversations(zone)` → `{ id, title, level, zone }[]` for that zone (`cafe`, `park`, `classroom` / `class`, `shop`). An empty zone lists every group chat.
- `joinConversation(id)` — starts that group chat, or a 1-on-1 when `id` is a character id
- `join()` opens the chooser for the nearest group. `chat()`, `say(text)`, `choose(index)`, `leave()`, `chatWith(name)`
- `getSettings()` / `setSettings(partial)` — `tts`, `voiceURI`, `rate`, `subtitles`, `zh`, `difficulty` (`any`, `beginner`, `intermediate`)
