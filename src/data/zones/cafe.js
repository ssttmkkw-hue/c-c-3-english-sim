import { choice, line, node } from '../script.js';

const phrases = [
  'I slept well, thank you.',
  'I usually get up at seven.',
  'Let us meet here at nine.',
];

export const cafeGraphs = {
  'cafe.morning': {
    start: 'sleep',
    nodes: {
      sleep: node('Player: Mika_88', [
        line('Player: Mika_88', 'Good morning. Did you sleep well?', '早上好。你睡得好吗？'),
        line('Barista Tom', 'Grab a seat. The first pot of coffee is ready.', '坐吧。第一壶咖啡好了。'),
      ], [
        choice('Yes, I slept well.', '是的，我睡得很好。', ['slept', 'well', 'yes'], 'time'),
        choice('I am a little sleepy.', '我有点困。', ['sleepy', 'tired'], 'time'),
        choice('Not really. I stayed up late.', '不太好。我熬夜了。', ['late', 'not', 'night'], 'time'),
      ]),
      time: node('Barista Tom', [
        line('Barista Tom', 'Coffee helps. What time do you usually get up?', '咖啡能提神。你通常几点起床？'),
      ], [
        choice('I usually get up at seven.', '我通常七点起床。', ['seven', '7'], 'breakfast'),
        choice('I get up around eight.', '我大约八点起床。', ['eight', '8'], 'breakfast'),
      ]),
      breakfast: node('Player: Leo_cafe', [
        line('Player: Leo_cafe', 'Do you eat breakfast, or do you just drink coffee?', '你吃早餐，还是只喝咖啡？'),
      ], [
        choice('I usually have toast.', '我通常吃吐司。', ['toast', 'eat', 'breakfast'], 'after'),
        choice('I just drink coffee.', '我只喝咖啡。', ['coffee', 'just', 'drink'], 'after'),
        choice('I skip breakfast on weekdays.', '工作日我不吃早餐。', ['skip', 'weekday'], 'after'),
      ]),
      after: node('Player: Mika_88', [
        line('Player: Mika_88', 'What are you doing after this cup?', '喝完这杯你要去做什么？'),
      ], [
        choice('I am going to class.', '我要去上课。', ['class', 'school'], 'bye'),
        choice('I am going for a walk.', '我要去散步。', ['walk', 'park'], 'bye'),
      ]),
      bye: node('Barista Tom', [
        line('Barista Tom', 'Have a good morning. Will we see you tomorrow?', '祝你上午愉快。明天还能见到你吗？'),
      ], [
        choice('Yes, see you tomorrow.', '好，明天见。', ['tomorrow', 'yes', 'see'], 'end'),
        choice('Maybe. Have a good day.', '也许吧。祝你今天愉快。', ['maybe', 'day'], 'end'),
      ]),
      end: node('Player: Mika_88', [
        line('Barista Tom', 'I will save you a window seat if I can.', '有空的话我会给你留个靠窗的位子。'),
        line('Player: Mika_88', 'Come say good morning again. It is good practice.', '再来跟我们说早上好。这是很好的练习。'),
      ], [], { end: true, reaction: 'wave', phrases }),
    },
  },
  'cafe.plans': {
    start: 'free',
    nodes: {
      free: node('Player: Mika_88', [
        line('Player: Mika_88', 'We were talking about Saturday. Are you free this weekend?', '我们在聊周六。你这周末有空吗？'),
        line('Player: Leo_cafe', 'No pressure. We are still deciding.', '不勉强。我们还在决定。'),
      ], [
        choice('I am free on Saturday.', '我周六有空。', ['saturday', 'free'], 'museum'),
        choice('I am busy on Sunday, but Saturday is open.', '我周日忙，但周六有空。', ['sunday', 'saturday', 'busy'], 'museum'),
        choice('I am not sure yet.', '我还不确定。', ['sure', 'not', 'maybe'], 'museum'),
      ]),
      museum: node('Player: Leo_cafe', [
        line('Player: Leo_cafe', 'We might visit a museum in the afternoon. Would you like to come?', '我们下午也许去博物馆。你想一起来吗？'),
      ], [
        choice('That sounds fun. What time?', '听起来不错。几点？', ['time', 'fun', 'when'], 'travel'),
        choice('I have not been to a museum in a while.', '我好久没去博物馆了。', ['museum', 'while', 'been'], 'travel'),
        choice('I would rather stay in the cafe.', '我更想待在咖啡馆。', ['rather', 'stay', 'cafe'], 'travel'),
      ]),
      travel: node('Barista Tom', [
        line('Barista Tom', 'If you go, leave by ten so you are not rushed. How will you get there?', '要去的话，十点前出发就不赶。你们怎么去？'),
      ], [
        choice('I will take the bus.', '我坐公交去。', ['bus'], 'meet'),
        choice('I can walk if it is close.', '如果近的话我可以走过去。', ['walk', 'close'], 'meet'),
      ]),
      meet: node('Player: Mika_88', [
        line('Player: Mika_88', 'Should we meet here, or at the museum door?', '我们在这儿见，还是在博物馆门口见？'),
      ], [
        choice('Let us meet here at nine.', '我们九点在这儿见。', ['here', 'nine', '9'], 'confirm'),
        choice('Let us meet at the museum.', '我们在博物馆见。', ['museum', 'meet'], 'confirm'),
      ]),
      confirm: node('Player: Leo_cafe', [
        line('Player: Leo_cafe', 'Great. I will text you if the plan changes. Does that work?', '好。计划有变我会发消息给你。这样可以吗？'),
      ], [
        choice('Yes, that works for me.', '可以，我没问题。', ['works', 'yes'], 'end'),
        choice('Please text me the address too.', '请把地址也发给我。', ['address', 'text'], 'end'),
      ]),
      end: node('Barista Tom', [
        line('Barista Tom', 'I will have coffee ready if you meet here. Have a fun weekend either way.', '如果你们在这儿见，我会准备好咖啡。不管怎样，周末愉快。'),
        line('Player: Mika_88', 'See you Saturday, if your plans stay open.', '如果你周六还空着，周六见。'),
      ], [], { end: true, phrases }),
    },
  },
};
