import { cafeGraphs } from './zones/cafe.js';
import { parkGraphs } from './zones/park.js';
import { classGraphs } from './zones/classroom.js';
import { shopGraphs } from './zones/shop.js';
import { soloGraphs } from './zones/solos.js';
import { applyLegacyZh } from './zh-legacy.js';

/** Preset ambient loops and branching dialogues. Beginner–intermediate English. */

/** Lines wandering visitors say when they stop beside a group. */
export const VISITOR_LINES = {
  rae: [
    'Mind if I listen in? I am practicing too.',
    'This spot is lively. What are you chatting about?',
    'I will only stay a minute. Your English sounds clear.',
  ],
  eli: [
    'Hi, can I listen for a minute? I want to hear the English.',
    'I am still learning. Could you say that a little slower?',
    'This group is helpful. I am picking up new words.',
  ],
};

export const AMBIENT = {
  'cafe.ambient': [
    { speaker: 'Barista Tom', text: 'The lunch rush is quiet today. Can I pour anyone a refill?' },
    { speaker: 'Player: Mika_88', text: 'Yes, please. This latte is smooth. Is the milk oat milk?' },
    { speaker: 'Barista Tom', text: 'It is. We also have dairy milk if you want to switch.' },
    { speaker: 'Player: Leo_cafe', text: 'I might get an iced tea next. Is it sweet?' },
    { speaker: 'Barista Tom', text: 'A little. I can make it with less sugar.' },
    { speaker: 'Player: Mika_88', text: 'Good idea. I will sit by the window after this cup.' },
  ],
  'park.ambient': [
    { speaker: 'Ranger Priya', text: 'The breeze is nice today. Are you both staying in the park?' },
    { speaker: 'Player: JuneWalks', text: 'For a bit. I love this weather. It is warm, but not hot.' },
    { speaker: 'Player: Ken_outdoors', text: 'Same. Last weekend it rained, so I stayed inside.' },
    { speaker: 'Player: JuneWalks', text: 'What are you doing this weekend, Ken?' },
    { speaker: 'Player: Ken_outdoors', text: 'A short hike if the sky stays clear. Want to come?' },
    { speaker: 'Ranger Priya', text: 'Take water, and please keep to the path.' },
  ],
  'class.ambient': [
    { speaker: 'Teacher Lin', text: 'Let us practice introductions. Noah, would you start?' },
    { speaker: 'Student Noah', text: 'Hi. My name is Noah. I am from Busan. I like soccer.' },
    { speaker: 'Player: Hana_studies', text: 'Nice to meet you. I am Hana. I study design.' },
    { speaker: 'Teacher Lin', text: 'Lovely. A quick grammar check: I have lived here for two years.' },
    { speaker: 'Student Noah', text: 'So we use have lived for something that continues?' },
    { speaker: 'Teacher Lin', text: 'Exactly. For is with a period of time. Since is with a start point.' },
  ],
  'shop.ambient': [
    { speaker: 'Clerk Sam', text: 'Welcome in. The blue jackets just arrived. Want a size check?' },
    { speaker: 'Player: Mei_shop', text: 'How much is the blue jacket?' },
    { speaker: 'Clerk Sam', text: 'It is forty-eight dollars. Medium and large are on the shelf.' },
    { speaker: 'Player: Omar_22', text: 'Do you have a smaller size? Large is too big for me.' },
    { speaker: 'Clerk Sam', text: 'Small is in the back. I can bring it out.' },
    { speaker: 'Player: Mei_shop', text: 'I will think about the price and look at the hats too.' },
  ],
};

function node(speaker, lines, choices, extra = {}) {
  return { speaker, lines, choices, ...extra };
}

const PH = {
  cafe: ['I\'d like a latte, please.', 'Oat milk, please.', 'Just looking, thanks.'],
  park: ['The weather is lovely.', 'I might go for a walk.', 'I would like to join you.'],
  class: ['Hi, my name is Alex. I like music.', 'I have lived here for two years.', 'Could you say that again?'],
  shop: ['How much is the blue jacket?', 'I will take a medium, please.', 'That is a bit expensive for me.'],
  solo: ['Nice to meet you.', 'Could you say that again?', 'Thank you, that helps.'],
};

