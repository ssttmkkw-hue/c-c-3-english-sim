/**
 * ConversationProvider
 * -------------------
 * DialogueEngine depends only on this shape. Implementations must be async
 * so a future network-backed provider can drop in without changing the HUD.
 *
 * context: { conversationId, zoneId, speakers: string[], mode: 'group' | 'solo' }
 *
 * start(context) -> Promise<Turn>
 * respond(userText, context) -> Promise<Turn>
 *
 * Turn: {
 *   npcLines: { speaker: string, text: string }[],
 *   choices: { text: string, keywords: string[] }[],
 *   ended: boolean,
 *   reaction?: 'nod' | 'jump'
 * }
 */
export class ConversationProvider {
  // eslint-disable-next-line no-unused-vars
  async start(context) {
    throw new Error('ConversationProvider.start is not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  async respond(userText, context) {
    throw new Error('ConversationProvider.respond is not implemented');
  }
}
