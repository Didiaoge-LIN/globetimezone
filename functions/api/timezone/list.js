/**
 * GET /api/timezone/list
 */
import { listTimezones, json } from '../../_utils/timezone';

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' } });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('q') || '';

  const results = listTimezones(search);
  return json({ count: results.length, timezones: results });
}
