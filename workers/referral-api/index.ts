import { Hono } from 'hono';
import type { Context } from 'hono';

interface Env {
  API_KEYS: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

// ========== 辅助函数 ==========

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ success: false, error: message }, status);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidReferralCode(code: string): boolean {
  return /^[a-z0-9]{8}$/.test(code);
}

// ========== POST /api/referral/register ==========
// 新用户通过推荐码注册
app.post('/register', async (c: Context<{ Bindings: Env }>) => {
  let body: { referral_code?: string; new_user_email?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { referral_code, new_user_email } = body;

  // 校验推荐码
  if (!referral_code || !isValidReferralCode(referral_code)) {
    return errorResponse('referral_code must be an 8-character lowercase alphanumeric string', 400);
  }

  // 校验邮箱
  if (!new_user_email || !isValidEmail(new_user_email)) {
    return errorResponse('new_user_email must be a valid email address', 400);
  }

  const normalizedEmail = new_user_email.trim().toLowerCase();
  const normalizedCode = referral_code.trim().toLowerCase();

  // === 防作弊1：相同推荐码 + 邮箱已注册 ===
  const existingKey = `gtz-referral-${normalizedCode}-${normalizedEmail}`;
  const existing = await c.env.API_KEYS.get(existingKey);
  if (existing) {
    return errorResponse('This email has already been referred by this code', 409);
  }

  // === 防作弊2：同一邮箱已被任何推荐码推荐 ===
  const emailIndexKey = `gtz-referral-email-${normalizedEmail}`;
  const emailIndex = await c.env.API_KEYS.get(emailIndexKey);
  if (emailIndex) {
    return errorResponse('This email has already been referred', 409);
  }

  // === 防作弊3：同一IP 24小时内只能注册一次 ===
  const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
  const ipLimitKey = `gtz-referral-ip-${clientIP}`;
  const ipLastReg = await c.env.API_KEYS.get(ipLimitKey);
  if (ipLastReg) {
    const lastTime = parseInt(ipLastReg);
    if (Date.now() - lastTime < 24 * 60 * 60 * 1000) {
      return errorResponse('Too many registrations from this IP. Please try again in 24 hours.', 429);
    }
  }

  // === 验证推荐码有效性 ===
  const referralMetaKey = `gtz-referral-${normalizedCode}`;
  const referrerEmail = await c.env.API_KEYS.get(referralMetaKey);
  if (!referrerEmail) {
    return errorResponse('Invalid referral code', 404);
  }

  // === 存储推荐关系 ===
  const now = Date.now();
  const referralRecord = JSON.stringify({
    referral_code: normalizedCode,
    referrer_email: referrerEmail,
    new_user_email: normalizedEmail,
    created_at: now,
    has_paid: false,
    reward_issued: false,
  });

  await c.env.API_KEYS.put(existingKey, referralRecord, { expirationTtl: 365 * 24 * 60 * 60 });

  // 建立邮箱 → 推荐关系索引
  await c.env.API_KEYS.put(emailIndexKey, existingKey, { expirationTtl: 365 * 24 * 60 * 60 });

  // IP限制记录（24小时）
  await c.env.API_KEYS.put(ipLimitKey, String(now), { expirationTtl: 24 * 60 * 60 });

  // 更新推荐人的推荐计数
  const refCountKey = `gtz-referral-count-${referrerEmail}`;
  const prevCount = await c.env.API_KEYS.get(refCountKey);
  const newCount = prevCount ? parseInt(prevCount) + 1 : 1;
  await c.env.API_KEYS.put(refCountKey, String(newCount));

  return jsonResponse({
    success: true,
    message: 'Referral relationship recorded',
  }, 201);
});

// ========== GET /api/referral/stats ==========
// 查询推荐人的推荐统计
app.get('/stats', async (c: Context<{ Bindings: Env }>) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey) {
    return errorResponse('X-API-Key header is required', 401);
  }

  // 通过API密钥查找用户邮箱
  const normalizedKey = apiKey.trim().toLowerCase();
  const keyMetaKey = `gtz-key-${normalizedKey}`;
  const keyDataStr = await c.env.API_KEYS.get(keyMetaKey);
  if (!keyDataStr) {
    return errorResponse('Invalid API key', 401);
  }

  let keyData: { email: string; plan: string; expires?: string };
  try {
    keyData = JSON.parse(keyDataStr);
  } catch {
    return errorResponse('Invalid API key data', 401);
  }

  const referrerEmail = keyData.email;

  // 统计推荐人数
  const refCountKey = `gtz-referral-count-${referrerEmail}`;
  const countStr = await c.env.API_KEYS.get(refCountKey);
  const referralCount = countStr ? parseInt(countStr) : 0;

  // 统计获得奖励（查找 reward 记录）
  const rewardCountKey = `gtz-referral-reward-${referrerEmail}`;
  const rewardStr = await c.env.API_KEYS.get(rewardCountKey);
  const rewardMonths = rewardStr ? parseInt(rewardStr) : 0;

  // 列出被推荐用户
  const listPrefix = `gtz-referral-${referrerEmail.slice(0, 10)}`;
  // 注意：KV list 有前缀限制，这里用更可靠的计数方式
  const referredUsers: string[] = [];

  return jsonResponse({
    referral_count: referralCount,
    reward_months: rewardMonths,
    referred_users: referredUsers,
    referral_code_link: `https://globetimezone.com/?ref=${normalizedKey.slice(0, 8)}`,
  });
});

