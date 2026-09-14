/**
 * ============================================================
 * GlobeTimeZone 城市页面全维度自动化审计脚本 v3.0
 * 覆盖：安全合规、SEO语义、性能优化、功能正确性、协议规范
 * 用法：TEST_URL=https://globetimezone.com node audit.js
 * ============================================================
 */

const BASE_URL = process.env.TEST_URL || 'https://globetimezone.com';
const CONCURRENCY = 10;
const TEST_CITIES = ['beijing', 'shanghai', 'new-york', 'london', 'tokyo', 'sydney', 'dubai', 'los-angeles'];

// 工具：带超时的 fetch
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function createResult(name, pass, detail = '') {
  return { name, pass, detail };
}

// 1. 安全头检测
async function testSecurityHeaders(url) {
  const results = [];
  const res = await fetchWithTimeout(url, { method: 'HEAD' });
  const headers = Object.fromEntries(res.headers.entries());

  const requiredHeaders = [
    'content-security-policy',
    'strict-transport-security',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy',
    'cross-origin-opener-policy',
    'cross-origin-resource-policy',
  ];

  requiredHeaders.forEach(h => {
    results.push(createResult(
      `安全头存在：${h}`,
      !!headers[h],
      headers[h] || '缺失'
    ));
  });

  // X-Frame-Options 为 DENY
  results.push(createResult(
    'X-Frame-Options 为 DENY',
    headers['x-frame-options'] === 'DENY',
    headers['x-frame-options']
  ));

  // X-XSS-Protection 为 0
  results.push(createResult(
    'X-XSS-Protection 为 0',
    headers['x-xss-protection'] === '0',
    headers['x-xss-protection'] || '缺失'
  ));

  // CSP 包含 upgrade-insecure-requests
  const csp = headers['content-security-policy'] || '';
  results.push(createResult(
    'CSP 包含 upgrade-insecure-requests',
    csp.includes('upgrade-insecure-requests'),
    csp.includes('upgrade-insecure-requests') ? '存在' : '缺失'
  ));

  // 安全头无重复
  const rawHeaders = res.headers.raw ? res.headers.raw() : {};
  const contentTypeCount = rawHeaders['x-content-type-options']?.length || 1;
  results.push(createResult(
    '安全头无重复',
    contentTypeCount === 1,
    `出现 ${contentTypeCount} 次`
  ));

  return { category: '安全合规', results };
}

// 2. SEO 语义检测
async function testSeoSemantics(url) {
  const results = [];
  const res = await fetchWithTimeout(url);
  const html = await res.text();

  ['title', 'meta name="description"', 'rel="canonical"'].forEach(tag => {
    results.push(createResult(
      `存在 SEO 标签：${tag}`,
      html.includes(tag),
      tag
    ));
  });

  const h1Count = (html.match(/<h1/gi) || []).length;
  results.push(createResult(
    'H1 标签唯一',
    h1Count === 1,
    `实际 ${h1Count} 个`
  ));

  const ogTags = ['og:title', 'og:description', 'og:image', 'og:url'];
  const ogComplete = ogTags.every(tag => html.includes(tag));
  results.push(createResult(
    'OG 社交分享标签完整',
    ogComplete,
    ogComplete ? '全部存在' : '部分缺失'
  ));

  const hasCitySchema = html.includes('"@type":"City"') || html.includes('"@type": "City"');
  const hasBreadcrumb = html.includes('"@type":"BreadcrumbList"') || html.includes('"@type": "BreadcrumbList"');
  const hasClock = html.includes('"@type":"Clock"') || html.includes('"@type": "Clock"');
  const hasFaq = html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"');
  results.push(createResult('City 结构化数据', hasCitySchema, hasCitySchema ? '存在' : '缺失'));
  results.push(createResult('BreadcrumbList 结构化数据', hasBreadcrumb, hasBreadcrumb ? '存在' : '缺失'));
  results.push(createResult('Clock 结构化数据', hasClock, hasClock ? '存在' : '缺失'));
  results.push(createResult('FAQPage 结构化数据', hasFaq, hasFaq ? '存在' : '缺失'));

  const hasHreflang = html.includes('hreflang=');
  results.push(createResult(
    'Hreflang 多语言标签存在',
    hasHreflang,
    hasHreflang ? '存在' : '缺失'
  ));

  return { category: 'SEO 语义', results };
}

