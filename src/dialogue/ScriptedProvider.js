import { ConversationProvider } from './ConversationProvider.js';
import { matchChoice } from './match.js';

function present(node, reaction) {
  const lines = (node.lines || []).map((line) => (
    typeof line === 'string' ? { speaker: node.speaker, text: line } : line
  ));
  const choices = node.choices || [];
  const ended = choices.length === 0 || node.end === true;
  return {
    npcLines: lines,
    choices: ended ? [] : choices.map((choice) => ({
      text: choice.text,
      keywords: choice.keywords || [],
    })),
    ended,
    reaction: node.reaction || reaction || 'nod',
  };
}

function retryTurn(node) {
  const choices = node.choices || [];
  const hints = choices
    .map((choice) => (choice.keywords && choice.keywords[0]) || choice.text)
    .slice(0, 3)
    .join(', ');
  return {
    npcLines: [{
      speaker: node.speaker,
      text: `Sorry, could you say that again? You could try: ${hints}.`,
    }],
    choices: choices.map((choice) => ({ text: choice.text, keywords: choice.keywords || [] })),
    ended: false,
    reaction: 'nod',
  };
}

export class ScriptedProvider extends ConversationProvider {
  constructor(graphs) {
    super();
    this.graphs = graphs;
    this.session = null;
  }

  async start(context) {
    const graph = this.graphs[context.conversationId];
    if (!graph) {
      return {
        npcLines: [{ speaker: 'Guide', text: 'This conversation is not ready yet.' }],
        choices: [],
        ended: true,
        reaction: 'nod',
      };
    }
    this.session = { id: context.conversationId, nodeId: graph.start };
    return present(graph.nodes[graph.start]);
  }

  async respond(userText, context) {
    const graph = this.graphs[context.conversationId] || (this.session && this.graphs[this.session.id]);
    if (!graph || !this.session) {
      return { npcLines: [], choices: [], ended: true };
    }
    const node = graph.nodes[this.session.nodeId];
    if (!node || !node.choices || node.choices.length === 0) {
      return {
        npcLines: [{ speaker: node ? node.speaker : 'Guide', text: 'We can stop here. Press Leave when you are ready.' }],
        choices: [],
        ended: true,
        reaction: 'nod',
      };
    }
    const matched = matchChoice(userText, node.choices || []);
    if (!matched) return retryTurn(node);
    this.session.nodeId = matched.next;
    const next = graph.nodes[matched.next];
    if (!next) return { npcLines: [], choices: [], ended: true, reaction: 'nod' };
    return present(next, matched.reaction);
  }
}
