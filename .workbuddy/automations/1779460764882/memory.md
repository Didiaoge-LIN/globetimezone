# GlobeTimeZone 双平台内容日历发布 — 执行记录

## 2026-05-29 (第1次执行)
- **状态**: 跳过（当日无排期内容）
- **原因**: 今天是周五，内容日历从周六(05-30)开始排期，频率为每周3次(Tue/Thu/Sat)
- **日历概况**: 共12篇帖子，覆盖4周(05-30 ~ 06-25)，双平台(Twitter + LinkedIn)
- **凭据状态**: .env 文件存在，但未验证具体凭据是否完整
- **下次执行**: 2026-05-30 周六 → Post #1「约错时间差点丢单」(scene-crash)

## 2026-05-30 (第2次执行)
- **状态**: 跳过（当日无排期内容）
- **原因**: 5月30日是周六，但内容日历中Post #1日期为2026-05-30。运行时脚本检测为"无排期"——需排查是时区偏差还是脚本日期解析问题。
- **凭据状态**: 仍未验证

## 2026-05-31 (第3次执行)
- **状态**: 跳过（当日无排期内容，符合预期）
- **日期**: 2026-05-31 周日
- **原因**: 内容日历排期为每周3次(Tue/Thu/Sat)，周日无排期内容
- **脚本执行**: `node scripts/twitter-bot.cjs --from-calendar --publish` 正常执行，输出 "No posts scheduled for 2026-05-31."
- **凭据状态**: ⚠️ .env 仅有 Cloudflare 凭据，缺少 Twitter (API Key/Secret/Access Token/Access Secret) 和 LinkedIn (Access Token/Person ID) 凭据。即使有排期内容也无法发布。
- **下次排期**: 2026-06-02 周二 → Post #2「怎么快速查时差」(tool-demo)
- **⚠️ 注意**: 2026-05-30(周六)的Post #1未发布，怀疑已被跳过。今天(周日)无排期属于正常。需确认周六那天的执行是否也跳过了Post #1（可能是自动化未触发或时区问题）。

## 2026-06-01 (第4次执行)
- **状态**: 跳过（当日无排期内容，符合预期）
- **日期**: 2026-06-01 周一
- **原因**: 内容日历排期为每周3次(Tue/Thu/Sat)，周一无排期
- **脚本执行**: `node scripts/twitter-bot.cjs --from-calendar --publish` 正常，输出 "No posts scheduled for 2026-06-01."
- **下次排期**: 2026-06-02 周二 → Post #2「怎么快速查时差」(tool-demo)
- **⚠️ 遗留问题**: Post #1 (2026-05-30周六) 仍未发布。脚本在5月30日执行时报"无排期"，需排查是脚本日期匹配 bug 还是执行时间早于 publishTime(14:00)导致的。建议6月2日执行前检查脚本的日期比较逻辑。

## 2026-06-02 (第5次执行)
- **状态**: 帖子已生成，因缺少凭据未发布到平台
- **日期**: 2026-06-02 周二，执行时间 23:22 CST（自动化触发时间晚于排期的14:00）
- **当日排期**: Post #2「怎么快速查时差」(tool-demo)
- **Twitter 帖子**: 126字符，含 #Productivity #Timezone #RemoteTeams 标签
- **LinkedIn 帖子**: 204字符，亮点清单式长文
- **发布结果**: 双平台均 FAIL — missing_credentials
  - Twitter: 缺少 TWITTER_API_KEY / TWITTER_API_SECRET / TWITTER_ACCESS_TOKEN / TWITTER_ACCESS_SECRET
  - LinkedIn: 缺少 LINKEDIN_ACCESS_TOKEN
