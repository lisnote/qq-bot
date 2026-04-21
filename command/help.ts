import { CommandContext } from '@/types';
import { Structs } from '@/utils/napcat';

const help = `可用指令:
/help 显示帮助
/reset 重置模型状态
/memory 设置模型记忆
/prompt
  设置模型提示词, 支持变量注入:
  {{time|user|memory}}`;
export default async function (ctx: CommandContext) {
  const { napcat, data } = ctx;
  napcat.send_msg({
    group_id: data.message_type === 'group' ? data.group_id : undefined,
    user_id: data.user_id,
    message: [Structs.text(help)],
  });
}
