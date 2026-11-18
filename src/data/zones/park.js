import { choice, line, node } from '../script.js';

const wayPhrases = [
  'Where is the fountain?',
  'I will sit for a minute.',
  'Thank you for the help.',
];

const hikePhrases = [
  'We should bring water.',
  'I will tell the group and rest.',
  'Yes, I am in.',
];

export const parkGraphs = {
  'park.way': {
    start: 'look',
    nodes: {
      look: node('Ranger Priya', [
        line('Ranger Priya', 'Hi. Are you looking for something in the park?', '你好。你在公园里找什么吗？'),
        line('Player: JuneWalks', 'We know the paths pretty well if you need a pointer.', '如果你需要指路，我们对这些小路很熟。'),
      ], [
        choice('Where is the fountain?', '喷泉在哪里？', ['fountain', 'where'], 'trees'),
        choice('Where can I sit?', '我可以坐在哪里？', ['sit', 'bench', 'where'], 'trees'),
        choice('I am just walking.', '我只是在散步。', ['walking', 'just', 'walk'], 'trees'),
      ]),
      trees: node('Player: JuneWalks', [
        line('Player: JuneWalks', 'The fountain is past the tall trees. Can you see them from here?', '喷泉在那几棵高树过去。你从这儿能看见吗？'),
      ], [
        choice('Yes, I see the trees.', '能，我看见那些树了。', ['see', 'trees', 'yes'], 'bench'),
        choice('Not yet. Could you point?', '还没。你能指一下吗？', ['point', 'not', 'yet'], 'bench'),
      ]),
      bench: node('Player: Ken_outdoors', [
        line('Player: Ken_outdoors', 'There is a bench if you need a rest. Do you want to sit with us?', '想休息的话有张长椅。要跟我们一起坐吗？'),
      ], [
        choice('I will sit for a minute.', '我坐一会儿。', ['sit', 'minute'], 'stay'),
        choice('No thanks. I will keep walking.', '不用了，谢谢。我继续走。', ['walk', 'no', 'keep'], 'stay'),
      ]),
      stay: node('Ranger Priya', [
        line('Ranger Priya', 'The path loops back to the plaza. Will you stay for the afternoon?', '这条路会绕回广场。你下午会留在这儿吗？'),
      ], [
        choice('I will stay a little longer.', '我会再待一会儿。', ['stay', 'longer'], 'bye'),
        choice('I need to leave soon.', '我得很快离开。', ['leave', 'soon'], 'bye'),
      ]),
      bye: node('Player: JuneWalks', [
        line('Player: JuneWalks', 'Enjoy the park. Wave if you get turned around.', '好好逛公园。如果迷路了就挥手。'),
      ], [
        choice('Thank you for the help.', '谢谢你的帮助。', ['thank', 'help'], 'end'),
        choice('See you on the path.', '路上见。', ['path', 'see'], 'end'),
      ]),
      end: node('Ranger Priya', [
        line('Ranger Priya', 'The bins are by the benches, and the fountain is a good meeting spot.', '垃圾桶在长椅旁边，喷泉是个很好的会合地点。'),
        line('Player: Ken_outdoors', 'Have a good walk.', '散步愉快。'),
      ], [], { end: true, reaction: 'wave', phrases: wayPhrases }),
    },
  },
  'park.hike': {
    start: 'before',
    nodes: {
      before: node('Player: Ken_outdoors', [
        line('Player: Ken_outdoors', 'A few of us want a short hike. Have you hiked before?', '我们几个人想去短途徒步。你以前徒步过吗？'),
        line('Ranger Priya', 'Keep it easy, and stay on the marked path.', '走轻松的路线，并且待在有标记的小路上。'),
      ], [
        choice('Yes, I hike sometimes.', '是的，我有时去徒步。', ['sometimes', 'yes', 'hike'], 'bring'),
        choice('Only easy trails.', '我只走简单的步道。', ['easy', 'trail'], 'bring'),
        choice('No, but I want to try.', '没有，但我想试试。', ['try', 'no', 'want'], 'bring'),
      ]),
      bring: node('Player: JuneWalks', [
        line('Player: JuneWalks', 'The trail takes about an hour. What should we bring?', '这条步道大约一小时。我们该带什么？'),
      ], [
        choice('We should bring water.', '我们应该带水。', ['water', 'bring'], 'tired'),
        choice('I will bring a light jacket.', '我会带一件薄外套。', ['jacket', 'light'], 'tired'),
        choice('Snacks would be smart.', '带点零食比较好。', ['snack', 'food'], 'tired'),
      ]),
      tired: node('Ranger Priya', [
        line('Ranger Priya', 'If you get tired, do not leave the path alone. What will you do?', '如果累了，不要一个人离开小路。你会怎么做？'),
      ], [
        choice('I will tell the group and rest.', '我会告诉大家，然后休息。', ['tell', 'rest', 'group'], 'time'),
        choice('I will turn back with a friend.', '我会和朋友一起返回。', ['friend', 'back', 'turn'], 'time'),
      ]),
      time: node('Player: Ken_outdoors', [
        line('Player: Ken_outdoors', 'We can start at nine, when it is cooler. Does morning work for you?', '我们可以九点出发，那时候更凉快。早上对你合适吗？'),
      ], [
        choice('Morning works for me.', '早上对我合适。', ['morning', 'works'], 'in'),
        choice('Could we start at ten?', '我们可以十点出发吗？', ['ten', '10', 'start'], 'in'),
      ]),
      in: node('Player: JuneWalks', [
        line('Player: JuneWalks', 'Then we will meet by the fountain. Are you in?', '那我们在喷泉边见。你算一个吗？'),
      ], [
        choice('Yes, I am in.', '好，我参加。', ['yes', 'in'], 'end'),
        choice('I will decide tonight.', '我今晚再决定。', ['tonight', 'decide'], 'end'),
      ]),
      end: node('Ranger Priya', [
        line('Ranger Priya', 'Bring water, stay together, and turn back if the weather changes.', '带上水，大家走在一起，天气变了就返回。'),
        line('Player: Ken_outdoors', 'I will look for you by the fountain. Nice planning with you.', '我会在喷泉边等你。和你一起计划很开心。'),
      ], [], { end: true, phrases: hikePhrases }),
    },
  },
};
