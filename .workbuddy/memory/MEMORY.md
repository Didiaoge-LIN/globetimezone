# GlobeTimeZone 项目长期记忆

## 社交媒体内容日历
- 自动化 ID: 1779460764882，每天14:00 CST触发
- 脚本: `node scripts/twitter-bot.cjs --from-calendar --publish`
- 日历: content-calendar.json，12篇帖子，覆盖4周(05-30 ~ 06-25)，每周3次(Tue/Thu/Sat)
- 双平台: Twitter + LinkedIn
- **🔴 凭据问题持续未解决**: .env 仅含 Cloudflare 凭据，缺少 Twitter OAuth 1.0a 四件套和 LinkedIn Access Token
- 累计积压: Post #1~#6 (6篇帖子未发布)，日历剩余 Post #7~#12
- 每次自动化执行都生成帖子内容但因凭据缺失无法发布

## 技术栈
- 纯 HTML/CSS/JS（无框架）
- Cloudflare Pages 部署
- GitHub Actions CI/CD