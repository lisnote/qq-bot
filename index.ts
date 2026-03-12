import logger from './utils/logger';
import mitt, { Emitter } from 'mitt';
import { readdir } from 'fs/promises';

const plugins = await readdir('./plugins').then(async (list) => {
  const result: Array<(bot: { ws: WebSocket; emitter: Emitter<any> }) => void> = [];
  for (const v of list) {
    await import(`@/plugins/${v}`).then((v) => result.push(v.default));
  }
  return result;
});

let ws: WebSocket;
function connect() {
  const emitter = mitt<any>();
  ws?.close();
  ws = new WebSocket(`${process.env.HOST}?access_token=${process.env.ACCESS_TOKEN}`);
  ws.onopen = () => logger.debug('成功连接到 NapCat 服务');
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.meta_event_type !== 'heartbeat') {
        logger.info(event.data);
      }
      emitter.emit(`${data.message_type && data.message_type + '.'}${data.post_type ?? ''}`, data);
    } catch (e) {
      logger.error('解析消息失败', e, event.data);
    }
  };
  ws.onclose = (code) => logger.error(`连接已断开，状态码: ${code.code}，原因: ${code.reason}`);
  ws.onerror = (err) => logger.error(err);
  plugins.forEach((v) => v({ ws, emitter }));
  return ws;
}

ws = connect();
setInterval(() => {
  if (ws.readyState !== WebSocket.OPEN) {
    logger.debug('连接已断开，尝试重新连接');
    connect();
  }
}, 1000);
