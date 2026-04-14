import { NCWebsocket, Structs } from '@/utils/napcat';

const napcat = new NCWebsocket({
  host: process.env.HOST!,
  port: Number(process.env.PORT!),
  protocol: 'ws',
  accessToken: process.env.TOKEN!,
});
await napcat.connect();

napcat.on('message', async (data) => {
  console.log(data.sender.nickname, data.sender.user_id, data.message);
  const text = data.message
    .filter((item) => item.type === 'text')
    .map((item) => item.data.text)
    .join(' ');
  napcat.send_msg({ user_id: data.user_id, message: [Structs.text(text)] });
});
