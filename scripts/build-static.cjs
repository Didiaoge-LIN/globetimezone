#!/usr/bin/env node
'use strict';

/**
 * 构建静态站点产物到 dist/ —— 站点产物与工程源码分离。
 *
 * 现状问题：
 *   本仓库同时充当工程仓库与部署源（部署源即仓库根），因此凡是「已提交」的
 *   工程文件都会随部署公开。实测线上曾可读 /wrangler.toml（含 zone_id 与
 *   KV namespace ID）、/src/app.ts、/package.json、/.cfignore、
 *   /.workbuddy/memory/MEMORY.md 等；并且在 /_redirects 里补屏蔽规则的做法
 *   又受两重限制 ——
 *     · 语言通配 rewrite（/<lang>/* 代理）不重新走规则匹配，只写根路径的
 *       屏蔽会被 /en/... 绕过；
 *     · _redirects 有效规则上限 100 条，逐语言展开会撑爆、截断正常规则。
 *   结论：屏蔽只能是纵深防御，根治必须让工程文件不进部署产物。
 *
 * 本脚本做的事：
 *   把「允许公开」的内容复制到 dist/，排除全部工程文件与工程目录。
 *   复制完成后做一次反向校验：若 dist/ 中仍出现工程文件特征（*.toml、
 *   package.json、.cfignore、src/ 等），直接失败退出，避免漏排静默上线。
 *
 * 部署模式与启用方式（2026-10-10 修订）：
 *   本仓库通过 `wrangler pages publish .` **直接上传**部署（非 Git 连接构建），
 *   因此【不涉及 CF Pages 的 build command / npm install】—— 注释里记录的
 *   "build 阶段 npm install 失败" 阻塞对本模式不适用。启用方式改为：
 *     本地：node scripts/build-static.cjs   →  产出 dist/
 *     部署：wrangler pages publish dist --project-name globetimezone-web
 *   即在本地生成仅含公开产物的 dist/，再上传 dist/ 而非整个仓库根，
 *   工程文件（wrangler.*.toml / src / workers / scripts / package.json …）
 *   根本不进入部署产物，根治泄露。
 *
 *   历史验证存档（2026-09-14，git 连接 + build command 模式下的失败，仅作记录）：
 *     · 脚本本身没问题：干净克隆下成功产出 402 文件 / 33.2 MB，退出码 0。
 *     · 设 Build command = node scripts/build-static.cjs、输出 = dist 后，
 *       CF Pages build 阶段连续 4 次失败，二分定位为「一旦设置 build
 *       command，Pages 先跑 npm install」，而本仓库 package.json 含
 *       playwright/wrangler/typescript 等重型依赖装不上即判失败。
 *     · 该阻塞仅存在于「Git 连接 + build command」模式；直接上传模式绕开。
 *
 * 注意：
 *   · functions/ 必须【保留在 dist/ 内】—— 本仓库走 `wrangler pages publish
 *     dist` 直接上传，Pages Functions 从发布目录的 functions/ 编译，与
 *     publish 目录是同一份；排除它会让 sitemap/og/api/语言中间件等全挂。
 *     函数源码由 CF 编译为服务端代码，不会作为静态文件公开，故非泄露。
 *   · _headers / _redirects / _routes.json 必须复制进 dist/，Pages 只从
 *     publish 目录读取它们（脚本不会排除这三份文件）。
 *   · 启用后，_redirects 中的安全屏蔽段可退化为纵深防御，
 *     并由 scripts/gen-security-redirects.cjs --check 在 CI 中守住不漂移。
 *
 * 用法：node scripts/build-static.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

/** 整体排除的目录（含嵌套路径） */
const EXCLUDE_DIRS = [
  '.git',
  '.github',
  '.workbuddy',
  '.wrangler',
  '.playwright-cli',
  'node_modules',
  'dist',
  // ⚠️ functions/ 必须【保留】—— 本仓库通过 `wrangler pages publish dist`
  //    直接上传部署，Pages Functions 从发布目录的 functions/ 编译，
  //    与 publish 目录是同一份；若排除它，sitemap/og/api/语言中间件等全挂。
  'src',
  'docs',
  'ops',
  'outreach',
  'link-building',
  'guest-blog-kit',
  'product-hunt',
  'email-templates',
  'templates',
  'extension',
  'extension-chrome',
  'extension-firefox',
  'data',
  // ⚠️ workers/ 是 Cloudflare Workers 源码（含 .ts），会被当静态文件公开，
  //    属真实泄露（实测 /workers/gateway/index.ts 返回 200），必须排除。
  'workers',
  // ⚠️ scripts/ 是构建/审计工具（含 .cjs/.py/.sh），非站点运行时且含源码，
  //    全部排除（原仅排除 scripts/legacy，仍会漏 scripts/*.cjs 等）。
  'scripts',
];

