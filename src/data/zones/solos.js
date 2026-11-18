import { choice, line, node } from '../script.js';

export const soloGraphs = {
  'nina.solo': {
    start: 'lost',
    nodes: {
      lost: node('Tourist Nina', [
        line('Tourist Nina', 'Excuse me, I am a bit lost. Is this the main plaza?', '打扰一下，我有点迷路了。这里是主广场吗？'),
      ], [
        choice('Yes, this is the plaza.', '是的，这里是广场。', ['yes', 'plaza'], 'cafe'),
        choice('Can I help you find something?', '我能帮你找地方吗？', ['help', 'find'], 'cafe'),
      ]),
      cafe: node('Tourist Nina', [
        line('Tourist Nina', 'Thank you. How do I get to the cafe? I would love a cup of tea.', '谢谢。咖啡馆怎么走？我想喝杯茶。'),
      ], [
        choice('The cafe is to the southwest.', '咖啡馆在西南边。', ['southwest', 'cafe'], 'class'),
        choice('Walk toward the brown floor and the long counter.', '朝棕色地面和长柜台走。', ['brown', 'counter', 'walk'], 'class'),
      ]),
      class: node('Tourist Nina', [
        line('Tourist Nina', 'And the classroom? I have a lesson later today.', '那教室呢？我今天晚些时候有课。'),
      ], [
        choice('The classroom is northwest.', '教室在西北边。', ['northwest', 'class'], 'shop'),
        choice('Look for the blue floor and the whiteboard.', '找蓝色的地面和白板。', ['blue', 'whiteboard'], 'shop'),
      ]),
      shop: node('Tourist Nina', [
        line('Tourist Nina', 'You are kind. Is the shop far from here?', '你人真好。商店离这儿远吗？'),
      ], [
        choice('The shop is northeast. It is a short walk.', '商店在东北边，走过去很近。', ['northeast', 'short', 'shop'], 'bye'),
        choice('It is close. You will see the orange floor.', '很近。你会看到橙色的地面。', ['close', 'orange'], 'bye'),
      ]),
      bye: node('Tourist Nina', [
        line('Tourist Nina', 'Thanks a lot. I will say "excuse me" if I get lost again.', '非常感谢。如果再迷路，我会说 excuse me。'),
      ], [
        choice('You are welcome. Enjoy the plaza.', '不客气。祝你在广场玩得开心。', ['welcome', 'enjoy'], 'end'),
        choice('Have a good visit.', '祝你参观愉快。', ['visit', 'good'], 'end'),
      ]),
      end: node('Tourist Nina', [
        line('Tourist Nina', 'I will remember: cafe southwest, classroom northwest, shop northeast. Thank you!', '我会记住：咖啡馆在西南，教室在西北，商店在东北。谢谢你！'),
      ], [], {
        end: true,
        reaction: 'wave',
        phrases: ['Excuse me, I am a bit lost.', 'How do I get to the cafe?', 'It is a short walk.'],
      }),
    },
  },
  'ada.solo': {
    start: 'tutor',
    nodes: {
      tutor: node('Librarian Ada', [
        line('Librarian Ada', 'Hello, I am Ada. I tutor English by the desks. Would you like a short exercise?', '你好，我是 Ada。我在课桌边辅导英语。你想做个小练习吗？'),
      ], [
        choice('Yes, please.', '好的，请吧。', ['yes', 'please'], 'am'),
        choice('What kind of exercise is it?', '是什么样的练习？', ['kind', 'what', 'exercise'], 'am'),
      ]),
      am: node('Librarian Ada', [
        line('Librarian Ada', 'Fill the gap: I ___ a student. Which verb fits with I?', '填空：I ___ a student。哪个动词和 I 搭配？'),
      ], [
        choice('I am a student.', '我是学生。', ['am'], 'she'),
        choice('I is a student.', '我是学生。（这句不对：I 后面要用 am）', ['is'], 'fix'),
      ]),
      fix: node('Librarian Ada', [
        line('Librarian Ada', 'Close. Use am with I, and is with he or she. Try the first one again.', '很接近。I 用 am，he 或 she 用 is。再试第一句。'),
      ], [
        choice('I am a student.', '我是学生。', ['am'], 'she'),
        choice('Could you say that again?', '你能再说一次吗？', ['again', 'repeat'], 'she'),
      ]),
      she: node('Librarian Ada', [
        line('Librarian Ada', 'Good. Now try: She ___ from Seoul.', '很好。现在试：She ___ from Seoul。'),
      ], [
        choice('She is from Seoul.', '她来自首尔。', ['is', 'seoul'], 'polite'),
        choice('She are from Seoul.', '她来自首尔。（这句不对：she 后面要用 is）', ['are'], 'fixshe'),
      ]),
      fixshe: node('Librarian Ada', [
        line('Librarian Ada', 'Use is with she: She is from Seoul. Are is for you, we, and they.', 'she 要用 is：She is from Seoul。are 用于 you、we 和 they。'),
      ], [
        choice('She is from Seoul.', '她来自首尔。', ['is', 'seoul'], 'polite'),
        choice('Thanks, I will remember is.', '谢谢，我会记住用 is。', ['remember', 'is', 'thanks'], 'polite'),
      ]),
      polite: node('Librarian Ada', [
        line('Librarian Ada', 'A polite way to ask for help is "Could you help me with this word?" Can you try it?', '礼貌地求助可以说 “Could you help me with this word?” 你能试着说吗？'),
      ], [
        choice('Could you help me with this word?', '你能帮我看看这个词吗？', ['help', 'word', 'could'], 'bye'),
        choice('Please help me with this word.', '请帮我看看这个词。', ['please', 'help', 'word'], 'bye'),
      ]),
      bye: node('Librarian Ada', [
        line('Librarian Ada', 'Lovely. Come by the desks any time you want five quiet minutes.', '很好。想安静练五分钟的时候，随时来课桌这边。'),
      ], [
        choice('Thank you, Ada.', '谢谢你，Ada。', ['thank', 'ada'], 'end'),
        choice('I will practice the verbs.', '我会练习这些动词。', ['verb', 'practice'], 'end'),
      ]),
      end: node('Librarian Ada', [
        line('Librarian Ada', 'Remember: I am, she is. And "Could you help me?" is a friendly question.', '记住：I am，she is。还有，“Could you help me?” 是个友好的问句。'),
      ], [], {
        end: true,
        phrases: ['I am a student.', 'She is from Seoul.', 'Could you help me with this word?'],
      }),
    },
  },
  'jo.solo': {
    start: 'music',
    nodes: {
      music: node('Musician Jo', [
        line('Musician Jo', 'Hey, I am Jo. I play here in the afternoons. Do you like music?', '嘿，我是 Jo。我下午在这儿演奏。你喜欢音乐吗？'),
      ], [
        choice('Yes, I love music.', '是的，我很喜欢音乐。', ['love', 'music', 'yes'], 'request'),
        choice('I listen when I study.', '我学习的时候会听音乐。', ['listen', 'study'], 'request'),
        choice('What do you play?', '你演奏什么？', ['what', 'play'], 'request'),
      ]),
      request: node('Musician Jo', [
        line('Musician Jo', 'Mostly simple songs on this little guitar. Any request, or should I pick?', '大多是用这把小吉他弹简单的歌。你要点歌，还是我来选？'),
      ], [
        choice('Could you play something calm?', '你能弹一首安静的吗？', ['calm', 'play'], 'sing'),
        choice('You pick. I am easy.', '你选吧。我都可以。', ['pick', 'easy', 'you'], 'sing'),
      ]),
      sing: node('Musician Jo', [
        line('Musician Jo', 'People sometimes sing the last line with me. Would you like to try?', '有时大家会跟我唱最后一句。你想试试吗？'),
      ], [
        choice('I will try one line.', '我试一句。', ['try', 'line'], 'phrase'),
        choice('I will just listen today.', '我今天只听。', ['listen', 'just'], 'phrase'),
      ]),
      phrase: node('Musician Jo', [
        line('Musician Jo', 'A nice thing to say after a song is "That song is beautiful." Want to use it?', '一首歌结束后可以说 “That song is beautiful.” 你想用这句吗？'),
      ], [
        choice('That song is beautiful.', '那首歌真好听。', ['beautiful', 'song'], 'bye'),
        choice('I liked the rhythm.', '我喜欢那个节奏。', ['rhythm', 'liked'], 'bye'),
      ]),
      bye: node('Musician Jo', [
        line('Musician Jo', 'Thanks for stopping. A smile is plenty. Will you stay for one more song?', '谢谢你停下来。一个微笑就够了。你再听一首吗？'),
      ], [
        choice('Thank you for the music.', '谢谢你的音乐。', ['thank', 'music'], 'end'),
        choice('One more, then I will walk on.', '再听一首，然后我继续走。', ['more', 'walk'], 'end'),
      ]),
      end: node('Musician Jo', [
        line('Musician Jo', 'I am here most afternoons. Come say what you want to hear.', '我大多数下午都在这儿。想来听什么就告诉我。'),
      ], [], {
        end: true,
        reaction: 'wave',
        phrases: ['Do you like music?', 'Could you play something calm?', 'That song is beautiful.'],
      }),
    },
  },
  'bea.solo': {
    start: 'freeze',
    nodes: {
      freeze: node('Customer Bea', [
        line('Customer Bea', 'Hi, I am Bea. I am next in line, but my English freezes at the counter. Can you help me practice?', '你好，我是 Bea。下一个就到我了，可我在柜台前英语就卡住。你能帮我练习吗？'),
      ], [
        choice('Sure. What do you want to buy?', '当然。你想买什么？', ['buy', 'what', 'sure'], 'jacket'),
        choice('Let us practice the sentence together.', '我们一起练习那句话吧。', ['practice', 'sentence', 'together'], 'jacket'),
      ]),
      jacket: node('Customer Bea', [
        line('Customer Bea', 'I want the blue jacket in a medium. How should I say that to Sam?', '我想要一件中号的蓝色外套。我该怎么跟 Sam 说？'),
      ], [
        choice('I would like the blue jacket in a medium, please.', '请给我一件中号的蓝色外套。', ['medium', 'jacket', 'like'], 'price'),
        choice('Can I see the blue jacket, please?', '我能看看那件蓝色外套吗？', ['see', 'jacket'], 'price'),
      ]),
      price: node('Customer Bea', [
        line('Customer Bea', 'What if it costs too much? I do not want to be rude.', '如果太贵怎么办？我不想显得没礼貌。'),
      ], [
        choice('That is a bit expensive for me.', '这对我来说有点贵。', ['expensive'], 'bag'),
        choice('Do you have anything less expensive?', '有便宜一点的吗？', ['less', 'cheaper', 'expensive'], 'bag'),
      ]),
      bag: node('Customer Bea', [
        line('Customer Bea', 'And if the jacket is fine, how do I ask for a bag?', '如果外套合适，我怎么要一个袋子？'),
      ], [
        choice('Could I have a bag, please?', '请给我一个袋子，好吗？', ['bag', 'have'], 'luck'),
        choice('No bag, thank you.', '不用袋子，谢谢。', ['no', 'bag', 'thank'], 'luck'),
      ]),
      luck: node('Customer Bea', [
        line('Customer Bea', 'You made that easy. I will try it with Sam. Wish me luck?', '你把这变得很简单。我去跟 Sam 试。祝我好运？'),
      ], [
        choice('You have got this.', '你一定行。', ['got', 'this'], 'end'),
        choice('Good luck, Bea.', '祝你好运，Bea。', ['luck', 'good'], 'end'),
      ]),
      end: node('Customer Bea', [
        line('Customer Bea', 'I will say "I would like the blue jacket in a medium, please." Thank you for practicing with me.', '我会说 “I would like the blue jacket in a medium, please.” 谢谢你陪我练习。'),
      ], [], {
        end: true,
        reaction: 'jump',
        phrases: ['I would like the blue jacket in a medium, please.', 'That is a bit expensive for me.', 'Could I have a bag, please?'],
      }),
    },
  },
};
