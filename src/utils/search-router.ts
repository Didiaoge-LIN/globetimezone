class SearchRouter {
  private input: HTMLInputElement | null;

  constructor() {
    this.input = document.getElementById('decision-input') as HTMLInputElement | null;
    if (this.input) this.input.addEventListener('keypress', this.handleKeyPress.bind(this));
  }

  private handleKeyPress(e: KeyboardEvent) {
    if (e.key !== 'Enter' || !this.input) return;
    let query = this.input.value.trim();
    if (!query) return;
    if (query.length > 150) {
      console.warn('[Search] Query truncated, length:', query.length);
      query = query.slice(0, 150);
    }

    const meetingMatch = query.match(
      /(?:明天|后天|下周|(\d+)月(\d+)日)?\s*(?:下午|上午|晚上)?(\d{1,2})点\s*(?:和|与|跟)?([\u4e00-\u9fa5a-zA-Z\s,]+)(?:开|周会|会议|开会)/
    );
    if (meetingMatch) {
      const cities = meetingMatch[4].split(/[,，\s]+/).filter(Boolean);
      const params = new URLSearchParams();
      params.set('cities', cities.join(','));
      if (meetingMatch[1]) params.set('month', meetingMatch[1]);
      if (meetingMatch[2]) params.set('day', meetingMatch[2]);
      if (meetingMatch[3]) params.set('hour', meetingMatch[3]);
      window.location.href = `/meeting-planner?${params.toString()}`;
      return;
    }

    const cityMatch = query.match(
      /(?:给|和|联系|call)?([\u4e00-\u9fa5a-zA-Z\s]+)(?:打电话|联系|通话|call)/
    );
    if (cityMatch) {
      window.location.href = `/contact-advisor?city=${encodeURIComponent(cityMatch[1].trim())}`;
      return;
    }

    if (/(会议|规划|meeting|schedule)/i.test(query)) {
      window.location.href = '/meeting-planner';
      return;
    }

    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  }
}

new SearchRouter();
