#!/bin/bash
if grep -rE "DSN.*=|API_KEY.*=|SECRET.*=|SIGNING_KEY.*=" --include="*.ts" --include="*.html" --include="*.toml" --include="*.js" . ; then
  echo "⚠️  发现疑似密钥明文！请使用 'wrangler secret put' 注入。"
  exit 1
fi
echo "密钥安全检查通过。"
