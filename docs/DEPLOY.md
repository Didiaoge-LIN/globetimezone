# GlobeTimeZone.com 部署指南

## 项目结构

```
globetimezone/
├── index.html              ← 主页（时区换算工具）
├── css/
│   └── style.css           ← 样式文件
├── js/
│   └── main.js             ← 功能逻辑
└── pages/
    ├── about.html           ← 关于我们
    ├── privacy.html         ← 隐私政策
    ├── disclaimer.html      ← 免责声明
    ├── articles.html        ← 文章列表
    └── us-china-time-difference.html ← 示例文章
```

## 部署步骤

### 第一步：上传到 GitHub

1. 打开 https://github.com
2. 点击右上角「+」→「New repository」
3. 仓库名称填：`globetimezone`
4. 选择「Public」
5. 点击「Create repository」
6. 按照页面指引上传文件（可用 GitHub Desktop 或网页拖拽上传）

### 第二步：在 Cloudflare Pages 部署

1. 打开 https://dash.cloudflare.com
2. 左侧菜单选「Workers & Pages」
3. 点击「Create application」→「Pages」→「Connect to Git」
4. 连接 GitHub 账号，选择 `globetimezone` 仓库
5. 构建设置全部留空（纯静态网站）
6. 点击「Save and Deploy」

### 第三步：绑定域名

1. 在 Namecheap 购买 globetimezone.com
2. 在 Cloudflare Pages 项目中点「Custom domains」
3. 填入 globetimezone.com
4. 按提示在 Namecheap DNS 中添加 CNAME 记录
5. 等待 5-30 分钟生效

### 第四步：申请 Google AdSense

1. 打开 https://adsense.google.com
2. 填写网站地址 globetimezone.com
3. 等待审核（通常 1-2 周）
4. 审核通过后替换 index.html 中的广告占位符代码
