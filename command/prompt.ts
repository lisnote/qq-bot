import { CommandContext } from '@/types';
import { Structs } from '@/utils/napcat';

export default async function (ctx: CommandContext) {
  const { napcat, aiChat, data, message } = ctx;
  await aiChat.setPrompt(data.user_id.toString(), message);
  await napcat.send_msg({
    user_id: data.user_id,
    group_id: data.message_type === 'group' ? data.group_id : undefined,
    message: [Structs.reply(data.message_id), Structs.text('prompt更新成功')],
  });
}
