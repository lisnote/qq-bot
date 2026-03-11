import { Emitter } from 'mitt';
export default function ({ ws, emitter }: { ws: WebSocket; emitter: Emitter<any> }) {
  emitter.on('private.message', (data) => echo(ws,  data));
  emitter.on('group.message', (data) => echo(ws,  data));
}

function echo(ws: WebSocket, data: any) {
  ws.send(
    JSON.stringify({
      action: data.group_id ? 'send_group_msg' : 'send_private_msg',
      params: {
        group_id: data.group_id,
        user_id: data.group_id ? undefined : data.user_id,
        message: data.raw_message,
      },
    }),
  );
}
