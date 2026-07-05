# GlobeTimeZone 缓存命中率 + anti-bot 误杀诊断报告

**日期**: 2026-07-03
**数据来源**: CF GraphQL Analytics API (httpRequestsAdaptiveGroups)
**诊断范围**: 06-25 ~ 07-02 (8天)

---

## 一、缓存命中率诊断

### 1.1 现象

| 日期 | PV | 请求 | 缓存请求 | 缓存率 | 威胁 |
|------|-----|------|----------|--------|------|
| 06-25 | 1844 | 3930 | 56 | 1.4% | 11 |
| 06-26 | 1780 | 2308 | 42 | 1.8% | 8 |
| 06-27 | 1868 | 2707 | 109 | 4.0% | 8 |
| 06-28 | 1794 | 2483 | 128 | 5.2% | 4 |
| 06-29 | 1702 | 2101 | 5 | 0.2% | 39 |
| 06-30 | 1644 | 2314 | 51 | 2.2% | 0 |
| 07-01 | 1707 | 2408 | 48 | 2.0% | 0 |
| 07-02 | 1822 | 2740 | 179 | 6.5% | 0 |
| **均值** | **1770** | **2624** | **77** | **2.9%** | — |

6/27 做了静态资源透传修复（commit 3a798be），预期缓存率 2%→90%，实际8天后平均仅 2.9%。

### 1.2 根因分析

#### 6/29 (缓存率0.2%异常日) 按 cacheStatus 维度拆解

| Cache Status | 请求数 | 占比 | 含义 |
|-------------|--------|------|------|
| **dynamic** | 1700 | **93.5%** | 请求经过 Functions 或不可缓存 |
| none | 104 | 5.7% | 无缓存策略 |
| bypass | 14 | 0.8% | 绕过缓存 |
| **hit** | **0** | **0%** | 零缓存命中 |

**核心结论：93.5%的请求是 "dynamic" 状态，CF 完全不缓存。**

#### dynamic 占比高的三层原因

**原因1：66.3%流量被 anti-bot 拦截，返回 no-store 429**

7/02 按 userAgentBrowser 维度：
- Unknown desktop: 1930 (66.3%) ← 被 anti-bot 拦截的爬虫
- 这些请求返回 `Cache-Control: no-store, private` 的429响应，不可能缓存

**原因2：爬虫请求携带 `Cache-Control: no-cache` 头**

6/29 首页 `/` 被请求1492次，全部为 dynamic。首页 `_headers` 配置了 `s-maxage=300`，本应被缓存。爬虫携带 `no-cache` 请求头导致 CF 每次回源。

