import { format } from 'util';
import { createStream, RotatingFileStream } from 'rotating-file-stream';
import dayjs from '@/utils/date';
import { join } from 'path';
import { readdir, unlink } from 'fs/promises';

// 日志级别
type Level = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
const level: Level[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
// 日志颜色
const levelColor: Record<Level, string> = {
  DEBUG: '\x1b[36m',
  INFO: '\x1b[0m',
  WARN: '\x1b[33m',
  ERROR: '\x1b[31m',
};

// 配置日志输出流
const logPath = join(process.cwd(), './logs');
function createLevelStream(level: Level) {
  return createStream(
    function (time, index) {
      const levelLower = level.toLowerCase();
      if (!time) return `${levelLower}-latest.log`;
      return `${levelLower}-${dayjs(time).format('YYYY-MM-DDTHH-mm-ss-SSS')}-${index}.log`;
    },
    {
      path: logPath,
      size: '10M',
      interval: '1d',
      compress: false,
    },
  );
}
const levelStream: Record<Level, RotatingFileStream> = {
  DEBUG: createLevelStream('DEBUG'),
  INFO: createLevelStream('INFO'),
  WARN: createLevelStream('WARN'),
  ERROR: createLevelStream('ERROR'),
};

// 清理过期日志
levelStream.INFO.on('rotated', async () => {
  const logs = await readdir(logPath);
  const expireDate = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
  logs
    .filter((v) => {
      const match = v.match(/.*-(\d{4}-\d{2}-\d{2}).*/)?.[1];
      return v.endsWith('.log') && match && match.localeCompare(expireDate) < 0;
    })
    .forEach((v) => {
      unlink(join(logPath, v));
    });
});

// 处理输出
function output(level: string, ...args: any[]) {
  const plain = `[${dayjs().format('YYYY-MM-DD HH:mm:ss.SSS')}]\t${level}\t${format(...args)}\n`;
  const colorMap = {
    DEBUG: '\x1b[36m',
    INFO: '\x1b[0m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
  };
  process.stdout.write(`${colorMap[level]}${plain}\x1b[0m`);
  levelStream[level].write(plain);
}

// 创建与导出日志实例
const logger = {
  debug: (...args: any[]) => output('DEBUG', ...args),
  info: (...args: any[]) => output('INFO', ...args),
  error: (...args: any[]) => output('ERROR', ...args),
  warn: (...args: any[]) => output('WARN', ...args),
};

export { logger, logger as default };