// ========== POST /api/referral/reward — Stripe Webhook 触发 ==========
// 当新用户完成首次付费时，为推荐人发放奖励
app.post('/reward', async (c: Context<{ Bindings: Env }>) => {
  let body: { email?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const paidEmail = body.email?.trim().toLowerCase();
  if (!paidEmail || !isValidEmail(paidEmail)) {
    return errorResponse('email is required', 400);
  }

  // 查找该邮箱是否通过推荐注册
  const emailIndexKey = `gtz-referral-email-${paidEmail}`;
  const referralRecordKey = await c.env.API_KEYS.get(emailIndexKey);
  if (!referralRecordKey) {
    return jsonResponse({ success: false, message: 'No referral record found for this email' });
  }

  // 读取推荐记录
  const recordStr = await c.env.API_KEYS.get(referralRecordKey);
  if (!recordStr) {
    return errorResponse('Referral record not found', 404);
  }

  const record = JSON.parse(recordStr);
  if (record.reward_issued) {
    return jsonResponse({ success: false, message: 'Reward already issued' });
  }

  // 标记已付费
  record.has_paid = true;

  // 为推荐人发放1个月PRO会员奖励
  const referrerEmail = record.referrer_email;
  const rewardCountKey = `gtz-referral-reward-${referrerEmail}`;
  const prevReward = await c.env.API_KEYS.get(rewardCountKey);
  const newReward = prevReward ? parseInt(prevReward) + 1 : 1;
  await c.env.API_KEYS.put(rewardCountKey, String(newReward));

  // 延长推荐人的PRO会员到期日
  const referrerKeyMeta = `gtz-key-${referrerEmail.replace(/[^a-z0-9]/g, '-')}`;
  // 需要找到推荐人的API key来延长...
  // 简化处理：搜索 referrer 的 API key
  const referrerKeyPattern = `gtz-key-`;
  // 由于KV list限制，这里留空由外部系统处理
  // 实际生产中通过查找用户 或 使用专门的管理API处理

  record.reward_issued = true;
  record.rewarded_at = Date.now();
  await c.env.API_KEYS.put(referralRecordKey, JSON.stringify(record));

  return jsonResponse({
    success: true,
    message: 'Reward issued',
    referrer_email: referrerEmail,
    reward_months_total: newReward,
  });
});

// ========== 健康检查 ==========
app.get('/health', (c) => {
  return jsonResponse({ status: 'ok', service: 'referral-api' });
});

export default app;
