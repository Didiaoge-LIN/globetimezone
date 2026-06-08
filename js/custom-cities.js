// custom-cities.js — V9.2 自定义城市列表
// V9.3: 新增中文搜索支持（中文名→IANA时区映射）
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

  // 中文名 → IANA 时区映射（支持中文搜索）
  const CN_NAMES = {
    // 东亚
    '日本':'Asia/Tokyo','东京':'Asia/Tokyo','大阪':'Asia/Tokyo',
    '韩国':'Asia/Seoul','首尔':'Asia/Seoul',
    '朝鲜':'Asia/Pyongyang','平壤':'Asia/Pyongyang',
    '蒙古':'Asia/Ulaanbaatar','乌兰巴托':'Asia/Ulaanbaatar',
    // 中国及周边
    '中国':'Asia/Shanghai','北京':'Asia/Shanghai','上海':'Asia/Shanghai',
    '香港':'Asia/Hong_Kong','台湾':'Asia/Taipei','台北':'Asia/Taipei',
    '澳门':'Asia/Macau',
    // 东南亚
    '新加坡':'Asia/Singapore',
    '泰国':'Asia/Bangkok','曼谷':'Asia/Bangkok',
    '越南':'Asia/Ho_Chi_Minh','胡志明':'Asia/Ho_Chi_Minh','河内':'Asia/Ho_Chi_Minh',
    '印尼':'Asia/Jakarta','雅加达':'Asia/Jakarta','巴厘岛':'Asia/Makassar',
    '菲律宾':'Asia/Manila','马尼拉':'Asia/Manila',
    '马来西亚':'Asia/Kuala_Lumpur','吉隆坡':'Asia/Kuala_Lumpur',
    '缅甸':'Asia/Yangon','仰光':'Asia/Yangon',
    '柬埔寨':'Asia/Phnom_Penh','金边':'Asia/Phnom_Penh',
    // 南亚
    '印度':'Asia/Kolkata','德里':'Asia/Kolkata','新德里':'Asia/Kolkata','孟买':'Asia/Kolkata',
    '巴基斯坦':'Asia/Karachi','卡拉奇':'Asia/Karachi',
    '孟加拉':'Asia/Dhaka','达卡':'Asia/Dhaka',
    '斯里兰卡':'Asia/Colombo',
    '尼泊尔':'Asia/Kathmandu','加德满都':'Asia/Kathmandu',
    // 中东
    '阿联酋':'Asia/Dubai','迪拜':'Asia/Dubai',
    '沙特':'Asia/Riyadh','利雅得':'Asia/Riyadh',
    '卡塔尔':'Asia/Qatar','多哈':'Asia/Qatar',
    '以色列':'Asia/Jerusalem','耶路撒冷':'Asia/Jerusalem',
    '伊朗':'Asia/Tehran','德黑兰':'Asia/Tehran',
    '土耳其':'Europe/Istanbul','伊斯坦布尔':'Europe/Istanbul',
    // 欧洲
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
    // 北美
    '美国':'America/New_York','纽约':'America/New_York',
    '洛杉矶':'America/Los_Angeles','旧金山':'America/Los_Angeles','硅谷':'America/Los_Angeles',
    '芝加哥':'America/Chicago',
    '西雅图':'America/Los_Angeles',
    '华盛顿':'America/New_York','波士顿':'America/New_York',
    '迈阿密':'America/New_York',
    '休斯顿':'America/Chicago',
    '丹佛':'America/Denver',
    '凤凰城':'America/Phoenix',
    '拉斯维加斯':'America/Los_Angeles',
    '加拿大':'America/Toronto','多伦多':'America/Toronto',
    '温哥华':'America/Vancouver',
    '蒙特利尔':'America/Toronto',
    '墨西哥':'America/Mexico_City','墨西哥城':'America/Mexico_City',
    // 南美
    '巴西':'America/Sao_Paulo','圣保罗':'America/Sao_Paulo','里约':'America/Sao_Paulo',
    '阿根廷':'America/Argentina/Buenos_Aires','布宜诺斯艾利斯':'America/Argentina/Buenos_Aires',
    '智利':'America/Santiago','圣地亚哥':'America/Santiago',
    '哥伦比亚':'America/Bogota','波哥大':'America/Bogota',
    '秘鲁':'America/Lima','利马':'America/Lima',
    // 大洋洲
    '澳大利亚':'Australia/Sydney','悉尼':'Australia/Sydney',
    '墨尔本':'Australia/Melbourne',
    '布里斯班':'Australia/Brisbane',
    '珀斯':'Australia/Perth',
    '阿德莱德':'Australia/Adelaide',
    '新西兰':'Pacific/Auckland','奥克兰':'Pacific/Auckland',
    // 非洲
    '埃及':'Africa/Cairo','开罗':'Africa/Cairo',
    '南非':'Africa/Johannesburg','约翰内斯堡':'Africa/Johannesburg',
    '尼日利亚':'Africa/Lagos','拉各斯':'Africa/Lagos',
    '肯尼亚':'Africa/Nairobi','内罗毕':'Africa/Nairobi',
    '摩洛哥':'Africa/Casablanca','卡萨布兰卡':'Africa/Casablanca',
    '埃塞俄比亚':'Africa/Addis_Ababa',
  };

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
        <span class="city-hour" style="font-size:1.6rem;font-weight:700;display:block;margin:0.2rem 0;font-variant-numeric:tabular-nums;"></span>
        <span class="city-date" style="display:block;font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.3rem;"></span>
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

  // 更新所有卡片的时钟 + 日期
  function updateClocks() {
    document.querySelectorAll('.city-status-card').forEach(card => {
      const tz = card.getAttribute('data-tz');
      if (!tz) return;
      const hourEl = card.querySelector('.city-hour');
      const dateEl = card.querySelector('.city-date');
      if (!hourEl) return;
      try {
        const now = new Date();
        const timeStr = new Intl.DateTimeFormat('zh-CN', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
        hourEl.textContent = timeStr;
        if (dateEl) {
          const dateStr = new Intl.DateTimeFormat('zh-CN', { timeZone: tz, month: 'short', day: 'numeric', weekday: 'short' }).format(now);
          dateEl.textContent = dateStr;
        }
      } catch {}
    });
  }

  // 搜索框 + 添加城市
  function initSearch() {
    const input = document.getElementById('city-search-input');
    const dropdown = document.getElementById('city-search-dropdown');
    if (!input || !dropdown) return;

    let allTZ = getAllTimezones();
    // 构建中文名索引：IANA时区 → 中文名列表
    const tzToCN = {};
    for (const [cn, tz] of Object.entries(CN_NAMES)) {
      if (!tzToCN[tz]) tzToCN[tz] = [];
      if (!tzToCN[tz].includes(cn)) tzToCN[tz].push(cn);
    }

    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      if (!q) { dropdown.style.display = 'none'; return; }

      // 收集匹配结果：{ tz, label, score }
      const results = [];
      const seen = new Set();

      // 1. 中文名匹配
      for (const [cn, tz] of Object.entries(CN_NAMES)) {
        if (cn.toLowerCase().includes(q)) {
          if (!seen.has(tz)) {
            seen.add(tz);
            results.push({ tz, label: tz.replace(/_/g, ' ') + ' (' + cn + ')', score: 1 });
          }
        }
      }

      // 2. IANA 标识符匹配
      for (const tz of allTZ) {
        const tzLower = tz.toLowerCase();
        if (tzLower.includes(q) && !seen.has(tz)) {
          seen.add(tz);
          const cnNames = tzToCN[tz] ? ' (' + tzToCN[tz].slice(0,2).join('/') + ')' : '';
          results.push({ tz, label: tz.replace(/_/g, ' ') + cnNames, score: tzLower.startsWith(q) ? 2 : 0 });
        }
      }

      // 排序：中文匹配 > IANA前缀匹配 > IANA包含匹配
      results.sort((a,b) => b.score - a.score);
      const matches = results.slice(0, 10);

      if (!matches.length) { dropdown.style.display = 'none'; return; }
      dropdown.innerHTML = '';
      matches.forEach(r => {
        const item = document.createElement('div');
        item.textContent = r.label;
        item.style.cssText = 'padding:6px 10px;cursor:pointer;font-size:13px;';
        item.addEventListener('mouseenter', () => item.style.background = '#f1f5f9');
        item.addEventListener('mouseleave', () => item.style.background = 'transparent');
        item.addEventListener('click', () => {
          const lst = load();
          if (!lst.includes(r.tz)) {
            lst.push(r.tz);
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

  // 定时刷新：每秒更新时钟，每分钟重新渲染（刷新状态徽章）
  function startTimer() {
    // 每秒更新时间（含秒数跳动）
    setInterval(() => {
      updateClocks();
    }, 1000);
    // 每分钟重新渲染（刷新工作状态徽章 + 日期）
    setInterval(() => {
      render();
    }, 60000);
  }

  // 智能决策输入框（顶部大输入框）
  function initSmartSearch() {
    const input = document.getElementById('decision-input');
    if (!input) return;

    input.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const q = input.value.trim();
      if (!q) return;

      // 尝试从输入中匹配中文城市名
      for (const [cn, tz] of Object.entries(CN_NAMES)) {
        if (q.includes(cn)) {
          const lst = load();
          if (!lst.includes(tz)) {
            lst.push(tz);
            save(lst);
            render();
          }
        }
      }
      input.value = '';
    });
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { render(); initSearch(); initSmartSearch(); startTimer(); });
  } else {
    render();
    initSearch();
    initSmartSearch();
    startTimer();
  }
})();
