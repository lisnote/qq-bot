import { EventContext } from '@/types';
import { ImageContent, Message, TextContent } from '@/utils/aichat/api';
import logger from '@/utils/logger';
import { ImageSegment, SendMessageSegment, Structs, TextSegment } from '@/utils/napcat';
import sharp from 'sharp';

export default async function ({ aiChat, napcat, data }: EventContext<'message.private'>) {
  const segmentList = data.message.filter((item) => ['text', 'image'].includes(item.type)) as Array<
    TextSegment | ImageSegment
  >;
  const messages: NonNullable<Message['content']> = [];
  if (!segmentList.length) return;
  for (const segment of segmentList) {
    if (segment.type === 'text') {
      messages.push({ type: 'text', text: segment.data.text });
    } else if (process.env.MODE === 'production') {
      const fileInfo = await napcat.get_image({ file: segment.data.file });
      let fileBase64 = await sharp(fileInfo.file)
        .jpeg({ quality: 10 })
        .toBuffer()
        .then((v) => v.toString('base64'));
      messages.push({
        type: 'image_url',
        image_url: { url: 'data:image/jpeg;base64,' + fileBase64 },
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
