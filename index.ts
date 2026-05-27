import { NCWebsocket } from '@/utils/napcat';
import logger from '@/utils/logger';
import { EventContext, Middleware } from './types';
import setupAiChat from './middleware/setupAiChat';
import messageLog from './middleware/messageLog';
import handleCommand from './middleware/handleCommand';
import handleEvent from './middleware/handleEvent';
import config from '@/config.yaml';
import rockKingdom from './task/rocoKingdom';

const napcat = new NCWebsocket({
  host: config.onebot.host,
  port: config.onebot.port,
  protocol: config.onebot.protocol,
  accessToken: config.onebot.token,
});

// 中间件列表
const middlewareList = [
  setupAiChat,
  messageLog,
  handleCommand,
  handleEvent,
] as Middleware[];

// 中间件组合函数
async function middlewareCompose(middleware: Middleware[], context: EventContext) {
  async function dispatch(i: number) {
    if (i === middleware.length) return Promise.resolve();
    await middleware[i](context, () => dispatch(i + 1));
    return;
  }
  return dispatch(0);
}

// 事件处理
napcat.on('*', async ({ event, context }) => {
  const ctx = { napcat, data: context, event } as EventContext;
  await middlewareCompose(middlewareList, ctx);
});

// 任务执行
napcat.connect().then(() => {
  const taskList = [rockKingdom];
  for (const task of taskList) {
    try {
      task({ napcat });
    } catch (e) {
      logger.error('任务执行失败', task);
    }
  }
});

await napcat.connect();

logger.debug('QQ机器人启动成功');
