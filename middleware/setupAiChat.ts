import { EventContext, Next } from '@/types';
import AiChat from '@/utils/aichat';
import config from '@/config.yaml';

const aiChat = await AiChat.create({
  sqlitePath: './data/aichat.db',
  chat: config.aichat.chat,
  vision: config.aichat.vision,
});

export default async function setupAiChat(ctx: EventContext, next: Next) {
  ctx.aiChat = aiChat;
  await next();
}
