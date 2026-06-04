import type { UserPreference } from '../types';

class PreferenceService {
  private storageKey = 'user-tz-prefs';

  get(): UserPreference | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) as UserPreference : null;
    } catch {
      return null;
    }
  }

  save(prefs: UserPreference): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(prefs));
      this.learnPatterns(prefs);
      if (navigator.onLine) this.syncToCloud(prefs);
    } catch (e) {
      console.warn('Failed to save preferences:', e);
    }
  }

  private learnPatterns(prefs: UserPreference): void {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    if (!prefs.learnedPatterns) prefs.learnedPatterns = [];
    const existing = prefs.learnedPatterns.find(p => p.dayOfWeek === day);
    if (existing) {
      if (!existing.activeHours.includes(hour)) {
        existing.activeHours.push(hour);
      }
    } else {
      prefs.learnedPatterns.push({ dayOfWeek: day, activeHours: [hour] });
    }
  }

  private async syncToCloud(prefs: UserPreference): Promise<void> {
    try {
      await fetch('/api/v1/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
    } catch {}
  }
}

export const preferenceService = new PreferenceService();
