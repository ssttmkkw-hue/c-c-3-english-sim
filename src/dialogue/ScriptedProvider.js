import { ConversationProvider } from './ConversationProvider.js';
import { confidentEnough, matchChoice, normalize } from './match.js';

function asLine(line, speaker) {
  if (typeof line === 'string') return { speaker, text: line, zh: '' };
  return {
    speaker: line.speaker || speaker,
    text: line.text,
    zh: line.zh || '',
  };
}

function asChoice(choice) {
  return {
    text: choice.text,
    zh: choice.zh || '',
    keywords: choice.keywords || [],
  };
}

function present(node, reaction) {
  const lines = (node.lines || []).map((line) => asLine(line, node.speaker));
  const choices = node.choices || [];
  const ended = choices.length === 0 || node.end === true;
  return {
    npcLines: lines,
    choices: ended ? [] : choices.map(asChoice),
    ended,
    reaction: node.reaction || reaction || 'nod',
    phrases: ended ? (node.phrases || []) : [],
  };
}

function retryTurn(node) {
  const base = present(node);
  const hints = (node.choices || [])
    .map((choice) => (choice.keywords && choice.keywords[0]) || choice.text)
    .slice(0, 3)
    .join(', ');
  return {
    ...base,
    npcLines: [{
      speaker: node.speaker,
      text: `Sorry, could you say that again? You could try: ${hints}.`,
      zh: `抱歉，能再说一次吗？你可以试试：${hints}。`,
    }],
    ended: false,
    phrases: [],
    reaction: 'nod',
  };
}

function heardOf(input, match, confidence) {
  const pct = Math.round(confidence * 100);
  return {
    input: String(input || '').trim(),
    match,
    confidence,
    text: `“${String(input || '').trim()}” → ${match} (${pct}%)`,
  };
}

const YES_WORDS = new Set(['yes', 'yeah', 'yep', 'yup', 'sure', 'correct', 'right', 'ok', 'okay']);
const NO_WORDS = new Set(['no', 'nope', 'nah', 'again', 'retry']);

function confirmIntent(userText) {
  const norm = normalize(userText);
  if (norm === 'yes' || norm === 'try again') return norm === 'yes' ? 'yes' : 'retry';
  const words = norm.split(' ').filter(Boolean);
  if (words.length > 2) return '';
  if (words.some((word) => NO_WORDS.has(word))) return 'retry';
  if (words.some((word) => YES_WORDS.has(word))) return 'yes';
  return '';
}

export class ScriptedProvider extends ConversationProvider {
  constructor(graphs) {
    super();
    this.graphs = graphs;
    this.session = null;
  }

  start(context) {
    const graph = this.graphs[context.conversationId];
    if (!graph) {
      return {
        npcLines: [{ speaker: 'Guide', text: 'This conversation is not ready yet.' }],
        choices: [],
        ended: true,
        reaction: 'nod',
      };
    }
    this.session = { id: context.conversationId, nodeId: graph.start, pending: null };
    return present(graph.nodes[graph.start]);
  }

  currentChoices() {
    const graph = this.session && this.graphs[this.session.id];
    if (!graph || !this.session) return [];
    const node = graph.nodes[this.session.nodeId];
    if (!node || !node.choices) return [];
    return node.choices.map(asChoice);
  }

  respond(userText, context) {
    const graph = this.graphs[context.conversationId] || (this.session && this.graphs[this.session.id]);
    if (!graph || !this.session) {
      return { npcLines: [], choices: [], ended: true };
    }
    const node = graph.nodes[this.session.nodeId];
    if (!node || !node.choices || node.choices.length === 0) {
      return { npcLines: [], choices: [], ended: true, reaction: 'nod' };
    }
    if (this.session.pending) {
      const pending = this.session.pending;
      const intent = confirmIntent(userText);
      if (intent === 'yes') {
        this.session.pending = null;
        return this.advance(graph, pending, pending.input, pending.confidence);
      }
      this.session.pending = null;
      if (intent === 'retry') return present(node);
    }
    const result = matchChoice(userText, node.choices || []);
    if (!result) return retryTurn(node);
    const { choice, confidence } = result;
    if (!confidentEnough(confidence)) {
      this.session.pending = {
        next: choice.next,
        reaction: choice.reaction,
        text: choice.text,
        zh: choice.zh || '',
        input: userText,
        confidence,
      };
      const quote = choice.text;
      return {
        npcLines: [{
          speaker: node.speaker,
          text: `Did you mean: "${quote}"?`,
          zh: `你是想说：“${choice.zh || quote}”吗？`,
        }],
        choices: [
          { text: 'Yes', zh: '是的', keywords: ['yes', 'yeah', 'correct'] },
          { text: 'Try again', zh: '再说一次', keywords: ['again', 'no', 'retry'] },
        ],
        ended: false,
        reaction: 'nod',
        confirm: true,
        heard: heardOf(userText, choice.text, confidence),
      };
    }
    return this.advance(graph, choice, userText, confidence);
  }

  advance(graph, choice, userText, confidence) {
    this.session.nodeId = choice.next;
    const next = graph.nodes[choice.next];
    const heard = heardOf(userText, choice.text, confidence);
    if (!next) return { npcLines: [], choices: [], ended: true, reaction: 'nod', heard };
    return { ...present(next, choice.reaction), heard };
  }
}
