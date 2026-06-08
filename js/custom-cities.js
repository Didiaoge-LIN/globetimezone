// custom-cities.js — V10 城市搜索（Premium 卡片 + 实时秒级更新）
// 依赖：localStorage，Intl.supportedValuesOf
(() => {
  const STORAGE_KEY = 'gtz_custom_cities';
  const DEFAULTS = ['America/New_York','Europe/London','Asia/Tokyo','Asia/Shanghai'];

  // ─── 数据层 ───────────────────────────────
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [...DEFAULTS]; } catch { return [...DEFAULTS]; }
  }
  function save(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
  function getAllTimezones() {
    try { return Intl.supportedValuesOf('timeZone') || []; } catch { return []; }
  }

  // 中文名 → IANA 映射（支持中文搜索）
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

  // 反向索引：时区 → 中文名
  let tzToCN = {};
  (function buildIndex() {
    for (const [cn, tz] of Object.entries(CN_NAMES)) {
      if (!tzToCN[tz]) tzToCN[tz] = [];
      if (!tzToCN[tz].includes(cn)) tzToCN[tz].push(cn);
    }
  })();
  // 暴露给其他模块（meeting-planner 等）
  window.__gtz_tzToCN = tzToCN;
  window.__gtz_CN_NAMES = CN_NAMES;

  // ─── 搜索核心 ─────────────────────────────
  function searchCities(q) {
    if (!q) return [];
    const lowerQ = q.toLowerCase().trim();
    const results = [], seen = new Set();

    // 1. 中文名匹配
    for (const [cn, tz] of Object.entries(CN_NAMES)) {
      if (cn.includes(lowerQ) || cn.toLowerCase().includes(lowerQ)) {
        if (!seen.has(tz)) {
          seen.add(tz);
          const cnList = tzToCN[tz] ? tzToCN[tz].slice(0,2).join(' / ') : '';
          results.push({ tz, cnName: cn, label: cn + ' — ' + tz.replace(/_/g,' '), score: 10 });
        }
      }
    }

    // 2. IANA 英文 ID 匹配
    const allTZ = getAllTimezones();
    for (const tz of allTZ) {
      const tzLower = tz.toLowerCase();
      if (seen.has(tz)) continue;
      const cnList = tzToCN[tz] || [];
      // 检查是否匹配 IANA ID
      if (tzLower.includes(lowerQ)) {
        seen.add(tz);
        const label = cnList.length > 0
          ? cnList.slice(0,2).join(' / ') + ' — ' + tz.replace(/_/g,' ')
          : tz.replace(/_/g,' ');
        results.push({ tz, cnName: cnList[0] || tzLabelRaw(tz), label, score: tzLower.startsWith(lowerQ) ? 5 : 1 });
        continue;
      }
      // 检查是否匹配中文别名（从索引找）
      if (cnList.some(cn => cn.includes(lowerQ) || cn.toLowerCase().includes(lowerQ))) {
        seen.add(tz);
        results.push({ tz, cnName: cnList[0], label: cnList.slice(0,2).join(' / ') + ' — ' + tz.replace(/_/g,' '), score: 3 });
      }
    }

    results.sort((a,b) => b.score - a.score);
    return results.slice(0, 10);
  }

  function tzLabelRaw(tz) {
    return tz.replace(/_/g, ' ').split('/').pop();
  }

  // ─── 公共：添加城市 ───────────────────────
  function addCity(tz) {
    const lst = load();
    if (!lst.includes(tz)) {
      lst.push(tz);
      save(lst);
      render();
      return 'added';
    }
    // 已在列表中 → 高亮闪烁该卡片
    highlightCard(tz);
    return 'exists';
  }

  // 高亮闪烁已有城市卡片
  function highlightCard(tz) {
    const card = document.querySelector('.city-status-card[data-tz="' + tz + '"]');
    if (!card) return;
    card.style.transition = 'box-shadow 0.15s, transform 0.15s';
    card.style.boxShadow = '0 0 0 3px var(--accent), 0 8px 24px rgba(0,102,204,0.25)';
    card.style.transform = 'scale(1.05)';
    setTimeout(() => {
      card.style.boxShadow = 'var(--shadow)';
      card.style.transform = 'scale(1)';
    }, 800);
  }

  // Toast 提示
  function showToast(msg) {
    const existing = document.getElementById('gtz-toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.id = 'gtz-toast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:8px 20px;border-radius:24px;font-size:14px;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;';
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; });
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
  }

  // ─── 显示层 ───────────────────────────────
  function getHour(tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).formatToParts(new Date());
      const h = parts.find(p => p.type === 'hour');
      return h ? parseInt(h.value, 10) : new Date().getUTCHours();
    } catch { return new Date().getUTCHours(); }
  }

  function statusText(hour) {
    if (hour >= 9 && hour < 18) return { text: '工作中 · 可联系', cssClass: 'status-working', emoji: '🟢' };
    if (hour >= 7 && hour < 22) return { text: '非工作时段', cssClass: 'status-off', emoji: '🟡' };
    return { text: '深夜勿扰', cssClass: 'status-night', emoji: '🔵' };
  }

  function flagEmoji(tz) {
    const map = { 'America':'🇺🇸','Europe':'🇪🇺','Asia':'🇨🇳','Africa':'🇿🇦','Pacific':'🇦🇺','Australia':'🇦🇺','Indian':'🇮🇳' };
    return map[tz.split('/')[0]] || '🌐';
  }

  function render() {
    const container = document.getElementById('custom-city-cards');
    if (!container) return;
    const list = load();
    container.innerHTML = '';
    list.forEach(tz => {
      const hour = getHour(tz), st = statusText(hour);
      const card = document.createElement('div');
      card.className = 'city-status-card ' + st.cssClass;
      card.setAttribute('data-tz', tz);
      card.innerHTML =
        '<button class="remove-btn" title="移除" style="position:absolute;top:8px;right:10px;border:none;background:none;cursor:pointer;font-size:16px;color:var(--text-muted);z-index:2;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all 0.2s;">&times;</button>' +
        '<div class="card-city-name">'+tzLabelRaw(tz)+'</div>' +
        '<div class="card-time city-hour" style="font-variant-numeric:tabular-nums;"></div>' +
        '<div class="card-date city-date"></div>' +
        '<span class="status-badge" style="background:#f1f5f9;color:#475569;">'+st.emoji+' '+st.text+'</span>';
      card.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        save(load().filter(t => t !== tz));
        render();
      });
      container.appendChild(card);
    });
    updateClocks();
    updateStatusBadges();
  }

  function updateClocks() {
    document.querySelectorAll('.city-status-card').forEach(card => {
      const tz = card.getAttribute('data-tz');
      if (!tz) return;
      const hourEl = card.querySelector('.city-hour'), dateEl = card.querySelector('.city-date');
      if (!hourEl) return;
      try {
        const now = new Date();
        hourEl.textContent = new Intl.DateTimeFormat('zh-CN', { timeZone: tz, hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }).format(now);
        if (dateEl) dateEl.textContent = new Intl.DateTimeFormat('zh-CN', { timeZone: tz, month:'short', day:'numeric', weekday:'short' }).format(now);
      } catch {}
    });
  }

  function updateStatusBadges() {
    document.querySelectorAll('.city-status-card').forEach(card => {
      const tz = card.getAttribute('data-tz');
      if (!tz) return;
      const badge = card.querySelector('.status-badge');
      if (!badge) return;
      const hour = getHour(tz), st = statusText(hour);
      badge.textContent = st.emoji + ' ' + st.text;
      // 更新卡片 CSS class
      card.classList.remove('status-working', 'status-off', 'status-night');
      card.classList.add(st.cssClass);
    });
  }

  // ─── 下拉渲染 ──────────────────────────────
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
        if (status === 'exists') showToast(r.cnName + ' 已在列表中');
        else showToast('已添加 ' + r.cnName);
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
      showToast('未找到匹配城市');
      return;
    }
    if (results.length === 1) {
      // 只有一个匹配 → 自动添加
      const status = addCity(results[0].tz);
      input.value = '';
      if (dropdown) dropdown.style.display = 'none';
      if (status === 'exists') showToast(results[0].cnName + ' 已在列表中');
      else showToast('已添加 ' + results[0].cnName);
    } else if (dropdown) {
      // 多个匹配 → 显示下拉
      showDropdown(dropdown, input, results);
    }
  }

  // ─── 搜索框1：城市搜索 + 下拉 ──────────────
  function initSearch() {
    const input = document.getElementById('city-search-input');
    const dropdown = document.getElementById('city-search-dropdown');
    const btn = document.getElementById('city-search-btn');
    if (!input || !dropdown) return;

    // 输入时实时显示下拉
    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (!q) { dropdown.style.display = 'none'; return; }
      const results = searchCities(q);
      showDropdown(dropdown, input, results);
    });

    // Enter 键 → 取第一个结果添加
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearchAndAdd(input, dropdown);
      }
    });

    // 搜索按钮
    if (btn) {
      btn.addEventListener('click', () => doSearchAndAdd(input, dropdown));
    }

    // 点击外部关闭
    document.addEventListener('click', e => {
      if (!dropdown.contains(e.target) && e.target !== input) dropdown.style.display = 'none';
    });
  }

  // ─── 搜索框2：智能搜索（顶部大框）──────────
  function initSmartSearch() {
    const input = document.getElementById('decision-input');
    const btn = document.getElementById('decision-btn');
    if (!input) return;

    // 创建一个隐藏的下拉用于显示匹配结果
    const dropdown = document.createElement('div');
    dropdown.id = 'decision-dropdown';
    dropdown.style.cssText = 'display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.08);z-index:100;max-height:240px;overflow-y:auto;margin-top:4px;';
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(dropdown);

    // 输入时实时下拉
    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (!q) { dropdown.style.display = 'none'; return; }
      const results = searchCities(q);
      showDropdown(dropdown, input, results);
    });

    // Enter 键 → 取第一个结果添加
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearchAndAdd(input, dropdown);
      }
    });

    // 搜索按钮
    if (btn) {
      btn.addEventListener('click', () => doSearchAndAdd(input, dropdown));
    }

    // 点击外部关闭
    document.addEventListener('click', e => {
      if (!dropdown.contains(e.target) && e.target !== input) dropdown.style.display = 'none';
    });
  }

  // ─── 定时器 ────────────────────────────────
  function startTimer() {
    setInterval(updateClocks, 1000);
    setInterval(updateStatusBadges, 60000);
  }

  // ─── 入口 ──────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { render(); initSearch(); initSmartSearch(); startTimer(); });
  } else {
    render(); initSearch(); initSmartSearch(); startTimer();
  }
})();
