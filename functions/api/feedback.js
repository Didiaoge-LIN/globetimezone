// /api/feedback — 匿名反馈接口（仅接收文本，不收集任何用户信息）
export async function onRequestPost(context) {
  try {
    const { feedback } = await context.request.json();
    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return new Response(JSON.stringify({ error: '反馈内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    if (feedback.length > 2000) {
      return new Response(JSON.stringify({ error: '反馈内容不能超过2000字' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    // 写入 KV（如果绑定）或简单日志
    // 当前 Spark 计划没有 KV，仅记录到 console
    console.log('[FEEDBACK]', new Date().toISOString(), feedback.trim());

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: '无效请求' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
