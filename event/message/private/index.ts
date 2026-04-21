import { EventContext } from '@/types';
import logger from '@/utils/logger';
import { SendMessageSegment, Structs } from '@/utils/napcat';

export default async function ({ aiChat, napcat, data }: EventContext<'message.private'>) {
  const text = data.message
    .filter((item) => item.type === 'text')
    .map((item) => item.data.text)
    .join(' ');
  if (!text) return;
  await aiChat
    .chat(data.user_id.toString(), data.sender.nickname, text)
    .then(async (reply) => {
      const message: SendMessageSegment[] = reply
        .map((v) => {
          if (v.type === 'text') {
            return Structs.text(v.content.replaceAll("\n\n", '\n'));
          } else {
            return Structs.image(v.content);
          }
        })
      for (const i in message) {
        const index = Number(i);
        const msg = message[index];
        await napcat.send_msg({
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
