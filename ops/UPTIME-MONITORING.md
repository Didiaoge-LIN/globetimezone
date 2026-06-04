# 可用性监控配置指南 - GlobeTimeZone

## 方案一：UptimeRobot（免费方案推荐）

### 注册与配置
1. 访问 https://uptimerobot.com → 注册免费账户
2. Dashboard → **+ Add New Monitor**
3. 配置参数：

```
Monitor Type:     HTTP(s)
Friendly Name:    GlobeTimeZone
URL:              https://globetimezone.com
Monitoring Interval: 5 minutes
Monitor Timeout:  30 seconds
```

4. 高级设置：
   - HTTP Method: GET
   - Expected Status Code: 200
   - SSL Expiry Reminder: 开启（提前 7/14/30 天通知）

### 告警联系人配置
```
Alert Contacts → Add Alert Contact:
  - Email: support@globetimezone.com
  - Slack: Webhook URL（见下方 Slack 配置）
```

### 监控关键词检测
在 Monitor 设置中添加 Keyword:
```
Keyword Type:   Present (存在)
Keyword Value:  GlobeTimeZone
```
如页面不含此关键词则触发宕机告警。

### 免费计划限制
- 50 个监控
- 5 分钟间隔
- 2 个月日志保留

---

## 方案二：Cloudflare Health Checks（可靠性更高）

### 前提条件
- Cloudflare Pro 及以上计划（$20/月）
- 或使用 Cloudflare 免费计划 + 外部监控

### 配置步骤
1. Cloudflare Dashboard → **Traffic** → **Health Checks**
2. Create Health Check:

```
Name:           GlobeTimeZone Origin
URL:            https://globetimezone.com
Check Frequency: 1 minute
Timeout:        5 seconds
Expected Code:  200
Failure Threshold: 3 consecutive failures
```

3. 配置通知：
```
Cloudflare Dashboard → Notifications → Create:
  Event Type: Health Checks status change
  Target: Slack Webhook（或 Email）
  Advanced: 启用失败恢复通知
```

### 配置状态页（可选）
Cloudflare 提供公开状态页：`https://status.globetimezone.com`

---

## 日常巡检清单
- [ ] 每周检查 UptimeRobot 历史报告
- [ ] 每月检查 SSL 证书到期时间
- [ ] 宕机时 5 分钟内响应
- [ ] 维护窗口前暂停监控

---

文档版本：v1.0 | 2026-05-26
