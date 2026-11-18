/**
 * Talks only to a ConversationProvider. It does not read preset data itself.
 */
export class DialogueEngine {
  constructor(provider) {
    this.provider = provider;
  }

  start(context) {
    return this.provider.start(context);
  }

  respond(userText, context) {
    return this.provider.respond(userText, context);
  }

  /** Expected replies for the current node, including during a confirm prompt. */
  currentChoices() {
    if (this.provider.currentChoices) return this.provider.currentChoices();
    return [];
  }
}
