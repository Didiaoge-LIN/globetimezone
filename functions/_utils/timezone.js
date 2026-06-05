/**
 * GlobeTimeZone Pages Functions — 时区工具模块
 * 纯 Intl API，零外部依赖
 */

const COMMON_TIMEZONES = [
  'Pacific/Midway', 'Pacific/Honolulu', 'America/Anchorage',
  'America/Los_Angeles', 'America/Denver', 'America/Chicago',
  'America/New_York', 'America/Toronto', 'America/Sao_Paulo',
  'Atlantic/Azores', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Moscow', 'Africa/Cairo', 'Asia/Dubai',
  'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka',
  'Asia/Bangkok', 'Asia/Shanghai', 'Asia/Tokyo',
  'Asia/Seoul', 'Australia/Sydney', 'Australia/Melbourne',
  'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Tongatapu'
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function getOffsetMinutes(tz) {
  const now = new Date();
  const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC', hour12: false });
  const tzStr = now.toLocaleString('en-US', { timeZone: tz, hour12: false });
  const utcDate = new Date(utcStr + ' UTC');
  const tzDate = new Date(tzStr + ' UTC');
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

function formatOffset(minutes) {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (m === 0) return `UTC${sign}${h}`;
  return `UTC${sign}${h}:${pad(m)}`;
}

export function getTimeInZone(tz) {
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZoneName: 'short'
    });
    const parts = fmt.formatToParts(now);
    const get = (type) => parts.find(p => p.type === type)?.value || '';

    const iso = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
    const offset = getOffsetMinutes(tz);
    const isoWithOffset = `${iso}${formatOffset(offset)}`;

    const isDST = get('timeZoneName').includes('D') || /[A-Z]{3,4}D/.test(get('timeZoneName'));

    return {
      timezone: tz,
      datetime: isoWithOffset,
      iso: isoWithOffset,
      offset: formatOffset(offset),
      offset_minutes: offset,
      is_dst: isDST,
      unix: Math.floor(now.getTime() / 1000),
      day_of_week: new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(now),
    };
  } catch {
    return null;
  }
}

export function convertTime(fromTz, toTz, timestamp) {
  const from = getTimeInZone(fromTz);
  const to = getTimeInZone(toTz);
  if (!from || !to) return null;

  const diffMinutes = to.offset_minutes - from.offset_minutes;
  const diffHours = diffMinutes / 60;

  return {
    from: { timezone: fromTz, datetime: from.datetime, offset: from.offset, is_dst: from.is_dst },
    to: { timezone: toTz, datetime: to.datetime, offset: to.offset, is_dst: to.is_dst },
    difference: {
      hours: diffHours,
      minutes: diffMinutes,
      formatted: diffHours > 0 ? `+${diffHours}h` : `${diffHours}h`,
      description: diffMinutes === 0 ? 'Same time' :
        diffHours > 0 ? `${toTz} is ${Math.abs(diffHours)}h ahead` :
        `${toTz} is ${Math.abs(diffHours)}h behind`
    }
  };
}

export function listTimezones(search) {
  const results = COMMON_TIMEZONES
    .map(tz => {
      const info = getTimeInZone(tz);
      if (!info) return null;
      return {
        timezone: tz,
        offset: info.offset,
        offset_minutes: info.offset_minutes,
        is_dst: info.is_dst,
        current_time: info.datetime
      };
    })
    .filter(Boolean);

  if (search) {
    const q = search.toLowerCase();
    return results.filter(r =>
      r.timezone.toLowerCase().includes(q) ||
      r.offset.toLowerCase().includes(q)
    );
  }
  return results;
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=60, s-maxage=300',
  };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: corsHeaders()
  });
}
