# Cloudflare Pages 部署配置指南

## 方案：直接连接 GitHub 仓库

### 步骤 1：连接仓库
1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages**
2. **Connect to Git** → 选择 GitHub 仓库
3. 选择 `globetimezone` 仓库

### 步骤 2：构建配置
```
Build configuration:
  Framework preset:   None (Static HTML)
  Build command:      npm run build
  Build output directory: ./
  Root directory:     /
```

### 步骤 3：环境变量
```
变量名                    值                        环境
GA_MEASUREMENT_ID       G-XXXXXXXXXX              Production
SENTRY_DSN              https://xxx@sentry.io/xx   Production
NODE_ENV                production                Production
```

### 步骤 4：自定义域名
1. Pages 项目 → **Custom domains**
2. 添加: `globetimezone.com` 和 `www.globetimezone.com`
3. Cloudflare 自动配置 DNS

---

## 方案对比

| 特性 | GitHub Actions + rsync | Cloudflare Pages |
|------|----------------------|------------------|
| 部署速度 | 30s-2min | 30s-1min |
| 服务器要求 | 需要 VPS | 无需服务器 |
| 免费额度 | GitHub Actions: 2000min/月 | 无限（500次构建/月） |
| SSL | 手动配置 | 自动 |
| 全球 CDN | 需配置 Cloudflare | 内置 |
| 回滚 | 手动操作 | 一键回滚 |
| **推荐度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 自动部署流程
```
Git Push → GitHub Actions / Cloudflare Pages
  ↓
构建/验证
  ↓
部署至服务器 / Pages
  ↓
清理 Cloudflare 缓存
  ↓
冒烟测试 (HTTP 200 检查)
  ↓
Slack 通知 (成功/失败)
```

文档版本：v1.0 | 2026-05-26
