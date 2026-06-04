export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const city = url.searchParams.get('city') || 'UTC';
    const tz = decodeURIComponent(city);

    const timeRes = await fetch(`https://globetimezone.com/api/v1/timezone/${tz}?format=ssr`);
    const timeHtml = await timeRes.text();

    const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: #1a1a2e;
      color: #fff;
      text-align: center;
      padding: 16px;
    }
    a { color: #0066cc; }
  </style>
</head>
<body>
  ${timeHtml}
  <p style="font-size:10px;margin-top:8px;">
    Powered by <a href="https://globetimezone.com" target="_blank">GlobeTimeZone</a>
  </p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=60',
      },
    });
  },
};
