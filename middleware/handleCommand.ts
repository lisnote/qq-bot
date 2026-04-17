import { CommandContext, EventContext, Next } from '@/types';
import logger from '@/utils/logger';

export default async function handleCommand(ctx: EventContext<'message'>, next: Next) {
  const { data } = ctx;
  // 跳过非消息事件
  if (!('post_type' in data) || data.post_type !== 'message') return next();
  // 跳过非命令消息
  if (!/^\/[\w\/]+/.test(data.raw_message)) return next();
  // 提取指令与消息
  let command = '';
  const message = data.raw_message
    .replace(/^\/[\w\/]+/, (match: string) => {
      command = match;
      return '';
    })
    .trimStart();

  // 导入指令模块
  const module = await import(`@/command${command}`).catch(() => undefined);
  if (module?.default) {
    // 执行指令
    const commandContext: CommandContext = Object.assign(ctx, { command, message });
    await module.default(commandContext)?.catch?.(logger.error);
    return;
  } else {
    // 指令不存在
    await next();
  }
}