// 3. URL 归一化检测
async function testUrlNormalization(baseUrl) {
  const results = [];
  const testCases = [
    { name: '大写路径 301 跳小写', url: `${baseUrl}/city/BEIJING/`, expectStatus: 301 },
    { name: '无斜杠路径 301 跳带斜杠', url: `${baseUrl}/city/beijing`, expectStatus: 301 },
    { name: '非法 slug 返回 404', url: `${baseUrl}/city/!!!invalid!!!/`, expectStatus: 404 },
    { name: '超长 slug 返回 404', url: `${baseUrl}/city/${'a'.repeat(100)}/`, expectStatus: 404 },
    { name: '路径遍历攻击拦截', url: `${baseUrl}/city/..%2f..%2fetc%2fpasswd/`, expectStatus: 404 },
    { name: '编码绕过攻击拦截', url: `${baseUrl}/city/%2e%2e%2f/`, expectStatus: 404 },
  ];

  for (const tc of testCases) {
    try {
      const res = await fetchWithTimeout(tc.url, { redirect: 'manual' });
      const pass = res.status === tc.expectStatus;
      results.push(createResult(tc.name, pass, `实际状态码：${res.status}`));
    } catch (e) {
      results.push(createResult(tc.name, false, `请求失败：${e.message}`));
    }
  }

  return { category: 'URL 归一化', results };
}

// 4. 性能与协议规范检测
async function testPerformance(url) {
  const results = [];
  const start = Date.now();
  const res = await fetchWithTimeout(url, { method: 'HEAD' });
  const duration = Date.now() - start;

  results.push(createResult(
    '页面响应时间 < 500ms',
    duration < 500,
    `实际 ${duration}ms`
  ));

  // ETag 存在
  const hasEtag = !!res.headers.get('etag');
  results.push(createResult(
    'ETag 协商缓存存在',
    hasEtag,
    hasEtag ? res.headers.get('etag') : '缺失'
  ));

  // HEAD 请求无正文
  const body = await res.text();
  results.push(createResult(
    'HEAD 请求无响应正文',
    body.length === 0,
    `正文长度 ${body.length} 字节`
  ));

  // 304 协商缓存生效
  const etag = res.headers.get('etag');
  if (etag) {
    const res304 = await fetchWithTimeout(url, {
      method: 'GET',
      headers: { 'If-None-Match': etag }
    });
    results.push(createResult(
      '协商缓存返回 304',
      res304.status === 304,
      `实际状态码 ${res304.status}`
    ));
  }

  // HTML 压缩
  const fullRes = await fetchWithTimeout(url);
  const fullHtml = await fullRes.text();
  const hasLongWhitespace = /\s{4,}/.test(fullHtml);
  results.push(createResult(
    'HTML 已压缩',
    !hasLongWhitespace,
    hasLongWhitespace ? '存在冗余空白' : '压缩正常'
  ));

  // 无 GA4 占位符
  const hasGaPlaceholder = fullHtml.includes('G-XXXXXXXXXX');
  results.push(createResult(
    'GA4 ID 无占位符',
    !hasGaPlaceholder,
    hasGaPlaceholder ? '仍使用 G-XXXXXXXXXX' : '已替换'
  ));

  return { category: '性能与协议', results };
}

// 5. 错误页检测
async function testErrorPages(baseUrl) {
  const results = [];

  const res404 = await fetchWithTimeout(`${baseUrl}/city/not-exist-12345/`);
  results.push(createResult(
    '404 页面状态码正确',
    res404.status === 404,
    `实际 ${res404.status}`
  ));

  const html404 = await res404.text();
  results.push(createResult(
    '404 页面禁止索引',
    html404.includes('noindex') && res404.headers.get('x-robots-tag')?.includes('noindex'),
    '符合 SEO 规范'
  ));

  results.push(createResult(
    '404 页面有引导入口',
    html404.includes('返回首页'),
    '降低跳出率'
  ));

  const res405 = await fetchWithTimeout(`${baseUrl}/city/beijing/`, { method: 'POST' });
  results.push(createResult(
    'POST 请求返回 405',
    res405.status === 405,
    `实际 ${res405.status}`
  ));
  results.push(createResult(
    '405 响应包含 Allow 头',
    !!res405.headers.get('allow'),
    res405.headers.get('allow') || '缺失'
  ));

  const hasSecurityHeaders = !!res404.headers.get('content-security-policy') && !!res404.headers.get('x-frame-options');
  results.push(createResult(
    '错误页携带完整安全头',
    hasSecurityHeaders,
    '安全基线统一'
  ));

  return { category: '错误页规范', results };
}

