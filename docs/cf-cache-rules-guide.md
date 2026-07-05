# CF Cache Rules 设置操作指南

**目标**: 将缓存命中率从 2.9% 提升到 70%+
**预计耗时**: 5分钟
**前提**: 登录 Cloudflare Dashboard

---

## 操作路径

```
Cloudflare Dashboard → globetimezone.com → Caching → Cache Rules → Create rule
```

如果侧边栏没有 "Caching"，找 **Rules → Cache Rules**（新版界面路径）。

---

## 规则1：首页强制缓存

| 字段 | 值 |
|------|-----|
| Rule name | `Cache homepage` |
| When incoming requests match... | `URI Path` `equals` `/` |
| Cache eligibility | **Eligible for cache** |
| Edge TTL | **Override origin** → `300` seconds |
| Browser TTL | **Override origin** → `0` seconds |

点 **Deploy**。

---

## 规则2：城市页强制缓存

| 字段 | 值 |
|------|-----|
| Rule name | `Cache city pages` |
| When incoming requests match... | `URI Path` `starts with` `/city/` |
| Cache eligibility | **Eligible for cache** |
| Edge TTL | **Override origin** → `300` seconds |
| Browser TTL | **Override origin** → `0` seconds |

点 **Deploy**。

---

## 规则3：静态资源长期缓存

| 字段 | 值 |
|------|-----|
| Rule name | `Cache static assets` |
| When incoming requests match... | `URI Path` `starts with` `/css/` <br>（点 Add another，依次加 `/js/` `/styles/` `/assets/` `/icons/` `/locales/`） |
| Cache eligibility | **Eligible for cache** |
| Edge TTL | **Override origin** → `2592000` seconds（30天） |
| Browser TTL | **Override origin** → `31536000` seconds（1年） |

点 **Deploy**。

---

## 规则4（可选）：多语言首页缓存

| 字段 | 值 |
|------|-----|
| Rule name | `Cache i18n homepages` |
| When incoming requests match... | `URI Path` `matches regex` `^/(en|zh|de|fr|es|ja|ko|pt|ar)/?$` |
| Cache eligibility | **Eligible for cache** |
| Edge TTL | **Override origin** → `300` seconds |
| Browser TTL | **Override origin** → `0` seconds |

---

## 验证方法

设置完成后等10分钟，然后运行：

```bash
python automation/fetch_analytics.py
```

看 `cache_hit_ratio` 字段。如果从 2.9% 跳到 50%+，说明规则生效了。

或者更快的验证方式 — 用 curl 测首页响应头：

```bash
curl -sI https://globetimezone.com/ | grep -i "cf-cache\|age\|cache-control"
```

如果看到 `cf-cache-status: HIT` 或 `age: 大于0`，说明缓存生效。第一次请求可能是 `MISS`，再请求一次看是否变成 `HIT`。

---

## 为什么这个方案有效

当前的问题：爬虫携带 `Cache-Control: no-cache` 请求头，CF 尊重这个头，每次都回源。

Cache Rules 的 **Edge TTL: Override origin** 会忽略请求端的 `no-cache` 头，强制在 CF 边缘节点缓存响应。爬虫再怎么带 `no-cache`，CF 直接用缓存副本返回，不再回源到 Functions。

这能把首页和城市页的回源请求砍掉 80%+，同时大幅降低 Functions 执行次数。
