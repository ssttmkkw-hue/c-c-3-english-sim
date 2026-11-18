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
- **Join / 加入:** Near a group, press **E** (or Join). Members walk into a circle with you and turn inward.
- **1-on-1 / 一对一:** Near a person with a personal chat, press **F** (or Talk). They turn to face you.
- **Reply / 回答:** Choice buttons, the text box, or push-to-talk (hold **Space** or **Hold to talk**).
- **Leave / 离开:** **Esc** or **Leave**. The group goes back to its own ambient chat.
- **Read aloud / 朗读:** “Read lines aloud” uses `speechSynthesis` and is off by default.
- **Minimap / 小地图:** Top-right. Zones, group anchors, other people, and you.

## Speech recognition / 语音识别

Push-to-talk uses the browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`, `en-US`).

- **Works / 可用:** Chrome or Edge, on `localhost` or `https`.
- **Unavailable / 不可用:** Firefox, and plain `http` pages that are not localhost. The mic button shows **Mic unavailable** and a tooltip that explains this. You can still type or tap a choice.
- While listening, the chat panel shows the interim transcript. After you release the key, a **Heard: …** line shows which choice the script matched.

## Project structure / 目录

- `index.html`, `style.css` — page, HUD, favicon (inline SVG, so `/favicon.ico` is not requested).
- `src/main.js` — loop, camera, groups, `window.__sim`.
- `src/world/` — plaza zones, props, entrance signs.
- `src/avatars/` — procedural bodies, idle/walk, emotes, speech bubbles.
- `src/input/` — keyboard (`event.code`, with `event.key` fallback), mouse orbit, touch stick, speech.
- `src/ui/hud.js` — zone, chat log, choices, mic state.
- `src/dialogue/` — engine and providers.
- `src/data/` — characters and scripted graphs.

## Dialogue architecture / 对话架构

`DialogueEngine` only calls a `ConversationProvider`:

- `start(context) -> Promise<Turn>`
- `respond(userText, context) -> Promise<Turn>`

`context` is `{ conversationId, zoneId, speakers, mode }` where `mode` is `group` or `solo`.

A `Turn` is `{ npcLines, choices, ended, reaction?, phrases?, heard? }`. The HUD never reads the script files itself.

The live provider is `ScriptedProvider`. It walks the graphs in `src/data/conversations.js` and loose-matches typed or spoken text with `match.js` (keywords, overlap, and a small typo tolerance).

`AIProvider` (`src/dialogue/AIProvider.js`) is an unwired stub. To plug in a real model later:

1. Keep the key on a server you control. Do not put it in this public static site.
2. Implement `start` / `respond` so they `fetch` your proxy and return the same `Turn` shape.
3. Construct `new DialogueEngine(new AIProvider())` instead of `ScriptedProvider`.

`DialogueEngine` stays the same.

## Debug hook / 调试接口

`window.__sim` (for headless checks):

- `getState()` → `{ zone, playerPos, nearby, inConversation, conversationId, lastNpcLine, choices }`
- `teleportTo(zoneOrGroupId)` — `cafe`, `park`, `classroom` / `class`, `shop`, `plaza`, or an NPC id
- `join()`, `chat()`, `say(text)`, `choose(index)`, `leave()`
