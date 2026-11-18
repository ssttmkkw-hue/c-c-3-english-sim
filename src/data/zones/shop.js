import { choice, line, node } from '../script.js';

const giftPhrases = [
  'It is a gift for a friend.',
  'About twenty dollars.',
  'Yes, please wrap it.',
];

const returnPhrases = [
  'I would like to return this jacket.',
  'Yes, here is my receipt.',
  'That is everything, thank you.',
];

export const shopGraphs = {
  'shop.gift': {
    start: 'who',
    nodes: {
      who: node('Clerk Sam', [
        line('Clerk Sam', 'Hi. Are you shopping for yourself, or for a gift?', '你好。你是给自己买，还是买礼物？'),
        line('Player: Mei_shop', 'Gifts are more fun to talk about. We can help.', '聊礼物更有意思。我们可以帮忙。'),
      ], [
        choice('It is a gift for a friend.', '这是给朋友的礼物。', ['gift', 'friend'], 'like'),
        choice('It is for me.', '是给我自己的。', ['for me', 'myself'], 'like'),
        choice('I am just looking.', '我只是看看。', ['looking', 'just'], 'like'),
      ]),
      like: node('Player: Mei_shop', [
        line('Player: Mei_shop', 'My friend likes simple colors. What does your person like?', '我的朋友喜欢简单的颜色。你要送的人喜欢什么？'),
      ], [
        choice('She likes blue.', '她喜欢蓝色。', ['blue', 'she'], 'budget'),
        choice('He likes hats.', '他喜欢帽子。', ['hat', 'he'], 'budget'),
      ]),
      budget: node('Player: Omar_22', [
        line('Player: Omar_22', 'Budget matters. How much do you want to spend?', '预算很重要。你想花多少钱？'),
      ], [
        choice('About twenty dollars.', '大约二十美元。', ['twenty', '20'], 'which'),
        choice('I can spend about fifty dollars.', '我可以花大约五十美元。', ['fifty', '50'], 'which'),
      ]),
      which: node('Clerk Sam', [
        line('Clerk Sam', 'The hat is fifteen dollars. The scarf is twenty-two. Which one sounds right?', '帽子十五美元。围巾二十二美元。哪一个合适？'),
      ], [
        choice('I will take the hat.', '我要这顶帽子。', ['hat', 'take'], 'wrap'),
        choice('I will take the scarf.', '我要这条围巾。', ['scarf', 'take'], 'wrap'),
      ]),
      wrap: node('Player: Mei_shop', [
        line('Player: Mei_shop', 'Nice gift. Do you want it wrapped?', '礼物不错。要包起来吗？'),
      ], [
        choice('Yes, please wrap it.', '好，请包起来。', ['wrap', 'yes'], 'end'),
        choice('No wrap, thank you.', '不用包，谢谢。', ['no', 'thank'], 'end'),
      ]),
      end: node('Clerk Sam', [
        line('Clerk Sam', 'I can wrap it at the counter. A simple bow is free.', '我可以在柜台包好。简单的蝴蝶结是免费的。'),
        line('Player: Omar_22', 'Your friend is going to like that. See you around.', '你的朋友会喜欢的。回头见。'),
      ], [], { end: true, reaction: 'jump', phrases: giftPhrases }),
    },
  },
  'shop.return': {
    start: 'need',
    nodes: {
      need: node('Clerk Sam', [
        line('Clerk Sam', 'Hi. Do you need help with a return, or is this a new purchase?', '你好。你是要退货，还是新买一件？'),
        line('Player: Omar_22', 'I returned a hat last week. Sam is easy to talk to.', '我上周退了一顶帽子。跟 Sam 说话很轻松。'),
      ], [
        choice('I would like to return this jacket.', '我想退这件外套。', ['return', 'jacket'], 'receipt'),
        choice('I want to exchange a shirt.', '我想换一件衬衫。', ['exchange', 'shirt'], 'receipt'),
        choice('I am checking the policy.', '我在了解退换政策。', ['policy', 'checking'], 'receipt'),
      ]),
      receipt: node('Player: Omar_22', [
        line('Player: Omar_22', 'They will ask for the receipt. Do you have it with you?', '他们会要收据。你带在身上吗？'),
      ], [
        choice('Yes, here is my receipt.', '有，这是我的收据。', ['receipt', 'yes', 'here'], 'credit'),
        choice('I paid by card, but I lost the receipt.', '我刷卡付的，但收据丢了。', ['lost', 'card', 'receipt'], 'credit'),
      ]),
      credit: node('Clerk Sam', [
        line('Clerk Sam', 'Without a receipt we can offer store credit. What would you prefer?', '没有收据的话我们可以给店内积分。你更想要哪种？'),
      ], [
        choice('Store credit is fine.', '店内积分可以。', ['credit', 'store', 'fine'], 'size'),
        choice('I would like the money back, if possible.', '如果可以，我想拿回现金。', ['money', 'back', 'refund'], 'size'),
      ]),
      size: node('Player: Mei_shop', [
        line('Player: Mei_shop', 'The medium fit me better than the large. Do you need a different size?', '中号比大号更适合我。你需要换一个尺码吗？'),
      ], [
        choice('Yes, I need a smaller size.', '是的，我需要小一号。', ['smaller', 'size', 'yes'], 'else'),
        choice('No, a refund is enough.', '不用，退款就好。', ['refund', 'no', 'enough'], 'else'),
      ]),
      else: node('Clerk Sam', [
        line('Clerk Sam', 'I can finish that at the counter. Anything else today?', '我可以在柜台办好。今天还有别的事吗？'),
      ], [
        choice('That is everything, thank you.', '就这些，谢谢。', ['everything', 'thank'], 'end'),
        choice('Could I see the scarves too?', '我也能看看围巾吗？', ['scarf', 'see'], 'end'),
      ]),
      end: node('Player: Mei_shop', [
        line('Clerk Sam', 'You are all set. Keep the receipt next time, just in case.', '办好了。下次把收据留着，以防万一。'),
        line('Player: Mei_shop', 'You explained that clearly. See you the next time we shop.', '你解释得很清楚。下次买东西见。'),
      ], [], { end: true, phrases: returnPhrases }),
    },
  },
};
