# GlobeTimeZone 每日社交媒体帖子生成与发布 - 执行记录

## 最后执行时间
2026-06-08 08:29 GMT+8

## 功能状态
- ✅ 帖子生成：正常工作
- ⚠️ 自动发布：API 凭据未配置（优雅降级，仅生成不发布）
- ✅ 历史记录：自动保存，90天自动裁剪
- ✅ 城市轮换：按天自动切换城市组（global/us-eu/apac）
- ✅ Bug 修复：runDailyMode() 中缺少 todayPost 变量定义已修复
- ✅ 脚本修复：twitter-bot.js 重命名为 twitter-bot.cjs 以兼容 "type": "module" 项目

## 自动发布配置
脚本已升级，支持 `--publish` 参数自动发布到 Twitter/X 和 LinkedIn。
需要用户在 `.env` 文件中配置 API 凭据后才能真正发布。

### 脚本用法
- `node scripts/twitter-bot.cjs` — 仅生成，不发布
- `node scripts/twitter-bot.cjs --publish` — 生成 + 发布
- `node scripts/twitter-bot.cjs --dry-run --publish` — 生成 + 模拟发布（测试用）
- `node scripts/twitter-bot.cjs --platform twitter` — 仅发布到 Twitter
- `node scripts/twitter-bot.cjs --platform linkedin` — 仅发布到 LinkedIn

## 最近执行记录
| 日期 | 城市组 | 发布状态 |
|------|--------|----------|
| 2026-06-08 | apac | 生成成功，凭据未配置 |
| 2026-06-07 | us-eu | 生成成功，凭据未配置 |
| 2026-06-06 | apac | 生成成功，凭据未配置 |
| 2026-06-04 | global | 生成成功，凭据未配置 |
| 2026-06-03 | global | 生成成功，凭据未配置 |
| 2026-06-01 | global | 生成成功，凭据未配置 |
| 2026-05-31 | apac | 生成成功，凭据未配置 |
| 2026-05-30 | apac | 生成成功，凭据未配置 |
| 2026-05-29 | us-eu | 生成成功，凭据未配置 |
| 2026-05-28 | apac | 生成成功，凭据未配置 |
| 2026-05-27 | apac | 生成成功，凭据未配置 |
| 2026-05-26 | us-eu | 生成成功，凭据未配置 |
| 2026-05-25 | apac | 生成成功，凭据未配置 |
| 2026-05-24 | apac | 生成成功，凭据未配置 |
| 2026-05-23 | - | 脚本错误（todayPost未定义） |

## 今日帖子内容 (2026-06-08)
**城市组**: apac
**时间戳**: 2026-06-08T00:29:51.487Z

**帖子文案**:
```
🕐 What time is it for your team right now?

🇨🇳 Beijing 08:29 AM | 🗼 Tokyo 09:29 AM | 🇸🇬 Singapore 08:29 AM | 🇦🇺 Sydney 10:29 AM

See all time zones instantly → https://globetimezone.com
```

**字符数**: 193

## 发布结果
- **Twitter**: ⚠️ 缺少凭据 (TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET)
- **LinkedIn**: ⚠️ 缺少凭据 (LINKEDIN_ACCESS_TOKEN)
- **状态**: 优雅降级，仅生成帖子不发布

## 历史记录
- social-posts.json 当前包含 17 条历史记录
- 自动维护最近90天记录

## 依赖
- twitter-api-v2 (npm)

## 备注
- 每日自动任务正常运行
- 缺少凭据时脚本会优雅降级（仅生成不发布，输出警告）
- social-posts.json 自动维护最近90天记录
- 下次城市组轮换：us-eu (2026-06-09)
- 路径问题已解决：脚本已重命名为 .cjs 扩展名以兼容 ES module 项目
