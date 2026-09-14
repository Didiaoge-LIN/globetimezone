#!/usr/bin/env node
/**
 * Cloudflare Pages Direct Deploy
 * Bypasses wrangler proxy issues by using the CF API directly via curl
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const API_TOKEN = process.env.CF_API_TOKEN || ''; // 从环境变量读取，不要硬编码
const ACCOUNT_ID = 'b73e041dfa2e834c1cd23d11f1971cd5';
const PROJECT = 'globetimezone';
const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}`;
const PROXY = 'http://127.0.0.1:10808';
const DIR = process.cwd();

function curl(method, url, options = {}) {
    let cmd = `curl -x ${PROXY} -s -X ${method} "${url}" -H "Authorization: Bearer ${API_TOKEN}"`;
    if (options.body) {
        cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(options.body).replace(/'/g, "'\\''")}'`;
    }
    if (options.headers) {
        for (const [k, v] of Object.entries(options.headers)) {
            cmd += ` -H "${k}: ${v}"`;
        }
    }
    try {
        const result = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
        return JSON.parse(result);
    } catch (e) {
        console.error('API Error:', e.message);
        return null;
    }
}

// Get files to deploy (build a simple manifest)
function getFiles(dir, base = '') {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(base, entry.name).replace(/\\/g, '/');
        if (entry.isDirectory()) {
            files.push(...getFiles(fullPath, relPath));
        } else {
            const content = fs.readFileSync(fullPath);
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            files.push({ path: relPath, hash, size: content.length });
        }
    }
    return files;
}

console.log('🔧 Cloudflare Pages Direct Deploy\n');

// Step 1: Get upload URL from CF
console.log('Step 1: Creating deployment...');
const deployBody = {
    manifest: {} // We'll build the manifest
};

// Actually, CF Pages direct upload API requires a different flow.
// Let's create a deployment via wrangler's internal API
console.log('Attempting direct deployment via wrangler API...');

// Alternative: Use pages project's deployment API
// POST /accounts/:id/pages/projects/:name/deployments
const deploy = curl('POST', `${BASE_URL}/deployments`, {
    body: { production_branch: 'main' }
});

if (deploy && deploy.success) {
    console.log(`✅ Deployment created: ${deploy.result.id}`);
    console.log(`   URL: ${deploy.result.url}`);
} else {
    console.log('⚠️  API deploy failed. Trying wrangler once more...');
    
    // Last resort: run wrangler again
    try {
        const result = execSync(
            `set HTTP_PROXY=${PROXY}&& set HTTPS_PROXY=${PROXY}&& set CLOUDFLARE_API_TOKEN=${API_TOKEN}&& set CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID}&& npx wrangler pages publish ./ --project-name=${PROJECT} --commit-dirty=true --skip-caching`,
            { encoding: 'utf8', timeout: 120000, cwd: DIR }
        );
        console.log(result);
    } catch (e) {
        console.log('Wrangler output:', e.stdout || '');
        console.log('Wrangler error:', e.stderr || e.message);
    }
}
