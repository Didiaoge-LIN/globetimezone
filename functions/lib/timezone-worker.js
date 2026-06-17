/**
 * 时区计算标准库
 * 所有时差、时段计算必须调用本库，禁止自行实现
 * 兼容夏令时、跨天、跨时区所有场景
 */

/**
 * 获取指定时区的UTC偏移量
 * @param {string} timeZone IANA时区标识
 * @param {Date} [date=new Date()] 基准时间
 * @returns {number} UTC偏移分钟数，正数表示比UTC快
 */
export const getUtcOffsetMinutes = (timeZone, date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map(part => [part.type, part.value])
  );

  const localUtcTs = Date.UTC(
    parseInt(parts.year, 10),
    parseInt(parts.month, 10) - 1,
    parseInt(parts.day, 10),
    parseInt(parts.hour, 10),
    parseInt(parts.minute, 10),
    parseInt(parts.second, 10)
  );

  return Math.round((localUtcTs - date.getTime()) / 60000);
};

/**
 * 计算两个时区的时差
 * @param {string} tzA 时区A
 * @param {string} tzB 时区B
 * @param {Date} [date=new Date()] 基准时间
 * @returns {number} 时差分钟数，正数表示A比B快
 */
export const getTimeDifferenceMinutes = (tzA, tzB, date = new Date()) => {
  return getUtcOffsetMinutes(tzA, date) - getUtcOffsetMinutes(tzB, date);
};

/**
 * 格式化时差为人类可读文本
 * @param {number} minutes 时差分钟数
 * @returns {string} 格式化文本
 */
export const formatTimeDifference = (minutes) => {
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;

  if (mins === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${mins}分钟`;
};

/**
 * 将本地工作时段转换为UTC分钟区间（支持跨天）
 * @param {string} timeZone 时区
 * @param {number} startHour 本地工作开始小时（0-23）
 * @param {number} endHour 本地工作结束小时（0-23）
 * @param {Date} [date=new Date()] 基准日期
 * @returns {Array<{start: number, end: number}>} UTC分钟区间数组，跨天返回2段
 */
export const getWorkWindowsUtc = (timeZone, startHour = 9, endHour = 17, date = new Date()) => {
  const offset = getUtcOffsetMinutes(timeZone, date);
  const startLocalMin = startHour * 60;
  const endLocalMin = endHour * 60;

  let startUtcMin = startLocalMin - offset;
  let endUtcMin = endLocalMin - offset;

  const DAY_MINUTES = 24 * 60;
  startUtcMin = ((startUtcMin % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  endUtcMin = ((endUtcMin % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;

  if (startUtcMin < endUtcMin) {
    return [{ start: startUtcMin, end: endUtcMin }];
  } else {
    return [
      { start: startUtcMin, end: DAY_MINUTES },
      { start: 0, end: endUtcMin }
    ];
  }
};

/**
 * 求多组区间的交集（支持每组多个区间、跨天场景）
 * @param {Array<Array<{start: number, end: number}>>} allWindows 所有时区的区间集合
 * @returns {Array<{start: number, end: number}>} 交集区间数组
 */
export const intersectAllWindows = (allWindows) => {
  if (allWindows.length === 0) return [];
  let result = allWindows[0];

  for (let i = 1; i < allWindows.length; i++) {
    const currentWindows = allWindows[i];
    const nextResult = [];

    for (const a of result) {
      for (const b of currentWindows) {
        const start = Math.max(a.start, b.start);
        const end = Math.min(a.end, b.end);
        if (start < end) {
          nextResult.push({ start, end });
        }
      }
    }

    result = nextResult;
    if (result.length === 0) break;
  }

  return result;
};
