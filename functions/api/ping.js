export async function onRequest(context) {
  return new Response(JSON.stringify({ status: 'pong', time: new Date().toISOString() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
