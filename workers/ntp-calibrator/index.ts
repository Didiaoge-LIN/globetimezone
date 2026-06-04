import type { CalibrationResult } from '../types';

interface NtpResponse {
  origin: string;
  offset: number;
  delay: number;
}

const TIME_SOURCES = [
  'https://worldtimeapi.org/api/timezone/Etc/UTC',
  'https://timeapi.io/api/Time/current/zone?timeZone=UTC',
  'https://www.timeapi.io/api/Time/current/zone?timeZone=UTC',
];

async function fetchTimeFromSource(url: string): Promise<NtpResponse> {
  const start = Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Source ${url} returned ${res.status}`);
  const data: any = await res.json();
  const end = Date.now();
  const serverTime = new Date(data.utc_datetime || data.dateTime || data.datetime).getTime();
  const delay = end - start;
  const offset = serverTime - (start + delay / 2);
  return { origin: url, offset, delay };
}

function marzullo(sources: NtpResponse[]): { offset: number; confidence: number } {
  if (sources.length === 0) return { offset: 0, confidence: 0 };
  if (sources.length === 1) return { offset: sources[0].offset, confidence: 0.3 };
  const offsets = sources.map(s => s.offset).sort((a, b) => a - b);
  const mid = Math.floor(offsets.length / 2);
  const median = offsets.length % 2 !== 0 ? offsets[mid] : (offsets[mid - 1] + offsets[mid]) / 2;
  const confidence = Math.min(0.95, sources.length / 5 + 0.3);
  return { offset: median, confidence };
}

interface Env {
  CALIBRATION: KVNamespace;
}

let memCache: { data: CalibrationResult; ts: number } | null = null;
const MEM_TTL = 60000;
const sourceHealth = new Map<string, { failures: number; lastSuccess: number }>();
const FAILURE_THRESHOLD = 3;
const HEALTH_RESET_MS = 300000;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/ntp/calibrate') {
      const healthySources = TIME_SOURCES.filter(s => {
        const h = sourceHealth.get(s);
        if (!h) return true;
        if (h.failures >= FAILURE_THRESHOLD && (Date.now() - h.lastSuccess) < HEALTH_RESET_MS) return false;
        return true;
      });

      const results = await Promise.allSettled(healthySources.map(fetchTimeFromSource));
      const valid = results
        .filter((r): r is PromiseFulfilledResult<NtpResponse> => r.status === 'fulfilled')
        .map(r => r.value);

      TIME_SOURCES.forEach(s => {
        const h = sourceHealth.get(s) || { failures: 0, lastSuccess: 0 };
        const idx = healthySources.indexOf(s);
        if (idx >= 0 && results[idx].status === 'fulfilled') {
          h.failures = 0;
          h.lastSuccess = Date.now();
        } else if (healthySources.includes(s)) {
          h.failures++;
        }
        sourceHealth.set(s, h);
      });

      const { offset, confidence } = marzullo(valid);
      const calibration: CalibrationResult = {
        offset,
        confidence,
        sources: valid.length,
        updated: new Date().toISOString(),
      };
      await env.CALIBRATION.put('latest', JSON.stringify(calibration));
      memCache = { data: calibration, ts: Date.now() };
      return new Response(JSON.stringify(calibration), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/api/ntp/offset') {
      if (memCache && (Date.now() - memCache.ts) < MEM_TTL) {
        return new Response(JSON.stringify(memCache.data), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
        });
      }
      const cached = await env.CALIBRATION.get('latest');
      if (cached) {
        const data = JSON.parse(cached);
        memCache = { data, ts: Date.now() };
        return new Response(cached, {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
        });
      }
      return new Response(JSON.stringify({
        offset: 0, confidence: 0, sources: 0, updated: new Date().toISOString(),
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const healthySources = TIME_SOURCES.filter(s => {
      const h = sourceHealth.get(s);
      if (!h) return true;
      if (h.failures >= FAILURE_THRESHOLD && (Date.now() - h.lastSuccess) < HEALTH_RESET_MS) return false;
      return true;
    });

    const results = await Promise.allSettled(healthySources.map(fetchTimeFromSource));
    const valid = results
      .filter((r): r is PromiseFulfilledResult<NtpResponse> => r.status === 'fulfilled')
      .map(r => r.value);

    TIME_SOURCES.forEach(s => {
      const h = sourceHealth.get(s) || { failures: 0, lastSuccess: 0 };
      const idx = healthySources.indexOf(s);
      if (idx >= 0 && results[idx].status === 'fulfilled') {
        h.failures = 0;
        h.lastSuccess = Date.now();
      } else if (healthySources.includes(s)) {
        h.failures++;
      }
      sourceHealth.set(s, h);
    });

    const { offset, confidence } = marzullo(valid);
    const calibration: CalibrationResult = {
      offset, confidence, sources: valid.length, updated: new Date().toISOString(),
    };
    await env.CALIBRATION.put('latest', JSON.stringify(calibration));
    memCache = { data: calibration, ts: Date.now() };
  },
};
