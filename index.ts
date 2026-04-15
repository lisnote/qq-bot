import { NCWebsocket, SendMessageSegment, Structs } from '@/utils/napcat';
import logger from '@/utils/logger';
import { filter } from '@/utils/filter';
import { CommandContext } from './types';
import AiChat from '@/utils/aichat';
import { emojiEmotionMap } from './utils/aichat/emoji';

const aiChat = await AiChat.create({ sqlitePath: './data/data.db' });
const napcat = new NCWebsocket({
  host: process.env.HOST!,
  port: Number(process.env.PORT!),
  protocol: 'ws',
  accessToken: process.env.TOKEN!,
});
await napcat.connect();

napcat.on('message', async (data) => {
  // 消息历史
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
      try {
        const commandContext: CommandContext = { aiChat, napcat, data, command, message };
        await module.default(commandContext);
      } catch (e) {
        logger.error(e);
      }
      return;
    }
  }
  // Ai回复
  if (
    data.message_type === 'group' &&
    !data.message.find((item) => item.type === 'at' && item.data.qq === data.self_id.toString())
  ) {
    return;
  }
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
          group_id: data.message_type === 'group' ? data.group_id : undefined,
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
});

logger.debug('QQ机器人启动成功');
