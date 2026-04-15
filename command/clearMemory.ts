import { CommandContext } from '@/types';
import { Structs } from '@/utils/napcat';

export default async function (ctx: CommandContext) {
  await ctx.aiChat.clearMemory(ctx.data.user_id.toString());
  await ctx.napcat.send_msg({
    group_id: ctx.data.message_type === 'group' ? ctx.data.group_id : undefined,
    user_id: ctx.data.user_id,
    message: [Structs.reply(ctx.data.message_id), Structs.text('关于您的记忆已清除')],
  });
}
