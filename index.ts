import { NCWebsocket } from 'node-napcat-ts';

const napcat = new NCWebsocket({
  host: process.env.HOST!,
  port: Number(process.env.PORT!),
  protocol: 'ws',
  accessToken: process.env.TOKEN!,
});
await napcat.connect();

napcat.on('message', async (data) => {
  console.log(data.sender.nickname, data.sender.user_id, data.message);
  for (let item of data.message) {
    if (item.type === 'image') {
      console.log(item.data.file);
    }
  }
});
