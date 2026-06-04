import { getTrustState, createTrustIndicator } from '../utils/trust-indicator';

class RealClock extends HTMLElement {
  private worker: Worker | null = null;
  private displayEl: HTMLElement | null = null;
  private offset: number = 0;
  private timezone: string = '';
  private retryTimer: number | null = null;
  private trustIndicator: HTMLSpanElement | null = null;
  private _visibilityHandler: (() => void) | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.timezone = this.getAttribute('timezone') || 'UTC';
    this.shadowRoot!.innerHTML = `<span class="time" role="timer" aria-live="polite">--:--:--</span>`;
    this.displayEl = this.shadowRoot!.querySelector('.time');
    this.fetchOffsetAndStart();
  }

  private async fetchOffsetAndStart() {
    try {
      const res = await fetch(`/api/v1/timezone/${encodeURIComponent(this.timezone)}`);
      if (!res.ok) throw new Error('Failed to fetch offset');
      const data = await res.json();
      this.offset = data.offset;
      
      const confidence = data.confidence || 0;
      const sources = data.sources || 0;
      const state = getTrustState(confidence, sources);
      this.trustIndicator = createTrustIndicator(state);
      this.shadowRoot!.appendChild(this.trustIndicator);
      
      this.startWorker();
    } catch (e) {
      console.error('Clock init error:', e);
      if (this.displayEl) this.displayEl.textContent = 'Err';
      this.retryTimer = window.setTimeout(() => this.fetchOffsetAndStart(), 30000);
    }
  }

  private startWorker() {
    if (this.worker) return;
    this.worker = new Worker(new URL('../workers/clock-worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent) => {
      const now = e.data.now;
      const local = new Date(now + this.offset * 3600000);
      if (this.displayEl) {
        this.displayEl.textContent = local.toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
        });
      }
    };
    this.worker.postMessage({ command: 'start' });

    this._visibilityHandler = () => {
      if (document.hidden) {
        this.worker?.postMessage({ command: 'stop' });
      } else if (this.worker) {
        this.worker.postMessage({ command: 'start' });
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);
  }

  disconnectedCallback() {
    if (this.worker) {
      this.worker.postMessage({ command: 'stop' });
      this.worker.terminate();
      this.worker = null;
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
    }
  }
}

if (!customElements.get('real-clock')) {
  customElements.define('real-clock', RealClock);
}
