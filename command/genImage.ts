import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { CommandContext } from '@/types';
import logger from '@/utils/logger';
import { ImageSegment, Receive } from '@/utils/napcat';
import { UserModelMessage } from 'ai';
import config from '@/config.yaml';

const openrouter = createOpenRouter({
  apiKey: config.command.genImage.key,
  baseURL: config.command.genImage.url,
});

export default async function ({ napcat, data }: CommandContext) {
  const content: UserModelMessage['content'] = [];
  const segments = data.message.filter((v) => ['text', 'image'].includes(v.type)) as Array<
    Receive['text'] | Receive['image']
  >;
  for (const index in segments) {
    const segment = segments[index];
    if (segment.type === 'text') {
      const text = index == '0' ? segment.data.text.replace('/genImage', '') : segment.data.text;
      content.push({ type: 'text', text: text.trim() });
    } else {
      const base64 = await fetch(segment.data.url)
        .then((v) => v.arrayBuffer())
        .then((v) => Buffer.from(v).toBase64())
        .catch(() => napcat.get_file({ file: segment.data.file }).then((v) => v.base64));
      content.push({ type: 'image', image: base64 });
    }
  }
  logger.info(content);
  const result = await generateText({
    model: openrouter(config.command.genImage.model),
    messages: [{ role: 'user', content }],
  });
  const images = result.files.filter((v) => v.mediaType?.startsWith('image/'));
  await napcat.send_msg({
    group_id: data.message_type === 'group' ? data.group_id : undefined,
    user_id: data.user_id,
    message: [
      { type: 'reply', data: { id: data.message_id.toString() } },
      ...images.map((image) => {
        return {
          type: 'image',
          data: {
            file: `data:${image.mediaType};base64,${image.base64}`,
          },
        } as ImageSegment;
      }),
    ],
  });
}
