# Google Search Console - 提交 Sitemap 与索引监控指南

## GlobeTimeZone.com

> 更新时间：2026-05-22  
> 站点：https://globetimezone.com  
> GSC 属性：sc-domain:globetimezone.com

---

## 一、首次提交 Sitemap（推荐：手动操作）

### 步骤

1. 打开 [Google Search Console](https://search.google.com/search-console)
2. 选择属性 **`globetimezone.com`**
3. 左侧菜单 → **"索引"** → **"站点地图"**
4. 在「添加站点地图」输入框输入：
   ```
   sitemap.xml
   ```
   （完整 URL 为 `https://globetimezone.com/sitemap.xml`）
5. 点击 **"提交"**

### 成功标志

| 状态 | 含义 |
|------|------|
| ✅ 成功 | Google 已成功抓取站点地图 |
| ⚠️ 无法获取 | 检查 sitemap.xml 是否可访问 |
| ❌ 含有错误 | 点击详情查看具体错误 URL |

---

## 二、验证站点地图内容

提交前确认 sitemap.xml 可被 Google 访问：

```bash
# 测试访问
curl -I https://globetimezone.com/sitemap.xml
# 应返回 HTTP/1.1 200 OK

# 查看内容
curl https://globetimezone.com/sitemap.xml | head -50
```

**当前 sitemap.xml 统计：**
- 总 URL 数：**59 个**
- 格式：标准 XML Sitemap 0.9
- 包含：首页（8语言）、城市时间页（12个）、工具页、知识库文章

---

## 三、索引覆盖率监控

### 方法 A：GSC 后台定期查看（零配置）

每周登录 GSC 查看以下报告：

| 报告位置 | 查看内容 |
|---------|---------|
| 索引 > 页面索引报告 | 已索引 / 未索引页面数 |
| 索引 > 站点地图 | sitemap 处理状态 |
| 搜索效果 > 查询 | 展示次数、点击率 |
| 体验 > 核心 Web 指标 | PageSpeed 评分 |

### 方法 B：自动化监控（推荐）

使用项目中已创建的脚本：

```bash
# 1. 查看 GSC API 设置指南
python gsc_submit.py setup

# 2. 提交 sitemap（需 API token）
GSC_ACCESS_TOKEN=xxx python gsc_submit.py submit

# 3. 查看索引覆盖率
GSC_ACCESS_TOKEN=xxx python gsc_submit.py monitor

# 4. 无需 API：通过 Google 搜索检查收录情况
python gsc_submit.py check
```

### 方法 C：设置自动化定时任务

创建一个每天自动运行的监控任务：

```bash
# 编辑 crontab（Linux/macOS）
crontab -e

# 添加以下行（每天早上 9 点运行）
0 9 * * * python /path/to/globetimezone/gsc_submit.py check >> /tmp/gsc_monitor.log 2>&1
```

Windows 使用任务计划程序：
1. 打开「任务计划程序」
2. 创建基本任务 → 触发器：每日
3. 操作：启动程序 → python.exe + 脚本路径

---

## 四、GSC API 认证设置（用于自动化）

### 方式 1：OAuth2（推荐用于本地开发）

```bash
# 安装 Google 认证库
pip install google-auth-oauthlib

# 运行授权流程（会自动打开浏览器）
python -c "
from google_auth_oauthlib.flow import InstalledAppFlow
import json

SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
flow = InstalledAppFlow.from_client_secrets_file('client_secrets.json', SCOPES)
creds = flow.run_local_server(port=0)
print('ACCESS_TOKEN:', creds.token)
print('REFRESH_TOKEN:', creds.refresh_token)
"
```

### 方式 2：服务账号（推荐用于服务器）

1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目 → 启用 **Google Search Console API**
3. 创建服务账号 → 下载 JSON 密钥
4. 将服务账号邮箱添加为 GSC 属性用户
   - GSC → 设置 → 用户和权限 → 添加用户
5. 将 JSON 保存为 `~/.gsc_credentials.json`

---

## 五、索引问题排查

### 常见「未建立索引」原因

| 问题 | 解决方案 |
|------|---------|
| 被发现 - 当前未建立索引 | 等待，Google 会逐步建立索引 |
| 网址已提交，但网页无法访问 | 确认页面返回 HTTP 200 |
| 重复内容，用户未设置规范标记 | 检查 canonical 标签 |
| 网页被 robots.txt 屏蔽 | 检查 /robots.txt |
| 备用网页（有合适的规范网页） | 正常，hreflang 设置正确时会出现 |

### GlobeTimeZone 特定检查项

```bash
# 检查 canonical 标签是否正确
curl -s https://globetimezone.com/zh/ | grep -i canonical

# 检查 hreflang 是否正确
curl -s https://globetimezone.com/ | grep -i hreflang

# 检查 robots.txt
curl https://globetimezone.com/robots.txt
```

---

## 六、预期索引时间表

| 时间 | 预期状态 |
|------|---------|
| 提交后 0-3 天 | GSC 显示「已发现 - 尚未建立索引」 |
| 提交后 3-14 天 | 主要页面开始显示「已建立索引」 |
| 提交后 2-4 周 | 大部分页面完成索引 |
| 持续 | 新页面在 sitemap 更新后 1-2 周内被索引 |

---

## 七、提交历史记录

| 日期 | 操作 | 结果 |
|------|------|------|
| 2026-05-22 | 首次提交 sitemap.xml | 待确认 |
| | GA4 配置完成 (G-14921330046) | ✅ |
| | Cloudflare Pages 部署完成 | ✅ |
| | _redirects 301 规则生效 | ✅ |

---

## 八、相关链接

- GSC 后台：https://search.google.com/search-console?resource_id=sc-domain:globetimezone.com
- sitemap 地址：https://globetimezone.com/sitemap.xml
- robots.txt：https://globetimezone.com/robots.txt
- GA4 后台：https://analytics.google.com/ → GlobeTimeZone Web
- PageSpeed Insights：https://pagespeed.web.dev/report?url=https://globetimezone.com
