import { EventContext } from '@/types';
import { Message } from '@/utils/aichat/api';
import logger from '@/utils/logger';
import { ImageSegment, SendMessageSegment, Structs, TextSegment } from '@/utils/napcat';

export default async function ({ aiChat, napcat, data }: EventContext<'message.private'>) {
  const segmentList = data.message.filter((item) => ['text', 'image'].includes(item.type)) as Array<
    TextSegment | ImageSegment
  >;
  const messages: NonNullable<Message['content']> = [];
  if (!segmentList.length) return;
  for (const segment of segmentList) {
    if (segment.type === 'text') {
      messages.push({ type: 'text', text: segment.data.text });
    } else {
      const file = await napcat.get_file({ file: segment.data.file });
      messages.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: file.base64 },
      });
    }
  }
  await aiChat
    .chat(data.user_id.toString(), data.sender.nickname, messages)
    .then(async (reply) => {
      const message: SendMessageSegment[] = reply.map((v) => {
        if (v.type === 'text') {
          return Structs.text(v.content.replaceAll('\n\n', '\n'));
        } else {
          return Structs.image(v.content);
        }
      });
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
