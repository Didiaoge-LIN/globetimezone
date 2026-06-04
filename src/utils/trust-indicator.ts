export type TrustLevel = 'green' | 'yellow' | 'red';

export interface TrustState {
  level: TrustLevel;
  tooltip: string;
}

export function getTrustState(confidence: number, sources: number): TrustState {
  if (confidence > 0.8 && sources >= 2) {
    return { level: 'green', tooltip: '时间已校准，可信度高' };
  } else if (confidence > 0.5) {
    return { level: 'yellow', tooltip: '校准源减少，可能存在轻微偏差' };
  } else {
    return { level: 'red', tooltip: '时间校准异常，当前时间仅供参考' };
  }
}

export function createTrustIndicator(state: TrustState): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = `trust-indicator trust-${state.level}`;
  span.title = state.tooltip;
  span.setAttribute('aria-label', state.tooltip);
  const icons = { green: '🟢', yellow: '🟡', red: '🔴' };
  span.textContent = icons[state.level];
  span.style.cssText = 'font-size:0.6em;margin-left:4px;cursor:help;';
  return span;
}
