/**
 * workers/timezone-api/index.ts — Timezone API Worker V5.1
 * 裁决 #3: KV 替代 R2
 * CEO · 首席系统架构师 · SYS · OPS 联合签署 2026-05-30
 */
import { Hono } from 'hono';
import { cache } from 'hono/cache';
import type { TimezoneData, TimezoneApiResponse, SSRData } from '../types';

interface Env {
  TZ_DATA: KVNamespace;
  CALIBRATION: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.use('/api/v1/timezone/*', cache({
  cacheName: 'tz-api',
  cacheControl: 'public, max-age=3600, s-maxage=86400',
  wait: true,
}));

app.get('/api/v1/timezone/*', async (c) => {
  const pathParts = new URL(c.req.url).pathname.split('/');
  const tzIndex = pathParts.indexOf('timezone');
  const zone = tzIndex >= 0 ? decodeURIComponent(pathParts.slice(tzIndex + 1).join('/')) : '';
  if (!zone) return c.json({ error: 'Missing timezone parameter' }, 400);

  const format = c.req.query('format');
  const atParam = c.req.query('at');

  // 从 KV 读取
  const dataStr = await c.env.TZ_DATA.get('timezone-offsets.json');
  if (!dataStr) return c.json({ error: 'Timezone data unavailable' }, 503);
  const data: TimezoneData = JSON.parse(dataStr);

  const transitions = data.zones[zone];
  if (!transitions || transitions.length === 0)
    return c.json({ error: `Unknown timezone: ${zone}` }, 404);

  let queryTime = new Date();
  if (atParam) {
    queryTime = new Date(atParam);
    if (isNaN(queryTime.getTime()))
      return c.json({ error: 'Invalid at parameter' }, 400);
    if (Math.abs(queryTime.getFullYear() - new Date().getFullYear()) > 10)
      return c.json({ error: 'Time range limited to ±10 years' }, 400);
  }

  let activeOffset = transitions[0].offset;
  for (let i = transitions.length - 1; i >= 0; i--) {
    if (new Date(transitions[i].start) <= queryTime) {
      activeOffset = transitions[i].offset;
      break;
    }
  }

  const localTime = new Date(queryTime.getTime() + activeOffset * 60000);

  let ntpOffset = 0, ntpCalibrated = false, confidence = 0, sources = 0;
  try {
    const calStr = await c.env.CALIBRATION?.get('latest');
    if (calStr) {
      const cal = JSON.parse(calStr);
      ntpOffset = cal.offset || 0;
      ntpCalibrated = cal.confidence > 0.5;
      confidence = cal.confidence || 0;
      sources = cal.sources || 0;
    }
  } catch {}

  c.header('X-Time-Calibrated', ntpCalibrated ? 'true' : 'false');
  c.header('X-Time-Offset', `${ntpOffset}ms`);

  if (format === 'ssr') {
    const ssrData: SSRData = {
      city: zone,
      currentTime: localTime.toISOString(),
      offset: activeOffset,
      isDST: activeOffset !== transitions[0].offset,
    };
    return c.html(
      `<time datetime="${ssrData.currentTime}" data-offset="${ssrData.offset}" aria-label="Current time in ${ssrData.city}" role="timer">${localTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</time>`
    );
  }

  const response: TimezoneApiResponse & { confidence: number; sources: number } = {
    zone,
    offset: activeOffset,
    updated: data.updated,
    confidence,
    sources,
  };
  return c.json(response);
});

export default app;
