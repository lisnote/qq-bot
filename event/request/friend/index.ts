import { EventContext } from '@/types';

export default async function ({ napcat, data }: EventContext<'request.friend'>) {
  napcat.set_friend_add_request({ flag: data.flag, approve: true });
}
