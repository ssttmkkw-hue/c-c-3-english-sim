/** Preset ambient loops and branching dialogues. Beginner–intermediate English. */

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

export const GRAPHS = {
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
        { text: 'Oat milk, please.', keywords: ['oat'], next: 'done', reaction: 'nod' },
        { text: 'Regular milk is fine.', keywords: ['regular', 'dairy', 'normal'], next: 'done', reaction: 'nod' },
      ]),
      tea: node('Barista Tom', [
        { speaker: 'Barista Tom', text: 'We have green tea and black tea. Both can be iced.' },
        { speaker: 'Player: Leo_cafe', text: 'The iced black tea is my usual.' },
      ], [
        { text: 'Iced black tea, please.', keywords: ['iced', 'black'], next: 'done', reaction: 'nod' },
        { text: 'Hot green tea, please.', keywords: ['green', 'hot'], next: 'done', reaction: 'nod' },
      ]),
      look: node('Barista Tom', [
        'No problem. The menu is on the counter. Wave if you need me.',
      ], [], { end: true }),
      done: node('Barista Tom', [
        { speaker: 'Barista Tom', text: 'Great choice. I will have that ready in a minute. Enjoy the plaza!' },
        { speaker: 'Player: Mika_88', text: 'Nice order. Sit with us if you want.' },
      ], [], { end: true, reaction: 'jump' }),
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
        { text: 'I might come back tomorrow.', keywords: ['tomorrow', 'later'], next: 'bye', reaction: 'nod' },
      ]),
      invite: node('Player: JuneWalks', [
        'A walk sounds perfect. We leave from this bench around ten.',
      ], [
        { text: 'I would like to join you.', keywords: ['join', 'like', 'come'], next: 'bye', reaction: 'jump' },
        { text: 'Thanks, I already have plans.', keywords: ['plans', 'thanks', 'busy'], next: 'bye', reaction: 'nod' },
      ]),
      cozy: node('Player: Ken_outdoors', [
        'That sounds cozy. A quiet weekend is good too.',
      ], [], { end: true }),
      bye: node('Ranger Priya', [
        'Have a good one. Enjoy the fresh air, and wave if you need the path map.',
      ], [], { end: true, reaction: 'nod' }),
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
        { speaker: 'Player: Hana_studies', text: 'Welcome to class. You explained it clearly.' },
      ], [], { end: true, reaction: 'jump' }),
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
        { speaker: 'Clerk Sam', text: 'Wonderful. I will ring that up at the counter.' },
        { speaker: 'Player: Omar_22', text: 'Good pick. The color looks nice.' },
      ], [], { end: true, reaction: 'jump' }),
      bye: node('Clerk Sam', [
        'Of course. Take your time, and come back any time.',
      ], [], { end: true }),
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
        'A small latte with oat milk. It is simple, and it wakes me up.',
      ], [
        { text: 'I will try that next time.', keywords: ['try', 'next'], next: 'd', reaction: 'jump' },
      ]),
      c: node('Barista Tom', [
        'Mornings are busy, but afternoons are calm. It is a good time to practice English here.',
      ], [
        { text: 'That is why I came. Thank you.', keywords: ['thank', 'practice', 'english'], next: 'd', reaction: 'nod' },
      ]),
      d: node('Barista Tom', [
        'Any time. I will save you a clean cup.',
      ], [], { end: true }),
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
        'Nice. Ordering food is great practice. The staff are patient.',
      ], [], { end: true }),
      c: node('Player: Mika_88', [
        'Then a quiet table is perfect. No pressure to talk the whole time.',
      ], [], { end: true }),
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
        'Same. If it is windy, I just walk a shorter loop.',
      ], [], { end: true }),
      c: node('Player: Ken_outdoors', [
        'That is fair. The benches are here if you only want a short break.',
      ], [], { end: true }),
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
        'Stay on the path, take your trash with you, and keep music quiet.',
      ], [
        { text: 'I will. Thank you for the reminder.', keywords: ['thank', 'will'], next: 'd', reaction: 'nod' },
      ]),
      c: node('Ranger Priya', [
        'Yes. Use a bench, and pack up your wrappers before you leave.',
      ], [
        { text: 'Sounds good. I will clean up.', keywords: ['clean', 'good', 'will'], next: 'd', reaction: 'jump' },
      ]),
      d: node('Ranger Priya', [
        'Thanks. Enjoy the trees.',
      ], [], { end: true }),
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
        'Use since with a start time: since Monday. Use for with a duration: for three days.',
      ], [
        { text: 'I have studied English for one year.', keywords: ['for', 'year', 'studied'], next: 'd', reaction: 'jump' },
      ]),
      c: node('Teacher Lin', [
        'Try: Hi, I am …, and I am into …. Then ask a question back.',
      ], [
        { text: 'Hi, I am Alex, and I am into music. What about you?', keywords: ['into', 'what about', 'music'], next: 'd', reaction: 'jump' },
      ]),
      d: node('Teacher Lin', [
        'That sounds natural. Say it once more later today so it sticks.',
      ], [], { end: true }),
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
        'That is smart. Short practice is easier than one long talk.',
      ], [], { end: true }),
      c: node('Student Noah', [
        'We can keep answers short. One or two sentences is enough.',
      ], [], { end: true, reaction: 'nod' }),
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
        'You can return unworn items within fourteen days with the receipt.',
      ], [
        { text: 'Good to know. Thank you.', keywords: ['thank', 'know'], next: 'd', reaction: 'nod' },
      ]),
      c: node('Clerk Sam', [
        'If you are between sizes, choose the larger one. The jackets fit a little small.',
      ], [
        { text: 'Then I will try the larger size.', keywords: ['larger', 'try', 'bigger'], next: 'd', reaction: 'jump' },
      ]),
      d: node('Clerk Sam', [
        'Happy to help. I will be at the counter.',
      ], [], { end: true }),
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
        'True. Evenings in the plaza get cool.',
      ], [], { end: true }),
      c: node('Player: Omar_22', [
        'Good point. My friend would like a simple hat.',
      ], [], { end: true, reaction: 'jump' }),
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
        'The cafe is the brown corner to the southwest. Look for the long counter.',
      ], [], { end: true }),
      class: node('Player: Rae_guides', [
        'The classroom is northwest, with a blue floor and a whiteboard.',
      ], [], { end: true }),
      shop: node('Player: Rae_guides', [
        'The shop is the orange corner to the northeast. Shelves are along the back.',
      ], [], { end: true }),
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
        'Cool. The classroom group is friendly if you want more practice.',
      ], [], { end: true }),
      d: node('Student Eli', [
        'You have got this. See you around the plaza.',
      ], [], { end: true }),
    },
  },
};
