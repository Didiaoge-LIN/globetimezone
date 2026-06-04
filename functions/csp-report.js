/**
 * CSP Violation Report Endpoint
 * Cloudflare Pages Function — handles POST /csp-report
 * 接收浏览器 CSP 违规报告并记录日志
 */
export async function onRequest(context) {
  const { request } = context;

  // 仅接受 POST 请求到 /csp-report
  const url = new URL(request.url);
  if (request.method !== 'POST' || !url.pathname.endsWith('/csp-report')) {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const report = await request.json();
    const cspReport = report['csp-report'];

    if (cspReport) {
      // 结构化日志输出，方便 Logpush / Workers Logs 检索
      console.log(JSON.stringify({
        type: 'csp-violation',
        timestamp: new Date().toISOString(),
        blocked_uri: cspReport['blocked-uri'] || '',
        document_uri: cspReport['document-uri'] || '',
        violated_directive: cspReport['violated-directive'] || '',
        effective_directive: cspReport['effective-directive'] || '',
        original_policy: cspReport['original-policy'] || '',
        referrer: cspReport['referrer'] || '',
        status_code: cspReport['status-code'] || 0,
        script_sample: cspReport['script-sample'] || '',
        user_agent: request.headers.get('User-Agent') || '',
      }));
    }

    // 204 No Content — 标准 CSP 报告响应
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('CSP report parse error:', err.message);
    return new Response('Bad Request', { status: 400 });
  }
}
