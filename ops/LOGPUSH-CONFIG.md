# Cloudflare Logpush & Worker 日志配置指南

## 2.1 Cloudflare Logpush（推荐）

### 启用步骤
1. Cloudflare Dashboard → **Analytics & Logs** → **Logs** → **Logpush**
2. 点击 **Connect a service**
3. 选择目标存储：

| 目标 | 用途 | 成本 |
|------|------|------|
| R2 | Cloudflare 自有存储，无出口费 | 免费层 10GB |
| Google Cloud Storage | GCP 生态集成 | 按量计费 |
| Datadog | APM 平台 | 按量计费 |

### 推荐配置（使用 R2）
```bash
# 1. 创建 R2 存储桶
# Cloudflare Dashboard → R2 → Create Bucket
# Bucket name: globetimezone-logs

# 2. 创建 Logpush Job
# 数据集: HTTP Requests
# 目标: R2 → globetimezone-logs
# 推送频率: 按计划（免费）/ 实时（Pro+）
# 保留字段: 全量默认
```

### 字段清单（关键字段）
```
ClientIP, ClientRequestHost, ClientRequestURI,
EdgeResponseStatus, OriginResponseStatus,
CacheStatus, ClientSSLProtocol,
ClientRequestUserAgent, ClientCountry,
EdgeStartTimestamp, EdgeResponseTime
```

---

## 2.2 简易 Worker 日志至 GA4

### 配置 Worker 日志
在 Cloudflare Worker 中添加：

```javascript
// 在 Worker 脚本中
async function logToGA(event, request) {
  const MEASUREMENT_ID = 'G-XXXXXXXXXX';      // 从 GA4 获取
  const API_SECRET = 'your-ga4-api-secret';   // GA4 → 数据流 → 测量协议 API 密钥

  const payload = {
    client_id: request.headers.get('CF-Connecting-IP') || 'unknown',
    events: [{
      name: 'worker_event',
      params: {
        event_type: event.type || 'info',
        url: request.url,
        country: request.cf?.country || 'XX',
        status: event.status || 0,
      }
    }]
  };

  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  ).catch(() => {}); // 静默失败
}
```

---

## 2.3 源站 Nginx 日志配置

配置文件已包含: `ops/nginx-logformat.conf`

### JSON 格式示例输出
```json
{
  "time":"2026-05-26T14:30:00+08:00",
  "remote_addr":"1.2.3.4",
  "host":"globetimezone.com",
  "request":"GET / HTTP/2.0",
  "status":200,
  "body_bytes_sent":12345,
  "http_referer":"https://google.com/",
  "http_user_agent":"Mozilla/5.0...",
  "request_time":0.123,
  "upstream_response_time":"0.100",
  "ssl_protocol":"TLSv1.3",
  "request_method":"GET",
  "scheme":"https"
}
```

### 日志轮转
```bash
# 创建: /etc/logrotate.d/nginx-globetimezone
/var/log/nginx/globetimezone.access.log
/var/log/nginx/globetimezone.error.log {
    daily
    rotate 30
    missingok
    notifempty
    compress
    delaycompress
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 $(cat /var/run/nginx.pid)
    endscript
}
```

---

## 实施检查清单
- [ ] 创建 R2 存储桶
- [ ] 配置 Logpush → R2
- [ ] Nginx JSON 日志格式已启用
- [ ] 日志轮转已配置
- [ ] GA4 Worker 错误日志（如有 Worker）

文档版本：v1.0 | 2026-05-26
