// meeting-planner.js — V10 会议规划模式（用户友好重设计）
(() => {
  const STORAGE_KEY = 'gtz_custom_cities';
  const WORK_HOURS = { start: 9, end: 17 }; // 默认工作时间 9:00-17:00

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  }

  // 获取中文名
  function cnName(tz) {
    const map = window.__gtz_tzToCN;
    if (map && map[tz] && map[tz].length > 0) return map[tz][0];
    // 后备：从 IANA ID 提取城市名
    const parts = tz.replace(/_/g, ' ').split('/');
    return parts[parts.length - 1];
  }

  // 国旗 emoji
  function flagEmoji(tz) {
    const map = { 'America': '🇺🇸', 'Europe': '🇪🇺', 'Asia': '🌏', 'Africa': '🌍', 'Pacific': '🌊', 'Australia': '🇦🇺', 'Indian': '🇮🇳' };
    return map[tz.split('/')[0]] || '🌐';
  }

  // UTC 小时 → 某时区的本地小时
  function localHourAtUTC(tz, utcHour) {
    try {
      const now = new Date();
      const nowUTC = now.getUTCHours();
      const offsetMs = (utcHour - nowUTC) * 3600000;
      const fakeDate = new Date(now.getTime() + offsetMs);
      // 用 Intl API 获取目标时区的本地小时
      const h = parseInt(
        new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(fakeDate),
        10
      );
      return isNaN(h) ? -1 : h;
    } catch { return -1; }
  }

  // 获取当前 UTC 小时
  function currentUTCHour() {
    return new Date().getUTCHours();
  }

  // 判断某 UTC 小时在某时区是否工作时段
  function isWorkAtUTC(tz, utcHour) {
    const localH = localHourAtUTC(tz, utcHour);
    return localH >= WORK_HOURS.start && localH < WORK_HOURS.end;
  }

  // 格式化 UTC 小时 → HH:00
  function fmtHour(h) { return String(h).padStart(2, '0') + ':00'; }

  // 格式化某时区在某个 UTC 小时的时间
  function fmtLocalTime(tz, utcHour) {
    const localH = localHourAtUTC(tz, utcHour);
    if (localH < 0) return '--';
    return String(localH).padStart(2, '0') + ':00';
  }

  // 找最佳重叠时段
  function findBestWindows(cities) {
    const windows = [];
    let inWindow = false, start = -1, maxOverlap = 0;

    for (let h = 0; h < 24; h++) {
      const overlap = cities.filter(tz => isWorkAtUTC(tz, h)).length;
      if (overlap > maxOverlap) maxOverlap = overlap;

      if (overlap === cities.length && !inWindow) {
        inWindow = true;
        start = h;
      }
      if ((overlap < cities.length || h === 23) && inWindow) {
        inWindow = false;
        windows.push({ start, end: h === 23 ? h : h - 1, type: 'full' });
      }
    }

    // 如果没有全员窗口，找最佳部分窗口
    if (!windows.length && cities.length > 0) {
      for (let h = 0; h < 24; h++) {
        const overlap = cities.filter(tz => isWorkAtUTC(tz, h)).length;
        if (overlap >= maxOverlap && maxOverlap >= 2 && !inWindow) {
          inWindow = true;
          start = h;
        }
        if ((overlap < maxOverlap || h === 23) && inWindow) {
          inWindow = false;
          windows.push({ start, end: h === 23 ? h : h - 1, type: 'partial', overlap: maxOverlap });
        }
      }
    }

    return { windows, maxOverlap };
  }

  // 渲染面板
  function renderPanel() {
    let panel = document.getElementById('meeting-panel');
    if (panel) { panel.remove(); return; } // toggle

    panel = document.createElement('div');
    panel.id = 'meeting-panel';
    panel.style.cssText = 'margin:1.5rem auto;max-width:900px;background:var(--bg-card);border-radius:16px;padding:1.5rem;box-shadow:var(--shadow);text-align:left;';

    const cities = load();
    if (!cities.length) {
      panel.innerHTML = '<p style="color:var(--text-secondary);font-size:0.95rem;text-align:center;padding:1.5rem 0;">请先在上方搜索并添加城市，然后开启会议模式。</p>';
      const target = document.getElementById('custom-city-cards');
      if (target) target.after(panel);
      return;
    }

    let html = '';

    // ══════════════════════════════════════
    // Part 1: 最佳会议时段推荐
    // ══════════════════════════════════════
    const { windows, maxOverlap } = findBestWindows(cities);
    const utcNow = currentUTCHour();

    html += '<div style="margin-bottom:1.5rem;padding:1.2rem 1.5rem;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-radius:12px;border:1.5px solid #6ee7b7;">';
    html += '<div style="font-size:1.1rem;font-weight:700;color:#065f46;margin-bottom:0.8rem;">📅 最佳会议时段</div>';

    if (windows.length > 0) {
      const best = windows[0];
      const typeLabel = best.type === 'full' ? '✅ 全员可参会' : `⚡ ${best.overlap}/${cities.length} 人可参会`;

      html += `<div style="display:flex;align-items:baseline;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.6rem;">`;
      html += `<span style="background:#059669;color:#fff;padding:3px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;">${typeLabel}</span>`;
      html += `<span style="font-size:1.2rem;font-weight:700;color:#1a1a2e;">UTC ${fmtHour(best.start)} — ${fmtHour(best.end)}</span>`;
      html += `</div>`;

      // 各城市对应时间
      html += '<div style="display:flex;flex-wrap:wrap;gap:0.6rem 1.5rem;font-size:0.88rem;color:#374151;">';
      cities.forEach(tz => {
        const startLocal = fmtLocalTime(tz, best.start);
        const endLocal = fmtLocalTime(tz, best.end);
        const isWork = isWorkAtUTC(tz, best.start);
        const icon = isWork ? '🟢' : '🟡';
        html += `<span>${flagEmoji(tz)} <b>${cnName(tz)}</b> ${startLocal}—${endLocal} ${icon}</span>`;
      });
      html += '</div>';

      // 如果还有其他窗口，也列出来
      if (windows.length > 1) {
        html += '<div style="margin-top:0.5rem;font-size:0.8rem;color:#6b7280;">';
        windows.slice(1).forEach(w => {
          html += `另可: UTC ${fmtHour(w.start)}—${fmtHour(w.end)} `;
        });
        html += '</div>';
      }
    } else {
      html += '<span style="color:#92400e;font-size:0.95rem;">⚠️ 这些城市的工作时段没有重叠，无法安排全体会议。</span>';
    }
    html += '</div>';

    // ══════════════════════════════════════
    // Part 2: 城市工作时间线
    // ══════════════════════════════════════
    html += '<div style="overflow-x:auto;margin-bottom:1rem;">';
    html += '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;min-width:700px;">';

    // 表头 — UTC 小时标签
    html += '<tr><th style="padding:4px 10px;text-align:left;color:var(--text-secondary);font-weight:500;min-width:90px;">城市</th>';
    for (let h = 0; h < 24; h++) {
      const isNow = h === utcNow;
      html += `<th style="padding:2px 1px;text-align:center;font-weight:${isNow?'700':'400'};font-size:0.7rem;color:${isNow?'#2563eb':'var(--text-secondary)'};">${h}</th>`;
    }
    html += '</tr>';

    // 每个城市一行
    cities.forEach(tz => {
      html += `<tr><td style="padding:5px 10px;font-weight:600;white-space:nowrap;color:var(--text);">${flagEmoji(tz)} ${cnName(tz)}</td>`;
      for (let h = 0; h < 24; h++) {
        const isNow = h === utcNow;
        const localH = localHourAtUTC(tz, h);

        let bg, text = '';
        if (localH < 0) {
          bg = '#f3f4f6';
        } else if (localH >= WORK_HOURS.start && localH < WORK_HOURS.end) {
          bg = '#bbf7d0'; // 工作时间
        } else if (localH >= 22 || localH < 6) {
          bg = '#f3f4f6'; // 深夜
        } else {
          bg = '#fef3c7'; // 非工作
        }

        const nowStyle = isNow ? 'box-shadow:inset 0 0 0 2px #2563eb;' : '';

        html += `<td style="padding:2px;text-align:center;background:${bg};border-radius:2px;min-width:18px;font-size:0.65rem;font-weight:700;${nowStyle}">${text}</td>`;
      }
      html += '</tr>';
    });

    // 底部：重叠人数行
    html += '<tr style="border-top:2px solid #e5e7eb;">';
    html += '<td style="padding:6px 10px;font-weight:700;color:#059669;white-space:nowrap;">可参会人数</td>';
    for (let h = 0; h < 24; h++) {
      const overlap = cities.filter(tz => isWorkAtUTC(tz, h)).length;
      const isNow = h === utcNow;
      let bg, fg;
      if (overlap === cities.length) { bg = '#059669'; fg = '#fff'; }
      else if (overlap >= cities.length * 0.6) { bg = '#fbbf24'; fg = '#1a1a2e'; }
      else if (overlap >= 1) { bg = '#f3f4f6'; fg = '#6b7280'; }
      else { bg = '#fafafa'; fg = '#d1d5db'; }

      html += `<td style="padding:2px;text-align:center;background:${bg};color:${fg};border-radius:3px;font-size:0.75rem;font-weight:600;${isNow?'box-shadow:inset 0 0 0 2px #2563eb;':''}">${overlap > 0 ? overlap : ''}</td>`;
    }
    html += '</tr>';

    html += '</table></div>';

    // ══════════════════════════════════════
    // Part 3: 图例
    // ══════════════════════════════════════
    html += '<div style="display:flex;flex-wrap:wrap;gap:1rem;font-size:0.78rem;color:var(--text-secondary);padding:0.5rem 0;">';
    html += '<span style="display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:14px;height:14px;background:#bbf7d0;border-radius:2px;"></span> 工作时段 (9:00-17:00)</span>';
    html += '<span style="display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:14px;height:14px;background:#fef3c7;border-radius:2px;"></span> 非工作时段</span>';
    html += '<span style="display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:14px;height:14px;background:#f3f4f6;border-radius:2px;"></span> 深夜 (22:00-6:00)</span>';
    html += '<span style="display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:14px;height:14px;background:#bbf7d0;border-radius:2px;box-shadow:inset 0 0 0 2px #2563eb;"></span> 当前时刻（蓝框）</span>';
    html += '<span style="display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:14px;height:14px;background:#059669;border-radius:2px;"></span> 全员可参会</span>';
    html += '</div>';
    html += '<p style="font-size:0.75rem;color:var(--text-tertiary);margin-top:0.3rem;">横轴为 UTC 时间，点击按钮可关闭面板。</p>';

    panel.innerHTML = html;

    const target = document.getElementById('custom-city-cards');
    if (target) target.after(panel); else {
      const hero = document.querySelector('.hero');
      if (hero) hero.after(panel);
    }

    // 滚动到面板
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // 注入切换按钮
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
