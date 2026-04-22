import { EventContext } from '@/types';

export default async function ({ napcat, data }: EventContext<'request'>) {
  if (data.request_type === 'group') {
    napcat.set_group_add_request({ flag: data.flag, approve: true });
  }
  napcat.set_friend_add_request({ flag: data.flag, approve: true });
}
