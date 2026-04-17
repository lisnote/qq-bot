import { EventContext, Next } from '@/types';

const privateList =
  process.env.PRIVATE_FILTER?.split(',')
    .filter((v) => v)
    .map((v) => Number(v.trim())) || [];
const groupList =
  process.env.GROUP_FILTER?.split(',')
    .filter((v) => v)
    .map((v) => Number(v.trim())) || [];

export default async function filter({ data }: EventContext, next: Next) {
  // 跳过非消息事件
  if (!('post_type' in data) || data.post_type !== 'message') return next();
  // 过滤不在白名单中的用户和群聊
  if (data.message_type === 'private') {
    if (!privateList.length || privateList.includes(data.user_id)) await next();
  } else {
    if (!groupList.length || groupList.includes(data.group_id)) await next();
  }
}