const BASE_GRAPHS = {
  'cafe.join': {
    start: 'greet',
    nodes: {
      greet: node('Barista Tom', [
        { speaker: 'Barista Tom', text: 'Hey, welcome to the plaza cafe. What can I get started for you?' },
        { speaker: 'Player: Mika_88', text: 'Pull up a chair. We are just chatting about drinks.' },
      ], [
        { text: "I'd like a latte, please.", keywords: ['latte', 'coffee', 'like'], next: 'size', reaction: 'nod' },
        { text: 'Do you have tea?', keywords: ['tea', 'have'], next: 'tea', reaction: 'nod' },
        { text: 'Just looking, thanks.', keywords: ['looking', 'browse', 'thanks'], next: 'look', reaction: 'nod' },
      ]),
      size: node('Barista Tom', [
        'Sure. What size would you like, small or medium?',
      ], [
        { text: 'A small latte, please.', keywords: ['small'], next: 'milk', reaction: 'nod' },
        { text: 'Medium, please.', keywords: ['medium', 'bigger'], next: 'milk', reaction: 'jump' },
      ]),
      milk: node('Barista Tom', [
        'Do you want oat milk or regular milk?',
      ], [
        { text: 'Oat milk, please.', keywords: ['oat'], next: 'serve', reaction: 'nod' },
        { text: 'Regular milk is fine.', keywords: ['regular', 'dairy', 'normal'], next: 'serve', reaction: 'nod' },
      ]),
      tea: node('Barista Tom', [
        { speaker: 'Barista Tom', text: 'We have green tea and black tea. Both can be iced.' },
        { speaker: 'Player: Leo_cafe', text: 'The iced black tea is my usual.' },
      ], [
        { text: 'Iced black tea, please.', keywords: ['iced', 'black'], next: 'sweet', reaction: 'nod' },
        { text: 'Hot green tea, please.', keywords: ['green', 'hot'], next: 'sweet', reaction: 'nod' },
      ]),
      look: node('Barista Tom', [
        'No problem. The menu is on the counter. Want a recommendation, or will you read it yourself?',
      ], [
        { text: 'What do you recommend?', keywords: ['recommend', 'suggest', 'popular'], next: 'rec', reaction: 'nod' },
        { text: 'I will read the menu. Thank you.', keywords: ['menu', 'read', 'thank'], next: 'menu2', reaction: 'nod' },
      ]),
      rec: node('Barista Tom', [
        { speaker: 'Barista Tom', text: 'The oat latte is our most popular drink. It is not too sweet.' },
        { speaker: 'Player: Leo_cafe', text: 'That is what I tell everyone too.' },
      ], [
        { text: 'I will try the oat latte.', keywords: ['oat', 'latte', 'try'], next: 'serve', reaction: 'jump' },
        { text: 'Maybe next time. Thanks.', keywords: ['next', 'thanks', 'later'], next: 'menu2', reaction: 'nod' },
      ]),
      menu2: node('Player: Mika_88', [
        { speaker: 'Barista Tom', text: 'Take your time. Wave if a word on the menu is new.' },
        { speaker: 'Player: Mika_88', text: 'We can help with the names of the drinks.' },
      ], [
        { text: 'What is a cappuccino?', keywords: ['cappuccino', 'what'], next: 'cap', reaction: 'nod' },
        { text: 'I am all set. Thank you.', keywords: ['set', 'thank', 'ready'], next: 'thanks', reaction: 'wave' },
      ]),
      cap: node('Barista Tom', [
        'A cappuccino is espresso with steamed milk and foam. It is smaller than a latte.',
      ], [
        { text: 'Then I would like a cappuccino.', keywords: ['cappuccino', 'like'], next: 'done', reaction: 'nod' },
        { text: 'Good to know. I will decide later.', keywords: ['later', 'know', 'decide'], next: 'thanks', reaction: 'nod' },
      ]),
      sweet: node('Barista Tom', [
        'Do you want sugar in the tea?',
      ], [
        { text: 'No sugar, please.', keywords: ['no', 'sugar'], next: 'serve', reaction: 'nod' },
        { text: 'A little sugar, please.', keywords: ['little', 'sugar'], next: 'serve', reaction: 'nod' },
      ]),
      serve: node('Barista Tom', [
        'For here or to go?',
      ], [
        { text: 'For here, please.', keywords: ['here'], next: 'done', reaction: 'nod' },
        { text: 'To go, please.', keywords: ['go', 'takeaway'], next: 'done', reaction: 'nod' },
      ]),
      thanks: node('Player: Mika_88', [
        { speaker: 'Player: Mika_88', text: 'No rush. Do you want to sit with us for a minute?' },
      ], [
        { text: 'Yes, I will sit for a minute.', keywords: ['sit', 'yes'], next: 'done', reaction: 'nod' },
        { text: 'I will walk around first. Thank you.', keywords: ['walk', 'thank'], next: 'done', reaction: 'wave' },
      ]),
      done: node('Barista Tom', [
        { speaker: 'Barista Tom', text: 'Great choice. I will have that ready in a minute. Enjoy the plaza!' },
        { speaker: 'Player: Mika_88', text: 'Nice order. Sit with us if you want. Thanks for chatting.' },
      ], [], { end: true, reaction: 'jump', phrases: PH.cafe }),
    },
  },
  'park.join': {
    start: 'weather',
    nodes: {
      weather: node('Ranger Priya', [
        { speaker: 'Ranger Priya', text: 'Hi there. Beautiful day in the park, isn’t it?' },
        { speaker: 'Player: JuneWalks', text: 'We were just talking about the weekend.' },
      ], [
        { text: 'Yes, the weather is lovely.', keywords: ['weather', 'lovely', 'nice', 'beautiful'], next: 'weekend', reaction: 'nod' },
        { text: 'It looks like rain later.', keywords: ['rain', 'cloud'], next: 'rain', reaction: 'nod' },
      ]),
      weekend: node('Player: Ken_outdoors', [
        'What are you doing this weekend?',
      ], [
        { text: 'I might go for a walk.', keywords: ['walk', 'hike', 'outside'], next: 'invite', reaction: 'jump' },
        { text: 'I will probably stay home and read.', keywords: ['home', 'read', 'inside'], next: 'cozy', reaction: 'nod' },
      ]),
      rain: node('Ranger Priya', [
        'Maybe a light shower. The benches are fine if you bring a light jacket.',
      ], [
        { text: 'Then I will bring a jacket.', keywords: ['jacket', 'bring'], next: 'invite', reaction: 'nod' },
        { text: 'I might come back tomorrow.', keywords: ['tomorrow', 'later'], next: 'water', reaction: 'nod' },
      ]),
      invite: node('Player: JuneWalks', [
        'A walk sounds perfect. We leave from this bench around ten.',
      ], [
        { text: 'I would like to join you.', keywords: ['join', 'like', 'come'], next: 'map', reaction: 'jump' },
        { text: 'Thanks, I already have plans.', keywords: ['plans', 'thanks', 'busy'], next: 'map', reaction: 'nod' },
      ]),
      cozy: node('Player: Ken_outdoors', [
        'That sounds cozy. Do you read stories or something for English class?',
      ], [
        { text: 'I read short stories in English.', keywords: ['read', 'stories', 'english'], next: 'book', reaction: 'nod' },
        { text: 'I mostly rest and listen to music.', keywords: ['rest', 'music', 'listen'], next: 'book', reaction: 'nod' },
      ]),
      book: node('Player: JuneWalks', [
        'Nice. A quiet plan is still a plan. Want to meet here next weekend anyway?',
      ], [
        { text: 'Yes, I would like that.', keywords: ['yes', 'like', 'meet'], next: 'map', reaction: 'jump' },
        { text: 'I will see how the week goes.', keywords: ['see', 'week', 'maybe'], next: 'map', reaction: 'nod' },
      ]),
      water: node('Player: Ken_outdoors', [
        'If you come tomorrow, bring water. Morning is cooler. Will you come in the morning?',
      ], [
        { text: 'Yes, I will come in the morning.', keywords: ['morning', 'yes'], next: 'map', reaction: 'nod' },
        { text: 'I will come in the afternoon.', keywords: ['afternoon'], next: 'map', reaction: 'nod' },
      ]),
      map: node('Ranger Priya', [
        'The fountain is near the tall trees, and the path returns to the plaza. Need anything else?',
      ], [
        { text: 'Where are the benches?', keywords: ['bench', 'where', 'sit'], next: 'bye', reaction: 'nod' },
        { text: 'I am all set. Thank you.', keywords: ['set', 'thank', 'all'], next: 'bye', reaction: 'wave' },
      ]),
      bye: node('Ranger Priya', [
        'Have a good one. Enjoy the fresh air, and wave if you need the path map.',
      ], [], { end: true, reaction: 'nod', phrases: PH.park }),
    },
  },
  'class.join': {
    start: 'intro',
    nodes: {
      intro: node('Teacher Lin', [
        { speaker: 'Teacher Lin', text: 'Welcome. Would you like to introduce yourself to the class?' },
        { speaker: 'Student Noah', text: 'I can go first if you want a model: I am Noah, and I like soccer.' },
      ], [
        { text: 'Hi, my name is Alex. I like music.', keywords: ['name', 'like', 'music', 'alex'], next: 'grammar', reaction: 'nod' },
        { text: 'I am a little nervous, but hello.', keywords: ['nervous', 'hello', 'shy'], next: 'encourage', reaction: 'nod' },
      ]),
      encourage: node('Teacher Lin', [
        'That is a fine start. You can add your name and one thing you like.',
      ], [
        { text: 'My name is Alex, and I like music.', keywords: ['name', 'like', 'music'], next: 'grammar', reaction: 'jump' },
      ]),
      grammar: node('Teacher Lin', [
        'Nice to meet you. Quick question: which sentence is correct? A) I have lived here since two years. B) I have lived here for two years.',
      ], [
        { text: 'B. We use for with a length of time.', keywords: ['for', 'b', 'length', 'two years'], next: 'praise', reaction: 'jump' },
        { text: 'A. Since two years.', keywords: ['since', 'a'], next: 'hint', reaction: 'nod' },
      ]),
      hint: node('Teacher Lin', [
        'Close. Since needs a starting point, like since 2022. For needs a duration, like for two years.',
      ], [
        { text: 'Then B is correct: for two years.', keywords: ['for', 'b', 'correct'], next: 'praise', reaction: 'nod' },
      ]),
      praise: node('Player: Hana_studies', [
        { speaker: 'Teacher Lin', text: 'Yes. That is the present perfect with for. Well done.' },
        { speaker: 'Player: Hana_studies', text: 'Welcome to class. Want to try one more sentence?' },
      ], [
        { text: 'Yes. I have studied English for one year.', keywords: ['studied', 'for', 'year'], next: 'more', reaction: 'jump' },
        { text: 'Thank you. I will practice tonight.', keywords: ['thank', 'practice', 'tonight'], next: 'practice', reaction: 'nod' },
      ]),
      more: node('Teacher Lin', [
        'Excellent. That sentence uses for plus a length of time. You can also say since last year.',
      ], [
        { text: 'I have studied English since last year.', keywords: ['since', 'year'], next: 'close', reaction: 'nod' },
        { text: 'I will write both sentences down.', keywords: ['write', 'both'], next: 'practice', reaction: 'nod' },
      ]),
      practice: node('Teacher Lin', [
        'Before you go, say one sentence about your day.',
      ], [
        { text: 'I am practicing English today.', keywords: ['practic', 'today', 'english'], next: 'close', reaction: 'nod' },
        { text: 'I met new people in class.', keywords: ['met', 'people', 'class'], next: 'close', reaction: 'jump' },
      ]),
      close: node('Student Noah', [
        { speaker: 'Teacher Lin', text: 'Lovely work. Come back any time you want more practice.' },
        { speaker: 'Student Noah', text: 'You did great. See you next class.' },
      ], [], { end: true, reaction: 'wave', phrases: PH.class }),
    },
  },
  'shop.join': {
    start: 'hello',
    nodes: {
      hello: node('Clerk Sam', [
        { speaker: 'Clerk Sam', text: 'Hi! Looking for something special today?' },
        { speaker: 'Player: Mei_shop', text: 'We are comparing prices. Ask Sam anything.' },
      ], [
        { text: 'How much is the blue jacket?', keywords: ['price', 'much', 'jacket', 'cost'], next: 'price', reaction: 'nod' },
        { text: 'Do you have this shirt in a medium?', keywords: ['size', 'medium', 'shirt'], next: 'size', reaction: 'nod' },
      ]),
      price: node('Clerk Sam', [
        'The blue jacket is forty-eight dollars. It comes in small, medium, and large.',
      ], [
        { text: 'I will take a medium, please.', keywords: ['medium', 'take', 'buy'], next: 'pay', reaction: 'jump' },
        { text: 'That is a bit expensive for me.', keywords: ['expensive', 'much', 'cost'], next: 'sale', reaction: 'nod' },
      ]),
      size: node('Clerk Sam', [
        'Yes. Medium should fit if you usually wear a medium. You can try it on.',
      ], [
        { text: 'Great, I will try the medium.', keywords: ['try', 'medium'], next: 'pay', reaction: 'nod' },
        { text: 'What if it is too big?', keywords: ['big', 'return', 'exchange'], next: 'sale', reaction: 'nod' },
      ]),
      sale: node('Clerk Sam', [
        'There is a hat for fifteen dollars, and you can exchange clothes within fourteen days.',
      ], [
        { text: 'I will take the hat, please.', keywords: ['hat', 'take'], next: 'pay', reaction: 'jump' },
        { text: 'I will think about it. Thank you.', keywords: ['think', 'thank'], next: 'bye', reaction: 'nod' },
      ]),
      pay: node('Player: Omar_22', [
        { speaker: 'Clerk Sam', text: 'Wonderful. Will you pay by card or cash?' },
        { speaker: 'Player: Omar_22', text: 'Good pick. The color looks nice.' },
      ], [
        { text: 'By card, please.', keywords: ['card'], next: 'bag', reaction: 'nod' },
        { text: 'Cash, please.', keywords: ['cash'], next: 'bag', reaction: 'nod' },
      ]),
      bag: node('Clerk Sam', [
        'Here is your bag. Would you like a receipt?',
      ], [
        { text: 'Yes, a receipt, please.', keywords: ['receipt', 'yes'], next: 'wrap', reaction: 'nod' },
        { text: 'No receipt. Thank you.', keywords: ['no', 'thank'], next: 'wrap', reaction: 'wave' },
      ]),
      bye: node('Clerk Sam', [
        'Of course. Take your time, and come back any time.',
      ], [
        { text: 'Thanks. I will look around a bit more.', keywords: ['thanks', 'look', 'around'], next: 'wrap', reaction: 'nod' },
        { text: 'See you later. Have a good day.', keywords: ['later', 'day', 'see'], next: 'wrap', reaction: 'wave' },
      ]),
      wrap: node('Player: Mei_shop', [
        { speaker: 'Clerk Sam', text: 'You too. It was nice talking with you.' },
        { speaker: 'Player: Mei_shop', text: 'See you around the plaza.' },
      ], [], { end: true, phrases: PH.shop }),
    },
  },
  'tom.solo': {
    start: 'a',
    nodes: {
      a: node('Barista Tom', [
        'I have worked this counter for three years. Do you want a recommendation?',
      ], [
        { text: 'What do you drink in the morning?', keywords: ['morning', 'drink', 'recommend'], next: 'b', reaction: 'nod' },
        { text: 'How busy does the cafe get?', keywords: ['busy', 'crowd'], next: 'c', reaction: 'nod' },
      ]),
      b: node('Barista Tom', [
        'A small latte with oat milk. It is simple, and it wakes me up. Do you take sugar?',
      ], [
        { text: 'No sugar, please.', keywords: ['no', 'sugar'], next: 'd', reaction: 'nod' },
        { text: 'Just a little sugar.', keywords: ['little', 'sugar'], next: 'd', reaction: 'nod' },
      ]),
      c: node('Barista Tom', [
        'Mornings are busy, but afternoons are calm. Do you want to practice ordering?',
      ], [
        { text: 'Yes. I would like a tea, please.', keywords: ['tea', 'like', 'yes'], next: 'd', reaction: 'jump' },
        { text: 'Maybe later. Thank you.', keywords: ['later', 'thank'], next: 'd', reaction: 'nod' },
      ]),
      d: node('Barista Tom', [
        'Nice and clear. People also say "for here" or "to go". Which do you prefer?',
      ], [
        { text: 'For here, please.', keywords: ['here'], next: 'e', reaction: 'nod' },
        { text: 'To go, please.', keywords: ['go', 'take'], next: 'e', reaction: 'nod' },
      ]),
      e: node('Barista Tom', [
        'Perfect. Thanks for the chat. I will save you a clean cup next time.',
      ], [], { end: true, reaction: 'wave', phrases: PH.cafe }),
    },
  },
  'mika.solo': {
    start: 'a',
    nodes: {
      a: node('Player: Mika_88', [
        'Oh hey. I am Mika. I come here to talk with people in English. How is your day?',
      ], [
        { text: 'Pretty good. I am practicing too.', keywords: ['good', 'practic', 'english'], next: 'b', reaction: 'jump' },
        { text: 'A little tired, honestly.', keywords: ['tired', 'sleepy'], next: 'c', reaction: 'nod' },
      ]),
      b: node('Player: Mika_88', [
        'Nice. Ordering food is great practice. What do you usually say at a counter?',
      ], [
        { text: 'I would like a coffee, please.', keywords: ['coffee', 'like'], next: 'd', reaction: 'nod' },
        { text: 'Can I have the menu, please?', keywords: ['menu', 'have'], next: 'd', reaction: 'nod' },
      ]),
      c: node('Player: Mika_88', [
        'A quiet table is perfect. Do you want to sit, or keep walking?',
      ], [
        { text: 'I will sit for a minute.', keywords: ['sit'], next: 'd', reaction: 'nod' },
        { text: 'I will keep walking. Thanks.', keywords: ['walk', 'thanks'], next: 'd', reaction: 'wave' },
      ]),
      d: node('Player: Mika_88', [
        'Sounds good. It was nice to meet you. Come say hi again.',
      ], [], { end: true, phrases: PH.solo }),
    },
  },
  'ken.solo': {
    start: 'a',
    nodes: {
      a: node('Player: Ken_outdoors', [
        'I am Ken. I walk this park most days. Do you like being outside?',
      ], [
        { text: 'Yes, especially in good weather.', keywords: ['yes', 'weather', 'outside'], next: 'b', reaction: 'nod' },
        { text: 'I prefer indoor hobbies.', keywords: ['indoor', 'inside', 'prefer'], next: 'c', reaction: 'nod' },
      ]),
      b: node('Player: Ken_outdoors', [
        'Same. If it is windy, I walk a shorter loop. Do you walk in the morning or evening?',
      ], [
        { text: 'Usually in the morning.', keywords: ['morning'], next: 'd', reaction: 'nod' },
        { text: 'After class, in the evening.', keywords: ['evening', 'after'], next: 'd', reaction: 'nod' },
      ]),
      c: node('Player: Ken_outdoors', [
        'That is fair. The benches are here for a short break. Want a water-bottle tip?',
      ], [
        { text: 'Yes, please.', keywords: ['yes', 'please'], next: 'd', reaction: 'nod' },
        { text: 'No thanks. I am fine.', keywords: ['no', 'fine'], next: 'd', reaction: 'wave' },
      ]),
      d: node('Player: Ken_outdoors', [
        'Bring water, and say "I am heading out" when you leave. Nice talking with you.',
      ], [], { end: true, phrases: PH.park }),
    },
  },
  'priya.solo': {
    start: 'a',
    nodes: {
      a: node('Ranger Priya', [
        'Hi, I am Priya. I look after the park. Please remember the simple rules.',
      ], [
        { text: 'What are the rules?', keywords: ['rule', 'what'], next: 'b', reaction: 'nod' },
        { text: 'Can I have a picnic here?', keywords: ['picnic', 'eat', 'food'], next: 'c', reaction: 'nod' },
      ]),
      b: node('Ranger Priya', [
        'Stay on the path, take your trash with you, and keep music quiet. All clear?',
      ], [
        { text: 'Yes. I will follow the rules.', keywords: ['yes', 'rules', 'follow'], next: 'd', reaction: 'nod' },
        { text: 'Could you repeat the last one?', keywords: ['repeat', 'again', 'last'], next: 'd', reaction: 'nod' },
      ]),
      c: node('Ranger Priya', [
        'Yes. Use a bench, and pack up your wrappers before you leave. Need anything else?',
      ], [
        { text: 'Where are the bins?', keywords: ['bin', 'trash', 'where'], next: 'd', reaction: 'nod' },
        { text: 'That is all. Thank you.', keywords: ['all', 'thank'], next: 'd', reaction: 'wave' },
      ]),
      d: node('Ranger Priya', [
        'The bins are by the benches. Thanks for asking. Enjoy the trees.',
      ], [], { end: true, reaction: 'nod', phrases: PH.park }),
    },
  },
  'lin.solo': {
    start: 'a',
    nodes: {
      a: node('Teacher Lin', [
        'Hello. Do you want a little help with a sentence?',
      ], [
        { text: 'Yes. When do I use since and for?', keywords: ['since', 'for', 'when'], next: 'b', reaction: 'nod' },
        { text: 'How can I introduce myself more naturally?', keywords: ['introduce', 'myself', 'natural'], next: 'c', reaction: 'nod' },
      ]),
      b: node('Teacher Lin', [
        'Use since with a start time: since Monday. Use for with a duration: for three days. Want to try?',
      ], [
        { text: 'I have studied English for one year.', keywords: ['for', 'year', 'studied'], next: 'd', reaction: 'jump' },
        { text: 'I have lived here since May.', keywords: ['since', 'may', 'lived'], next: 'd', reaction: 'nod' },
      ]),
      c: node('Teacher Lin', [
        'Try: Hi, I am …, and I am into …. Then ask a question back. Your turn.',
      ], [
        { text: 'Hi, I am Alex, and I am into music. What about you?', keywords: ['into', 'music', 'what'], next: 'd', reaction: 'jump' },
        { text: 'Hi, I am Alex. I am into cooking. How about you?', keywords: ['cooking', 'how about'], next: 'd', reaction: 'nod' },
      ]),
      d: node('Teacher Lin', [
        'That sounds natural. Say it once more later today so it sticks. Lovely work.',
      ], [], { end: true, reaction: 'nod', phrases: PH.class }),
    },
  },
  'noah.solo': {
    start: 'a',
    nodes: {
      a: node('Student Noah', [
        'I am Noah. I get nervous when I speak, but I still try. Do you?',
      ], [
        { text: 'Yes. I practice a little every day.', keywords: ['practice', 'every', 'yes'], next: 'b', reaction: 'nod' },
        { text: 'Speaking in class is hard for me too.', keywords: ['hard', 'class', 'too'], next: 'c', reaction: 'nod' },
      ]),
      b: node('Student Noah', [
        'That is smart. Short practice is easier than one long talk. What do you practice?',
      ], [
        { text: 'I practice ordering food.', keywords: ['order', 'food'], next: 'd', reaction: 'nod' },
        { text: 'I practice introducing myself.', keywords: ['introduc', 'myself'], next: 'd', reaction: 'nod' },
      ]),
      c: node('Student Noah', [
        'We can keep answers short. One or two sentences is enough. Want to try one now?',
      ], [
        { text: 'Hi. I am practicing with you.', keywords: ['hi', 'practic'], next: 'd', reaction: 'jump' },
        { text: 'Maybe next time. Thank you.', keywords: ['next', 'thank'], next: 'd', reaction: 'wave' },
      ]),
      d: node('Student Noah', [
        'You did well. See you in class. Remember: short answers are still real English.',
      ], [], { end: true, phrases: PH.class }),
    },
  },
  'sam.solo': {
    start: 'a',
    nodes: {
      a: node('Clerk Sam', [
        'Need help finding a size, or do you have a question about returns?',
      ], [
        { text: 'What is your return policy?', keywords: ['return', 'policy', 'exchange'], next: 'b', reaction: 'nod' },
        { text: 'Which size should I pick?', keywords: ['size', 'pick', 'which'], next: 'c', reaction: 'nod' },
      ]),
      b: node('Clerk Sam', [
        'You can return unworn items within fourteen days with the receipt. Do you have the receipt?',
      ], [
        { text: 'Yes, I keep my receipts.', keywords: ['yes', 'receipt'], next: 'd', reaction: 'nod' },
        { text: 'Not this time. I will next time.', keywords: ['next', 'not'], next: 'd', reaction: 'nod' },
      ]),
      c: node('Clerk Sam', [
        'If you are between sizes, choose the larger one. The jackets fit a little small. Want to try one?',
      ], [
        { text: 'Yes. I will try the larger size.', keywords: ['larger', 'try', 'yes'], next: 'd', reaction: 'jump' },
        { text: 'I will think about the size.', keywords: ['think', 'size'], next: 'd', reaction: 'nod' },
      ]),
      d: node('Clerk Sam', [
        'Happy to help. Ask "Can I try this on?" any time. I will be at the counter.',
      ], [], { end: true, reaction: 'wave', phrases: PH.shop }),
    },
  },
  'omar.solo': {
    start: 'a',
    nodes: {
      a: node('Player: Omar_22', [
        'I am Omar. I am deciding between a hat and a jacket. Any advice?',
      ], [
        { text: 'Get the jacket if you want something warm.', keywords: ['jacket', 'warm'], next: 'b', reaction: 'nod' },
        { text: 'A hat is cheaper for a gift.', keywords: ['hat', 'cheap', 'gift'], next: 'c', reaction: 'nod' },
      ]),
      b: node('Player: Omar_22', [
        'True. Evenings get cool. Should I ask Sam for a medium or a large?',
      ], [
        { text: 'Ask for a medium first.', keywords: ['medium'], next: 'd', reaction: 'nod' },
        { text: 'Ask if you can try both.', keywords: ['try', 'both'], next: 'd', reaction: 'nod' },
      ]),
      c: node('Player: Omar_22', [
        'Good point. My friend would like a simple hat. What color should I pick?',
      ], [
        { text: 'Blue is a safe gift.', keywords: ['blue'], next: 'd', reaction: 'nod' },
        { text: 'Ask your friend first.', keywords: ['ask', 'friend'], next: 'd', reaction: 'nod' },
      ]),
      d: node('Player: Omar_22', [
        'Thanks, that helps. I will say "I will take this one, please." See you around.',
      ], [], { end: true, reaction: 'wave', phrases: PH.shop }),
    },
  },
  'rae.solo': {
    start: 'a',
    nodes: {
      a: node('Player: Rae_guides', [
        'Hey, I am Rae. I can point you around. Where do you want to go?',
      ], [
        { text: 'Where is the cafe?', keywords: ['cafe', 'coffee'], next: 'cafe', reaction: 'nod' },
        { text: 'How do I find the classroom?', keywords: ['class', 'classroom', 'study'], next: 'class', reaction: 'nod' },
        { text: 'Which way is the shop?', keywords: ['shop', 'store'], next: 'shop', reaction: 'nod' },
      ]),
      cafe: node('Player: Rae_guides', [
        'The cafe is the brown corner to the southwest. Look for the long counter. Want a phrase for the barista?',
      ], [
        { text: 'Yes. How do I order a latte?', keywords: ['latte', 'order', 'yes'], next: 'phrase', reaction: 'nod' },
        { text: 'No thanks. I can find it.', keywords: ['no', 'find'], next: 'bye', reaction: 'wave' },
      ]),
      class: node('Player: Rae_guides', [
        'The classroom is northwest, with a blue floor and a whiteboard. Need a way to join the lesson?',
      ], [
        { text: 'How do I introduce myself?', keywords: ['introduc', 'myself', 'how'], next: 'phrase', reaction: 'nod' },
        { text: 'I will just listen first.', keywords: ['listen'], next: 'bye', reaction: 'nod' },
      ]),
      shop: node('Player: Rae_guides', [
        'The shop is the orange corner to the northeast. Shelves are along the back. Need a shopping phrase?',
      ], [
        { text: 'How do I ask the price?', keywords: ['price', 'how', 'much'], next: 'phrase', reaction: 'nod' },
        { text: 'I am only looking today.', keywords: ['looking'], next: 'bye', reaction: 'nod' },
      ]),
      phrase: node('Player: Rae_guides', [
        'Try "Could you help me, please?" Then say what you need in one short sentence. Want me to repeat that?',
      ], [
        { text: 'Yes, please say it again.', keywords: ['again', 'yes', 'repeat'], next: 'bye', reaction: 'nod' },
        { text: 'Got it. Thank you, Rae.', keywords: ['got', 'thank'], next: 'bye', reaction: 'jump' },
      ]),
      bye: node('Player: Rae_guides', [
        'You are welcome. Have fun out there, and wave if you get lost.',
      ], [], { end: true, reaction: 'wave', phrases: ['Where is the cafe?', 'Could you help me, please?', 'Thank you, Rae.'] }),
    },
  },
  'eli.solo': {
    start: 'a',
    nodes: {
      a: node('Student Eli', [
        'Hi. I am Eli. I am walking and repeating vocabulary. Do you have a test soon?',
      ], [
        { text: 'Yes, and I feel a bit worried.', keywords: ['worried', 'test', 'yes', 'nervous'], next: 'b', reaction: 'nod' },
        { text: 'Not soon. I am just practicing.', keywords: ['practic', 'not', 'just'], next: 'c', reaction: 'nod' },
      ]),
      b: node('Student Eli', [
        'Try saying one full sentence out loud. It helps more than reading only.',
      ], [
        { text: 'I will try that. Thanks, Eli.', keywords: ['try', 'thank'], next: 'd', reaction: 'jump' },
      ]),
      c: node('Student Eli', [
        'Cool. The classroom group is friendly if you want more practice. Will you join them?',
      ], [
        { text: 'Yes, I will join the class group.', keywords: ['yes', 'join'], next: 'd', reaction: 'jump' },
        { text: 'Not today. I am walking with you.', keywords: ['not', 'today', 'walk'], next: 'd', reaction: 'nod' },
      ]),
      d: node('Student Eli', [
        'You have got this. A useful line is "Could you say that again, please?" See you around the plaza.',
      ], [], { end: true, reaction: 'wave', phrases: PH.class }),
    },
  },
};

