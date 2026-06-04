import type { Context } from 'hono';

export function errorResponse(
  c: Context,
  message: string,
  status: number,
  retryAfter?: number
): Response {
  const requestId = c.get('requestId') || crypto.randomUUID();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Id': requestId
  };
  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }
  return new Response(JSON.stringify({
    error: message,
    request_id: requestId,
    retry_after: retryAfter || null
  }), { status, headers });
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function logError(service: string, message: string, error?: Error) {
  let stack = error?.stack || null;
  if (stack) {
    stack = stack.replace(/gtz-[a-f0-9-]+/gi, 'gtz-***');
    stack = stack.replace(
      /-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/gi,
      '***'
    );
    stack = stack.replace(/https:\/\/hooks\.slack\.com\/[^\s"]+/gi, '***');
    stack = stack.replace(/https:\/\/discord\.com\/api\/webhooks\/[^\s"]+/gi, '***');
  }
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    service,
    level: 'error',
    message,
    stack
  }));
}

/**
 * API密钥SHA-256哈希（极低危风险修复）
 * 用于存储和验证API密钥，避免明文泄露
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ========== 简单内存熔断器 (P1修复：SQLite DO迁移前的临时方案) ==========
export class SimpleCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold: number;
  private readonly timeout: number;

  constructor(threshold = 5, timeout = 30000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.failures >= this.threshold && Date.now() - this.lastFailureTime < this.timeout) {
      throw new Error('Circuit breaker open');
    }

    return fn().catch((e) => {
      this.failures++;
      this.lastFailureTime = Date.now();
      throw e;
    });
  }

  success() {
    this.failures = 0;
  }

  getState() {
    const isOpen = this.failures >= this.threshold && Date.now() - this.lastFailureTime < this.timeout;
    return {
      state: isOpen ? 'open' : 'closed',
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}
