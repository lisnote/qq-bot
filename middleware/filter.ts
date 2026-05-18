import { EventContext, Next } from '@/types';
import config from '@/config.yaml';

const blackList = {
  group: Array.isArray(config.blackList?.group) ? config.blackList.group : [],
  user: Array.isArray(config.blackList?.user) ? config.blackList.user : [],
};
const whiteList = {
  group: Array.isArray(config.whiteList?.group) ? config.whiteList.group : [],
  user: Array.isArray(config.whiteList?.user) ? config.whiteList.user : [],
};

export default async function filter({ data }: EventContext, next: Next) {
  // 跳过非消息事件
  if (!('post_type' in data) || data.post_type !== 'message') return next();
  // 过滤黑白名单中的用户和群聊
  if (data.message_type === 'private') {
    if (
      !blackList.user.includes(data.user_id) &&
      (!whiteList.user.length || whiteList.user.includes(data.user_id))
    ) {
      await next();
    }
  } else {
    if (
      !blackList.user.includes(data.group_id) &&
      (!whiteList.group.length || whiteList.group.includes(data.group_id))
    ) {
      await next();
    }
  }
}
