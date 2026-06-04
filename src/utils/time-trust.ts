import { OfflineFallback } from './offline-fallback';
import { getTrustState } from './trust-indicator';

interface NtpOffset {
  offset: number;
  confidence: number;
  sources: number;
  updated: string;
}

let cachedOffset: NtpOffset | null = null;
let consecutiveFailures = 0;

export async function getTrustedTime(): Promise<{ date: Date; trustLevel: 'green' | 'yellow' | 'red' }> {
  if (!cachedOffset) {
    try {
      const res = await fetch('/api/ntp/offset');
      if (res.ok) {
        cachedOffset = await res.json();
        consecutiveFailures = 0;
        OfflineFallback.saveTimeData(cachedOffset);
      } else {
        throw new Error('NTP fetch failed');
      }
    } catch (e) {
      consecutiveFailures++;
      if (consecutiveFailures >= 3) {
        console.warn('[TimeTrust] NTP全故障，尝试离线缓存');
        const offline = await OfflineFallback.loadTimeData();
        if (offline) cachedOffset = offline;
      }
    }
  }
  const offset = cachedOffset?.offset || 0;
  const date = new Date(Date.now() + offset);
  const confidence = cachedOffset?.confidence || 0;
  const sources = cachedOffset?.sources || 0;
  const state = getTrustState(confidence, sources);
  return { date, trustLevel: state.level };
}

export function startNtpRefresh(intervalMs = 300000): void {
  setInterval(async () => {
    try {
      const res = await fetch('/api/ntp/offset');
      if (res.ok) {
        cachedOffset = await res.json();
        consecutiveFailures = 0;
        OfflineFallback.saveTimeData(cachedOffset);
      }
    } catch {}
  }, intervalMs);
}

if (typeof window !== 'undefined') startNtpRefresh();