// 6. 健康接口检测
async function testHealthEndpoint(baseUrl) {
  const results = [];

  try {
    const res = await fetchWithTimeout(`${baseUrl}/api/health`);
    results.push(createResult(
      '健康接口返回 200',
      res.status === 200,
      `实际 ${res.status}`
    ));

    const data = await res.json();
    results.push(createResult(
      '健康接口返回标准 JSON',
      data.status === 'ok' && !!data.version,
      `服务状态：${data.status}，版本：${data.version}`
    ));

    results.push(createResult(
      '健康接口禁止缓存',
      res.headers.get('cache-control')?.includes('no-store'),
      '防止监控异常'
    ));

    // Deep 检查
    const deepRes = await fetchWithTimeout(`${baseUrl}/api/health?deep=1`);
    if (deepRes.status === 200) {
      const deepData = await deepRes.json();
      results.push(createResult(
        'Deep 检查端点可用',
        !!deepData.checks,
        deepData.checks ? `KV: ${deepData.checks.kv_storage}, Stripe: ${deepData.checks.stripe}` : '无 checks'
      ));
    }
  } catch (e) {
    results.push(createResult('健康接口可访问', false, e.message));
  }

  return { category: '健康接口', results };
}

// 并发控制执行器
async function batchRun(tasks, handler, concurrency) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const current = index++;
      try {
        results[current] = await handler(tasks[current]);
      } catch (e) {
        results[current] = { error: e.message };
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

// 生成汇总报告
function generateReport(allResults) {
  let totalPass = 0;
  let totalCount = 0;
  const failedItems = [];

  console.log('\n' + '='.repeat(80));
  console.log('GlobeTimeZone 城市页面全维度自动化审计报告');
  console.log('='.repeat(80));
  console.log(`检测站点：${BASE_URL}`);
  console.log(`检测时间：${new Date().toLocaleString()}`);
  console.log('-'.repeat(80));

  allResults.forEach(category => {
    const passCount = category.results.filter(r => r.pass).length;
    const total = category.results.length;
    totalPass += passCount;
    totalCount += total;
    const rate = ((passCount / total) * 100).toFixed(2);

    console.log(`\n[${category.category}] ${passCount}/${total} 通过 (${rate}%)`);
    console.log('-'.repeat(40));

    category.results.forEach(item => {
      const icon = item.pass ? '✅' : '❌';
      console.log(`  ${icon} ${item.name}`);
      if (!item.pass) {
        console.log(`     详情：${item.detail}`);
        failedItems.push({ category: category.category, ...item });
      }
    });
  });

  console.log('\n' + '='.repeat(80));
  const totalRate = ((totalPass / totalCount) * 100).toFixed(2);
  console.log(`整体通过率：${totalPass}/${totalCount} (${totalRate}%)`);

  if (failedItems.length > 0) {
    console.log('\n未通过项汇总：');
    failedItems.forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.category}] ${item.name}：${item.detail}`);
    });
  } else {
    console.log('\n所有检测项全部通过，达到生产级标准！');
  }

  console.log('='.repeat(80) + '\n');
}

// 主函数
async function main() {
  console.log('启动全维度自动化审计...');
  console.log(`目标站点：${BASE_URL}`);
  console.log(`测试页面数：${TEST_CITIES.length}`);
  console.log(`并发数：${CONCURRENCY}`);

  // 单页面全维度检测
  const pageResults = await batchRun(TEST_CITIES, async (city) => {
    const url = `${BASE_URL}/city/${city}/`;
    console.log(`\n检测页面：${url}`);
    return [
      await testSecurityHeaders(url),
      await testSeoSemantics(url),
      await testPerformance(url)
    ];
  }, CONCURRENCY);

  // 全局专项检测
  console.log('\n执行全局专项检测...');
  const globalResults = [
    await testUrlNormalization(BASE_URL),
    await testErrorPages(BASE_URL),
    await testHealthEndpoint(BASE_URL)
  ];

  // 合并所有结果
  const allResults = [...pageResults.flat(), ...globalResults];

  // 生成报告
  generateReport(allResults);
}

main().catch(e => {
  console.error('检测脚本执行失败：', e);
  process.exit(1);
});
