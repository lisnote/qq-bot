import { EventContext, Next } from '@/types';
import logger from '@/utils/logger';

export default async function messageLog({ data }: EventContext<'message'>, next: Next) {
  // 过滤非消息事件
  if (!('post_type' in data) || data.post_type !== 'message') return next();
  // 记录消息日志
  logger.info({
    ...(data.message_type === 'group' ? { groupId: data.group_id } : {}),
    userId: data.user_id,
    rawMessage: data.raw_message,
  });
  await next();
}
