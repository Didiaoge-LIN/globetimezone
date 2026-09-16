/**
 * workers/reminder-api/index.ts — Reminder API Worker
 * @author SYS — Systems Engineer
 * Reviewed by ALL 7 experts 2026-05-29
 *
 * Endpoint:
 *   POST /api/reminders  — Create a new timezone-based reminder
 *
 * Validation: Zod schema (timezone, email, action, optional targetTime)
 * Storage: KV namespace (REMINDERS)
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import type { ReminderPayload } from '../../src/types';

interface Env {
  REMINDERS: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

// ==================== CORS ====================
app.use('*', cors({
  origin: ['https://globetimezone.com', 'https://*.globetimezone.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// ==================== RATE LIMITER ====================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 100;

app.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateLimitMap.set(ip, entry);
  }
  entry.count++;
  if (entry.count > RATE_MAX_REQUESTS) {
    return c.json({ error: 'Too many requests', retryAfter: Math.ceil((entry.resetAt - now) / 1000) }, 429);
  }
  return next();
});

// ==================== SCHEMA ====================
const ReminderSchema = z.object({
  timezone: z.string().min(1).max(100),
  email: z.string().email(),
  action: z.enum(['wakeup', 'custom']),
  targetTime: z.string().datetime().optional(),
});

// ==================== CREATE REMINDER ====================
app.post('/api/reminders', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = ReminderSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        422
      );
    }

    const id = crypto.randomUUID();
    const reminder: ReminderPayload & { id: string; created: string } = {
      ...parsed.data,
      id,
      created: new Date().toISOString(),
    };

    await c.env.REMINDERS.put(id, JSON.stringify(reminder));

    return c.json({ success: true, id }, 201);
  } catch (e) {
    console.error('[reminder-api] Creation failed:', e);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== LIST REMINDERS ====================
app.get('/api/reminders', async (c) => {
  try {
    const list = await c.env.REMINDERS.list({ prefix: '' });
    const reminders = await Promise.all(
      list.keys.map(async (key) => {
        const raw = await c.env.REMINDERS.get(key.name, 'json');
        return raw;
      })
    );
    return c.json({ reminders: reminders.filter(Boolean) });
  } catch (e) {
    console.error('[reminder-api] List failed:', e);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== DELETE REMINDER ====================
app.delete('/api/reminders/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.REMINDERS.delete(id);
    return c.json({ success: true });
  } catch (e) {
    console.error('[reminder-api] Delete failed:', e);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== HEALTH ====================
app.get('/api/reminders/health', (c) => {
  return c.json({ status: 'ok', service: 'reminder-api', version: 'v4' });
});

export default app;
