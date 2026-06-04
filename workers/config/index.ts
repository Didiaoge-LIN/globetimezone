import { Hono } from 'hono';

interface Env {
  SENTRY_DSN: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/api/config', (c) => c.json({
  sentryDsn: c.env.SENTRY_DSN || '',
}));

export default app;
