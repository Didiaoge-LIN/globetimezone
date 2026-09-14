#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ACCOUNT_ID = 'b73e041dfa2e834c1cd23d11f1971cd5';
const SCRIPT_NAME = 'globetimezone-gateway-production';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_TOKEN || '';

if (!API_TOKEN) {
  console.error('ERROR: CLOUDFLARE_API_TOKEN not set');
  process.exit(1);
}

const scriptPath = path.resolve(__dirname, 'dist-gateway/index.js');
if (!fs.existsSync(scriptPath)) {
  console.error(`ERROR: ${scriptPath} not found`);
  console.error('Run first: npx wrangler deploy --dry-run --outdir=./dist-gateway workers/gateway/index.ts');
  process.exit(1);
}
const scriptContent = fs.readFileSync(scriptPath, 'utf8');
console.log(`Script loaded: ${scriptContent.length} chars`);

const metadata = {
  main_module: 'index.js',
  bindings: [
    { type: 'kv_namespace', name: 'API_KEYS', namespace_id: 'd89a7aa6340f4f3790495e119a94acf7' },
    { type: 'kv_namespace', name: 'REMINDERS', namespace_id: 'c29503afef6b4dee987a85ae9cb251d7' },
    { type: 'kv_namespace', name: 'CALIBRATION', namespace_id: '5a026ac173d84ca5836d47357cd4df65' },
    { type: 'kv_namespace', name: 'PREFERENCES', namespace_id: '9329056d8ea94e6d9d1f9337fc2bba69' },
    { type: 'kv_namespace', name: 'RATELIMIT', namespace_id: '47222a040de94105be399a03472bdd43' },
    { type: 'kv_namespace', name: 'SHARE_DATA', namespace_id: '0ab9fbf6807b45649b8ecd5c3e40c1ed' },
    { type: 'durable_object_namespace', name: 'CIRCUIT_BREAKER', class_name: 'CircuitBreakerDO' },
  ],
  migrations: [
    { tag: 'v1', new_classes: ['CircuitBreakerDO'] }
  ],
  vars: {
    ENVIRONMENT: 'production',
    TIMEZONE_API_URL: 'https://globetimezone-timezone-api.didiaoge-2026.workers.dev',
    REMINDER_API_URL: 'https://globetimezone-reminder-api.didiaoge-2026.workers.dev',
    NTP_CALIBRATOR_URL: 'https://globetimezone-ntp-calibrator.didiaoge-2026.workers.dev',
    TIME_SIGNER_URL: 'https://globetimezone-time-signer.didiaoge-2026.workers.dev',
    CONFIG_URL: 'https://globetimezone-config.didiaoge-2026.workers.dev',
    REFERRAL_API_URL: 'https://globetimezone-referral-api-production.didiaoge-2026.workers.dev',
  }
};

// Build multipart body
const BOUNDARY = `----CloudflareUpload${Date.now()}`;
const CRLF = '\r\n';
const parts = [];

// metadata part
parts.push(`--${BOUNDARY}`);
parts.push('Content-Disposition: form-data; name="metadata"');
parts.push('Content-Type: application/json');
parts.push('');
parts.push(JSON.stringify(metadata));

// script part
parts.push(`--${BOUNDARY}`);
parts.push('Content-Disposition: form-data; name="index.js"; filename="index.js"');
parts.push('Content-Type: application/javascript; charset=utf-8');
parts.push('');
parts.push(scriptContent);

// close
parts.push(`--${BOUNDARY}--`);
parts.push('');

const body = parts.join(CRLF);
const bodyBytes = Buffer.byteLength(body, 'utf8');
console.log(`Body size: ${bodyBytes} bytes (${(bodyBytes/1024).toFixed(1)} KB)`);

const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT_NAME}`;
console.log(`PUT ${url}`);

const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 180000);

fetch(url, {
  method: 'PUT',
  signal: ctrl.signal,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': `multipart/form-data; boundary=${BOUNDARY}`,
    'Content-Length': String(bodyBytes),
  },
  body: body,
})
.then(async res => {
  clearTimeout(timer);
  const text = await res.text();
  console.log(`\nHTTP ${res.status} ${res.statusText}`);
  let data;
  try { data = JSON.parse(text); } catch { data = null; }
  if (data?.success) {
    console.log('✅ Deploy successful!');
    console.log(JSON.stringify(data.result, null, 2).slice(0, 500));
    process.exit(0);
  } else {
    console.error('❌ Deploy failed:');
    if (data?.errors) data.errors.forEach(e => console.error(`  [${e.code}] ${e.message}`));
    else console.error(text.slice(0, 1000));
    process.exit(1);
  }
})
.catch(err => {
  clearTimeout(timer);
  console.error('\n❌ Request failed:');
  if (err.name === 'AbortError') console.error('  Timed out after 180s');
  else console.error(`  ${err.message}`);
  process.exit(1);
});
