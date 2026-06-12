// custom-cities.js — V11 全量升级
// 模块 1: 收藏⭐ + 拖拽排序 + IP定位
// 模块 2: 12/24小时制 + 日期格式切换
// 模块 3: 7段状态标签 + 自定义工作时段
// 模块 4: 单点时区换算器
// 模块 7: 书签引导提示
// 模块 11: GA4埋点
// 依赖：localStorage，Intl.supportedValuesOf
(() => {
  // ═══════ 存储键 ═══════
  const STORAGE_KEY     = 'gtz_custom_cities';
  const FAVORITES_KEY   = 'globetimezone_favorites';
  const FORMAT_KEY      = 'globetimezone_time_format';
  const DARK_KEY        = 'globetimezone_dark_mode';
  const CUSTOM_STATUS_K = 'globetimezone_custom_status';
  const BOOKMARK_TIP_K  = 'globetimezone_bookmark_tip';
  const FIRST_VISIT_K   = 'globetimezone_first_visit';
  const DEFAULTS        = ['America/New_York','Europe/London','Asia/Tokyo','Asia/Shanghai'];

  // ═══════ 数据层 ═══════
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [...DEFAULTS]; } catch { return [...DEFAULTS]; }
  }
  function save(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
  }
  function lsAvailable() {
    try { localStorage.setItem('__test__','1'); localStorage.removeItem('__test__'); return true; } catch { return false; }
  }
  function getAllTimezones() {
    try { return Intl.supportedValuesOf('timeZone') || []; } catch { return []; }
  }

  // ═══════ 格式配置 ═══════
  function getFormat() {
    try { return JSON.parse(localStorage.getItem(FORMAT_KEY)) || { hour24: true, dateFormat: 'yyyy-mm-dd' }; }
    catch { return { hour24: true, dateFormat: 'yyyy-mm-dd' }; }
  }
  function saveFormat(f) { try { localStorage.setItem(FORMAT_KEY, JSON.stringify(f)); } catch {} }

  // ═══════ 收藏层 ═══════
  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; } catch { return []; }
  }
  function saveFavs(list) { try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(list)); } catch {} }
  function isFav(tz) { return getFavs().includes(tz); }
  function toggleFav(tz) {
    const favs = getFavs();
    if (favs.includes(tz)) {
      saveFavs(favs.filter(t => t !== tz));
      showToast(gtz_t('toast.fav_removed','✅ 已取消收藏'));
      trackEvent('favorite_remove', { city: tz });
      return false;
    } else {
      saveFavs([...favs, tz]);
      showToast(gtz_t('toast.fav_saved','✅ 已保存到本地，下次打开自动显示'));
      trackEvent('favorite_add', { city: tz });
      // 分发事件给书签引导
      document.dispatchEvent(new CustomEvent('favorite-added'));
      return true;
    }
  }

  // ═══════ i18n 工具 ═══════
  function gtz_t(key, fallback) {
    if (typeof window.GTZ_T === 'function') return window.GTZ_T(key, fallback);
    return fallback !== undefined ? fallback : key;
  }

  // ═══════ 7段状态配置 ═══════
  const DEFAULT_STATUS_CONFIG = [
    { i18nKey: 'custom.status.sleep',   name: '深度睡眠', start: 0,  end: 6,  color: '#1e3a8a', emoji: '😴', cssClass: 'status-sleep' },
    { i18nKey: 'custom.status.morning', name: '清晨勿扰', start: 6,  end: 9,  color: '#3b82f6', emoji: '🌅', cssClass: 'status-morning' },
    { i18nKey: 'custom.status.working', name: '黄金工作', start: 9,  end: 12, color: '#10b981', emoji: '💼', cssClass: 'status-working' },
    { i18nKey: 'custom.status.lunch',   name: '午休低响', start: 12, end: 14, color: '#f59e0b', emoji: '🍜', cssClass: 'status-lunch' },
    { i18nKey: 'custom.status.working', name: '黄金工作', start: 14, end: 17, color: '#10b981', emoji: '💼', cssClass: 'status-working' },
    { i18nKey: 'custom.status.off',     name: '即将下班', start: 17, end: 19, color: '#f97316', emoji: '🌇', cssClass: 'status-off' },
    { i18nKey: 'custom.status.night',   name: '私人时间', start: 19, end: 24, color: '#8b5cf6', emoji: '🌙', cssClass: 'status-night' }
  ];

  function getCustomStatus(tz) {
    try {
      const all = JSON.parse(localStorage.getItem(CUSTOM_STATUS_K)) || {};
      return all[tz] || null;
    } catch { return null; }
  }
  function saveCustomStatus(tz, workStart, workEnd) {
    try {
      const all = JSON.parse(localStorage.getItem(CUSTOM_STATUS_K)) || {};
      all[tz] = { workStart, workEnd };
      localStorage.setItem(CUSTOM_STATUS_K, JSON.stringify(all));
    } catch {}
  }
  function getCityStatus(tz) {
    const hour = getHour(tz);
    const custom = getCustomStatus(tz);
    if (custom) {
      if (hour >= custom.workStart && hour < custom.workEnd)
        return { name: gtz_t('custom.status.working','黄金工作'), color: '#10b981', emoji: '💼', cssClass: 'status-working' };
      if (hour >= 22 || hour < 6)
        return { name: gtz_t('custom.status.sleep','深度睡眠'), color: '#1e3a8a', emoji: '😴', cssClass: 'status-sleep' };
      return { name: gtz_t('custom.status.offhours','非工作时段'), color: '#94a3b8', emoji: '🟡', cssClass: 'status-off' };
    }
    const cfg = DEFAULT_STATUS_CONFIG.find(s => hour >= s.start && hour < s.end);
    const c = cfg || DEFAULT_STATUS_CONFIG[0];
    return { ...c, name: gtz_t(c.i18nKey, c.name) };
  }

  // ═══════ 中文名映射 ═══════
  const CN_NAMES = {
    '日本':'Asia/Tokyo','东京':'Asia/Tokyo','大阪':'Asia/Tokyo',
    '韩国':'Asia/Seoul','首尔':'Asia/Seoul','朝鲜':'Asia/Pyongyang','平壤':'Asia/Pyongyang',
    '蒙古':'Asia/Ulaanbaatar','乌兰巴托':'Asia/Ulaanbaatar',
    '中国':'Asia/Shanghai','北京':'Asia/Shanghai','上海':'Asia/Shanghai',
    '香港':'Asia/Hong_Kong','台湾':'Asia/Taipei','台北':'Asia/Taipei','澳门':'Asia/Macau',
    '新加坡':'Asia/Singapore','泰国':'Asia/Bangkok','曼谷':'Asia/Bangkok',
    '越南':'Asia/Ho_Chi_Minh','胡志明':'Asia/Ho_Chi_Minh','河内':'Asia/Ho_Chi_Minh',
    '印尼':'Asia/Jakarta','雅加达':'Asia/Jakarta','巴厘岛':'Asia/Makassar',
    '菲律宾':'Asia/Manila','马尼拉':'Asia/Manila',
    '马来西亚':'Asia/Kuala_Lumpur','吉隆坡':'Asia/Kuala_Lumpur',
    '缅甸':'Asia/Yangon','仰光':'Asia/Yangon','柬埔寨':'Asia/Phnom_Penh','金边':'Asia/Phnom_Penh',
    '印度':'Asia/Kolkata','德里':'Asia/Kolkata','新德里':'Asia/Kolkata','孟买':'Asia/Kolkata',
    '巴基斯坦':'Asia/Karachi','卡拉奇':'Asia/Karachi',
    '孟加拉':'Asia/Dhaka','达卡':'Asia/Dhaka','斯里兰卡':'Asia/Colombo',
    '尼泊尔':'Asia/Kathmandu','加德满都':'Asia/Kathmandu',
    '阿联酋':'Asia/Dubai','迪拜':'Asia/Dubai','沙特':'Asia/Riyadh','利雅得':'Asia/Riyadh',
    '卡塔尔':'Asia/Qatar','多哈':'Asia/Qatar',
    '以色列':'Asia/Jerusalem','耶路撒冷':'Asia/Jerusalem',
    '伊朗':'Asia/Tehran','德黑兰':'Asia/Tehran',
    '土耳其':'Europe/Istanbul','伊斯坦布尔':'Europe/Istanbul',
    '英国':'Europe/London','伦敦':'Europe/London',
    '法国':'Europe/Paris','巴黎':'Europe/Paris',
    '德国':'Europe/Berlin','柏林':'Europe/Berlin',
    '意大利':'Europe/Rome','罗马':'Europe/Rome',
    '西班牙':'Europe/Madrid','马德里':'Europe/Madrid',
    '荷兰':'Europe/Amsterdam','阿姆斯特丹':'Europe/Amsterdam',
    '瑞士':'Europe/Zurich','苏黎世':'Europe/Zurich',
    '瑞典':'Europe/Stockholm','斯德哥尔摩':'Europe/Stockholm',
    '挪威':'Europe/Oslo','奥斯陆':'Europe/Oslo',
    '丹麦':'Europe/Copenhagen','哥本哈根':'Europe/Copenhagen',
    '芬兰':'Europe/Helsinki','赫尔辛基':'Europe/Helsinki',
    '波兰':'Europe/Warsaw','华沙':'Europe/Warsaw',
    '希腊':'Europe/Athens','雅典':'Europe/Athens',
    '葡萄牙':'Europe/Lisbon','里斯本':'Europe/Lisbon',
    '爱尔兰':'Europe/Dublin','都柏林':'Europe/Dublin',
    '比利时':'Europe/Brussels','布鲁塞尔':'Europe/Brussels',
    '奥地利':'Europe/Vienna','维也纳':'Europe/Vienna',
    '捷克':'Europe/Prague','布拉格':'Europe/Prague',
    '匈牙利':'Europe/Budapest','布达佩斯':'Europe/Budapest',
    '俄罗斯':'Europe/Moscow','莫斯科':'Europe/Moscow',
    '乌克兰':'Europe/Kiev','基辅':'Europe/Kiev',
    '美国':'America/New_York','纽约':'America/New_York',
    '洛杉矶':'America/Los_Angeles','旧金山':'America/Los_Angeles','硅谷':'America/Los_Angeles',
    '芝加哥':'America/Chicago','西雅图':'America/Los_Angeles',
    '华盛顿':'America/New_York','波士顿':'America/New_York','迈阿密':'America/New_York',
    '休斯顿':'America/Chicago','丹佛':'America/Denver',
    '凤凰城':'America/Phoenix','拉斯维加斯':'America/Los_Angeles',
    '加拿大':'America/Toronto','多伦多':'America/Toronto',
    '温哥华':'America/Vancouver','蒙特利尔':'America/Toronto',
    '墨西哥':'America/Mexico_City','墨西哥城':'America/Mexico_City',
    '巴西':'America/Sao_Paulo','圣保罗':'America/Sao_Paulo','里约':'America/Sao_Paulo',
    '阿根廷':'America/Argentina/Buenos_Aires','布宜诺斯艾利斯':'America/Argentina/Buenos_Aires',
    '智利':'America/Santiago','圣地亚哥':'America/Santiago',
    '哥伦比亚':'America/Bogota','波哥大':'America/Bogota',
    '秘鲁':'America/Lima','利马':'America/Lima',
    '澳大利亚':'Australia/Sydney','悉尼':'Australia/Sydney',
    '墨尔本':'Australia/Melbourne','布里斯班':'Australia/Brisbane',
    '珀斯':'Australia/Perth','阿德莱德':'Australia/Adelaide',
    '新西兰':'Pacific/Auckland','奥克兰':'Pacific/Auckland',
    '埃及':'Africa/Cairo','开罗':'Africa/Cairo',
    '南非':'Africa/Johannesburg','约翰内斯堡':'Africa/Johannesburg',
    '尼日利亚':'Africa/Lagos','拉各斯':'Africa/Lagos',
    '肯尼亚':'Africa/Nairobi','内罗毕':'Africa/Nairobi',
    '摩洛哥':'Africa/Casablanca','卡萨布兰卡':'Africa/Casablanca',
    '埃塞俄比亚':'Africa/Addis_Ababa',
  };

  let tzToCN = {};
  (function buildIndex() {
    for (const [cn, tz] of Object.entries(CN_NAMES)) {
      if (!tzToCN[tz]) tzToCN[tz] = [];
      if (!tzToCN[tz].includes(cn)) tzToCN[tz].push(cn);
    }
  })();
  window.__gtz_tzToCN = tzToCN;
  window.__gtz_CN_NAMES = CN_NAMES;

  // timezone → mp.city i18n key 映射（供 GTZ_T 翻译用）
  const TZ_CITY_KEY = {
    'Asia/Shanghai':'mp.city.shanghai','Asia/Tokyo':'mp.city.tokyo',
    'Asia/Seoul':'mp.city.seoul','Asia/Singapore':'mp.city.singapore',
    'Asia/Dubai':'mp.city.dubai','Asia/Kolkata':'mp.city.mumbai',
    'Asia/Hong_Kong':'mp.city.hk','Asia/Bangkok':'mp.city.bangkok',
    'Asia/Jakarta':'mp.city.jakarta','Asia/Taipei':'mp.city.taipei',
    'Asia/Karachi':'mp.city.karachi','Asia/Dhaka':'mp.city.dhaka',
    'Asia/Kathmandu':'mp.city.kathmandu','Asia/Riyadh':'mp.city.riyadh',
    'Europe/London':'mp.city.london','Europe/Paris':'mp.city.paris',
    'Europe/Berlin':'mp.city.berlin','Europe/Moscow':'mp.city.moscow',
    'Europe/Madrid':'mp.city.madrid','Europe/Rome':'mp.city.rome',
    'Europe/Amsterdam':'mp.city.amsterdam','Europe/Istanbul':'mp.city.istanbul',
    'Europe/Vienna':'mp.city.vienna','Europe/Stockholm':'mp.city.stockholm',
    'America/New_York':'mp.city.newyork','America/Chicago':'mp.city.chicago',
    'America/Denver':'mp.city.denver','America/Los_Angeles':'mp.city.la',
    'America/Toronto':'mp.city.toronto','America/Vancouver':'mp.city.vancouver',
    'America/Mexico_City':'mp.city.mexico','America/Sao_Paulo':'mp.city.saopaulo',
    'America/Argentina/Buenos_Aires':'mp.city.buenosaires',
    'Australia/Sydney':'mp.city.sydney','Pacific/Auckland':'mp.city.auckland',
    'Africa/Cairo':'mp.city.cairo','Africa/Johannesburg':'mp.city.johannesburg',
    'Africa/Lagos':'mp.city.lagos',
  };

  // ═══════ 工具函数 ═══════
  function tzLabelRaw(tz) { return tz.replace(/_/g, ' ').split('/').pop(); }
  function getCNName(tz) {
    // 优先用 i18n 翻译（非中文语言时显示本地化城市名）
    const i18nKey = TZ_CITY_KEY[tz];
    if (i18nKey) {
      const translated = gtz_t(i18nKey, null);
      if (translated && translated !== i18nKey) return translated;
    }
    // 回退：中文名映射表
    if (tzToCN[tz] && tzToCN[tz].length) return tzToCN[tz][0];
    return tzLabelRaw(tz);
  }
  function getHour(tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).formatToParts(new Date());
      const h = parts.find(p => p.type === 'hour');
      return h ? parseInt(h.value, 10) : new Date().getUTCHours();
    } catch { return new Date().getUTCHours(); }
  }

  // ═══════ Toast ═══════
  function showToast(msg, dur) {
    const existing = document.getElementById('gtz-toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.id = 'gtz-toast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:72px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:8px 20px;border-radius:24px;font-size:14px;z-index:99999;opacity:0;transition:opacity 0.3s;pointer-events:none;white-space:nowrap;';
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; });
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, dur || 1500);
  }

  // ═══════ GA4埋点 ═══════
  function trackEvent(name, params) {
    try {
      if (typeof gtag === 'function') gtag('event', name, params || {});
      if (typeof window._hmt !== 'undefined' && window._hmt.push) window._hmt.push(['_trackEvent', name, 'interact']);
    } catch {}
  }

  // ═══════ 当前语言 ═══════
  const LANG = (typeof window.GTZ_LANG === 'string') ? window.GTZ_LANG : 'zh';
  const DATE_LOCALE = (LANG === 'zh') ? 'zh-CN' : LANG;

  // ═══════ 时间格式化（模块2）═══════
  function formatTimeStr(date, tz, fmt) {
    const f = fmt || getFormat();
    try {
      return new Intl.DateTimeFormat(DATE_LOCALE, {
        timeZone: tz,
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: !f.hour24
      }).format(date);
    } catch { return '--:--:--'; }
  }
  function formatDateStr(date, tz, fmt) {
    const f = fmt || getFormat();
    try {
      const parts = new Intl.DateTimeFormat(DATE_LOCALE, {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
      }).formatToParts(date);
      const pp = {};
      parts.forEach(p => { pp[p.type] = p.value; });
      const y = pp.year, m = pp.month, d = pp.day, wd = pp.weekday;
      let dateStr;
      switch (f.dateFormat) {
        case 'mm/dd/yyyy': dateStr = `${m}/${d}/${y}`; break;
        case 'dd/mm/yyyy': dateStr = `${d}/${m}/${y}`; break;
        default: dateStr = `${y}-${m}-${d}`;
      }
      return `${wd} ${dateStr}`;
    } catch { return ''; }
  }

  // ═══════ 换算器（模块4）═══════
  let converterActive = false;
  let converterBaseTz = null;
  let converterBaseTime = null;
  let debounceTimer = null;

  function parseTime(input) {
    input = input.trim().toLowerCase();
    if (/^\d{4}$/.test(input)) {
      const h = parseInt(input.slice(0,2)), m = parseInt(input.slice(2,4));
      if (h >= 0 && h < 24 && m >= 0 && m < 60) return new Date(1970,0,1,h,m);
    }
    if (/^\d{1,2}:\d{2}$/.test(input)) {
      const [h,m] = input.split(':').map(Number);
      if (h >= 0 && h < 24 && m >= 0 && m < 60) return new Date(1970,0,1,h,m);
    }
    const ampm = input.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    if (ampm) {
      let h = parseInt(ampm[1]), m = ampm[2] ? parseInt(ampm[2]) : 0;
      if (ampm[3] === 'pm' && h !== 12) h += 12;
      if (ampm[3] === 'am' && h === 12) h = 0;
      if (h >= 0 && h < 24) return new Date(1970,0,1,h,m);
    }
    const cn = input.match(/^(上午|下午)(\d{1,2})点(?:(\d{1,2})分)?$/);
    if (cn) {
      let h = parseInt(cn[2]), m = cn[3] ? parseInt(cn[3]) : 0;
      if (cn[1] === '下午' && h !== 12) h += 12;
      if (cn[1] === '上午' && h === 12) h = 0;
      return new Date(1970,0,1,h,m);
    }
    return null;
  }

  function getUTCOffsetMinutes(tz) {
    try {
      const now = new Date();
      const local = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
      }).formatToParts(now);
      const pp = {};
      local.forEach(p => { pp[p.type] = p.value; });
      const tzDate = new Date(`${pp.year}-${pp.month}-${pp.day}T${pp.hour}:${pp.minute}:${pp.second}`);
      const utcDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                               now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
      return (tzDate - utcDate) / 60000;
    } catch { return 0; }
  }

  function updateAllCitiesTime(baseTz, baseDate) {
    const baseOffset = getUTCOffsetMinutes(baseTz);
    const baseMs = baseDate.getHours() * 3600000 + baseDate.getMinutes() * 60000;
    const baseUTCms = baseMs - baseOffset * 60000;
    document.querySelectorAll('.city-status-card').forEach(card => {
      const tz = card.getAttribute('data-tz');
      if (!tz) return;
      const hourEl = card.querySelector('.city-hour');
      const dateEl = card.querySelector('.city-date');
      if (!hourEl) return;
      const tzOffset = getUTCOffsetMinutes(tz);
      const tzMs = baseUTCms + tzOffset * 60000;
      let h = Math.floor(((tzMs % 86400000) + 86400000) % 86400000 / 3600000);
      let m = Math.floor(((tzMs % 3600000) + 3600000) % 3600000 / 60000);
      const fakeDate = new Date(1970, 0, 1, h, m);
      const f = getFormat();
      if (f.hour24) {
        hourEl.textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
      } else {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        hourEl.textContent = String(h12).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ' ' + ampm;
      }
    });
  }

  function showConverterInput(card, tz) {
    document.querySelectorAll('.converter-wrap').forEach(el => el.remove());
    const hourEl = card.querySelector('.city-hour');
    if (!hourEl) return;
    converterActive = true;
    converterBaseTz = tz;

    const wrap = document.createElement('div');
    wrap.className = 'converter-wrap';
    wrap.style.cssText = 'position:relative;display:inline-block;';

    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'converter-input';
    inp.value = hourEl.textContent.replace(/[^0-9:apmAPM\s上下午]/g,'').trim();
    inp.style.cssText = 'width:' + hourEl.offsetWidth + 'px;font-size:inherit;font-weight:inherit;text-align:center;border:2px solid var(--accent,#0066cc);border-radius:6px;background:var(--bg-card,#fff);color:var(--text,#333);padding:2px 4px;outline:none;';
    inp.setAttribute('placeholder', '如 1430 / 2pm / 下午2点');

    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'restore-btn';
    restoreBtn.textContent = gtz_t('btn.restore_realtime','⏱️ 恢复实时');
    restoreBtn.style.cssText = 'display:block;margin:4px auto 0;font-size:11px;padding:3px 8px;border:1px solid var(--border,#e2e8f0);border-radius:12px;background:var(--bg,#fff);color:var(--text-secondary,#666);cursor:pointer;white-space:nowrap;';

    wrap.appendChild(inp);
    wrap.appendChild(restoreBtn);
    hourEl.parentNode.insertBefore(wrap, hourEl);
    hourEl.style.display = 'none';
    inp.focus(); inp.select();

    function doConvert() {
      const t = parseTime(inp.value);
      if (t) {
        clearInterval(window.__gtz_clock_timer);
        updateAllCitiesTime(tz, t);
        trackEvent('converter_used');
      }
    }

    inp.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(doConvert, 200);
    });

    function restoreReal() {
      converterActive = false;
      wrap.remove();
      hourEl.style.display = '';
      if (!window.__gtz_clock_running) startTimer();
    }

    restoreBtn.addEventListener('click', restoreReal);

    function onKeyDown(e) {
      if (e.key === 'Escape') { restoreReal(); document.removeEventListener('keydown', onKeyDown); }
    }
    document.addEventListener('keydown', onKeyDown);

    function onClickOut(e) {
      if (!card.contains(e.target)) {
        restoreReal();
        document.removeEventListener('click', onClickOut);
        document.removeEventListener('keydown', onKeyDown);
      }
    }
    setTimeout(() => document.addEventListener('click', onClickOut), 50);
  }

  // ═══════ 自定义工作时段弹窗（模块3）═══════
  function showCustomStatusModal(tz, cityName) {
    const existing = document.getElementById('gtz-status-modal');
    if (existing) existing.remove();
    const custom = getCustomStatus(tz);
    const defStart = custom ? custom.workStart : 9;
    const defEnd = custom ? custom.workEnd : 18;

    const overlay = document.createElement('div');
    overlay.id = 'gtz-status-modal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;';

    const box = document.createElement('div');
    box.style.cssText = 'background:var(--bg-card,#fff);border-radius:16px;padding:24px;max-width:320px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
    box.innerHTML = `
      <h3 style="margin:0 0 16px;font-size:1rem;color:var(--text,#333)">
        ${gtz_t('modal.custom_status_title','⏰ 自定义工作时段')}<br><small style="font-weight:400;color:var(--text-secondary,#666)">${cityName}</small>
      </h3>
      <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center;">
        <label style="font-size:13px;color:var(--text-secondary,#666)">${gtz_t('modal.custom_status_label_start','上班')}</label>
        <input type="number" id="gtz-work-start" min="0" max="23" value="${defStart}"
          style="width:60px;padding:6px;border:1px solid var(--border,#e2e8f0);border-radius:8px;text-align:center;font-size:14px;">
        <span style="color:var(--text-muted,#aaa)">—</span>
        <label style="font-size:13px;color:var(--text-secondary,#666)">${gtz_t('modal.custom_status_label_end','下班')}</label>
        <input type="number" id="gtz-work-end" min="0" max="24" value="${defEnd}"
          style="width:60px;padding:6px;border:1px solid var(--border,#e2e8f0);border-radius:8px;text-align:center;font-size:14px;">
      </div>
      <div style="display:flex;gap:8px;">
        <button id="gtz-status-save" style="flex:1;padding:8px;background:var(--accent,#0066cc);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">${gtz_t('modal.custom_status_save','保存')}</button>
        <button id="gtz-status-reset" style="flex:1;padding:8px;background:var(--bg,#f8fafc);color:var(--text-secondary,#666);border:1px solid var(--border,#e2e8f0);border-radius:8px;cursor:pointer;font-size:14px;">${gtz_t('modal.custom_status_reset','恢复默认')}</button>
        <button id="gtz-status-cancel" style="padding:8px 12px;background:none;border:none;cursor:pointer;color:var(--text-muted,#aaa);font-size:14px;">${gtz_t('modal.custom_status_cancel','✕')}</button>
      </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('gtz-status-save').addEventListener('click', () => {
      const s = parseInt(document.getElementById('gtz-work-start').value, 10);
      const e = parseInt(document.getElementById('gtz-work-end').value, 10);
      if (isNaN(s) || isNaN(e) || s < 0 || e > 24 || s >= e) {
        showToast(gtz_t('toast.status_invalid','⚠️ 请输入有效的时段（0-24，开始 < 结束）')); return;
      }
      saveCustomStatus(tz, s, e);
      overlay.remove();
      render();
      showToast(gtz_t('toast.status_saved','✅ 工作时段已保存'));
    });
    document.getElementById('gtz-status-reset').addEventListener('click', () => {
      try {
        const all = JSON.parse(localStorage.getItem(CUSTOM_STATUS_K)) || {};
        delete all[tz];
        localStorage.setItem(CUSTOM_STATUS_K, JSON.stringify(all));
      } catch {}
      overlay.remove();
      render();
      showToast(gtz_t('toast.status_reset','✅ 已恢复默认时段'));
    });
    document.getElementById('gtz-status-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  // ═══════ 搜索 ═══════
  function searchCities(q) {
    if (!q) return [];
    const lowerQ = q.toLowerCase().trim();
    const results = [], seen = new Set();
    for (const [cn, tz] of Object.entries(CN_NAMES)) {
      if (cn.includes(lowerQ) || cn.toLowerCase().includes(lowerQ)) {
        if (!seen.has(tz)) {
          seen.add(tz);
          results.push({ tz, cnName: cn, label: cn + ' — ' + tz.replace(/_/g,' '), score: 10 });
        }
      }
    }
    const allTZ = getAllTimezones();
    for (const tz of allTZ) {
      const tzLower = tz.toLowerCase();
      if (seen.has(tz)) continue;
      const cnList = tzToCN[tz] || [];
      if (tzLower.includes(lowerQ)) {
        seen.add(tz);
        const label = cnList.length > 0
          ? cnList.slice(0,2).join(' / ') + ' — ' + tz.replace(/_/g,' ')
          : tz.replace(/_/g,' ');
        results.push({ tz, cnName: cnList[0] || tzLabelRaw(tz), label, score: tzLower.startsWith(lowerQ) ? 5 : 1 });
      } else if (cnList.some(cn => cn.includes(lowerQ) || cn.toLowerCase().includes(lowerQ))) {
        seen.add(tz);
        results.push({ tz, cnName: cnList[0], label: cnList.slice(0,2).join(' / ') + ' — ' + tz.replace(/_/g,' '), score: 3 });
      }
    }
    results.sort((a,b) => b.score - a.score);
    return results.slice(0, 10);
  }

  // ═══════ 添加城市 ═══════
  function addCity(tz) {
    const lst = load();
    if (!lst.includes(tz)) {
      lst.push(tz);
      save(lst);
      render();
      return 'added';
    }
    highlightCard(tz);
    return 'exists';
  }

  function highlightCard(tz) {
    const card = document.querySelector('.city-status-card[data-tz="' + tz + '"]');
    if (!card) return;
    card.style.transition = 'box-shadow 0.15s, transform 0.15s';
    card.style.boxShadow = '0 0 0 3px var(--accent,#0066cc), 0 8px 24px rgba(0,102,204,0.25)';
    card.style.transform = 'scale(1.05)';
    setTimeout(() => { card.style.boxShadow = ''; card.style.transform = ''; }, 800);
  }

  // ═══════ 渲染卡片 ═══════
  function render() {
    const container = document.getElementById('custom-city-cards');
    if (!container) return;
    const list = load();
    const favs = getFavs();
    // 收藏的城市排最前
    const sorted = [...favs.filter(t => list.includes(t)), ...list.filter(t => !favs.includes(t))];
    container.innerHTML = '';
    sorted.forEach(tz => {
      const st = getCityStatus(tz);
      const cityName = getCNName(tz);
      const faved = isFav(tz);
      const card = document.createElement('div');
      card.className = 'city-status-card ' + st.cssClass;
      card.setAttribute('data-tz', tz);
      card.setAttribute('draggable', 'true');
      card.style.position = 'relative';

      card.innerHTML =
        // 收藏⭐按钮（左上角）
        '<button class="fav-btn" title="' + gtz_t('btn.fav_title','收藏') + '" style="position:absolute;top:6px;left:8px;border:none;background:none;cursor:pointer;font-size:16px;z-index:2;line-height:1;padding:0;transition:transform 0.2s;">' +
          (faved ? '⭐' : '☆') +
        '</button>' +
        // 删除×按钮（右上角）
        '<button class="remove-btn" title="' + gtz_t('btn.remove_title','移除') + '" style="position:absolute;top:6px;right:8px;border:none;background:none;cursor:pointer;font-size:16px;color:var(--text-muted,#94a3b8);z-index:2;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all 0.2s;">&times;</button>' +
        // 城市名
        '<div class="card-city-name" style="padding-top:8px;">' + cityName + '</div>' +
        // 时间（可点击换算）
        '<div class="card-time city-hour" style="font-variant-numeric:tabular-nums;cursor:pointer;border-radius:6px;transition:background 0.2s;" title="点击换算时间"></div>' +
        '<div class="card-date city-date" style="font-size:11px;color:var(--text-muted,#94a3b8);"></div>' +
        // 状态标签（可点击自定义）
        '<span class="status-badge" style="cursor:pointer;" title="' + gtz_t('btn.status_title','点击自定义工作时段') + '" data-tz="' + tz + '">' + st.emoji + ' ' + st.name + '</span>';

      // 收藏按钮事件
      card.querySelector('.fav-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const now = toggleFav(tz);
        e.currentTarget.textContent = isFav(tz) ? '⭐' : '☆';
        e.currentTarget.style.transform = 'scale(1.4)';
        setTimeout(() => { e.currentTarget.style.transform = 'scale(1)'; }, 300);
        // 重新排序渲染
        render();
      });

      // 删除按钮
      card.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        save(load().filter(t => t !== tz));
        // 收藏中也移除
        const favs2 = getFavs();
        if (favs2.includes(tz)) saveFavs(favs2.filter(t => t !== tz));
        render();
      });

      // 时间点击 → 换算器
      const hourEl = card.querySelector('.city-hour');
      hourEl.addEventListener('click', (e) => {
        e.stopPropagation();
        showConverterInput(card, tz);
      });
      hourEl.addEventListener('mouseenter', () => { hourEl.style.background = 'rgba(0,102,204,0.08)'; });
      hourEl.addEventListener('mouseleave', () => { hourEl.style.background = ''; });

      // 状态标签点击 → 自定义弹窗
      card.querySelector('.status-badge').addEventListener('click', (e) => {
        e.stopPropagation();
        showCustomStatusModal(tz, cityName);
      });

      container.appendChild(card);
    });
    updateClocks();
    updateStatusBadges();
    initDragSort(container);
  }

  // ═══════ 时钟更新 ═══════
  function updateClocks() {
    if (converterActive) return;
    const now = new Date();
    const f = getFormat();
    document.querySelectorAll('.city-status-card').forEach(card => {
      const tz = card.getAttribute('data-tz');
      if (!tz) return;
      const hourEl = card.querySelector('.city-hour');
      const dateEl = card.querySelector('.city-date');
      if (!hourEl || hourEl.style.display === 'none') return;
      try {
        hourEl.textContent = formatTimeStr(now, tz, f);
        if (dateEl) dateEl.textContent = formatDateStr(now, tz, f);
      } catch {}
    });
  }

  function updateStatusBadges() {
    document.querySelectorAll('.city-status-card').forEach(card => {
      const tz = card.getAttribute('data-tz');
      if (!tz) return;
      const badge = card.querySelector('.status-badge');
      if (!badge) return;
      const st = getCityStatus(tz);
      badge.textContent = st.emoji + ' ' + st.name;
      card.className = card.className.replace(/status-\S+/g, '').trim() + ' ' + st.cssClass;
    });
  }

  // ═══════ 拖拽排序（模块1）═══════
  function initDragSort(container) {
    let dragged = null;
    let touchEl = null, touchStartY = 0;

    container.addEventListener('dragstart', e => {
      dragged = e.target.closest('.city-status-card');
      if (dragged) {
        setTimeout(() => { if (dragged) dragged.style.opacity = '0.4'; }, 0);
        e.dataTransfer.effectAllowed = 'move';
      }
    });
    container.addEventListener('dragend', e => {
      if (dragged) { dragged.style.opacity = ''; dragged = null; }
      saveSortedOrder(container);
    });
    container.addEventListener('dragover', e => {
      e.preventDefault();
      const after = getDragAfterEl(container, e.clientY);
      if (!dragged) return;
      if (after == null) container.appendChild(dragged);
      else container.insertBefore(dragged, after);
    });
    container.addEventListener('drop', e => { e.preventDefault(); });

    // 移动端 touch 拖拽
    container.addEventListener('touchstart', e => {
      touchEl = e.target.closest('.city-status-card');
      if (touchEl) {
        touchStartY = e.touches[0].clientY;
        touchEl.style.opacity = '0.4';
      }
    }, { passive: true });

    container.addEventListener('touchmove', e => {
      if (!touchEl) return;
      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const after = getDragAfterEl(container, touchY);
      if (after == null) container.appendChild(touchEl);
      else container.insertBefore(touchEl, after);
    }, { passive: false });

    container.addEventListener('touchend', e => {
      if (touchEl) {
        touchEl.style.opacity = '';
        touchEl = null;
        saveSortedOrder(container);
      }
    });
  }

  function getDragAfterEl(container, y) {
    const cards = [...container.querySelectorAll('.city-status-card:not([style*="opacity: 0.4"])')];
    return cards.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function saveSortedOrder(container) {
    const newOrder = [...container.querySelectorAll('.city-status-card')].map(c => c.getAttribute('data-tz'));
    save(newOrder);
    // 同步收藏顺序（收藏的在前）
    const favs = getFavs();
    const newFavs = newOrder.filter(t => favs.includes(t));
    saveFavs(newFavs);
  }

  // ═══════ IP定位（模块1）═══════
  async function initIPLocation() {
    const firstVisit = !localStorage.getItem(FIRST_VISIT_K);
    if (!firstVisit) return;
    localStorage.setItem(FIRST_VISIT_K, '1');
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) return;
      const data = await res.json();
      const tz = data.timezone;
      if (!tz) return;
      const lst = load();
      if (!lst.includes(tz)) {
        lst.unshift(tz); // 添加到最前
        save(lst);
        render();
        const cityName = data.city || tzLabelRaw(tz);
        showToast(gtz_t('toast.ip_auto_added','🌍 已为你自动添加当前城市：') + cityName + '，' + gtz_t('toast.ip_auto_add_fav','点击☆收藏更多'), 3000);
      }
    } catch { /* 静默失败 */ }
  }

  // ═══════ 书签引导（模块7）═══════
  function initBookmarkTip() {
    if (!lsAvailable()) return;
    if (localStorage.getItem(BOOKMARK_TIP_K) === 'true') return;
    document.addEventListener('favorite-added', () => {
      if (localStorage.getItem(BOOKMARK_TIP_K) === 'true') return;
      const tip = document.createElement('div');
      tip.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#10b981;color:white;padding:10px 15px;border-radius:10px;font-size:13px;z-index:99998;max-width:260px;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
      tip.textContent = '💡 按 Ctrl+D (Mac: ⌘D) 将本站加入书签，一键查看全球时间';
      document.body.appendChild(tip);
      localStorage.setItem(BOOKMARK_TIP_K, 'true');
      setTimeout(() => { tip.style.opacity = '0'; tip.style.transition = 'opacity 0.5s'; setTimeout(() => tip.remove(), 500); }, 2500);
    });
  }

  // ═══════ 格式切换按钮（模块2）═══════
  function initFormatToggle() {
    // 在 header 中注入切换按钮
    const header = document.getElementById('site-header');
    if (!header) return;
    const nav = header.querySelector('nav');
    if (!nav) return;

    const f = getFormat();
    const btn = document.createElement('button');
    btn.id = 'gtz-format-toggle';
    btn.title = '左键：12/24小时制 | 右键：日期格式';
    btn.textContent = f.hour24 ? '24H' : '12H';
    btn.style.cssText = 'background:none;border:1px solid var(--border,#e2e8f0);border-radius:6px;padding:0.25rem 0.55rem;font-size:0.75rem;cursor:pointer;color:var(--text-secondary,#666);margin-left:4px;';

    btn.addEventListener('click', () => {
      const fmt = getFormat();
      fmt.hour24 = !fmt.hour24;
      saveFormat(fmt);
      btn.textContent = fmt.hour24 ? '24H' : '12H';
      updateClocks();
      trackEvent('format_toggled', { hour24: fmt.hour24 });
    });
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const fmt = getFormat();
      const formats = ['yyyy-mm-dd', 'mm/dd/yyyy', 'dd/mm/yyyy'];
      const idx = formats.indexOf(fmt.dateFormat);
      fmt.dateFormat = formats[(idx + 1) % formats.length];
      saveFormat(fmt);
      showToast(gtz_t('toast.date_format','日期格式：') + fmt.dateFormat);
      updateClocks();
    });

    // 插入在 lang-picker 前
    const langPicker = nav.querySelector('.lang-picker');
    if (langPicker) nav.insertBefore(btn, langPicker);
    else nav.appendChild(btn);
  }

  // ═══════ 深色模式（模块5）═══════
  function initDarkMode() {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const stored = localStorage.getItem(DARK_KEY);
    const isDark = stored !== null ? stored === 'true' : mq.matches;
    applyDarkMode(isDark);

    mq.addEventListener('change', e => {
      if (localStorage.getItem(DARK_KEY) === null) applyDarkMode(e.matches);
    });

    // 注入按钮（header nav 最右侧，格式按钮旁边）
    const header = document.getElementById('site-header');
    if (!header) return;
    const nav = header.querySelector('nav');
    if (!nav) return;
    const btn = document.createElement('button');
    btn.id = 'gtz-dark-toggle';
    btn.title = '切换深色模式';
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.style.cssText = 'background:none;border:1px solid var(--border,#e2e8f0);border-radius:6px;padding:0.25rem 0.45rem;font-size:0.8rem;cursor:pointer;color:var(--text-secondary,#666);margin-left:4px;';
    btn.addEventListener('click', () => {
      const dark = document.body.classList.toggle('dark-mode');
      localStorage.setItem(DARK_KEY, dark);
      btn.textContent = dark ? '☀️' : '🌙';
      trackEvent('dark_mode_toggled', { dark });
    });
    const langPicker = nav.querySelector('.lang-picker');
    if (langPicker) nav.insertBefore(btn, langPicker);
    else nav.appendChild(btn);
  }

  function applyDarkMode(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
  }

  // ═══════ UTC 顶部时间栏（模块6）═══════
  function initUTCBar() {
    // 避免重复注入
    if (document.getElementById('gtz-utc-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'gtz-utc-bar';
    bar.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:28px;background:#1f2937;color:#9ca3af;display:flex;align-items:center;justify-content:center;z-index:99990;font-size:12px;font-family:monospace;cursor:pointer;user-select:none;';

    const timeSpan = document.createElement('span');
    bar.appendChild(timeSpan);
    document.body.insertBefore(bar, document.body.firstChild);
    // 给 body 加顶部 padding 避免内容被遮
    document.body.style.paddingTop = Math.max(parseInt(document.body.style.paddingTop || '0') + 28, 28) + 'px';

    function updateUTC() {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2,'0');
      const m = String(now.getUTCMinutes()).padStart(2,'0');
      const s = String(now.getUTCSeconds()).padStart(2,'0');
      timeSpan.textContent = 'UTC ' + h + ':' + m + ':' + s;
    }
    setInterval(updateUTC, 1000);
    updateUTC();

    bar.addEventListener('click', () => {
      const existing = bar.querySelector('.utc-stamp');
      if (existing) { existing.remove(); return; }
      const stamp = document.createElement('span');
      stamp.className = 'utc-stamp';
      stamp.textContent = ' │ ' + gtz_t('utc.timestamp','时间戳：') + Date.now();
      stamp.style.cssText = 'color:#f9fafb;margin-left:12px;';
      bar.appendChild(stamp);
      setTimeout(() => stamp.remove(), 3000);
    });
  }

  // ═══════ 反馈按钮（模块9）═══════
  function initFeedback() {
    if (document.getElementById('gtz-feedback-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'gtz-feedback-btn';
    btn.innerHTML = '💬';
    btn.title = gtz_t('btn.feedback_title','提交反馈');
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:44px;height:44px;border-radius:50%;border:none;background:#3b82f6;color:white;font-size:20px;cursor:pointer;z-index:9990;box-shadow:0 4px 12px rgba(59,130,246,0.4);transition:transform 0.2s;';
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.1)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
    btn.addEventListener('click', showFeedbackModal);
    document.body.appendChild(btn);
  }

  function showFeedbackModal() {
    const existing = document.getElementById('gtz-feedback-modal');
    if (existing) { existing.remove(); return; }
    const overlay = document.createElement('div');
    overlay.id = 'gtz-feedback-modal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;';
    const box = document.createElement('div');
    box.style.cssText = 'background:var(--bg-card,#fff);border-radius:16px;padding:24px;max-width:360px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:1rem;color:var(--text,#333)">${gtz_t('modal.feedback_title','💬 反馈建议')}</h3>
        <button id="gtz-fb-close" style="background:none;border:none;cursor:pointer;font-size:20px;color:var(--text-muted,#aaa);">✕</button>
      </div>
      <textarea id="gtz-fb-text" rows="4" placeholder="${gtz_t('modal.feedback_placeholder','请输入您的反馈建议（不收集任何个人信息）')}"
        style="width:100%;padding:10px;border:1px solid var(--border,#e2e8f0);border-radius:8px;font-size:14px;resize:vertical;box-sizing:border-box;background:var(--bg,#fff);color:var(--text,#333);"></textarea>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button id="gtz-fb-submit" style="flex:1;padding:10px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">${gtz_t('modal.feedback_submit','提交')}</button>
      </div>
      <p style="font-size:11px;color:var(--text-muted,#aaa);margin:8px 0 0;text-align:center;">${gtz_t('modal.feedback_anon','匿名提交 · 仅发送反馈内容')}</p>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('gtz-fb-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('gtz-fb-submit').addEventListener('click', () => {
      const text = document.getElementById('gtz-fb-text').value.trim();
      if (!text) { showToast(gtz_t('toast.feedback_empty','⚠️ 请输入反馈内容')); return; }
      fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: text })
      }).catch(() => {});
      trackEvent('feedback_submitted');
      overlay.remove();
      showToast(gtz_t('toast.feedback_thanks','🙏 感谢您的反馈！'));
    });
  }

  // ═══════ 下拉 ═══════
  function showDropdown(dropdown, input, results) {
    if (!results.length) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = '';
    results.forEach(r => {
      const item = document.createElement('div');
      item.textContent = r.label;
      item.style.cssText = 'padding:6px 10px;cursor:pointer;font-size:13px;';
      item.addEventListener('mouseenter', () => item.style.background = '#f1f5f9');
      item.addEventListener('mouseleave', () => item.style.background = 'transparent');
      item.addEventListener('click', () => {
        const status = addCity(r.tz);
        input.value = '';
        dropdown.style.display = 'none';
        if (status === 'exists') showToast(r.cnName + ' ' + gtz_t('toast.city_exists','已在列表中'));
        else showToast(gtz_t('toast.city_added','已添加') + ' ' + r.cnName);
      });
      dropdown.appendChild(item);
    });
    dropdown.style.display = 'block';
  }

  function doSearchAndAdd(input, dropdown) {
    const q = input.value.trim();
    if (!q) return;
    const results = searchCities(q);
    if (!results.length) {
      if (dropdown) dropdown.style.display = 'none';
      showToast(gtz_t('toast.city_not_found','未找到匹配城市'));
      return;
    }
    if (results.length === 1) {
      const status = addCity(results[0].tz);
      input.value = '';
      if (dropdown) dropdown.style.display = 'none';
      if (status === 'exists') showToast(results[0].cnName + ' ' + gtz_t('toast.city_exists','已在列表中'));
      else showToast(gtz_t('toast.city_added','已添加') + ' ' + results[0].cnName);
    } else if (dropdown) {
      showDropdown(dropdown, input, results);
    }
  }

  function initSearch() {
    const input = document.getElementById('city-search-input');
    const dropdown = document.getElementById('city-search-dropdown');
    const btn = document.getElementById('city-search-btn');
    if (!input || !dropdown) return;
    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (!q) { dropdown.style.display = 'none'; return; }
      showDropdown(dropdown, input, searchCities(q));
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doSearchAndAdd(input, dropdown); } });
    if (btn) btn.addEventListener('click', () => doSearchAndAdd(input, dropdown));
    document.addEventListener('click', e => { if (!dropdown.contains(e.target) && e.target !== input) dropdown.style.display = 'none'; });
  }

  function initSmartSearch() {
    const input = document.getElementById('decision-input');
    const btn = document.getElementById('decision-btn');
    if (!input) return;
    const dropdown = document.createElement('div');
    dropdown.id = 'decision-dropdown';
    dropdown.style.cssText = 'display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.08);z-index:100;max-height:240px;overflow-y:auto;margin-top:4px;';
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(dropdown);
    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (!q) { dropdown.style.display = 'none'; return; }
      showDropdown(dropdown, input, searchCities(q));
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doSearchAndAdd(input, dropdown); } });
    if (btn) btn.addEventListener('click', () => doSearchAndAdd(input, dropdown));
    document.addEventListener('click', e => { if (!dropdown.contains(e.target) && e.target !== input) dropdown.style.display = 'none'; });
  }

  // ═══════ 定时器 ═══════
  let clockTimer = null;
  function startTimer() {
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(updateClocks, 1000);
    window.__gtz_clock_timer = clockTimer;
    window.__gtz_clock_running = true;
    setInterval(updateStatusBadges, 60000);
  }

  // ═══════ 深色模式 CSS（注入到 head）═══════
  function injectDarkCSS() {
    if (document.getElementById('gtz-dark-css')) return;
    const style = document.createElement('style');
    style.id = 'gtz-dark-css';
    style.textContent = `
      body.dark-mode {
        --bg: #0f172a;
        --bg-card: #1e293b;
        --bg-glass: rgba(30,41,59,0.85);
        --text: #f1f5f9;
        --text-secondary: #94a3b8;
        --text-muted: #64748b;
        --border: #334155;
        --border-subtle: #1e293b;
        --accent: #60a5fa;
        --accent-light: rgba(96,165,250,0.12);
        --shadow: 0 4px 24px rgba(0,0,0,0.4);
      }
      body.dark-mode { background: var(--bg); color: var(--text); }
      body.dark-mode header { background: rgba(15,23,42,0.95) !important; border-color: var(--border) !important; }
      body.dark-mode .city-status-card { background: var(--bg-card) !important; border-color: var(--border) !important; color: var(--text) !important; }
      body.dark-mode input, body.dark-mode textarea { background: var(--bg-card) !important; color: var(--text) !important; border-color: var(--border) !important; }
      body.dark-mode .status-badge { background: rgba(255,255,255,0.08) !important; }
      body.dark-mode footer { border-color: var(--border) !important; color: var(--text-secondary) !important; }
      body.dark-mode footer a { color: var(--text-secondary) !important; }
      body.dark-mode #city-search-dropdown, body.dark-mode #decision-dropdown { background: var(--bg-card) !important; border-color: var(--border) !important; color: var(--text) !important; }
      body.dark-mode #city-search-dropdown > div, body.dark-mode #decision-dropdown > div { color: var(--text) !important; }
      body.dark-mode .hero-badge { background: rgba(96,165,250,0.15) !important; color: var(--accent) !important; }
      body.dark-mode h1, body.dark-mode h2, body.dark-mode h3 { color: var(--text) !important; }
      body.dark-mode nav a { color: var(--text) !important; }
      body.dark-mode #gtz-format-toggle, body.dark-mode #gtz-dark-toggle, body.dark-mode #lang-btn { color: var(--text-secondary) !important; border-color: var(--border) !important; }
      /* 卡片按钮在暗色下可见 */
      body.dark-mode .fav-btn { color: var(--text, #f1f5f9) !important; }
      body.dark-mode .remove-btn { color: var(--text-muted, #64748b) !important; }
      body.dark-mode .remove-btn:hover { color: #ef4444 !important; background: rgba(239,68,68,0.15) !important; }
      /* 地球可视化 - 确保 canvas 在暗色下可见 */
      body.dark-mode #earth-visual { background: transparent !important; }
      body.dark-mode #earth-visual canvas { background: transparent !important; }
      /* 广告容器暗色 */
      body.dark-mode .ad-container, body.dark-mode .sidebar-ad { background: var(--bg-card) !important; }
      body.dark-mode .converter-input { background: var(--bg-card) !important; color: var(--text) !important; border-color: var(--accent) !important; }
      body.dark-mode .restore-btn { background: var(--bg-card) !important; color: var(--text-secondary) !important; border-color: var(--border) !important; }
    `;
    document.head.appendChild(style);
  }

  // ═══════ 主入口 ═══════
  function init() {
    if (!lsAvailable()) return; // localStorage不可用时，隐藏收藏功能
    injectDarkCSS();
    initDarkMode();
    initFormatToggle();
    initUTCBar();
    initFeedback();
    render();
    initSearch();
    initSmartSearch();
    startTimer();
    initBookmarkTip();
    // 延迟执行 IP 定位，不阻塞首屏
    setTimeout(initIPLocation, 500);

    // 监听 i18n 翻译就绪事件，重渲染城市名和状态标签
    window.addEventListener('gtz-i18n-ready', function() {
      render(); // 重新渲染卡片（城市名 + 状态标签使用翻译）
      updateStatusBadges(); // 立即更新状态标签
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
