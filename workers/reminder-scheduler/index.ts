/**
 * workers/reminder-scheduler/index.ts — Reminder Cron Scheduler
 * @author SYS — Systems Engineer
 * Reviewed by ALL 7 experts 2026-05-29
 *
 * Runs every 5 minutes via Cloudflare Cron Trigger.
 * Scans KV for due reminders (within 5min window of targetTime).
 * Sends emails via SendGrid on match, then deletes the reminder.
 */
import type { ReminderPayload } from '../../src/types';

interface Env {
  REMINDERS: KVNamespace;
  SENDGRID_API_KEY: string;
}

export default {
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    console.log('[reminder-scheduler] Cron triggered');
    const list = await env.REMINDERS.list({ prefix: '' });
    const now = new Date();

    for (const key of list.keys) {
      try {
        const item = await env.REMINDERS.get(key.name, 'json') as ReminderPayload & { id: string; created: string } | null;
        if (!item || !item.targetTime) continue;

        const target = new Date(item.targetTime);
        const diffMs = Math.abs(target.getTime() - now.getTime());

        // Within 5 minutes of target time
        if (diffMs < 5 * 60 * 1000) {
          await sendEmail(
            env.SENDGRID_API_KEY,
            item.email,
            'GlobeTimeZone Reminder',
            `Your reminder for ${item.timezone} at ${item.targetTime} is due.\n\n` +
            `Visit https://globetimezone.com to check the current time in ${item.timezone}.`
          );
          await env.REMINDERS.delete(key.name);
          console.log(`[reminder-scheduler] Sent reminder ${item.id} to ${item.email}`);
        }
      } catch (err) {
        console.error(`[reminder-scheduler] Failed to process ${key.name}:`, err);
      }
    }
  },
};

/**
 * Send email via SendGrid API
 */
async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@globetimezone.com', name: 'GlobeTimeZone' },
      subject,
      content: [{ type: 'text/plain', value: body }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${text}`);
  }
}
