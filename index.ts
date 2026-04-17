import { NCWebsocket } from '@/utils/napcat';
import logger from '@/utils/logger';
import { filter } from '@/utils/filter';
import { CommandContext, EventContext } from './types';
import AiChat from '@/utils/aichat';

const aiChat = await AiChat.create({
  sqlitePath: './data/data.db',
  url: process.env.AI_BASE_URL!,
  key: process.env.AI_API_KEY!,
  model: process.env.AI_MODEL_NAME!,
});

const napcat = new NCWebsocket({
  host: process.env.HOST!,
  port: Number(process.env.PORT!),
  protocol: 'ws',
  accessToken: process.env.TOKEN!,
});

// 事件处理
napcat.on('*', async ({ event, context }) => {
  let eventPath = event
    .replaceAll('.', '/')
    .replace(/_(\w)/g, (_match, letter) => letter.toUpperCase());
  while (true) {
    const module = await import(`@/event/${eventPath}`).catch(() => undefined);
    if (module?.default) {
      const EventContext: EventContext = { aiChat, napcat, data: context };
      await module.default(EventContext)?.catch?.(logger.error);
    }
    const indexOf = eventPath.lastIndexOf('/');
    if (indexOf === -1) break;
    eventPath = eventPath.substring(0, indexOf);
  }
});

// 命令处理
napcat.on('message', async (data) => {
  // 消息日志
  logger.info({
    ...(data.message_type === 'group' ? { groupId: data.group_id } : {}),
    userId: data.user_id,
    rawMessage: data.raw_message,
  });
  // 消息过滤
  if (!filter(data)) return;
  // 命令处理
  if (data.message[0].type === 'text' && /^\/[\w\/]+/.test(data.message[0].data.text)) {
    let command = '';
    const message = data.message[0].data.text
      .replace(/^\/[\w\/]+/, (match: string) => {
        command = match;
        return '';
      })
      .trimStart();
    const module = await import(`@/command${command}`).catch(() => undefined);
    if (module?.default) {
      const commandContext: CommandContext = { aiChat, napcat, data, command, message };
      await module.default(commandContext)?.catch?.(logger.error);
      return;
    }
  }
});

await napcat.connect();

logger.debug('QQ机器人启动成功');
