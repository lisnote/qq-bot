import { CommandContext } from '@/types';
import { Structs } from '@/utils/napcat';

export default async function (ctx: CommandContext) {
  const { napcat, data, aiChat,message } = ctx;
  await aiChat.updateUser({ id: ctx.data.user_id.toString(), memory: message });
  await napcat.send_msg({
    user_id: data.user_id,
    group_id: data.message_type === 'group' ? data.group_id : undefined,
    message: [Structs.reply(data.message_id), Structs.text('模型记忆更新成功')],
  });
}
