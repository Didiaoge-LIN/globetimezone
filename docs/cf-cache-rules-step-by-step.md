# CF Cache Rules 分步操作指南

**当前页面**: Cloudflare Dashboard → globetimezone.com → Cache Rules  
**蓝色按钮**: `创建规则`

---

## 第一步：创建规则1（首页缓存）

1. 点击蓝色按钮 **`创建规则`**
2. 在规则编辑器顶部，输入 **规则名称**:
   ```
   Cache homepage
   ```
3. 找到 "When incoming requests match..."（当传入请求匹配...）区域
4. 点击下拉框，选择 **字段**: `URI Path`
5. 选择 **运算符**: `equals`（等于）
6. 输入 **值**:
   ```
   /
   ```
7. 下方 "Then..."（然后...）区域，设置:
   - **Cache eligibility**: 选择 `Eligible for cache`（符合缓存条件）
   - **Edge TTL**: 选择 `Override origin`（覆盖源站）
   - 输入数字: `300`
   - 单位选择: `Seconds`（秒）
   - **Browser TTL**: 选择 `Override origin`
   - 输入数字: `0`
   - 单位选择: `Seconds`
8. 点击底部 **部署**（或 `Deploy`）按钮

---

## 第二步：创建规则2（城市页缓存）

1. 再次点击 **`创建规则`**
2. 输入规则名称:
   ```
   Cache city pages
   ```
3. 条件设置:
   - **字段**: `URI Path`
   - **运算符**: `starts with`（以...开头）
   - **值**:
   ```
   /city/
   ```
4. 缓存设置:
   - **Cache eligibility**: `Eligible for cache`
   - **Edge TTL**: `Override origin` → `300` → `Seconds`
   - **Browser TTL**: `Override origin` → `0` → `Seconds`
5. 点击 **部署**

---

## 第三步：创建规则3（静态资源长期缓存）

1. 点击 **`创建规则`**
2. 输入规则名称:
   ```
   Cache static assets
   ```
3. 条件设置:
   - **字段**: `URI Path`
   - **运算符**: `starts with`
   - **值**: `/css/`
   - 点击 **Add another**（添加另一个）或 **+ 或** 按钮
   - 新增条件2:
     - **字段**: `URI Path`
     - **运算符**: `starts with`
     - **值**: `/js/`
   - 继续添加:
     - `/styles/`
     - `/assets/`
     - `/icons/`
     - `/locales/`
   - 确保多个条件之间是 **OR**（或）关系，不是 AND
4. 缓存设置:
   - **Cache eligibility**: `Eligible for cache`
   - **Edge TTL**: `Override origin` → `2592000` → `Seconds`（30天）
   - **Browser TTL**: `Override origin` → `31536000` → `Seconds`（1年）
5. 点击 **部署**

---

## 第四步：创建规则4（多语言首页）

1. 点击 **`创建规则`**
2. 输入规则名称:
   ```
   Cache i18n homepages
   ```
3. 条件设置:
   - **字段**: `URI Path`
   - **运算符**: `matches regex`（正则匹配）
   - **值**:
   ```
   ^/(en|zh|de|fr|es|ja|ko|pt|ar)/?$
   ```
4. 缓存设置:
   - **Cache eligibility**: `Eligible for cache`
   - **Edge TTL**: `Override origin` → `300` → `Seconds`
   - **Browser TTL**: `Override origin` → `0` → `Seconds`
5. 点击 **部署**

---

## 操作顺序建议

Free 套餐有 10 条 Cache Rules 额度，4 条规则完全够用。按优先级操作：

1. 先做 **规则1（首页）** + **规则2（城市页）** — 这两个效果最大
2. 再做 **规则3（静态资源）** — 减少带宽
3. 最后做 **规则4（多语言首页）** — 锦上添花

---

## 验证是否生效

4 条规则都创建后，等 2-3 分钟，打开本机命令行或 PowerShell 运行：

```bash
curl -sI https://globetimezone.com/ | findstr /i "cf-cache age"
```

第一次可能看到 `cf-cache-status: MISS`，30 秒内再跑一次，如果变成 `cf-cache-status: HIT`，说明缓存生效。

过几小时后运行：

```bash
python automation/fetch_analytics.py
```

看 `cache_hit_ratio` 是否从 2.9% 跳到 50%+。

---

## 常见注意点

- **Edge TTL 的 "Override origin" 必须选**，不选的话 CF 会尊重源站的 `no-cache` 头
- 多个静态资源路径之间必须是 **OR** 关系
- 如果看不到某个字段，可能是页面没加载完，刷新一下
- 如果界面是英文，对应名称:
  - 创建规则 = Create rule
  - 部署 = Deploy
  - 字段 = Field
  - 运算符 = Operator
  - 值 = Value
  - 覆盖源站 = Override origin
  - 符合缓存条件 = Eligible for cache
