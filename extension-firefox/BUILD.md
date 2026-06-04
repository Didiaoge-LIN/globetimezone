# GlobeTimeZone Firefox Extension - Build Guide

## 快速构建

```bash
cd extension-firefox
npx web-ext build --overwrite-dest --artifacts-dir=../dist-firefox
```

输出: `../dist-firefox/globetimezone_-_world_time_converter-1.0.0.zip` (可直接改名为 .xpi)

## 本地测试

```bash
cd extension-firefox
npx web-ext run
```

这会在一个临时 Firefox 配置中启动扩展，热重载改动。

## 手动测试

1. 打开 Firefox → `about:debugging#/runtime/this-firefox`
2. 点击"临时载入附加组件"
3. 选择 `manifest.json` 或 `.xpi` 文件

## 提交到 Firefox Add-ons (AMO)

1. 访问 https://addons.mozilla.org/developers/
2. 提交 `.xpi` 文件
3. 等待审核（通常 24-72 小时）

## 清单要点

- **manifest_version**: 3 (Firefox ≥ 109 支持)
- **browser_specific_settings**: 已配置，ID = `extension@globetimezone.com`
- **权限**: 仅 `storage`（无 host_permissions）
- **API**: 使用 `browser.*` 命名空间（Firefox 原生）
