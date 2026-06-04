#!/bin/bash
echo "检查 Node.js 版本..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "需要 Node.js >= 18，当前版本：$(node -v)"
  exit 1
fi
echo "检查 wrangler..."
if ! command -v wrangler &> /dev/null; then
  echo "请安装 wrangler: npm install -g wrangler"
  exit 1
fi
echo "检查 Cloudflare API 访问..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.cloudflare.com/client/v4/user/tokens/verify -H "Authorization: Bearer $CF_API_TOKEN")
if [ "$HTTP_CODE" != "200" ]; then
  echo "无法访问 Cloudflare API，请检查 CF_API_TOKEN 和网络代理设置。"
  exit 1
fi
echo "环境检查通过。"
