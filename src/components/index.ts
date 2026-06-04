import './real-clock';
import './smart-clock';
export { default as RealClock } from './real-clock';
export { default as SmartClock } from './smart-clock';
export function ensureComponentsDefined(): boolean {
  return [customElements.get('real-clock'), customElements.get('smart-clock')].every(Boolean);
}
