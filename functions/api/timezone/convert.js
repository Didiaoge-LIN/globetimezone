/**
 * GET /api/timezone/convert?from=Asia/Shanghai&to=America/New_York
 */
import { convertTime, json } from '../../_utils/timezone';

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' } });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!from || !to) {
    return json({ error: 'Missing from or to timezone' }, 400);
  }

  const result = convertTime(from, to);
  if (!result) {
    return json({ error: 'Invalid timezone', from, to }, 400);
  }

  return json(result);
}
