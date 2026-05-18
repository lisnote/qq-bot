import { EventContext, Next } from '@/types';
import config from '@/config.yaml';

const blackList = {
  group: Array.isArray(config.blackList?.group) ? config.blackList.group : [],
  private: Array.isArray(config.blackList?.private) ? config.blackList.private : [],
};
const whiteList = {
  group: Array.isArray(config.whiteList?.group) ? config.whiteList.group : [],
  private: Array.isArray(config.whiteList?.private) ? config.whiteList.private : [],
};

export default async function filter({ data }: EventContext, next: Next) {
  // 跳过非消息事件
  if (!('post_type' in data) || data.post_type !== 'message') return next();
  // 过滤黑白名单中的用户和群聊
  if (data.message_type === 'private') {
    if (
      !blackList.private.includes(data.user_id) &&
      (!whiteList.private.length || whiteList.private.includes(data.user_id))
    ) {
      await next();
    }
  } else {
    if (
      !blackList.private.includes(data.group_id) &&
      (!whiteList.group.length || whiteList.group.includes(data.group_id))
    ) {
      await next();
    }
  }
}
