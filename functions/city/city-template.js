// City page HTML template renderer - DO NOT EDIT
// Used by functions/city/[slug].js

const REFERENCE_CITIES = [
  { n: '北京', ne: 'Beijing', tz: 'Asia/Shanghai', o: 8 },
  { n: '纽约', ne: 'New York', tz: 'America/New_York', o: -5 },
  { n: '伦敦', ne: 'London', tz: 'Europe/London', o: 0 },
  { n: '东京', ne: 'Tokyo', tz: 'Asia/Tokyo', o: 9 },
  { n: '悉尼', ne: 'Sydney', tz: 'Australia/Sydney', o: 10 },
  { n: '迪拜', ne: 'Dubai', tz: 'Asia/Dubai', o: 4 },
  { n: '莫斯科', ne: 'Moscow', tz: 'Europe/Moscow', o: 3 },
  { n: '洛杉矶', ne: 'Los Angeles', tz: 'America/Los_Angeles', o: -8 },
];

function offsetStr(o) {
  if (o === 0) return 'UTC+0';
  const sign = o > 0 ? '+' : '';
  return Number.isInteger(o) ? `UTC${sign}${o}` : `UTC${sign}${Math.floor(o)}:${String(Math.round(Math.abs(o % 1) * 60)).padStart(2, '0')}`;
}

function timeDiffRows(city) {
  return REFERENCE_CITIES.map(ref => {
    const diff = ref.o - city.o;
    let diffDisplay;
    if (diff === 0) diffDisplay = '0（相同）';
    else if (diff > 0) diffDisplay = (Number.isInteger(diff) ? `+${diff}` : `+${diff}`) + '小时';
    else diffDisplay = (Number.isInteger(diff) ? `${diff}` : `${diff}`) + '小时';
    const colorStyle = diff > 0 ? 'color:#22c55e' : diff < 0 ? 'color:#ef4444' : '';
    return `        <tr>
          <td>${ref.n}<br><small style="color:var(--text-secondary)">${ref.ne}</small></td>
          <td style="font-weight:600;${colorStyle}">${diffDisplay}</td>
          <td><span class="status-dot" data-timezone="${ref.tz}"></span></td>
        </tr>`;
  }).join('\n');
}

function faqItems(faqs) {
  return faqs.map((faq, i) =>
    `      <details class="faq-item"${i === 0 ? ' open' : ''}>
        <summary class="faq-question">${faq.question}</summary>
        <div class="faq-answer"><p>${faq.answer}</p></div>
      </details>`
  ).join('\n');
}

function faqSchema(faqs) {
  return faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer }
  }));
}

function relatedLinks(related, allCities) {
  return related.map(rc => {
    const city = allCities[rc.s];
    const tz = city ? city.tz : rc.tz;
    return `        <a href="/city/${rc.s}/" class="city-card-sm">
          <h3>${rc.n}</h3>
          <div class="city-time-sm" data-timezone="${tz}"></div>
        </a>`;
  }).join('\n');
}

function hreflangTags(slug) {
  const langs = [
    ['en', 'en'], ['zh-CN', 'zh'], ['de', 'de'], ['fr', 'fr'],
    ['es', 'es'], ['ja', 'ja'], ['ko', 'ko'], ['pt-BR', 'pt'], ['ar', 'ar']
  ];
  const tags = langs.map(([hreflang, code]) =>
    `  <link rel="alternate" hreflang="${hreflang}" href="https://globetimezone.com/${code}/city/${slug}/" />`
  );
  tags.push(`  <link rel="alternate" hreflang="x-default" href="https://globetimezone.com/city/${slug}/" />`);
  return tags.join('\n');
}

