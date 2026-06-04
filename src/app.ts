import { startNtpRefresh } from './utils/time-trust';
import './components/real-clock';
import './components/smart-clock';
import './utils/search-router';
import { prefetchStrategy } from './utils/prefetch-strategy';
import { preferenceService } from './services/preference-service';
import './utils/ads-loader';
import './utils/skip-link';

document.addEventListener('DOMContentLoaded', () => {
  startNtpRefresh();
  prefetchStrategy.observeLinks();
  prefetchStrategy.prefetchOnIdle('/api/v1/timezone/Etc/UTC');
  const prefs = preferenceService.get();
  if (prefs) console.log('[App] User preferences loaded for', prefs.timezone);
  console.log('[App] All modules initialized successfully.');
});
