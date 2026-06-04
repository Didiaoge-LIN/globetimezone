# Sentry 前端错误监控集成指南

## 快速配置

### 步骤 1：注册 Sentry
1. 访问 https://sentry.io/signup/ → 注册（免费计划：5K events/month）
2. Create Project → Platform: **Browser**
3. 复制 DSN URL

### 步骤 2：修改 js/sentry.js
找到文件末尾的:
```javascript
const SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';
const SENTRY_ENABLED = false;
```

替换为你的实际 DSN 并启用:
```javascript
const SENTRY_DSN = 'YOUR_ACTUAL_SENTRY_DSN_HERE';
const SENTRY_ENABLED = true;
```

### 步骤 3：已内置的 SENTRY SDK 加载
```html
<!-- 在 index.html 和其他页面中加载 -->
<script src="/js/sentry.min.js" defer></script>
```

### 步骤 4：验证集成
```bash
# 在浏览器控制台执行
throw new Error('Sentry test error');
```
检查 Sentry Dashboard → Issues 是否收到错误。

---

## Sentry 仪表板配置

### 告警规则
```
Create Alert Rule:
  Name: GlobeTimeZone 前端异常
  Conditions: 
    - 事件数量 ≥ 10 / 1小时
    - 或 新异常首次出现
  Actions:
    - Send Slack notification
    - Send Email notification
```

### Issue 过滤（已在 sentry.js 中实现）
- 自动过滤浏览器扩展错误（chrome-extension, moz-extension）
- 开发环境错误不上报
- 只上报生产环境

### 性能监控扩展
```javascript
Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 0.2,         // 20% 事务采样
  replaysSessionSampleRate: 0.1, // 10% 回放
  replaysOnErrorSampleRate: 1.0, // 错误时 100% 回放
});
```

---

## GA4 备选方案（已在 monitoring.js 中集成）

如果不使用 Sentry，JavaScript 错误会通过 `gtag('event', 'exception')` 发送至 GA4：
- GA4 → 报告 → 参与度 → 事件
- 查找 `exception` 事件即可查看前端错误

### GA4 自定义报告配置
```
创建探索报告:
  - 维度: 事件名称, 页面位置
  - 指标: 事件数
  - 筛选: 事件名称 = exception
```

---

## 注意事项
- Sentry 免费计划: 5,000 events/month（小型网站足够）
- 需手动设置 DSN（免费注册后获取）
- 支持 Git 版本追踪（自动关联 release）

文档版本：v1.0 | 2026-05-26
