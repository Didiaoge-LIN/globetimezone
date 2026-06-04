/**
 * scripts/setup.mjs — 环境初始化（KV 命名空间创建）
 * 裁决 #3: 移除 R2 创建逻辑
 * CEO · 首席系统架构师 · SYS · OPS 联合签署 2026-05-30
 */
import { readFile, writeFile } from 'fs/promises';
import { request } from 'https';

const accountId = process.env.CF_ACCOUNT_ID;
const apiToken = process.env.CF_API_TOKEN;

if (!accountId || !apiToken) {
  console.error('请设置环境变量 CF_ACCOUNT_ID 和 CF_API_TOKEN');
  process.exit(1);
}

function cfApi(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${accountId}${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    };
    const req = request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const kvPayloads = [
    { title: 'REMINDERS' },
    { title: 'CALIBRATION' },
    { title: 'PREFERENCES' },
  ];

  for (const p of kvPayloads) {
    console.log(`创建 KV 命名空间: ${p.title}`);
    const res = await cfApi('/storage/kv/namespaces', 'POST', p);
    if (res.success) {
      const id = res.result.id;
      console.log(`KV ${p.title}: ${id}`);
      console.log(`请将以上 ID 手动填入对应的 wrangler.xxx.toml 文件`);
    } else {
      console.error(`KV ${p.title} 创建失败:`, JSON.stringify(res.errors));
    }
  }

  console.log('所有 KV 命名空间已创建。请手动配置 wrangler 文件中的 ID。');
}

main().catch(console.error);