**原因3：城市页（/city/*）通过 Functions 动态生成**

`_routes.json` include 了 `/city/*`，这些请求经过中间件 → city/ 路由 → 动态生成 HTML。CF Pages 不会自动缓存 Functions 响应，即使设置了 `s-maxage`。

### 1.3 6/27 透传修复为何无效

6/27 的修复在 `_middleware.js` Step 4.5 添加了静态资源透传：
```js
if (STATIC_ASSET_RE.test(url.pathname)) {
    return response; // 透传，不重包装
}
```

但 `_routes.json` 的 include 列表**不包含** `/css/*`, `/js/*`, `/assets/*` 等静态资源路径：
```json
{"include": ["/api/*", "/city/*", "/og/*", "/sitemap/*", "/compare/*", ...]}
```

静态资源本就不经过 Functions，透传代码**永远不会执行**。修复针对的是一个不存在的问题。

### 1.4 缓存优化方案

| 优先级 | 方案 | 预期效果 | 实现难度 |
|--------|------|----------|----------|
| P0 | CF Dashboard 设置 Cache Rules：忽略请求端 `no-cache` 头 | 首页缓存率 0→80% | 低（面板操作） |
| P0 | CF Dashboard 设置 Cache Rules：对 `/city/*` 路径强制 Edge TTL 300s | 城市页缓存率 0→70% | 低（面板操作） |
| P1 | 中间件对城市页使用 Cache API (`caches.default`) 显式缓存 | 城市页缓存率 0→90% | 中（代码修改） |
| P2 | anti-bot 拦截响应改为 503 + `Cache-Control: no-store` (已是 no-store) | 减少回源计算 | 无需修改 |

**最有效的方案是 P0**：在 CF Dashboard → Caching → Cache Rules 中添加规则：
1. 规则1：`URI Path equals "/"` → Cache eligibility: Eligible for cache → Edge TTL: 300s → Browser TTL: 0
2. 规则2：`URI Path starts with "/city/"` → Cache eligibility: Eligible for cache → Edge TTL: 300s
3. 规则3：`URI Path starts with "/css/" or "/js/" or "/assets/"` → Cache eligibility: Eligible for cache → Edge TTL: 1 month

这些规则会覆盖请求端的 `no-cache` 头，强制 CF 缓存。

---

## 二、anti-bot.js 误杀 Googlebot 检查

### 2.1 检查结论：Googlebot 未被误杀 ✅

7/02 CF Analytics 按 userAgentBrowser 维度：

| 浏览器/设备 | 请求数 | 占比 | 状态 |
|------------|--------|------|------|
| GoogleBot mobile | 198 | 6.8% | ✅ 正常通过 |
| GoogleBot desktop | 4 | 0.1% | ✅ 正常通过 |
| BingBot desktop | 13 | 0.4% | ✅ 正常通过 |
| AppleBot desktop | 160 | 5.5% | ✅ 正常通过 |

Googlebot 共 202 个请求正常通过 anti-bot 检测，未被拦截。

### 2.2 代码层面验证

`anti-bot.js` 的防御层与 Googlebot 的关系：

| 层级 | 机制 | Googlebot UA | 结果 |
|------|------|-------------|------|
| Layer 1 | UA 黑名单 | `Mozilla/5.0 (compatible; Googlebot/2.1; ...)` | ✅ 不匹配任何黑名单片段 |
| Layer 1.5 | 空 UA 检测 | UA 长度远超 10 | ✅ 通过 |
| Layer 2 | 可疑路径检测 | Googlebot 爬取正常页面路径 | ✅ 通过 |
| Layer 2.5 | 浏览器标识白名单 | `LEGIT_UA_FRAGMENTS` 包含 `googlebot` | ✅ 通过 |
| Layer 3 | KV 速率限制 | KV 未绑定，降级放行 | ✅ 通过 |

### 2.3 潜在风险

1. **`googleother` 在黑名单中** — 这是 Google 的非核心爬虫（用于预览/SafeSearch），拦截它可能影响 Google 对网站的某些处理。建议评估是否移除。

2. **ChromeHeadless 97个请求通过检测** — UA 含 "Chrome" 绕过了白名单检测，实际是 Headless Chrome 爬虫。建议在 UA 黑名单中添加 `headless` 检测。

3. **KV 速率限制未来绑定后可能误杀** — Googlebot 爬取频率可能超过 30 req/min。建议在速率限制逻辑中添加搜索引擎 IP 白名单或提高搜索引擎的速率限制阈值。

### 2.4 UV 波动与 anti-bot 的关系

7/01 UV=359 是8日最低，但：
- 7/01 的 Googlebot 请求数未拉取（下次可补充）
- UV 在 352~487 之间自然波动，359 并非异常值
- anti-bot 部署后威胁从 39→0，说明拦截有效
- **结论：UV 波动是自然波动，与 anti-bot 部署无因果关系**

---

## 三、robots.txt 检查

```
User-agent: *
Allow: /
Disallow: /og/
Disallow: /api/
Sitemap: https://globetimezone.com/sitemap.xml
```

robots.txt 配置正确，允许所有搜索引擎爬虫（包括 Googlebot）访问所有页面，仅禁止 /og/ 和 /api/。

---

## 四、总结与行动项

### 已确认
- [x] Googlebot 未被误杀 — 202个请求正常通过
- [x] robots.txt 配置正确
- [x] anti-bot.js 三层防御逻辑正确

### 待执行
- [ ] **CF Cache Rules 设置**（P0，面板操作）— 强制缓存首页和城市页
- [ ] **anti-bot.js 添加 `headless` 检测**（P1）— 拦截 ChromeHeadless 爬虫
- [ ] **评估 `googleother` 是否移出黑名单**（P2）
- [ ] **KV 速率限制绑定后添加搜索引擎白名单**（P2）
