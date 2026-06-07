// meeting-planner.js — V9.2 会议规划模式
(() => {
  const STORAGE_KEY = 'gtz_meeting_cities';
  const WORK_HOURS = { start: 9, end: 17 }; // 默认工作时间

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  }
  function save(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

  function getHour(tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).formatToParts(new Date());
      const h = parts.find(p => p.type === 'hour');
      return h ? parseInt(h.value, 10) : new Date().getUTCHours();
    } catch { return new Date().getUTCHours(); }
  }

  // 判断某小时是否在某时区的工作时间内
  function isWorkingHour(tz, utcHour) {
    try {
      // 把 UTC 小时转成目标时区本地小时
      const now = new Date();
      const localStr = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(now);
      // 改用更准确的方法：计算时区偏移
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
      const localHour = tzDate.getHours();
      return localHour >= WORK_HOURS.start && localHour < WORK_HOURS.end;
    } catch { return false; }
  }

  // 渲染会议规划面板
  function renderPanel() {
    let panel = document.getElementById('meeting-panel');
    if (panel) { panel.remove(); return; } // toggle

    panel = document.createElement('div');
    panel.id = 'meeting-panel';
    panel.style.cssText = 'margin:2rem auto;max-width:900px;background:var(--bg-card);border-radius:16px;padding:1.5rem 2rem;box-shadow:var(--shadow);text-align:left;';

    const cities = load();
    if (!cities.length) {
      panel.innerHTML = '<p style="color:var(--text-secondary);font-size:0.95rem;text-align:center;padding:1rem 0;">请先在上方添加城市，然后开启会议模式。</p>';
      document.getElementById('custom-city-cards').after(panel);
      return;
    }

    // 表头
    let html = '<h3 style="margin:0 0 1rem 0;font-size:1.1rem;">📅 全球会议时间重叠</h3>';
    html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
    html += '<tr><th style="padding:6px 8px;text-align:left;color:var(--text-secondary);font-weight:500;">时区</th>';
    for (let h = 0; h < 24; h++) {
      html += `<th style="padding:4px 2px;text-align:center;color:var(--text-secondary);font-weight:400;font-size:0.75rem;">${h}</th>`;
    }
    html += '</tr>';

    cities.forEach(tz => {
      const label = tz.replace(/_/g, ' ').split('/').pop();
      html += `<tr><td style="padding:6px 8px;font-weight:500;white-space:nowrap;">${label}</td>`;
      for (let h = 0; h < 24; h++) {
        // 简化：直接比较本地小时
        const now = new Date();
        const localHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(now), 10);
        const currentUTCHour = new Date().getUTCHours();
        // 用实际时间偏移来计算 h 时刻的本地小时
        const tzDate = new Date(now.getTime() + (h - currentUTCHour) * 3600000);
        const localH = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(tzDate), 10);
        const isWork = localH >= WORK_HOURS.start && localH < WORK_HOURS.end;
        const isNow = h === currentUTCHour;
        const bg = isNow ? '#3b82f6' : (isWork ? '#d1fae5' : '#f1f5f9');
        const border = isNow ? '2px solid #1d4ed6' : '1px solid transparent';
        html += `<td style="padding:3px;background:${bg};border-radius:3px;border:${border};min-width:28px;"></td>`;
      }
      html += '</tr>';
    });

    // 重叠行
    html += '<tr><td style="padding:6px 8px;font-weight:500;color:var(--accent);">重叠</td>';
    for (let h = 0; h < 24; h++) {
      const now = new Date();
      const currentUTCHour = new Date().getUTCHours();
      const tzDate = new Date(now.getTime() + (h - currentUTCHour) * 3600000);
      const overlap = cities.filter(tz => {
        const localH = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(tzDate), 10);
        return localH >= WORK_HOURS.start && localH < WORK_HOURS.end;
      }).length;
      const allWork = overlap === cities.length;
      const bg = allWork ? '#059669' : (overlap >= 2 ? '#f59e0b' : '#e5e7eb');
      const fg = allWork ? '#fff' : '#1a1a2e';
      html += `<td style="padding:3px;text-align:center;background:${bg};color:${fg};border-radius:3px;font-size:0.7rem;font-weight:600;">${overlap > 0 ? overlap : ''}</td>`;
    }
    html += '</tr></table></div>';
    html += '<p style="font-size:0.8rem;color:var(--text-tertiary);margin-top:0.8rem;">🟢 工作时间  🔵 当前时刻  🟡 重叠数  🟢 全员可参会</p>';

    panel.innerHTML = html;
    document.getElementById('custom-city-cards').after(panel);
  }

  // 在首页 Hero 区注入切换按钮
  function injectButton() {
    if (document.getElementById('meeting-toggle')) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const btn = document.createElement('button');
    btn.id = 'meeting-toggle';
    btn.textContent = '📅 会议规划模式';
    btn.style.cssText = 'margin:0.8rem auto 0;display:block;padding:0.5rem 1.5rem;font-size:0.9rem;border:1.5px solid var(--accent);background:transparent;color:var(--accent);border-radius:8px;cursor:pointer;';
    btn.addEventListener('mouseenter', () => { btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; btn.style.color = 'var(--accent)'; });
    btn.addEventListener('click', renderPanel);
    hero.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }
})();
