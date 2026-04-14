import timejs, { Dayjs, ConfigType, OpUnitType } from 'dayjs';

// 自定义dayjs, 设置时区, 替换默认format函数参数
process.env.TZ = 'Asia/Shanghai';
const dayjs = timejs;
const originalFormat = timejs.prototype.format;
timejs.prototype.format = function (this, format = 'YYYY-MM-DD HH:mm:ss') {
  return originalFormat.call(this, format);
};
export default dayjs;

/**
 * 处理 date 对象为指定格式的字符串
 * @param date
 * @param format 默认值为'YYYY-MM-DD hh:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function dateFormat(
  date: ConfigType,
  format = 'YYYY-MM-DD HH:mm:ss',
): string {
  return dayjs(date).format(format);
}

/**
 * 创建指定 format 的 dateFormat 函数
 * @param format 时间格式
 */
export function createDateFormat(format: string): typeof dateFormat {
  return function (date: ConfigType) {
    return dateFormat(date, format);
  };
}

/**
 * 返回传入时间的指定单位起止时间
 * @param date
 * @param unit 时间单位
 * @param formater 格式化函数
 * @returns 格式化后的日期字符串数组
 */
export function dateRange(
  date: ConfigType,
  unit: OpUnitType,
  formater: (date: Dayjs) => string = dateFormat,
): string[] {
  return [
    formater(dayjs(date).startOf(unit)),
    formater(dayjs(date).endOf(unit)),
  ];
}
