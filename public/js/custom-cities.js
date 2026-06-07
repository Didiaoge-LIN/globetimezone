// custom-cities.js — V9.2 自定义城市列表
// 依赖：localStorage，全球时区数据库（Intl.supportedValuesOf）
(() => {
  const STORAGE_KEY = 'gtz_custom_cities';
  const DEFAULTS = ['America/New_York','Europe/London','Asia/Tokyo','Asia/Shanghai'];

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULTS; } catch { return [...DEFAULTS]; }
  }
  function save(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

  // 获取所有 IANA 时区
  function getAllTimezones() {
    try { return Intl.supportedValuesOf('timeZone') || []; } catch { return []; }
  }

  // 格式化时区名称用于显示
  function tzLabel(tz) {
    return tz.replace(/_/g, ' ').split('/').pop();
  }

  // 获取某时区当前小时（24h）
  function getHour(tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).formatToParts(new Date());
      const h = parts.find(p => p.type === 'hour');
      return h ? parseInt(h.value, 10) : new Date().getUTCHours();
    } catch { return new Date().getUTCHours(); }
  }

  // 状态文字
  function statusText(hour) {
    if (hour >= 9 && hour < 18) return { text: '🟢 工作中 · 可联系', bg: '#d1fae5', color: '#065f46' };
    if (hour >= 7 && hour < 22) return { text: '🟡 非工作时段', bg: '#fef3c7', color: '#92400e' };
    return { text: '🔴 深夜勿扰', bg: '#fee2e2', color: '#991b1b' };
  }

  // 旗帜 emoji（简单映射）
  function flagEmoji(tz) {
    const map = { 'America':'🇺🇸','Europe':'🇪🇺','Asia':'🇨🇳','Africa':'🇿🇦','Pacific':'🇦🇺','Australia':'🇦🇺','Indian':'🇮🇳' };
    const prefix = tz.split('/')[0];
    return map[prefix] || '🌐';
  }

  // 渲染城市卡片列表
  function render() {
    const container = document.getElementById('custom-city-cards');
    if (!container) return;
    const list = load();
    container.innerHTML = '';
    list.forEach(tz => {
      const hour = getHour(tz);
      const st = statusText(hour);
      const card = document.createElement('div');
      card.className = 'city-status-card';
      card.setAttribute('data-tz', tz);
      card.style.cssText = 'background:var(--bg-card);border-radius:12px;padding:1rem 1.5rem;box-shadow:var(--shadow);min-width:140px;text-align:center;position:relative;';
      card.innerHTML = `
        <button class="remove-btn" title="移除" style="position:absolute;top:6px;right:8px;border:none;background:none;cursor:pointer;font-size:14px;color:var(--text-secondary);">&times;</button>
        <div style="font-size:1.5rem;">${flagEmoji(tz)}</div>
        <div style="font-weight:600;">${tzLabel(tz)}</div>
        <span class="city-hour" style="font-size:1.3rem;font-weight:700;display:block;margin:0.3rem 0;"></span>
        <span class="status-badge" style="display:inline-block;padding:0.2rem 0.8rem;border-radius:20px;font-size:0.8rem;font-weight:500;background:${st.bg};color:${st.color};">${st.text}</span>
      `;
      card.querySelector('.remove-btn').addEventListener('click', () => {
        const lst = load().filter(t => t !== tz);
        save(lst);
        render();
      });
      container.appendChild(card);
    });
    // 更新时钟
    updateClocks();
  }

  // 更新所有卡片的时钟
  function updateClocks() {
    document.querySelectorAll('.city-status-card').forEach(card => {
      const tz = card.getAttribute('data-tz');
      if (!tz) return;
      const hourEl = card.querySelector('.city-hour');
      if (!hourEl) return;
      try {
        const now = new Date();
        const timeStr = new Intl.DateTimeFormat('zh-CN', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
        hourEl.textContent = timeStr;
      } catch {}
    });
  }

  // 搜索框 + 添加城市
  function initSearch() {
    const input = document.getElementById('city-search-input');
    const dropdown = document.getElementById('city-search-dropdown');
    if (!input || !dropdown) return;

    let allTZ = getAllTimezones();
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      if (!q) { dropdown.style.display = 'none'; return; }
      const matches = allTZ.filter(tz => tz.toLowerCase().includes(q)).slice(0, 8);
      if (!matches.length) { dropdown.style.display = 'none'; return; }
      dropdown.innerHTML = '';
      matches.forEach(tz => {
        const item = document.createElement('div');
        item.textContent = tz.replace(/_/g, ' ');
        item.style.cssText = 'padding:6px 10px;cursor:pointer;font-size:13px;';
        item.addEventListener('mouseenter', () => item.style.background = '#f1f5f9');
        item.addEventListener('mouseleave', () => item.style.background = 'transparent');
        item.addEventListener('click', () => {
          const lst = load();
          if (!lst.includes(tz)) {
            lst.push(tz);
            save(lst);
            render();
          }
          input.value = '';
          dropdown.style.display = 'none';
        });
        dropdown.appendChild(item);
      });
      dropdown.style.display = 'block';
    });

    // 点击外部关闭
    document.addEventListener('click', e => {
      if (!dropdown.contains(e.target) && e.target !== input) dropdown.style.display = 'none';
    });
  }

  // 定时刷新
  function startTimer() {
    setInterval(() => {
      render();
    }, 60000);
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { render(); initSearch(); startTimer(); });
  } else {
    render();
    initSearch();
    startTimer();
  }
})();
