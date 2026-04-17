import { EventContext, Next } from '@/types';
import AiChat from '@/utils/aichat';

const aiChat = await AiChat.create({
  sqlitePath: './data/aichat.db',
  url: process.env.AI_BASE_URL!,
  key: process.env.AI_API_KEY!,
  model: process.env.AI_MODEL_NAME!,
});

export default async function setupAiChat(ctx: EventContext, next: Next) {
  ctx.aiChat = aiChat;
  await next();
}