/** 按文件名排除的工程文件 */
const EXCLUDE_FILES = [
  /^wrangler(\..+)?\.toml$/,
  /^package(-lock)?\.json$/,
  /^tsconfig\.json$/,
  /^sri-manifest\.json$/,
  /^\.cfignore$/,
  /^\.gitignore$/,
  /^\.env/,
  /^content-calendar\.json$/,
  /^social-posts\.json$/,
  /^timezone-offsets\.json$/,
  /^minify-js\.js$/,
  /\.py$/,
  /\.sh$/,
  /\.mjs$/,
  /\.cjs$/,
];

/** 校验用：dist/ 中不允许出现的特征 */
const FORBIDDEN = [
  { re: /(^|\/)wrangler(\..+)?\.toml$/, what: 'wrangler 配置' },
  { re: /(^|\/)package(-lock)?\.json$/, what: 'npm 清单' },
  { re: /(^|\/)tsconfig\.json$/, what: 'TS 配置' },
  { re: /(^|\/)\.cfignore$/, what: '部署忽略文件' },
  { re: /(^|\/)\.gitignore$/, what: 'git 忽略文件' },
  { re: /(^|\/)\.env/, what: '环境变量文件' },
  { re: /(^|\/)sri-manifest\.json$/, what: 'SRI 清单' },
  { re: /^\/(src|docs|ops|outreach|data|templates|workers|scripts)\//, what: '工程目录' },
  { re: /(^|\/)minify-js\.js$/, what: '构建脚本' },
  // 构建/脚本类文件（无论位于哪个目录，均不应进入静态产物）
  { re: /\.(cjs|mjs|py|sh)$/, what: '构建/脚本文件' },
];

function relOf(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function shouldCopy(src) {
  const rel = relOf(src);
  if (rel === '') return true;
  if (EXCLUDE_DIRS.some((d) => rel === d || rel.startsWith(d + '/'))) return false;
  const base = path.basename(src);
  if (EXCLUDE_FILES.some((re) => re.test(base))) return false;
  return true;
}

/** 收集目录下所有文件路径 */
function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/**
 * 递归复制（自实现，不用 fs.cpSync）。
 *
 * 为什么不用 fs.cpSync：
 *   · cpSync 是 Node 16.7+ 才有的 API。CF Pages 构建环境的 Node 版本由
 *     项目配置决定（可能低于 16.7），一旦不可用会直接导致构建失败 ——
 *     而构建命令一旦失败，整站部署就中断了。这里用 mkdirSync/copyFileSync/
 *     readdirSync（Node 8.5+ 全支持）换取最大版本兼容性。
 *   · 顺带避开 cpSync 的另一个坑：不支持把目录复制到自身的子目录
 *     （dist 在 ROOT 下，会抛 ERR_FS_CP_EINVAL），本实现由 shouldCopy
 *     排除 'dist' 目录来规避。
 */
function copyRecursive(src, dest) {
  if (!shouldCopy(src)) return;
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

/** 递归删除目录（不用 fs.rmSync，同样为版本兼容） */
function rmRecursive(p) {
  if (!fs.existsSync(p)) return;
  const st = fs.lstatSync(p);
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(p)) rmRecursive(path.join(p, name));
    fs.rmdirSync(p);
  } else {
    fs.unlinkSync(p);
  }
}

function main() {
  rmRecursive(DIST);
  fs.mkdirSync(DIST, { recursive: true });

  copyRecursive(ROOT, DIST);

  const files = walk(DIST);
  const hits = [];
  for (const f of files) {
    const rel = '/' + path.relative(DIST, f).split(path.sep).join('/');
    for (const rule of FORBIDDEN) {
      if (rule.re.test(rel)) hits.push(`${rel}  ← ${rule.what}`);
    }
  }

  const bytes = files.reduce((n, f) => n + fs.statSync(f).size, 0);

  if (hits.length) {
    console.error(`[x] dist/ 中仍存在 ${hits.length} 个工程文件，构建失败：`);
    for (const h of hits.slice(0, 30)) console.error('    ' + h);
    if (hits.length > 30) console.error(`    …另有 ${hits.length - 30} 个`);
    console.error('    → 请在上面的 EXCLUDE_DIRS / EXCLUDE_FILES 中补齐后重跑。');
    process.exit(1);
  }

  console.log(`[ok] dist/ 构建完成：${files.length} 个文件，${(bytes / 1024 / 1024).toFixed(1)} MB`);
  console.log('     校验通过：未包含任何工程文件特征。');
  console.log('');
  console.log('     部署（直接上传模式，无需改 Dashboard）：');
  console.log('       node scripts/build-static.cjs   # 生成 dist/');
  console.log('       wrangler pages publish dist --project-name globetimezone-web');
}

main();
