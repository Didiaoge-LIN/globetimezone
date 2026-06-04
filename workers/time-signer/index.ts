import { CONFIG } from '../config';
import type { SignedTimeResult } from '../types';

interface Env {
  SIGNING_KEY: string;
}

let lastCacheTime = 0;
const CACHE_TTL = CONFIG.CACHE.TIMEZONE_DATA_TTL;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/api/v1/signed-time') {
      return new Response('Not Found', { status: 404 });
    }

    const zone = url.searchParams.get('zone') || 'UTC';
    const timeResult = await getTimeForZone(zone);

    const encoder = new TextEncoder();
    const keyData = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.SIGNING_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign(
      'HMAC',
      keyData,
      encoder.encode(JSON.stringify(timeResult))
    );
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const signed: SignedTimeResult = {
      time: timeResult.time,
      signature: signatureHex,
      algorithm: 'HMAC-SHA256',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(signed), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

async function getTimeForZone(zone: string): Promise<{ time: string }> {
  return { time: new Date().toISOString() };
}
