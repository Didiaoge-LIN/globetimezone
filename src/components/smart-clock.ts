class SmartClock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const tz = this.getAttribute('timezone') || 'UTC';
    this.shadowRoot!.innerHTML = `<real-clock timezone="${this.escapeAttr(tz)}"></real-clock>`;
    import('../services/preference-service').then(({ preferenceService }) => {
      const prefs = preferenceService.get();
      if (prefs && prefs.timezone === tz) {
        const indicator = document.createElement('span');
        indicator.className = 'local-indicator';
        indicator.textContent = ' (本地)';
        indicator.title = '根据您的偏好识别';
        this.shadowRoot!.appendChild(indicator);
      }
    }).catch(() => {});
  }

  private escapeAttr(value: string): string {
    return value.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

if (!customElements.get('smart-clock')) {
  customElements.define('smart-clock', SmartClock);
}