export const GRAPHS = {
  ...BASE_GRAPHS,
  ...cafeGraphs,
  ...parkGraphs,
  ...classGraphs,
  ...shopGraphs,
  ...soloGraphs,
};

applyLegacyZh(GRAPHS, AMBIENT, VISITOR_LINES);

const CJK = /[\u4e00-\u9fff]/;

/**
 * Lists dialogue strings that have no Chinese.
 * Covers NPC lines, reply choices, recap phrases, ambient lines, and visitor lines.
 * Hint text is the opening words of a choice, so a choice with zh covers it.
 * @returns {{ kind: string, id: string, text: string }[]}
 */
export function missingZh() {
  const missing = [];
  const add = (kind, id, text, zh) => {
    const value = String(text || '').trim();
    if (!value) return;
    if (zh && CJK.test(zh)) return;
    missing.push({ kind, id, text: value });
  };
  for (const [gid, graph] of Object.entries(GRAPHS)) {
    for (const [nid, node] of Object.entries(graph.nodes || {})) {
      const where = `${gid}.${nid}`;
      for (const line of node.lines || []) {
        if (typeof line === 'string') add('line', where, line, '');
        else add('line', where, line.text, line.zh);
      }
      for (const choice of node.choices || []) add('choice', where, choice.text, choice.zh);
      for (const phrase of node.phrases || []) {
        if (typeof phrase === 'string') add('phrase', where, phrase, '');
        else add('phrase', where, phrase.text, phrase.zh);
      }
    }
  }
  for (const [id, lines] of Object.entries(AMBIENT)) {
    for (const line of lines) add('ambient', id, line.text, line.zh);
  }
  for (const [id, lines] of Object.entries(VISITOR_LINES)) {
    for (const line of lines) {
      if (typeof line === 'string') add('visitor', id, line, '');
      else add('visitor', id, line.text, line.zh);
    }
  }
  return missing;
}
