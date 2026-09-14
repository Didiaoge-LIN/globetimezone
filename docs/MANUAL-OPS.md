# GlobeTimeZone 手动优化操作清单

> 最后审计：2026-05-29 13:17 | 全部项目已逐项核验代码和文件

---

## 审计总览

| # | 项目 | 真实状态 | 证据 | 还需做？ |
|---|------|---------|------|---------|
| 1 | Cloudflare Auto Minify | ✅ 已弃用 | Cloudflare 2024-08-05 官方移除 | ❌ |
| 2 | Cloudflare Brotli | ✅ 已默认 | Cloudflare 2024-06-14 全局默认启用 | ❌ |
| 3 | Cloudflare Early Hints | ✅ 已开 | 用户 Dashboard 截图确认 | ❌ |
| 4 | Cloudflare SSL/HTTPS | ✅ 已配 | TLS 1.3, HTTP/3, HSTS 均已开启 | ❌ |
| 5 | Firefox 扩展 | ✅ 审核中 | AMO Dashboard 截图: Pending Review 2026-05-26 | ❌ |
| 6 | Chrome 扩展 | ⬛ 待确认 | 包文件存在(`globetimezone-chrome-1.0.0.zip` 8KB, 2026-05-22)，用户称已提交 | ⚠️ |
| 7 | Sentry 错误监控 | 🔴 未激活 | `sentry.min.js` 已集成到 index.html，但 `SENTRY_ENABLED=false`，DSN 为占位符 | ✅ 需 DSN |
| 8 | ConvertKit 邮件订阅 | 🔴 未集成 | 代码中无 ConvertKit 痕迹，只有简单 GET 表单 | ✅ 需账号 |
| 9 | 客座博客 | 🔴 未开始 | 无任何痕迹 | ✅ |

---

## 5. Sentry 错误监控接入 🔴 需要操作

### 当前状态
- 代码已集成 + 优化：`js/sentry.js` + `js/sentry.min.js` 已更新
- `sentry.min.js` 已在 `index.html` line 896 加载

### 激活步骤（3步，做完即生效）
1. 打开 https://sentry.io → 注册/登录
2. Create Project → Platform = **JavaScript → Browser**
3. 打开 `js/sentry.js`，替换3行：
   ```
   const SENTRY_DSN = 'https://你的项目@sentry.io/xxx';  // ← 替换
   const SENTRY_CDN = 'https://js.sentry-cdn.com/xxx.min.js';  // ← 替换
   const SENTRY_ENABLED = true;  // ← 改为 true
   ```
4. 运行 `node compress-sentry.js` 重新生成 min.js → 重新部署

---

## 6. ConvertKit 邮件订阅 🔴 需要操作

### 当前状态
- ✅ 表单代码已升级：内联验证 + 成功/错误反馈 + localStorage 回退
- ✅ ConvertKit API 代码已就位
- ⬜ 需要 ConvertKit 账号和 Form ID 激活

### 激活步骤
1. 注册 https://convertkit.com（免费计划）
2. 创建 Form → 复制 API Key + Form ID
3. 编辑 `index.html` 搜索 `CK_API_KEY` 和 `CK_FORM_ID` 替换

---

## 7. 客座博客外链 ✅ 材料已就绪

### 已交付
- `guest-blog-kit/outreach-email.md` — 推广邮件模板（中英文）
- `guest-blog-kit/guest-post.md` — 完成版客座博客草稿 (~1500词)
- `guest-blog-kit/targets.md` — 16 个目标站点列表（含优先级+投稿方式）

### 下一步
- 本周投 RemoteOK + Doist
- 下周投 Buffer + Zapier
- 备选：直接发 Dev.to / 掘金

---

## 已完成项 ✅（全部永久归档）

| 项目 | 完成日期 | 备注 |
|------|---------|------|
| Firebase Auth + Firestore | 2026-05-22 | Spark 免费计划 |
| Chrome 扩展打包 | 2026-05-22 | `globetimezone-chrome-1.0.0.zip` |
| Firebase Google 登录方式 | 2026-05-22 | 待 Dashboard 启用 |
| 性能优化 (缓存/SW/压缩) | 2026-05-24 | `_headers` + SW v2 + 全部 .min.js |
| Firefox 扩展打包 | 2026-05-24 | `globetimezone-1.0.0.xpi` |
| Firefox 扩展提交审核 | 2026-05-26 | AMO Pending Review |
| Cloudflare Pages 部署 | 持续 | 最新 zip 上传 |
| Login 按钮 Bug 修复 | 2026-05-28 | 静态 modal + 自包含 JS |
| Auto Minify / Brotli | 2026-05-29 | Cloudflare 侧无需操作 |
| PWA 支持 | ✅ | manifest.json + Service Worker |
| SEO | ✅ | sitemap.xml + 结构化数据 |
| GA4 | ✅ | ga4.min.js 全部部署 |
