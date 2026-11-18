import { choice, line, node } from '../script.js';

const phrases = [
  'Yes. The name is Ana.',
  'One key, please.',
  'Two nights, please.',
];

export const hotelGraphs = {
  'hotel.join': {
    start: 'hello',
    nodes: {
      hello: node('Clerk Nia', [
        line('Clerk Nia', 'Hello. Welcome to the plaza hotel. Do you have a reservation?', '你好。欢迎来到广场酒店。你有预订吗？'),
      ], [
        choice('Yes. The name is Ana.', '有的。名字是 Ana。', ['yes', 'ana', 'name'], 'room'),
        choice('I do not have one yet.', '我还没有预订。', ['not', 'no', 'yet'], 'room'),
      ]),
      room: node('Clerk Nia', [
        line('Clerk Nia', 'We have a quiet room ready. Would you like one key or two?', '我们有一间安静的房间。你要一把钥匙还是两把？'),
      ], [
        choice('One key, please.', '请给我一把钥匙。', ['one', 'key'], 'stay'),
        choice('Two keys, please.', '请给我两把钥匙。', ['two', 'keys'], 'stay'),
      ]),
      stay: node('Player: Guest_Ana', [
        line('Player: Guest_Ana', 'How many nights are you staying?', '你住几个晚上？'),
      ], [
        choice('Two nights, please.', '请住两个晚上。', ['two', 'nights'], 'bye'),
        choice('Just one night.', '只住一个晚上。', ['one', 'night'], 'bye'),
      ]),
      bye: node('Clerk Nia', [
        line('Clerk Nia', 'You are all set. The lift is on your left.', '都办好了。电梯在你左手边。'),
        line('Player: Guest_Ben', 'We can find it. Thank you for the help.', '我们找得到。谢谢你的帮助。'),
      ], [], { end: true, reaction: 'wave', phrases }),
    },
  },
  'hotel.breakfast': {
    start: 'ask',
    nodes: {
      ask: node('Player: Guest_Ben', [
        line('Player: Guest_Ben', 'Excuse me. What time is breakfast?', '打扰一下。早餐是几点？'),
      ], [
        choice('What time is breakfast?', '早餐是几点？', ['time', 'breakfast'], 'where'),
        choice('Is breakfast included?', '早餐包含在内吗？', ['included', 'breakfast'], 'where'),
      ]),
      where: node('Clerk Nia', [
        line('Clerk Nia', 'Breakfast is from seven to ten, just past the lift.', '早餐从七点到十点，就在电梯过去一点。'),
      ], [
        choice('Is it a long walk?', '走过去远吗？', ['walk', 'far', 'long'], 'end'),
        choice('Thank you. I will be there at eight.', '谢谢。我八点到。', ['thank', 'eight'], 'end'),
      ]),
      end: node('Player: Guest_Ana', [
        line('Player: Guest_Ana', 'I will save you a seat by the window.', '我会在窗边给你留个位子。'),
        line('Clerk Nia', 'Enjoy your morning. Ask us if you need anything.', '祝你早晨愉快。需要什么就问我们。'),
      ], [], { end: true, reaction: 'nod', phrases: ['What time is breakfast?', 'Thank you. I will be there at eight.'] }),
    },
  },
};
