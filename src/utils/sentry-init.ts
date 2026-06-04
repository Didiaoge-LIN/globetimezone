let sentryInitialized = false;
export async function initSentry(): Promise<void> {
  if (sentryInitialized) return;
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    if (config.sentryDsn && typeof (window as any).Sentry !== 'undefined') {
      (window as any).Sentry.init({
        dsn: config.sentryDsn,
        environment: 'production',
        tracesSampleRate: 0.1,
      });
      sentryInitialized = true;
    }
  } catch (e) {
    console.warn('[Sentry] Failed to load config');
  }
}
