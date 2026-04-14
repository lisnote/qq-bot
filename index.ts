import { NCWebsocket, Structs } from '@/utils/napcat';
import AiChat from './utils/aichat';
import logger from './utils/logger';

const aiChat = await AiChat.create({ sqlitePath: './data/data.db' });
const napcat = new NCWebsocket({
  host: process.env.HOST!,
  port: Number(process.env.PORT!),
  protocol: 'ws',
  accessToken: process.env.TOKEN!,
});
await napcat.connect();

napcat.on('message', async (data) => {
  if (data.message[0].type === 'text' && data.message[0].data.text.startsWith('/prompt ')) {
    const prompt = data.message[0].data.text.replace('/prompt ', '');
    await aiChat.setPrompt(data.user_id.toString(), prompt);
    return;
  }
  if (data.message_type === 'group' && !data.message.find((item) => item.type === 'at')) return;
  const text = data.message
    .filter((item) => item.type === 'text')
    .map((item) => item.data.text)
    .join(' ');
  if (!text) return;
  aiChat
    .ask(data.user_id.toString(), text)
    .then((answer) => {
      napcat.send_msg({ user_id: data.user_id, message: [Structs.text(answer)] });
    })
    .catch((e) => logger.error(e));
});
