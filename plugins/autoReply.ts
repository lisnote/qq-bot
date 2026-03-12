import { Emitter } from 'mitt';
export default function ({ ws, emitter }: { ws: WebSocket; emitter: Emitter<any> }) {
  const userMap = new Map<number, number>();
  emitter.on('private.message', (data) => {
    const total = (userMap.get(data.user_id) ?? 0) + 1;
    userMap.set(data.user_id, total);
    setTimeout(() => {
      const total = (userMap.get(data.user_id) ?? 0) - 1;
      if (total < 1) {
        userMap.delete(data.user_id);
      } else {
        userMap.set(data.user_id, total);
      }
    }, 60 * 1000);
    if (total <= 5) {
      sendMessage(ws, data.user_id, '[自动回复] 私信太多看不过来，有事请在群里@我');
    } else {
      sendMessage(ws, data.user_id, [
        {
          type: 'text',
          data: {
            text: '[自动回复] 我都说了我不看私信!!!',
          },
        },
        {
          type: 'image',
          data: {
            file: 'https://gxh.vip.qq.com/club/item/parcel/item/b3/b3890e177accf4b244505639485dc434/raw300.gif',
          },
        },
      ]);
    }
  });
}

function sendMessage(ws: WebSocket, user_id: number, message: any) {
  ws.send(
    JSON.stringify({
      action: 'send_private_msg',
      params: {
        user_id: user_id,
        message,
      },
    }),
  );
}
