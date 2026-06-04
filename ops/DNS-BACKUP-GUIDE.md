# DNS 配置备份指南

## 方案一：Cloudflare Dashboard 导出

1. Cloudflare Dashboard → 选择域名 `globetimezone.com`
2. **DNS** → **Records**
3. 点击右上角 **Export** → 下载 BIND 格式
4. 将导出的文件保存为 `ops/dns-records.txt` 并提交到 Git

## 方案二：Cloudflare API 导出脚本

```bash
#!/bin/bash
# ops/export-dns.sh
# 使用 Cloudflare API 导出所有 DNS 记录

ZONE_ID="YOUR_CLOUDFLARE_ZONE_ID"
API_TOKEN="YOUR_CLOUDFLARE_API_TOKEN"
OUTPUT="ops/dns-records-$(date +%Y%m%d).json"

curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?per_page=500" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  | python3 -m json.tool > "${OUTPUT}"

echo "DNS 记录已导出至: ${OUTPUT}"
```

## 方案三：定期自动备份（推荐）

将以下内容加入 `ops/backup-config.sh`:

```bash
# DNS 备份
if [ -n "${CF_API_TOKEN:-}" ] && [ -n "${CF_ZONE_ID:-}" ]; then
    curl -s "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records?per_page=500" \
      -H "Authorization: Bearer ${CF_API_TOKEN}" \
      -H "Content-Type: application/json" \
      > "${BACKUP_DIR}/dns-records.json"
fi
```

## 关键 DNS 记录清单（供手动检查）

| 类型 | 名称 | 内容 | TTL | 代理 |
|-----|------|------|-----|------|
| A | @ | 源站IP | Auto | ✅ |
| CNAME | www | globetimezone.com | Auto | ✅ |
| MX | @ | 邮件服务器 | Auto | ❌ |
| TXT | @ | SPF 记录 | Auto | ❌ |
| CNAME | _domainkey | DKIM | Auto | ❌ |

---

文档版本：v1.0 | 2026-05-26
