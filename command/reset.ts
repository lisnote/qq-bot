import { CommandContext } from '@/types';
import { Structs } from '@/utils/napcat';
import prompt from '@/utils/aichat/prompt.md' with { type: 'text' };
export default async function (ctx: CommandContext) {
  const { napcat, aiChat, data } = ctx;
  await aiChat.updateUser({ id: data.user_id.toString(), prompt, memory: '' });
  await aiChat.clearUserHistory(data.user_id.toString());
  await napcat.send_msg({
    user_id: data.user_id,
    group_id: data.message_type === 'group' ? data.group_id : undefined,
    message: [Structs.reply(data.message_id), Structs.text('重置模型成功')],
  });
}
