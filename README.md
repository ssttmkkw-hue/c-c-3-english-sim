# Plaza English

A static, VRChat-style plaza for beginner–intermediate English practice. Avatars and props are procedural (Three.js). There is no build step and no API key.

## Run

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Controls

- WASD or arrow keys to walk. Hold Shift to run.
- Drag the mouse to orbit the camera. Scroll to zoom.
- Near a group: **E** joins their conversation. Near someone with a personal chat: **F** talks 1-on-1.
- Reply with the choice buttons, the text box, or push-to-talk (hold **Space** or **Hold to talk**). Speech recognition uses the browser Web Speech API (`en-US`) when it exists.
- **Esc** or **Leave** steps out. The group resumes its own loop.
- **Read lines aloud** uses `speechSynthesis` and is off by default.
- On a touch device, a joystick and Join / Talk buttons appear.

## Dialogue

`DialogueEngine` only calls a `ConversationProvider` (`start`, `respond`). The live provider is `ScriptedProvider` with preset graphs in `src/data/conversations.js`. `AIProvider` is an unwired stub showing where a server-side model could plug in later. Do not put an API key in this site.
