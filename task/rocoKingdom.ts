import { NCWebsocket } from '@/utils/napcat';
import config from '@/config.yaml';
import dayjs from '@/utils/date';
import logger from '@/utils/logger';

const userList = Array.isArray(config.task?.rocoKingdom?.user) ? config.task.rocoKingdom.user : [];

let nextTime = Date.now();
let lastText = '';
export default async function rockKingdom({ napcat }: { napcat: NCWebsocket }) {
  if (!userList.length) return;
  task(napcat);
  setInterval(async () => task(napcat), 60000);
}

let lock = false;
async function task(napcat: NCWebsocket) {
  if (lock || !userList.length) return;
  lock = true;
  await pushMsg(napcat)
    .catch(logger.error)
    .finally(() => (lock = false));
}

async function pushMsg(napcat: NCWebsocket) {
  if (nextTime > Date.now() || dayjs().hour() < 8) return;
  const merchantInfo = await getMerchantInfo();
  if (!merchantInfo) return;
  nextTime = merchantInfo
    .filter((item) => 14400000 >= item.endTime - item.startTime)
    .sort((a, b) => a.endTime - b.endTime)[0]?.endTime;
  const goods = merchantInfo.map((item) => dayjs(item.endTime).format('HH:mm') + ' ' + item.name);
  const text = '洛克王国.远行商人\n' + goods.join('\n');

  if (text !== lastText) {
    lastText = text;
    logger.info('洛克王国.远行商人 | ' + goods.join(' | '));
    for (const user of userList) {
      await napcat.send_msg({
        user_id: user,
        message: [{ type: 'text', data: { text: text } }],
      });
    }
  }
}

async function getMerchantInfo(): Promise<{ startTime: number; endTime: number; name: string }[]> {
  return fetch('https://wegame.shallow.ink/api/v1/games/rocom/merchant/info?refresh=true', {
    headers: { 'X-API-Key': config.task.rocoKingdom.key },
  })
    .then((res) => res.json())
    .then(({ data }) => {
      logger.info('洛克王国.请求响应', JSON.stringify(data, null, 2));
      return data.merchantActivities
        .find((item) => item.name === '远行商人')
        ?.get_props.filter((item) => item.end_time > Date.now())
        .map((item) => {
          return {
            startTime: item.start_time,
            endTime: item.end_time,
            name: item.name,
          };
        });
    });
}
