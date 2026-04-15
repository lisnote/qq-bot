import { PrivateFriendMessage, PrivateGroupMessage, GroupMessage } from '@/utils/napcat';

const privateList =
  process.env.PRIVATE_FILTER?.split(',')
    .filter((v) => v)
    .map((v) => Number(v.trim())) || [];
const groupList =
  process.env.GROUP_FILTER?.split(',')
    .filter((v) => v)
    .map((v) => Number(v.trim())) || [];

export function filter(data: PrivateFriendMessage | PrivateGroupMessage | GroupMessage) {
  const isGroup = data.message_type === 'group';
  if (!isGroup && (!privateList.length || privateList.includes(data.user_id))) return true;
  else if (isGroup && (!groupList.length || groupList.includes(data.group_id))) return true;
  return false;
}
