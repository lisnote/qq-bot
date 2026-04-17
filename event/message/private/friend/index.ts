import { EventContext } from '@/types';
import { emojiEmotionMap } from '@/utils/aichat/emoji';
import logger from '@/utils/logger';
import { SendMessageSegment, Structs } from '@/utils/napcat';

export default async function ({ aiChat, napcat, data }: EventContext<'message.private.friend'>) {
  const text = data.message
    .filter((item) => item.type === 'text')
    .map((item) => item.data.text)
    .join(' ');
  if (!text) return;
  await aiChat
    .ask(data.user_id.toString(), data.sender.nickname, text)
    .then(async (answer) => {
      const message: SendMessageSegment[] = answer.text
        .split(/[。？(……)\n]/)
        .filter((v) => v.trim())
        .map((v) => Structs.text(v));
      const emoji = emojiEmotionMap.get(answer.emoji ?? '');
      if (emoji) {
        message.push(Structs.image(emoji.url));
      }
      for (const i in message) {
        const index = Number(i);
        const msg = message[index];
        napcat.send_msg({
          user_id: data.user_id,
          message: [msg],
        });
        const nextMsg = message[index + 1];
        if (nextMsg?.type === 'text') {
          const delay = nextMsg.data.text.length * (Math.random() * 100 + 100);
          await Bun.sleep(delay);
        }
      }
    })
    .catch((e) => logger.error(e));
}
