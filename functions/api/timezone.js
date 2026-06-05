/**
 * GET /api/timezone?zone=Asia/Shanghai
 */
import { getTimeInZone, json } from '../_utils/timezone';

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' } });
  }

  const url = new URL(request.url);
  const zone = url.searchParams.get('zone') || 'UTC';

  const result = getTimeInZone(zone);
  if (!result) {
    return json({ error: 'Invalid timezone', zone }, 400);
  }

  return json(result);
}
