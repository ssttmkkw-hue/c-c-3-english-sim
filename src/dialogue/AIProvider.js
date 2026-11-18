import { ConversationProvider } from './ConversationProvider.js';

/**
 * Stub for a later LLM backend. Not wired into the app and holds no API key.
 *
 * Suggested plug-in point (server proxy, never a browser key):
 *
 *   async respond(userText, context) {
 *     const res = await fetch('/api/conversation', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({
 *         userText,
 *         zoneId: context.zoneId,
 *         history: this.history,
 *       }),
 *     });
 *     const data = await res.json();
 *     // Map data into { npcLines, choices, ended }.
 *     return data;
 *   }
 *
 * Keep DialogueEngine unchanged: construct it with `new AIProvider()`
 * instead of ScriptedProvider when a proxy exists.
 */
export class AIProvider extends ConversationProvider {
  constructor() {
    super();
    this.history = [];
  }

  async start(context) {
    this.history = [{ role: 'system', content: `Zone ${context.zoneId}, mode ${context.mode}` }];
    return {
      npcLines: [{
        speaker: 'Guide',
        text: 'The AI provider is not configured. Conversations use the scripted provider.',
      }],
      choices: [],
      ended: true,
      reaction: 'nod',
    };
  }

  async respond(userText, context) {
    this.history.push({ role: 'user', content: userText, zoneId: context.zoneId });
    return {
      npcLines: [{
        speaker: 'Guide',
        text: 'The AI provider is not configured. No language model was called.',
      }],
      choices: [],
      ended: true,
      reaction: 'nod',
    };
  }
}
