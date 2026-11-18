import { choice, line, node } from '../script.js';

const questionPhrases = [
  'Could you speak more slowly?',
  'Where are you from?',
  'I have studied English for two years.',
];

const pastPhrases = [
  'I studied English yesterday.',
  'I like comedies because they are funny.',
  'I will write three sentences.',
];

export const classGraphs = {
  'class.questions': {
    start: 'ask',
    nodes: {
      ask: node('Teacher Lin', [
        line('Teacher Lin', 'Hello. Do you have a question about today\'s lesson?', '你好。今天的课你有问题吗？'),
        line('Student Noah', 'I ask questions all the time. It is how I learn.', '我经常提问。我就是这样学的。'),
      ], [
        choice('Could you speak more slowly?', '你能说慢一点吗？', ['slowly', 'slow', 'speak'], 'practice'),
        choice('What does this word mean?', '这个词是什么意思？', ['mean', 'word', 'what'], 'practice'),
        choice('Can I sit here?', '我可以坐这里吗？', ['sit', 'here'], 'practice'),
      ]),
      practice: node('Student Noah', [
        line('Student Noah', 'She is happy to repeat things. What do you want to practice?', '她很乐意重复。你想练习什么？'),
      ], [
        choice('I want to practice questions.', '我想练习提问。', ['question', 'practice'], 'from'),
        choice('I want to practice saying my name.', '我想练习说自己的名字。', ['name', 'practice'], 'from'),
      ]),
      from: node('Player: Hana_studies', [
        line('Player: Hana_studies', 'Try asking me a question. Where I am from is an easy one.', '试着问我一个问题。我从哪里来是个简单的。'),
      ], [
        choice('Where are you from?', '你从哪里来？', ['where', 'from'], 'answer'),
        choice('How long have you studied English?', '你学英语多久了？', ['long', 'studied', 'how'], 'answer'),
      ]),
      answer: node('Teacher Lin', [
        line('Teacher Lin', 'Good question form. Now answer one about yourself, in a full sentence.', '问句的形式很好。现在用完整的句子回答一个关于你自己的问题。'),
      ], [
        choice('I am from a small city.', '我来自一座小城市。', ['city', 'from'], 'bye'),
        choice('I have studied English for two years.', '我学英语两年了。', ['two', 'years', 'studied', 'for'], 'bye'),
      ]),
      bye: node('Student Noah', [
        line('Student Noah', 'That was clear. Will you come to the next practice?', '说得很清楚。你下次练习还会来吗？'),
      ], [
        choice('Thank you, that was helpful.', '谢谢，这很有帮助。', ['thank', 'helpful'], 'end'),
        choice('Yes. I will practice tonight.', '会的。我今晚练习。', ['tonight', 'practice', 'yes'], 'end'),
      ]),
      end: node('Teacher Lin', [
        line('Teacher Lin', 'A useful line is "Could you say that more slowly, please?"', '一句很有用的话是：“请你说慢一点，好吗？”'),
        line('Player: Hana_studies', 'See you next class. Ask me another question any time.', '下节课见。随时再问我问题。'),
      ], [], { end: true, reaction: 'nod', phrases: questionPhrases }),
    },
  },
  'class.past': {
    start: 'yesterday',
    nodes: {
      yesterday: node('Teacher Lin', [
        line('Teacher Lin', 'Let us use the past tense. What did you do yesterday?', '我们来用过去时。你昨天做了什么？'),
        line('Student Noah', 'I will go after you, so you can hear a model.', '我在你后面说，你可以先听一个例子。'),
      ], [
        choice('I studied English.', '我学英语了。', ['studied', 'english'], 'enjoy'),
        choice('I met a friend.', '我见了一个朋友。', ['met', 'friend'], 'enjoy'),
        choice('I stayed home.', '我待在家里。', ['stayed', 'home'], 'enjoy'),
      ]),
      enjoy: node('Player: Hana_studies', [
        line('Player: Hana_studies', 'Did you enjoy it?', '你喜欢那样度过吗？'),
      ], [
        choice('Yes, I enjoyed it.', '是的，我很享受。', ['enjoyed', 'yes'], 'movie'),
        choice('It was a little boring.', '有一点无聊。', ['boring'], 'movie'),
        choice('It was fun, but short.', '很有趣，但时间很短。', ['fun', 'short'], 'movie'),
      ]),
      movie: node('Student Noah', [
        line('Student Noah', 'I watched a movie last night. What kind of movies do you like?', '我昨晚看了电影。你喜欢什么类型的电影？'),
      ], [
        choice('I like comedies.', '我喜欢喜剧。', ['comed'], 'because'),
        choice('I prefer documentaries.', '我更喜欢纪录片。', ['document'], 'because'),
      ]),
      because: node('Teacher Lin', [
        line('Teacher Lin', 'Try a full sentence with because. Tell us why.', '试着用 because 说一个完整的句子。告诉我们原因。'),
      ], [
        choice('I like comedies because they are funny.', '我喜欢喜剧，因为它们好笑。', ['because', 'funny', 'comed'], 'homework'),
        choice('I stayed home because I was tired.', '我待在家里，因为我累了。', ['because', 'tired', 'home'], 'homework'),
      ]),
      homework: node('Player: Hana_studies', [
        line('Player: Hana_studies', 'That sentence was clear. Do you want a little homework?', '那个句子很清楚。你想要一点作业吗？'),
      ], [
        choice('Yes, I will write three sentences.', '好，我会写三个句子。', ['three', 'write', 'sentences'], 'end'),
        choice('I will practice with a friend.', '我会和朋友一起练习。', ['friend', 'practice'], 'end'),
      ]),
      end: node('Teacher Lin', [
        line('Teacher Lin', 'Yesterday takes the past tense: I studied, I met, I stayed.', 'yesterday 要用过去时：I studied，I met，I stayed。'),
        line('Student Noah', 'You did well. See you when we practice again.', '你做得很好。下次练习见。'),
      ], [], { end: true, phrases: pastPhrases }),
    },
  },
};