- **Post #1 跟进**: 用 `--date 2026-05-30` 手动测试确认 Post #1 日期匹配正常，可发布。5月30日执行失败原因大概率是自动化未在当日14:00触发，而非脚本日期解析bug。
- **凭据状态**: ⚠️ .env 仅含 Cloudflare 凭据。Twitter 需 OAuth 1.0a 四件套，LinkedIn 需 OAuth 2.0 Access Token。配置后两个帖子(Post #1 + Post #2)均可补发。
- **下次排期**: 2026-06-04 周四 → Post #3「时差换算草稿」(interactive)

## 2026-06-04 (第6次执行)
- **状态**: 跳过（当日无自动化触发记录，可能自动化未在当日14:00执行）
- **日期**: 2026-06-04 周四
- **排期内容**: Post #3「时差换算草稿」(interactive)
- **⚠️ 注意**: Post #3 未执行/未发布，属于自动化漏触发

## 2026-06-06 (第7次执行)
- **状态**: 帖子已生成，因缺少凭据未发布到平台
- **日期**: 2026-06-06 周六，执行时间 19:25 CST
- **当日排期**: Post #4「远程团队定会议时间」(scene-crash)
- **Twitter 帖子**: 133字符，含 #RemoteTeam #Timezone #Leadership 标签
- **LinkedIn 帖子**: 199字符，场景叙事式长文
- **发布结果**: 双平台均 FAIL — missing_credentials
  - Twitter: 缺少 TWITTER_API_KEY / TWITTER_API_SECRET / TWITTER_ACCESS_TOKEN / TWITTER_ACCESS_SECRET
  - LinkedIn: 缺少 LINKEDIN_ACCESS_TOKEN
- **凭据状态**: ⚠️ 仍未配置。累计已生成但未发布帖子：Post #1, #2, #3, #4
- **下次排期**: 2026-06-09 周二 → Post #5「墨西哥亡灵节踩坑」(tool-demo)
- **🔴 关键提醒**: 凭据问题已持续8天（5/31起），4篇帖子积压未发。DIAO总需尽快配置 Twitter OAuth 1.0a + LinkedIn OAuth 2.0 凭据到 .env 文件

## 2026-06-08 (第8次执行)
- **状态**: 跳过（当日无排期内容，符合预期）
- **日期**: 2026-06-08 周一
- **原因**: 内容日历排期为每周3次(Tue/Thu/Sat)，周一无排期
- **脚本执行**: `node scripts/twitter-bot.cjs --from-calendar --publish` 正常，输出 "No posts scheduled for 2026-06-08."
- **凭据状态**: ⚠️ 仍未配置。累计积压 Post #1~#4
- **下次排期**: 2026-06-09 周二 → Post #5「墨西哥亡灵节踩坑」(tool-demo)
- **🔴 关键提醒**: 凭据问题已持续14天（5/31起），4篇帖子积压。明天(周二)有排期内容，如凭据仍未配置将继续 FAIL

## 2026-06-09 (第9次执行)
- **状态**: 帖子已生成，因缺少凭据未发布到平台
- **日期**: 2026-06-09 周二
- **当日排期**: Post #5「墨西哥亡灵节踩坑」(tool-demo)
- **Twitter 帖子**: 131字符，含 #GlobalBusiness #CrossBorder #Fail 标签
- **LinkedIn 帖子**: 162字符，场景叙事式长文
- **发布结果**: 双平台均 FAIL — missing_credentials
  - Twitter: 缺少 TWITTER_API_KEY / TWITTER_API_SECRET / TWITTER_ACCESS_TOKEN / TWITTER_ACCESS_SECRET
  - LinkedIn: 缺少 LINKEDIN_ACCESS_TOKEN
- **凭据状态**: ⚠️ 仍未配置。累计积压 Post #1~#5（5篇帖子）
- **下次排期**: 2026-06-11 周四 → Post #6「加几个城市试试」(interactive)
- **🔴 关键提醒**: 凭据问题已持续15天（5/31起），5篇帖子积压未发

## 2026-06-11 (第10次执行)
- **状态**: 帖子已生成，因缺少凭据未发布到平台
- **日期**: 2026-06-11 周四，执行时间 14:02 CST
- **当日排期**: Post #6「加几个城市试试」(interactive)
- **Twitter 帖子**: 109字符，含 #Productivity #RemoteWork #Tip 标签
- **LinkedIn 帖子**: 140字符，具体建议式长文
- **发布结果**: 双平台均 FAIL — missing_credentials
  - Twitter: 缺少 TWITTER_API_KEY / TWITTER_API_SECRET / TWITTER_ACCESS_TOKEN / TWITTER_ACCESS_SECRET
  - LinkedIn: 缺少 LINKEDIN_ACCESS_TOKEN
- **凭据状态**: ⚠️ 仍未配置。累计积压 Post #1~#6（6篇帖子）
- **下次排期**: 2026-06-13 周六 → Post #7「免费时区API」(dev-tech)
- **🔴 关键提醒**: 凭据问题已持续17天（5/31起），6篇帖子积压未发。日历仅剩 Post #7~#12（6篇），如凭据继续未配置，全部帖子将积压至过期

## 2026-06-13 (第11次执行)
- **状态**: 帖子已生成，因缺少凭据未发布到平台
- **日期**: 2026-06-13 周六，执行时间 19:30 CST
- **当日排期**: Post #7「免费时区API」(dev-tech)
- **Twitter 帖子**: 125字符，含 #Developers #API #Timezone #WebDev 标签
- **LinkedIn 帖子**: 197字符，开发者向长文，介绍免费API+嵌入式时钟组件
- **发布结果**: 双平台均 FAIL — missing_credentials
  - Twitter: 缺少 TWITTER_API_KEY / TWITTER_API_SECRET / TWITTER_ACCESS_TOKEN / TWITTER_ACCESS_SECRET
  - LinkedIn: 缺少 LINKEDIN_ACCESS_TOKEN
- **凭据状态**: ⚠️ 仍未配置。累计积压 Post #1~#7（7篇帖子）
- **下次排期**: 2026-06-16 周二 → Post #8「嵌入式时钟组件」(dev-tech)
- **🔴 关键提醒**: 凭据问题已持续19天（5/31起），7篇帖子积压未发。日历仅剩 Post #8~#12（5篇，至6/25）
