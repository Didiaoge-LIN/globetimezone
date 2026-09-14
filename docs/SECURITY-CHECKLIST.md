# GlobeTimeZone 安全加固验证清单

执行日期：2026-05-25 | 依据：安全加固实施手册 v1.0

## ✅ 阶段1：安全响应头 (已完成)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| HSTS | ✅ | max-age=31536000; includeSubDomains; preload |
| X-Content-Type-Options | ✅ | nosniff |
| X-Frame-Options | ✅ | DENY（全局）/ ALLOW（/widget/*） |
| Referrer-Policy | ✅ | strict-origin-when-cross-origin |
| Permissions-Policy | ✅ | camera/microphone/geolocation 禁用 |
| CSP | ✅ | 含 frame-ancestors/base-uri/form-action/upgrade-insecure-requests |
| CSP report-uri | ✅ | /csp-report（Function 已创建） |

### CSP 策略摘要
```
default-src 'self'
script-src 'self' 'unsafe-inline' + Google/Firebase/CDN 白名单
style-src 'self' 'unsafe-inline' + CDN
img-src 'self' data: https:
connect-src 'self' + GA/Firebase/Sentry/Cloudflare
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
upgrade-insecure-requests
```

## ✅ 阶段2：安全巩固 (已完成)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| external link rel | ✅ | 6/6 target="_blank" 链接已添加 rel="noopener noreferrer" |
| Cookie 安全 | ✅ | 站点使用 localStorage（非HTTP Cookie），无需加固 |
| 表单 action | ✅ | 全部为相对路径或 #（自引用） |
| 无敏感字段 | ✅ | 无 password/credit card 字段 |

## ✅ 阶段3：监控与验证 (已完成)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| CSP 报告端点 | ✅ | functions/csp-report.js 已创建 |
| eval() 使用 | ✅ | 0 处使用 |
| innerHTML XSS | ⚠️ | 13 处使用（模板字面量，内容可控） |
| onclick 内联 | ⚠️ | 255 处（需 'unsafe-inline'，阶段4优化） |

## 📋 阶段4：长期优化（待后续）

- 255 个 onclick 事件处理 → 提取为外部 JS + addEventListener
- 13 处 innerHTML → 改用 textContent 或 DOM API
- 移除 CSP 中的 'unsafe-inline' → 使用 nonce 机制

## 🔧 用户需手动操作

由于 Cloudflare Dashboard 暂时无法访问，以下操作需在恢复访问后执行：

1. 上传新的 `_headers` + `functions/` 到 Cloudflare Pages
2. Cloudflare Dashboard → SSL/TLS → 开启 Always Use HTTPS
3. Cloudflare Dashboard → SSL/TLS → 开启 Automatic HTTPS Rewrites
4. 可选：访问 https://hstspreload.org 提交 HSTS preload
5. 在线验证：https://securityheaders.com 扫描 globetimezone.com

## 📊 修改文件清单

| 文件 | 变更 |
|------|------|
| `_headers` | 更新安全头，添加 frame-ancestors/base-uri/form-action/upgrade-insecure-requests/report-uri |
| `extension/popup.html` | 3 处 target="_blank" 添加 rel="noopener noreferrer" |
| `extension-chrome/popup.html` | 3 处 target="_blank" 添加 rel="noopener noreferrer" |
| `functions/csp-report.js` | 新建 CSP 违规报告端点 |
