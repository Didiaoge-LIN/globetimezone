# GlobeTimeZone V11 全面评估报告

**日期**：2026-06-13 | **评估人**：平头哥CEO | **基线**：线上实测

---

## 评估概览

| 维度 | 状态 | 备注 |
|------|------|------|
| API 健康 | ✅ 良好 | /status /timezone /list /convert 全线 200 |
| 静态页面 | ⚠️ 有问题 | 293 页 favicon.svg 全部 404 |
| 城市页面 | ❌ 严重缺失 | 200 页缺安全头/GA4/og:image/Sentry |
| 安全 | ⚠️ 部分缺失 | 静态页 CSP 508B OK；城市页零安全头 |
| i18n | ✅ 良好 | 9 语言 1055 keys，JSON/页面全线 200 |
| SEO | ⚠️ 需优化 | sitemap 仅 205 URL，缺 i18n/功能页 |
| PWA | ✅ 良好 | manifest + SW + 离线缓存正常 |
| 缓存策略 | ⚠️ 冲突 | _headers 规则合并导致 Cache-Control 重复 |

---

## P0 — Critical（必须立即修复）

### 1. favicon.svg 缺失 — 全站图标断链

- **现象**：`/favicon.svg` 返回 404
- **影响**：292/293 个 HTML 页面引用 `/favicon.svg`，浏览器标签页无图标
- **根因**：项目中从未创建过 favicon.svg 文件
- **附带**：201 个城市页面引用 `/favicon.ico`（也不存在）
- **修复方案**：创建 favicon.svg + favicon.ico，部署到根目录

### 2. 200 城市页面零安全头

- **现象**：`/city/new-york/` 响应无 CSP/HSTS/X-Frame-Options 等任何安全头
- **影响**：200+ 高 SEO 权重页面完全裸露，XSS/点击劫持/MIME嗅探风险
- **根因**：`_headers` 只对 CF Pages 静态资源生效，Functions 渲染的页面需自行设置响应头
- **涉及文件**：`functions/city/[slug].js`、`functions/[[path]].js`
- **修复方案**：在两个函数的 Response headers 中注入完整安全头

### 3. 200 城市页面无 GA4

- **现象**：城市模板无 gtag.js / GTM 引用
- **影响**：200+ 高流量页面零 Google Analytics 数据，无法追踪用户行为
- **根因**：city-template.js 创建时未加入 GA4 代码
- **修复方案**：在 city-template.js 中加入 GTM/gtag 脚本

---

## P1 — High（尽快修复）

### 4. 200 城市页面缺少 og:image

- **现象**：city-template.js 无 `<meta property="og:image">` 标签
- **影响**：社交分享无缩略图，严重影响传播效果
- **修复方案**：添加 `og:image` 指向 `/og-default.png`

### 5. 200 城市页面缺少 Sentry

- **现象**：city-template.js 无 Sentry SDK 引用
- **影响**：200+ 页面前端错误无法捕获
- **修复方案**：在模板中加入 sentry-init.js 引用

### 6. _headers Cache-Control 重复冲突

- **现象**：
  - manifest.json: `public, max-age=14400, swr=86400, public, max-age=86400, must-revalidate`
  - sw.js: `public, max-age=14400, swr=86400, no-cache, no-store, max-age=0, must-revalidate`
- **根因**：CF Pages 合并所有匹配规则的 headers（`/*` + `/manifest.json`），不是覆盖
- **影响**：浏览器可能遵循冲突指令导致缓存行为不可预测
- **修复方案**：从 `/*` 全局规则中移除 Cache-Control，改为按路径分组设置

### 7. sitemap.xml 缺少关键页面

- **现象**：仅 205 URL（200 城市 + 首页等），缺 /en/、/zh/、/meeting-planner/、/world-clock.html 等
- **影响**：搜索引擎无法发现 i18n 版本和功能页
- **修复方案**：扩展 sitemap.xml 生成脚本，添加 i18n 路径 + 功能页

### 8. OG 函数不支持 HEAD 请求

- **现象**：`/og/new-york` HEAD 返回 404，GET 返回 200
- **根因**：函数只导出 `onRequestGet`，无 `onRequestHead`
- **影响**：部分 HTTP 客户端/监控工具用 HEAD 探测会误判为 404
- **修复方案**：添加 `onRequestHead` 导出

---

## P2 — Medium（择时修复）

### 9. X-Content-Type-Options 重复

- **现象**：pages.dev 响应中出现两次 `nosniff`
- **根因**：_headers 全局规则 + Functions 内部都设置了此头
- **影响**：功能正常但不够规范

### 10. /api/health 500 on 自定义域名

- **现象**：自定义域名始终 500，.pages.dev 正常
- **根因**：CF 边缘层拦截（非代码问题）
- **替代**：`/api/status` 已作为正式端点

### 11. Stripe webhook 函数已部署但未启用

- **现象**：`/api/stripe-webhook` 返回 503，但路由活跃
- **影响**：每次请求都走 Function 执行，浪费计算资源
- **建议**：从 _routes.json exclude 或移除文件

### 12. CSP 缺少 Stripe 域名

- **现象**：pricing 页面已有 PRO 方案但 CSP 无 `js.stripe.com`
- **影响**：如果上线 Stripe 支付，JS 会被 CSP 阻止
- **备注**：当前 Stripe 未启用，暂无影响

---

## 健康项（确认 OK）

| 项目 | 状态 | 证据 |
|------|------|------|
| CSP 含 Firebase 域名 | ✅ | `*.firebaseio.com` + `securetoken.googleapis.com` 在线 |
| og-default.png | ✅ | 200, 21KB PNG, 正确缓存 |
| API /status | ✅ | 200, v6.3-pages-solo |
| API /timezone | ✅ | 200, IANA 时区正确 |
| API /timezone/list | ✅ | 200, 30 时区 |
| API /timezone/convert | ✅ | 200, 上海→纽约转换正确 |
| HSTS preload | ✅ | `max-age=31536000; includeSubDomains; preload` |
| i18n 9 语言 | ✅ | en/zh/de/fr/es/ja/ko/pt/ar 全线 200 |
| PWA manifest | ✅ | 7 个图标尺寸，standalone 模式 |
| Service Worker | ✅ | 2.2KB，含缓存版本 |
| robots.txt | ✅ | Cloudflare AI 防护 + 自定义规则 |
| Referrer-Policy | ✅ | `strict-origin-when-cross-origin` |
| Permissions-Policy | ✅ | 禁用 camera/mic/geolocation |

---

## 修复优先级路线图

```
P0（立即）：
  ├── 创建 favicon.svg + favicon.ico
  ├── 城市函数注入安全头（CSP/HSTS/X-Frame等）
  └── 城市模板加入 GA4 代码

P1（本周）：
  ├── 城市模板加入 og:image
  ├── 城市模板加入 Sentry
  ├── _headers Cache-Control 去重
  ├── 扩展 sitemap.xml
  └── OG 函数加 HEAD 支持

P2（择时）：
  ├── 去重 X-Content-Type-Options
  ├── 清理 Stripe webhook 路由
  └── 预留 CSP Stripe 域名
```
