# SEO 提交流程指南

> GlobeTimeZone.com - 让搜索引擎尽快发现网站

---

## 📍 目录

1. [Bing Webmaster Tools 提交](#1-bing-webmaster-tools-提交)
2. [Google Search Console 提交](#2-google-search-console-提交)
3. [Google AdSense 申请](#3-google-adsense-申请)
4. [检查清单](#4-检查清单)

---

## 1. Bing Webmaster Tools 提交

> ✅ 国内可直接访问，无需代理

### 步骤 1.1：注册/登录 Bing Webmaster Tools

1. 访问 **https://www.bing.com/webmasters**
2. 使用 Microsoft/Outlook 账户登录（或注册新账户）
3. 点击 **"添加网站"**
4. 输入 `globetimezone.com`
5. 选择验证方式（推荐 **HTML 文件验证**）

### 步骤 1.2：验证网站所有权

**方式 A：HTML 文件验证（推荐）**
- 选择"验证方法"中的"HTML 文件"
- 下载验证文件（通常是 `BingSiteAuth.html`）
- 将文件上传到网站根目录：`https://globetimezone.com/BingSiteAuth.html`
- 点击"验证"

**方式 B：CNAME 验证**
- 添加 DNS CNAME 记录（需要 Cloudflare/域名后台操作）

### 步骤 1.3：获取 API Key

1. 验证通过后，进入 **"设置" (Settings)**
2. 点击 **"API Access"**
3. 复制您的 **API Key**（形如：`XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`）

### 步骤 1.4：运行提交脚本

```bash
cd C:\Users\ASUS\WorkBuddy\Claw\globetimezone

python submit_sitemap.py "您的API_KEY"
```

**脚本会自动：**
- 提交 sitemap.xml
- 批量提交 25+ 重要页面 URL
- 获取当前索引统计

### 手动提交（备用）

如果 API 不可用，可手动提交：
1. Bing Webmaster Tools 面板 → **"Sitemaps"**
2. 在输入框输入：`https://globetimezone.com/sitemap.xml`
3. 点击 **"Submit"**

---

## 2. Google Search Console 提交

> ⚠️ 国内需要代理/VPN 才能访问

### 前提条件
- 可访问 Google（代理/VPN）
- Google 账户

### 步骤 2.1：添加网站

1. 打开代理，访问 **https://search.google.com/search-console**
2. 点击 **"添加资源"**
3. 选择 **"网址前缀"**
4. 输入：`https://globetimezone.com`
5. 点击 **"继续"**

### 步骤 2.2：验证所有权

**推荐：HTML 文件验证**
1. 下载验证文件 `google-site-verification.html`
2. 上传到网站根目录
3. 点击"验证"

> 💡 或者直接在 Cloudflare Pages 上传验证文件

### 步骤 2.3：提交 sitemap

1. 左侧菜单 → **"网站地图"**
2. 在"添加网站地图"输入框输入：`sitemap.xml`
3. 点击 **"提交"**
4. 等待 24-48 小时，查看「已发现的网址」数量

### 步骤 2.4：请求编入索引（加速）

1. GSC → **"检查网址"**
2. 输入：`https://globetimezone.com`
3. 点击 **"请求编入索引"**
4. 重复检查其他重要页面

---

## 3. Google AdSense 申请

> ⚠️ 国内需要代理/VPN，审核通常 1-14 天

### 步骤 3.1：确认网站准备就绪

**✅ 前置检查清单：**

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 网站可访问 | ✅ | globetimezone.com 已上线 |
| 隐私政策页 | ✅ | `/pages/privacy.html` 已存在 |
| 联系页面 | ✅ | `/pages/contact.html` 已存在 |
| 关于页面 | ✅ | `/pages/about.html` 已存在 |
| 免责声明 | ✅ | `/pages/disclaimer.html` 已存在 |
| 内容原创 | ✅ | 所有内容为原创 |
| 无违规内容 | ✅ | 无赌博/色情/仿牌 |

### 步骤 3.2：申请 AdSense

1. **打开代理**，访问 **https://www.google.com/adsense**
2. 点击 **"开始使用"** 或 **"注册"**
3. 登录 Google 账户
4. 填写信息：
   - **网站 URL**: `https://globetimezone.com`
   - **网站语言**: English
   - **收款人**: 真实姓名（拼音）
   - **国家/地区**: 选择您的所在国

5. 阅读并同意 **AdSense 条款**

### 步骤 3.3：等待审核

- **审核时间**：通常 1-14 天
- **审核内容**：
  - 网站内容是否原创
  - 是否符合 AdSense 政策
  - 网站是否可正常访问
  - 是否有必要的法律页面

- **审核期间**：
  - 不要修改网站结构
  - 保持网站正常访问
  - 不要添加违规内容

### 步骤 3.4：获取广告代码并部署

审核通过后：

1. AdSense 面板 → **"广告"** → **"获取广告代码"**
2. 复制 `<script>` 代码
3. 将代码添加到网站（我会帮您部署）

**我需要您提供：**
- AdSense 审核通过的 `ca-pub-XXXXXXXX` Publisher ID

---

## 4. 检查清单

### ✅ 已完成

- [x] 网站上线 (globetimezone.com)
- [x] sitemap.xml 生成并可访问
- [x] robots.txt 配置正确
- [x] 多语言页面 (9种语言)
- [x] 隐私政策页 (privacy.html)
- [x] 联系页面 (contact.html)
- [x] 关于页面 (about.html)
- [x] 免责声明 (disclaimer.html)
- [x] Bing Webmaster 验证标签（已植入）

### ⏳ 待完成

- [ ] Bing Webmaster Tools 注册 + API Key 获取
- [ ] 运行 `submit_sitemap.py` 提交 sitemap
- [ ] Google Search Console 注册 + sitemap 提交（需代理）
- [ ] Google AdSense 申请（需代理）

---

## 📞 需要帮助？

如果您在操作过程中遇到任何问题，请告诉我：
1. 您卡在哪一步？
2. 遇到了什么错误信息？

我会帮您解决！

---

**更新日期**: 2026-05-15
