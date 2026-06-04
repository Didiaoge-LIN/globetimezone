# Slack Webhook 告警配置指南

## 创建 Slack Incoming Webhook

### 步骤 1：创建 Slack App
1. 访问 https://api.slack.com/apps → Create New App
2. 选择 "From scratch"
3. App Name: `GlobeTimeZone Monitor`
4. Workspace: 选择你的工作区

### 步骤 2：启用 Incoming Webhooks
1. 左侧菜单 → Incoming Webhooks
2. Activate Incoming Webhooks → ON
3. 点击 "Add New Webhook to Workspace"
4. 选择通知频道（建议 `#monitoring` 或 `#alerts`）
5. 复制 Webhook URL

### 步骤 3：自定义通知格式

#### Cloudflare 告警 Payload
```json
{
  "text": "⚠️ *GlobeTimeZone 监控告警*\n• 状态: {{STATUS}}\n• 时间: {{TIMESTAMP}}\n• 详情: {{DETAILS}}"
}
```

#### UptimeRobot Webhook 配置
```json
{
  "text": "⚠️ *globetimezone.com* 监控告警\n• 监控: {MONITOR_NAME}\n• 状态: {ALERT_STATUS}\n• 时间: {DATETIME}\n• 详情: {MONITOR_URL}"
}
```

#### Sentry 告警 Payload
```
标题: "GlobeTimeZone 前端错误告警"
触发条件: 1 小时内 ≥ 10 个错误事件
```

### 步骤 4：webhook URL 安全存储
```
Webhook URL 格式:
Webhook URL 格式示例:
  https://hooks.slack.com/services/TXXXXXX/BXXXXXX/XXXXXX...(省略)

⚠️ 不要提交到公开仓库！
存储方式: Cloudflare Dashboard → Workers → Environment Variables
或: GitHub → Settings → Secrets → SLACK_WEBHOOK_URL
```

---

## 告警规则建议

| 严重级别 | 触发条件 | 通知方式 |
|---------|---------|---------|
| 🔴 严重 | 网站完全不可达 ≥ 2 分钟 | Slack + Email |
| 🟠 警告 | 响应时间 > 3s | Slack |
| 🟡 提示 | SSL 证书 7 天内到期 | Slack |
| 🔵 恢复 | 服务恢复正常 | Slack（恢复通知） |

---

文档版本：v1.0 | 2026-05-26
