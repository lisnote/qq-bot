import { HandlerResMap } from '@/utils/napcat';
import config from '@/config.yaml';
import { EventContext } from '@/types';

function getRole(data: HandlerResMap['message']) {
  const roleMap =
    data.message_type === 'group' ? config.auth.group[data.group_id] : config.auth.private;
  if (!roleMap) return false;
  const roleKey = Object.keys(roleMap).find((key) => {
    return key === 'default' || roleMap[key].user.includes(data.user_id);
  });
  return roleMap[roleKey ?? ''];
}
export function isAuthCommand(command: string, data: HandlerResMap['message']) {
  const role = getRole(data);
  if (!role) return false;
  const fullAuthName = `/command${command}`;
  return Boolean(
    role.allow.find((auth) => {
      return fullAuthName.startsWith(auth);
    }),
  );
}

export function isAuthEvent(event: string, data: EventContext['data']) {
  if (!('post_type' in data) || data.post_type !== 'message') return true;
  const role = getRole(data);
  if (!role) return false;
  const fullAuthName = `/event/${event}`;
  return Boolean(
    role.allow.find((auth) => {
      return fullAuthName.startsWith(auth);
    }),
  );
}
