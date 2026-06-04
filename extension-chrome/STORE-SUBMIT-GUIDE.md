# Chrome Web Store 提交指南

## 扩展包
- 文件: `globetimezone-chrome-1.0.0.zip`
- Manifest: V3
- 权限: storage (仅本地存储城市偏好)

## 提交步骤

### 1. 访问 Chrome Web Store Developer Dashboard
https://chrome.google.com/webstore/devconsole

### 2. 支付注册费 ($5 USD 一次性)
- 需要 Google 账号
- 支付后永久有效

### 3. 上传扩展包
- 点击 "New Item"
- 上传 `globetimezone-chrome-1.0.0.zip`
- 等待自动验证

### 4. 填写商店信息

| 字段 | 内容 |
|------|------|
| **Name** | GlobeTimeZone - World Time Converter |
| **Summary** | Free time zone converter with live world clock. Compare multiple cities instantly. |
| **Description** | [见下方] |
| **Category** | Productivity |
| **Language** | English |
| **Homepage** | https://globetimezone.com |
| **Support** | support@globetimezone.com |

### 5. 描述 (Store Description)

```
GlobeTimeZone brings instant time zone conversion to your Chrome toolbar.

Features:
• Live world clock — see current time for your favorite cities
• Add up to 8 cities for quick comparison
• Automatic daylight saving time (DST) detection
• Clean, minimal interface with dark mode support
• One-click access to full converter, meeting scheduler, and team panel
• Zero data collection — your preferences stay on your device

Perfect for:
✓ Remote teams working across time zones
✓ Freelancers managing international clients
✓ Travelers tracking home time
✓ Anyone who needs to know "what time is it there?"

100% free. No ads. No signup. No tracking.

Feedback? We'd love to hear from you at support@globetimezone.com
```

### 6. 截图要求
- 至少1张截图 (1280×800 或 640×400)
- 建议3-5张展示不同功能
- 截图内容建议:
  1. Popup视图 (显示4个城市时间)
  2. 暗色模式
  3. 添加城市下拉菜单

### 7. 隐私声明
```
Single purpose: This extension displays current time across multiple time zones.

Data collection: This extension does NOT collect, transmit, or share any 
personal or sensitive user data. City preferences are stored locally using 
Chrome's storage API and never leave your device.

No analytics, no tracking, no third-party code.
```

### 8. 审核时间
- 首次提交: 1-3 个工作日
- 后续更新: 通常 24 小时内

### 9. 发布后
- 在 GlobeTimeZone 网站添加 "Available on Chrome Web Store" 徽章
- 在 Product Hunt 发布时提及扩展
- 在 Reddit 帖子中引用扩展链接
