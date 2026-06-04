# Firefox 扩展提交指南 — GlobeTimeZone

## 扩展概述

- **名称**：GlobeTimeZone - World Time Converter
- **版本**：1.0.0
- **描述**：Free time zone converter with live world clock
- **权限**：仅 storage（存储用户城市偏好）
- **Manifest**：V3（Firefox 109+）

---

## 提交步骤

### 1. 打包扩展
```bash
cd extension/
zip -r ../globetimezone-firefox-1.0.0.zip . \
  -x "*.md" ".git/*" ".DS_Store"
```

### 2. 登录 Firefox Add-ons
1. 访问 https://addons.mozilla.org/developers/
2. 登录或创建 Firefox 账号
3. 点击 "Submit a New Add-on"

### 3. 上传文件
- 选择 "On your own" 分发方式
- 上传 `globetimezone-firefox-1.0.0.zip`
- 等待自动验证（通常 1-2 分钟）

### 4. 填写商店信息
| 字段 | 内容 |
|------|------|
| **Name** | GlobeTimeZone - World Time Converter |
| **Summary** | Free time zone converter. Compare time across cities, auto DST detection. |
| **Description** | [见下方详情] |
| **Category** | Productivity / Travel |
| **Homepage** | https://globetimezone.com |
| **Support Email** | support@globetimezone.com |
| **License** | MIT License |
| **Screenshots** | 添加扩展截图 (1280x800) |

### 5. 隐私声明
```
This extension does not collect, transmit, or share any personal data. 
It only stores user-configured city preferences locally using Firefox's 
built-in storage API. No data is ever sent to external servers.
```

### 6. 审核时间
- 首次提交：通常 1-3 个工作日
- 后续更新：通常 24 小时内

---

## 商店描述（英文）

```
GlobeTimeZone brings instant time zone conversion to your Firefox toolbar.

Features:
• Live world clock for your favorite cities
• Add up to 8 cities for quick comparison
• Automatic daylight saving time detection
• Clean, minimal interface with dark mode support
• Zero data collection — your preferences stay on your device

Click any city time to open the full GlobeTimeZone converter for 
meeting scheduling, multi-city comparison, and calendar export.

100% free. No ads. No signup. No tracking.
```

---

## 版本历史

### v1.0.0 (2026-05-21)
- Initial release
- 16 default cities
- DST auto-detection
- Dark mode support
- Local storage for city preferences