export function renderCityPage(slug, city, allCities) {
  const os = offsetStr(city.o);
  const dstDisplay = city.d ? '实行' : '不实行';
  const dstExtra = city.d
    ? `        <li><strong>夏令时开始：</strong>${city.ds}</li>\n        <li><strong>夏令时结束：</strong>${city.de}</li>\n        <li><strong>夏令时拨钟：</strong>拨快1小时</li>`
    : '';

  const schemaFaq = faqSchema(city.f);
  const faqSchemaStr = schemaFaq.map(q => JSON.stringify(q)).join(',');

  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${city.n}时间 - 现在几点、时差查询、夏令时 | GlobeTimeZone</title>
  <meta name="description" content="实时查询${city.n}当前时间，精准到秒。查看${city.n}与北京、纽约、伦敦、东京、悉尼的时差对比，最佳商务联系时间，夏令时切换日期。GlobeTimeZone提供全球200+城市实时时间查询。">
  <meta name="keywords" content="${city.n}时间, ${city.n}时差, ${city.n}现在几点, ${city.n}夏令时, ${city.ne} time">
  <link rel="canonical" href="https://globetimezone.com/city/${slug}/">
  ${hreflangTags(slug)}
  <meta name="baidu-tongji-id" content="cb6f0f9eec485c2521ce68dab67f5515" />
  <meta property="og:type" content="website">
  <meta property="og:title" content="${city.n}现在几点 - ${os}时区实时时间 | GlobeTimeZone">
  <meta property="og:description" content="实时查看${city.n}当前时间、与全球8大城市时差对比、最佳商务联系时段、夏令时信息。">
  <meta property="og:url" content="https://globetimezone.com/city/${slug}/">
  <meta property="og:site_name" content="GlobeTimeZone">
  <meta property="og:locale" content="zh_CN">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${city.n}现在几点 - ${os}">
  <meta name="twitter:description" content="实时查看${city.n}当前时间、时差对比、最佳联系时段。">
  <link rel="icon" href="/favicon.ico">
  <link rel="preconnect" href="https://www.googletagmanager.com">
  <link rel="preconnect" href="https://pagead2.googlesyndication.com">
  <link rel="manifest" href="/manifest.json">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "首页", "item": "https://globetimezone.com/"},
      {"@type": "ListItem", "position": 2, "name": "城市时间", "item": "https://globetimezone.com/cities/"},
      {"@type": "ListItem", "position": 3, "name": "${city.n}时间", "item": "https://globetimezone.com/city/${slug}/"}
    ]
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Clock",
    "name": "${city.n}当前时间",
    "description": "实时显示${city.n}的准确时间（${os}）",
    "timezone": "${city.tz}",
    "url": "https://globetimezone.com/city/${slug}/"
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [${faqSchemaStr}]
  }
  </script>
  <link rel="stylesheet" href="/styles/premium.css?v=2">
  <style>
    .city-hero{text-align:center;padding:3rem 1rem 2rem;max-width:800px;margin:0 auto;background:linear-gradient(135deg,var(--bg,#fff) 0%,var(--bg-secondary,#f0f4f8) 100%);border-radius:0 0 2rem 2rem}
    .city-clock{font-size:3.5rem;font-weight:800;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;color:var(--text)}
    .city-date{font-size:1.1rem;color:var(--text-secondary);margin-top:0.3rem}
    .city-status{display:inline-block;padding:0.3rem 1rem;border-radius:9999px;font-size:0.85rem;font-weight:600;margin-top:0.8rem}
    .status-working{background:#dcfce7;color:#166534}
    .status-sleeping{background:#dbeafe;color:#1e40af}
    .status-personal{background:#fef3c7;color:#92400e}
    .status-deep-sleep{background:#ede9fe;color:#5b21b6}
    .breadcrumb{max-width:800px;margin:0 auto;padding:0.75rem 1rem;font-size:0.85rem;color:var(--text-secondary)}
    .breadcrumb a{color:var(--text-secondary);text-decoration:none}
    .breadcrumb a:hover{color:var(--text);text-decoration:underline}
    .breadcrumb span{margin:0 0.4rem}
    .time-diff-section{max-width:800px;margin:2rem auto;padding:0 1rem}
    .time-diff-table{width:100%;border-collapse:collapse}
    .time-diff-table th{text-align:left;padding:0.75rem 1rem;border-bottom:2px solid var(--border);font-size:0.85rem;color:var(--text-secondary)}
    .time-diff-table td{padding:0.75rem 1rem;border-bottom:1px solid var(--border-subtle,#e5e7eb)}
    .time-diff-table tr:hover{background:var(--bg-secondary)}
    .contact-section{max-width:800px;margin:2rem auto;padding:0 1rem}
    .contact-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-top:1rem}
    .contact-card{padding:1.2rem 1.5rem;border-radius:12px;border:1px solid var(--border);background:var(--bg);transition:transform 0.2s,box-shadow 0.2s}
    .contact-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.08)}
    .contact-card h3{font-size:1rem;margin:0 0 0.5rem}
    .contact-card p{font-size:0.9rem;color:var(--text-secondary);margin:0;line-height:1.6}
    .tz-info-section{max-width:800px;margin:2rem auto;padding:0 1rem}
    .tz-info-list{list-style:none;padding:0}
    .tz-info-list li{padding:0.5rem 0;border-bottom:1px solid var(--border-subtle,#e5e7eb);display:flex;gap:0.5rem}
    .tz-info-list li strong{min-width:100px;flex-shrink:0;color:var(--text-secondary);font-size:0.9rem}
    .faq-section{max-width:800px;margin:2rem auto;padding:0 1rem}
    .faq-item{border:1px solid var(--border);border-radius:10px;margin-bottom:0.75rem;overflow:hidden}
    .faq-question{padding:1rem 1.2rem;font-weight:600;cursor:pointer;user-select:none;display:flex;justify-content:space-between;align-items:center}
    .faq-question::after{content:'+';font-size:1.2rem;color:var(--text-secondary)}
    details[open] .faq-question::after{content:'\\2212'}
    .faq-answer{padding:0 1.2rem 1rem;color:var(--text-secondary);line-height:1.7}
    .related-section{max-width:800px;margin:2rem auto 0;padding:0 1rem 2rem}
    .city-grid-sm{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.75rem;margin-top:1rem}
    .city-card-sm{display:block;padding:0.8rem;border-radius:10px;border:1px solid var(--border);text-decoration:none;color:var(--text);transition:transform 0.15s,box-shadow 0.15s}
    .city-card-sm:hover{transform:translateY(-2px);box-shadow:0 3px 10px rgba(0,0,0,0.06)}
    .city-card-sm h3{font-size:0.9rem;margin:0}
    .city-time-sm{font-size:0.8rem;color:var(--text-secondary);margin-top:0.2rem}
    @media(max-width:640px){.city-clock{font-size:2.5rem}.contact-cards{grid-template-columns:1fr}.city-grid-sm{grid-template-columns:repeat(2,1fr)}}
    @media(prefers-color-scheme:dark){:root{--bg:#0f172a;--bg-secondary:#1e293b;--text:#f1f5f9;--text-secondary:#94a3b8;--border:#334155;--border-subtle:#1e293b}.status-working{background:#064e3b;color:#6ee7b7}.status-sleeping{background:#1e3a5f;color:#93c5fd}.status-personal{background:#422006;color:#fcd34d}.status-deep-sleep{background:#2e1065;color:#c4b5fd}}
  </style>
</head>
<body>
  <a href="#main-content" class="skip-link">跳到主内容</a>
  <header id="site-header">
    <nav aria-label="主导航" style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;max-width:1200px;margin:0 auto;padding:0.75rem 1.5rem;">
      <a href="/" style="font-weight:800;font-size:1.05rem;text-decoration:none;color:var(--text);display:flex;align-items:center;gap:0.4rem;">
        <span style="font-size:1.3rem;">🌍</span>GlobeTimeZone
      </a>
      <a href="/time-difference/" style="text-decoration:none;color:var(--text);">时差查询</a>
      <a href="/meeting-planner/" style="text-decoration:none;color:var(--text);">会议规划</a>
      <a href="/tools/cross-border/" style="text-decoration:none;color:var(--text);">跨境工具</a>
      <a href="/blog/" style="text-decoration:none;color:var(--text);">教程</a>
      <a href="/pricing/" class="pro-link">升级 PRO</a>
    </nav>
  </header>
  <main id="main-content">
    <nav class="breadcrumb" aria-label="面包屑">
      <a href="/">首页</a><span>›</span>
      <a href="/cities/">城市时间</a><span>›</span>
      <strong>${city.n}时间</strong>
    </nav>
    <section class="city-hero">
      <h1>${city.n}现在时间 <small style="font-size:0.45em;color:var(--text-secondary);font-weight:400;">${os}</small></h1>
      <div class="city-clock" id="city-clock" data-timezone="${city.tz}">--:--:--</div>
      <div class="city-date" id="city-date"></div>
      <div class="city-status status-working" id="city-status">${city.n} · ${city.c}</div>
    </section>
    <section class="time-diff-section">
      <h2>${city.n}与全球主要城市时差</h2>
      <table class="time-diff-table">
        <thead><tr><th>城市</th><th>时差</th><th>当前状态</th></tr></thead>
        <tbody>
${timeDiffRows({ o: city.o })}
        </tbody>
      </table>
    </section>
    <section class="contact-section">
      <h2>联系${city.n}的最佳时间</h2>
      <div class="contact-cards">
        <div class="contact-card"><h3>📞 商务联系</h3><p>${city.bb}</p></div>
        <div class="contact-card"><h3>💬 亲友联系</h3><p>${city.bp}</p></div>
      </div>
    </section>
    <section class="tz-info-section">
      <h2>${city.n}时区信息</h2>
      <ul class="tz-info-list">
        <li><strong>时区名称：</strong>${city.tn}</li>
        <li><strong>IANA标识：</strong>${city.tz}</li>
        <li><strong>UTC偏移：</strong>${os}</li>
        <li><strong>夏令时：</strong>${dstDisplay}</li>
${dstExtra}
        <li><strong>所属国家：</strong>${city.c}（${city.cc}）</li>
      </ul>
    </section>
    <section class="faq-section">
      <h2>关于${city.n}时间的常见问题</h2>
${faqItems(city.f)}
    </section>
    <section class="related-section">
      <h2>其他热门城市时间</h2>
      <div class="city-grid-sm">
${relatedLinks(city.r, allCities)}
      </div>
    </section>
  </main>
  <footer style="text-align:center;padding:2rem 1rem;color:var(--text-secondary);font-size:0.85rem;border-top:1px solid var(--border-subtle);">
    <p style="display:flex;justify-content:center;gap:1.2rem;flex-wrap:wrap;">
      <a href="/about/" style="color:var(--text-secondary);text-decoration:none;">关于我们</a>
      <a href="/privacy/" style="color:var(--text-secondary);text-decoration:none;">隐私政策</a>
      <a href="/terms/" style="color:var(--text-secondary);text-decoration:none;">服务条款</a>
      <a href="mailto:support@globetimezone.com" style="color:var(--text-secondary);text-decoration:none;">联系我们</a>
    </p>
    <p style="margin-top:0.5rem;">&copy; 2026 GlobeTimeZone &middot; 所有时间数据基于 NTP 实时校准 &middot; 时区数据来源 IANA</p>
  </footer>
  <script data-cfasync="false">
  (function(){
    var tz='${city.tz}';
    var clockEl=document.getElementById('city-clock');
    var dateEl=document.getElementById('city-date');
    var statusEl=document.getElementById('city-status');
    function updateClock(){
      try{
        var now=new Date();
        var timeStr=now.toLocaleTimeString('zh-CN',{timeZone:tz,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
        var dateStr=now.toLocaleDateString('zh-CN',{timeZone:tz,year:'numeric',month:'long',day:'numeric',weekday:'long'});
        if(clockEl)clockEl.textContent=timeStr;
        if(dateEl)dateEl.textContent=dateStr;
        if(statusEl){
          var hour=parseInt(now.toLocaleString('en-US',{timeZone:tz,hour:'numeric',hour12:false}),10);
          var sc,st;
          if(hour>=9&&hour<18){sc='status-working';st='🟢 工作时间';}
          else if(hour>=7&&hour<9){sc='status-personal';st='🟡 早间私人时间';}
          else if(hour>=18&&hour<22){sc='status-personal';st='🟡 晚间私人时间';}
          else if(hour>=22||hour<1){sc='status-sleeping';st='🔵 准备休息';}
          else{sc='status-deep-sleep';st='😴 深度睡眠';}
          statusEl.className='city-status '+sc;
          statusEl.textContent=st+' · ${city.n}';
        }
      }catch(e){}
    }
    updateClock();
    setInterval(updateClock,1000);
  })();
  </script>
  <script src="/js/gtz-utils.js" defer data-cfasync="false"></script>
  <script src="/cookie-consent.js" defer data-cfasync="false"></script>
  <script src="/ads-loader.js" defer data-cfasync="false"></script>
  <script data-cfasync="false">
    if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js?v=6').catch(function(){});});}
  </script>
  <script src="/baidu-analytics.js" defer data-cfasync="false"></script>
</body>
</html>`;
}
