# 手动部署 Gateway Worker 到 Cloudflare Dashboard

## 背景
- `npx wrangler deploy` 在 Windows 上 POST 上传阶段持续 `fetch failed`
- `dist-gateway/index.js` 已通过 `--dry-run` 成功打包（392KB）
- 目标：替换生产环境 `globetimezone-gateway-production`

## 手动部署步骤（在 Cloudflare Dashboard 操作）

### Step 1：登录 Dashboard
1. 打开 https://dash.cloudflare.com/
2. 用 `didiaoge_2026@qq.com` 登录
3. 进入账户：`Didiaoge_2026@qq.com's Account`

### Step 2：进入 Workers 管理页
1. 左侧菜单 → **Workers & Pages**
2. 找到 **globetimezone-gateway-production**
3. 点击进入

### Step 3：上传新版本
1. 点击 **Deploy** 按钮（或 "Edit Code"）
2. 如果用 "Edit Code" 在线编辑器：
   - 删除原有代码
   - 复制 `dist-gateway/index.js` 全部内容粘贴进去
   - 点击 **Save and Deploy**
3. 如果用 "Upload" 方式：
   - 直接上传 `dist-gateway/index.js`

### Step 4：绑定资源（必须配置）
在 Worker 设置页 → **Settings** → **Variables**：

**KV Namespaces（6个）：**
| Variable Name | KV Namespace ID |
|-------------|----------------|
| `API_KEYS` | `d89a7aa6340f4f3790495e119a94acf7` |
| `REMINDERS` | `c29503afef6b4dee987a85ae9cb251d7` |
| `CALIBRATION` | `5a026ac173d84ca5836d47357cd4df65` |
| `PREFERENCES` | `9329056d8ea94e6d9d1f9337fc2bba69` |
| `RATELIMIT` | `47222a040de94105be399a03472bdd43` |
| `SHARE_DATA` | `0ab9fbf6807b45649b8ecd5c3e40c1ed` |

**Durable Object：**
| Variable Name | Class Name |
|-------------|-------------|
| `CIRCUIT_BREAKER` | `CircuitBreakerDO` |

**Environment Variables：**
| Key | Value |
|-----|-------|
| `ENVIRONMENT` | `production` |
| `TIMEZONE_API_URL` | `https://globetimezone-timezone-api.didiaoge-2026.workers.dev` |
| `REMINDER_API_URL` | `https://globetimezone-reminder-api.didiaoge-2026.workers.dev` |
| `NTP_CALIBRATOR_URL` | `https://globetimezone-ntp-calibrator.didiaoge-2026.workers.dev` |
| `TIME_SIGNER_URL` | `https://globetimezone-time-signer.didiaoge-2026.workers.dev` |
| `CONFIG_URL` | `https://globetimezone-config.didiaoge-2026.workers.dev` |
| `REFERRAL_API_URL` | `https://globetimezone-referral-api-production.didiaoge-2026.workers.dev` |

### Step 5：验证
部署完成后：
```bash
curl -s https://www.globetimezone.com/api/health
# 应该返回：
# {"status":"ok","version":"v6.1-final","timestamp":"..."}
```

## 文件位置
- 打包文件：`C:\Users\ASUS\WorkBuddy\Claw\globetimezone\dist-gateway\index.js`
- 参考配置：`C:\Users\ASUS\WorkBuddy\Claw\globetimezone\wrangler.gateway.toml`

## 备注
- Dashboard 部署不需要 wrangler CLI，绕过 Windows POST bug
- Durable Object migrations 需要在 Dashboard 的 "Durable Object classes" 里注册 `CircuitBreakerDO`
