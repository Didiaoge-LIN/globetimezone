// meeting-planner.js — V11 i18n 会议规划模式
(() => {
  const STORAGE_KEY = 'gtz_custom_cities';
  const WORK_HOURS = { start: 9, end: 17 };

  // ═══════ i18n 工具 ═══════
  function t(key, fallback) {
    if (typeof window.GTZ_T === 'function') return window.GTZ_T(key, fallback);
    return fallback !== undefined ? fallback : key;
  }
  const LANG = (typeof window.GTZ_LANG === 'string') ? window.GTZ_LANG : 'zh';

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  }

  // 获取本地化城市名
  function cityName(tz) {
    // 优先用 i18n 翻译
    const TZ_CITY_KEY = {
      'Asia/Shanghai':'mp.city.shanghai','Asia/Tokyo':'mp.city.tokyo',
      'Asia/Seoul':'mp.city.seoul','Asia/Singapore':'mp.city.singapore',
      'Asia/Dubai':'mp.city.dubai','Asia/Kolkata':'mp.city.mumbai',
      'Asia/Hong_Kong':'mp.city.hk','Asia/Bangkok':'mp.city.bangkok',
      'Asia/Jakarta':'mp.city.jakarta','Asia/Taipei':'mp.city.taipei',
      'Asia/Karachi':'mp.city.karachi','Asia/Dhaka':'mp.city.dhaka',
      'Europe/London':'mp.city.london','Europe/Paris':'mp.city.paris',
      'Europe/Berlin':'mp.city.berlin','Europe/Moscow':'mp.city.moscow',
      'Europe/Madrid':'mp.city.madrid','Europe/Rome':'mp.city.rome',
      'Europe/Amsterdam':'mp.city.amsterdam','Europe/Istanbul':'mp.city.istanbul',
      'America/New_York':'mp.city.newyork','America/Chicago':'mp.city.chicago',
      'America/Denver':'mp.city.denver','America/Los_Angeles':'mp.city.la',
      'America/Toronto':'mp.city.toronto','America/Vancouver':'mp.city.vancouver',
      'America/Mexico_City':'mp.city.mexico','America/Sao_Paulo':'mp.city.saopaulo',
      'Australia/Sydney':'mp.city.sydney','Pacific/Auckland':'mp.city.auckland',
      'Africa/Cairo':'mp.city.cairo','Africa/Johannesburg':'mp.city.johannesburg',
      'Africa/Lagos':'mp.city.lagos',
    };
    const i18nKey = TZ_CITY_KEY[tz];
    if (i18nKey) {
      const translated = t(i18nKey, null);
      if (translated && translated !== i18nKey) return translated;
    }
    // 回退中文映射
    const map = window.__gtz_tzToCN;
    if (map && map[tz] && map[tz].length > 0) return map[tz][0];
    // 最终回退 IANA 城市名
    return tz.replace(/_/g, ' ').split('/').pop();
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
      const h = parseInt(
        new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(fakeDate),
        10
      );
      return isNaN(h) ? -1 : h;
    } catch { return -1; }
  }

  function currentUTCHour() { return new Date().getUTCHours(); }

  function isWorkAtUTC(tz, utcHour) {
    const localH = localHourAtUTC(tz, utcHour);
    return localH >= WORK_HOURS.start && localH < WORK_HOURS.end;
  }

  function fmtHour(h) { return String(h).padStart(2, '0') + ':00'; }
  function fmtLocalTime(tz, utcHour) {
    const localH = localHourAtUTC(tz, utcHour);
    if (localH < 0) return '--';
    return String(localH).padStart(2, '0') + ':00';
  }

  function findBestWindows(cities) {
    const windows = [];
    let inWindow = false, start = -1, maxOverlap = 0;

    for (let h = 0; h < 24; h++) {
      const overlap = cities.filter(tz => isWorkAtUTC(tz, h)).length;
      if (overlap > maxOverlap) maxOverlap = overlap;
      if (overlap === cities.length && !inWindow) { inWindow = true; start = h; }
      if ((overlap < cities.length || h === 23) && inWindow) {
        inWindow = false;
        windows.push({ start, end: h === 23 ? h : h - 1, type: 'full' });
      }
    }

    if (!windows.length && cities.length > 0) {
      for (let h = 0; h < 24; h++) {
        const overlap = cities.filter(tz => isWorkAtUTC(tz, h)).length;
        if (overlap >= maxOverlap && maxOverlap >= 2 && !inWindow) { inWindow = true; start = h; }
        if ((overlap < maxOverlap || h === 23) && inWindow) {
          inWindow = false;
          windows.push({ start, end: h === 23 ? h : h - 1, type: 'partial', overlap: maxOverlap });
        }
      }
    }
    return { windows, maxOverlap };
  }

  function renderPanel() {
    let panel = document.getElementById('meeting-panel');
    if (panel) { panel.remove(); return; }

    panel = document.createElement('div');
    panel.id = 'meeting-panel';
    panel.style.cssText = 'margin:1.5rem auto;max-width:900px;background:var(--bg-card);border-radius:16px;padding:1.5rem;box-shadow:var(--shadow);text-align:left;';

    const cities = load();
    if (!cities.length) {
      panel.innerHTML = '<p style="color:var(--text-secondary);font-size:0.95rem;text-align:center;padding:1.5rem 0;">' + t('meeting.add_cities_first','请先在上方搜索并添加城市，然后开启会议模式。') + '</p>';
      const target = document.getElementById('custom-city-cards');
      if (target) target.after(panel);
      return;
    }

    let html = '';
    const { windows } = findBestWindows(cities);
    const utcNow = currentUTCHour();

    // Part 1: Best Meeting Time
    html += '<div style="margin-bottom:1.5rem;padding:1.2rem 1.5rem;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-radius:12px;border:1.5px solid #6ee7b7;">';
    html += '<div style="font-size:1.1rem;font-weight:700;color:#065f46;margin-bottom:0.8rem;">' + t('meeting.best_time','📅 最佳会议时段') + '</div>';

    if (windows.length > 0) {
      const best = windows[0];
      const typeLabel = best.type === 'full'
        ? t('meeting.all_available','✅ 全员可参会')
        : '⚡ ' + best.overlap + '/' + cities.length + ' ' + t('meeting.partial_available','人可参会');

      html += '<div style="display:flex;align-items:baseline;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.6rem;">';
      html += '<span style="background:#059669;color:#fff;padding:3px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;">' + typeLabel + '</span>';
      html += '<span style="font-size:1.2rem;font-weight:700;color:#1a1a2e;">UTC ' + fmtHour(best.start) + ' — ' + fmtHour(best.end) + '</span>';
      html += '</div>';

      html += '<div style="display:flex;flex-wrap:wrap;gap:0.6rem 1.5rem;font-size:0.88rem;color:#374151;">';
      cities.forEach(tz => {
        const startLocal = fmtLocalTime(tz, best.start);
        const endLocal = fmtLocalTime(tz, best.end);
        const isWork = isWorkAtUTC(tz, best.start);
        const icon = isWork ? '🟢' : '🟡';
        html += '<span>' + flagEmoji(tz) + ' <b>' + cityName(tz) + '</b> ' + startLocal + '—' + endLocal + ' ' + icon + '</span>';
      });
      html += '</div>';

      if (windows.length > 1) {
        html += '<div style="margin-top:0.5rem;font-size:0.8rem;color:#6b7280;">';
        windows.slice(1).forEach(w => {
          html += t('meeting.other_times','另可:') + ' UTC ' + fmtHour(w.start) + '—' + fmtHour(w.end) + ' ';
        });
        html += '</div>';
      }
    } else {
      html += '<span style="color:#92400e;font-size:0.95rem;">' + t('meeting.no_overlap','⚠️ 这些城市的工作时段没有重叠，无法安排全体会议。') + '</span>';
    }
    html += '</div>';

    // Part 2: Timeline
    html += '<div style="overflow-x:auto;margin-bottom:1rem;">';
    html += '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;min-width:700px;">';

    html += '<tr><th style="padding:4px 10px;text-align:left;color:var(--text-secondary);font-weight:500;min-width:90px;">' + t('meeting.city_label','城市') + '</th>';
    for (let h = 0; h < 24; h++) {
      const isNow = h === utcNow;
      html += '<th style="padding:2px 1px;text-align:center;font-weight:' + (isNow?'700':'400') + ';font-size:0.7rem;color:' + (isNow?'#2563eb':'var(--text-secondary)') + ';">' + h + '</th>';
    }
    html += '</tr>';

    cities.forEach(tz => {
      html += '<tr><td style="padding:5px 10px;font-weight:600;white-space:nowrap;color:var(--text);">' + flagEmoji(tz) + ' ' + cityName(tz) + '</td>';
      for (let h = 0; h < 24; h++) {
        const isNow = h === utcNow;
        const localH = localHourAtUTC(tz, h);
        let bg, text = '';
        if (localH < 0) { bg = '#f3f4f6'; }
        else if (localH >= WORK_HOURS.start && localH < WORK_HOURS.end) { bg = '#bbf7d0'; }
        else if (localH >= 22 || localH < 6) { bg = '#f3f4f6'; }
        else { bg = '#fef3c7'; }
        const nowStyle = isNow ? 'box-shadow:inset 0 0 0 2px #2563eb;' : '';
        html += '<td style="padding:2px;text-align:center;background:' + bg + ';border-radius:2px;min-width:18px;font-size:0.65rem;font-weight:700;' + nowStyle + '">' + text + '</td>';
      }
      html += '</tr>';
    });

    // Available count row
    html += '<tr style="border-top:2px solid #e5e7eb;">';
    html += '<td style="padding:6px 10px;font-weight:700;color:#059669;white-space:nowrap;">' + t('meeting.available_count','可参会人数') + '</td>';
    for (let h = 0; h < 24; h++) {
      const overlap = cities.filter(tz => isWorkAtUTC(tz, h)).length;
      const isNow = h === utcNow;
      let bg, fg;
      if (overlap === cities.length) { bg = '#059669'; fg = '#fff'; }
      else if (overlap >= cities.length * 0.6) { bg = '#fbbf24'; fg = '#1a1a2e'; }
      else if (overlap >= 1) { bg = '#f3f4f6'; fg = '#6b7280'; }
      else { bg = '#fafafa'; fg = '#d1d5db'; }
      html += '<td style="padding:2px;text-align:center;background:' + bg + ';color:' + fg + ';border-radius:3px;font-size:0.75rem;font-weight:600;' + (isNow?'box-shadow:inset 0 0 0 2px #2563eb;':'') + '">' + (overlap > 0 ? overlap : '') + '</td>';
    }
    html += '</tr>';
    html += '</table></div>';

    // Part 3: Legend
    html += '<div style="display:flex;flex-wrap:wrap;gap:1rem;font-size:0.78rem;color:var(--text-secondary);padding:0.5rem 0;">';
    html += '<span style="display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:14px;height:14px;background:#bbf7d0;border-radius:2px;"></span> ' + t('meeting.legend_work','工作时段 (9:00-17:00)') + '</span>';
    html += '<span style="display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:14px;height:14px;background:#fef3c7;border-radius:2px;"></span> ' + t('meeting.legend_off','非工作时段') + '</span>';
    html += '<span style="display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:14px;height:14px;background:#f3f4f6;border-radius:2px;"></span> ' + t('meeting.legend_night','深夜 (22:00-6:00)') + '</span>';
    html += '<span style="display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:14px;height:14px;background:#bbf7d0;border-radius:2px;box-shadow:inset 0 0 0 2px #2563eb;"></span> ' + t('meeting.legend_now','当前时刻（蓝框）') + '</span>';
    html += '<span style="display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:14px;height:14px;background:#059669;border-radius:2px;"></span> ' + t('meeting.legend_all','全员可参会') + '</span>';
    html += '</div>';
    html += '<p style="font-size:0.75rem;color:var(--text-tertiary);margin-top:0.3rem;">' + t('meeting.hint','横轴为 UTC 时间，点击按钮可关闭面板。') + '</p>';

    panel.innerHTML = html;

    const target = document.getElementById('custom-city-cards');
    if (target) target.after(panel); else {
      const hero = document.querySelector('.hero');
      if (hero) hero.after(panel);
    }
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function injectButton() {
    let btn = document.getElementById('meeting-toggle');
    if (!btn) {
      const hero = document.querySelector('.hero');
      if (!hero) return;
      btn = document.createElement('button');
      btn.id = 'meeting-toggle';
      btn.style.cssText = 'margin:0.8rem auto 0;display:block;padding:0.5rem 1.5rem;font-size:0.9rem;border:1.5px solid var(--accent);background:transparent;color:var(--accent);border-radius:8px;cursor:pointer;';
      btn.addEventListener('mouseenter', () => { btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; btn.style.color = 'var(--accent)'; });
      btn.addEventListener('click', renderPanel);
      hero.appendChild(btn);
    }
    // 刷新按钮文本（i18n 异步加载后更新）
    btn.textContent = t('meeting.toggle_btn','📅 会议规划模式');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }

  // i18n 语言包异步加载完成后，刷新所有动态翻译文本
  window.addEventListener('gtz-i18n-ready', function () {
    injectButton();
    // 如果面板已打开，刷新其内容
    var panel = document.getElementById('meeting-panel');
    if (panel && panel.style.display !== 'none') renderPanel();
  });
})();
