(function() {
  'use strict';

  const $ = id => document.getElementById(id);

  // ─── i18n for dynamic content ───
  var GTZ_LANG = (function() {
    var m = window.location.pathname.match(/^\/([a-z]{2})\//);
    var supported = ['en','zh','de','fr','es','ja','ko','pt','ar'];
    return (m && supported.indexOf(m[1]) !== -1) ? m[1] : 'zh';
  })();
  var GTZ_T = {};
  function t(key, fallback) { return GTZ_T[key] !== undefined ? GTZ_T[key] : (fallback || key); }

  // Load locale JSON for dynamic text translation
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/locales/' + GTZ_LANG + '.json?v=3', true);
  xhr.timeout = 5000;
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      try { GTZ_T = JSON.parse(xhr.responseText); updateAll(); } catch(e) {}
    }
  };
  xhr.send();

  // Helper to format translated text with placeholders
  function fmt(str, obj) {
    return str.replace(/\{([^}]+)\}/g, function(_, k) { return obj[k] !== undefined ? obj[k] : '{'+k+'}'; });
  }

  // ========== City Data ==========
  const CITY_GROUPS = [
    { group: t('timedifference.group.asia','亚洲'), cities: [
      ['Asia/Shanghai','北京 / 上海','CST','+8','中国'],
      ['Asia/Tokyo','东京','JST','+9','日本'],
      ['Asia/Seoul','首尔','KST','+9','韩国'],
      ['Asia/Singapore','新加坡','SGT','+8','新加坡'],
      ['Asia/Dubai','迪拜','GST','+4','阿联酋'],
      ['Asia/Kolkata','孟买','IST','+5:30','印度'],
      ['Asia/Hong_Kong','香港','HKT','+8','中国'],
      ['Asia/Bangkok','曼谷','ICT','+7','泰国'],
      ['Asia/Jakarta','雅加达','WIB','+7','印尼'],
    ]},
    { group: t('timedifference.group.europe','欧洲'), cities: [
      ['Europe/London','伦敦','BST','+1','英国'],
      ['Europe/Paris','巴黎','CEST','+2','法国'],
      ['Europe/Berlin','柏林','CEST','+2','德国'],
      ['Europe/Moscow','莫斯科','MSK','+3','俄罗斯'],
      ['Europe/Madrid','马德里','CEST','+2','西班牙'],
      ['Europe/Rome','罗马','CEST','+2','意大利'],
      ['Europe/Amsterdam','阿姆斯特丹','CEST','+2','荷兰'],
    ]},
    { group: t('timedifference.group.northamerica','北美洲'), cities: [
      ['America/New_York','纽约','EDT','-4','美国'],
      ['America/Chicago','芝加哥','CDT','-5','美国'],
      ['America/Denver','丹佛','MDT','-6','美国'],
      ['America/Los_Angeles','洛杉矶','PDT','-7','美国'],
      ['America/Toronto','多伦多','EDT','-4','加拿大'],
      ['America/Vancouver','温哥华','PDT','-7','加拿大'],
      ['America/Mexico_City','墨西哥城','CST','-6','墨西哥'],
    ]},
    { group: t('timedifference.group.southamerica','南美洲'), cities: [
      ['America/Sao_Paulo','圣保罗','BRT','-3','巴西'],
      ['America/Argentina/Buenos_Aires','布宜诺斯艾利斯','ART','-3','阿根廷'],
    ]},
    { group: t('timedifference.group.oceania','大洋洲'), cities: [
      ['Australia/Sydney','悉尼','AEST','+10','澳大利亚'],
      ['Pacific/Auckland','奥克兰','NZST','+12','新西兰'],
    ]},
    { group: t('timedifference.group.africa','非洲'), cities: [
      ['Africa/Cairo','开罗','EEST','+3','埃及'],
      ['Africa/Johannesburg','约翰内斯堡','SAST','+2','南非'],
      ['Africa/Lagos','拉各斯','WAT','+1','尼日利亚'],
    ]},
  ];

  // Build lookup
  const cityMap = {};
  CITY_GROUPS.forEach(g => g.cities.forEach(c => {
    cityMap[c[0]] = { name: c[1], abbr: c[2], offset: c[3], country: c[4] };
  }));

  // Populate selects
  function buildSelect(el, defaultVal) {
    CITY_GROUPS.forEach(g => {
      const optg = document.createElement('optgroup');
      optg.label = g.group;
      g.cities.forEach(c => {
        const o = document.createElement('option');
        o.value = c[0];
        o.textContent = c[0] === 'Asia/Shanghai' ? '北京 / 上海' : c[1];
        if (c[0] === defaultVal) o.selected = true;
        optg.appendChild(o);
      });
      el.appendChild(optg);
    });
  }

  buildSelect($('cityA'), 'Asia/Shanghai');
  buildSelect($('cityB'), 'America/New_York');

  // ========== Time Helpers ==========
  function getTimezoneOffset(tz) {
    try {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hour: 'numeric', hour12: false, timeZoneName: 'shortOffset'
      }).formatToParts(now);
      const namePart = parts.find(p => p.type === 'timeZoneName');
      if (!namePart) return 0;
      const m = namePart.value.match(/GMT([+-]\d{1,2})/);
      if (!m) return 0;
      const sign = m[1][0] === '-' ? -1 : 1;
      const val = parseInt(m[1].substring(1), 10);
      return sign * val;
    } catch(e) { return 0; }
  }

  function formatCityTime(tz) {
    const now = new Date();
    try {
      return {
        time: new Intl.DateTimeFormat('zh-CN', { timeZone: tz, hour:'2-digit', minute:'2-digit', hour12:false }).format(now),
        sec: new Intl.DateTimeFormat('en-US', { timeZone: tz, second:'2-digit', hour12:false }).format(now).slice(-2),
        date: new Intl.DateTimeFormat('zh-CN', { timeZone: tz, year:'numeric', month:'short', day:'numeric', weekday:'short' }).format(now),
        hour: parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour:'numeric', hour12:false }).format(now), 10),
        dayOfWeek: new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday:'short' }).format(now),
      };
    } catch(e) {
      return { time:'--:--', sec:'--', date:'---', hour: 0 };
    }
  }

  // ========== Quick Links ==========
  const QUICK_PAIRS = [
    ['Asia/Shanghai','America/New_York'],
    ['Asia/Tokyo','America/New_York'],
    ['America/Los_Angeles','Asia/Shanghai'],
    ['Europe/London','Asia/Singapore'],
    ['Australia/Sydney','Europe/London'],
    ['Asia/Dubai','America/Los_Angeles'],
    ['Europe/Paris','America/New_York'],
    ['America/Toronto','Asia/Shanghai'],
    ['Asia/Kolkata','Asia/Dubai'],
    ['Australia/Sydney','America/New_York'],
    ['Asia/Seoul','Europe/London'],
    ['Europe/Berlin','America/New_York'],
  ];

  function buildQuickLinks() {
    const grid = $('quickGrid');
    QUICK_PAIRS.forEach(([t1, t2]) => {
      const a = document.createElement('a');
      a.className = 'td-quick-link';
      const n1 = (cityMap[t1] || {}).name || t1;
      const n2 = (cityMap[t2] || {}).name || t2;
      a.href = `#`;
      a.innerHTML = `${n1} ↔ ${n2} <span class="td-q-arrow">→</span>`;
      a.addEventListener('click', e => {
        e.preventDefault();
        $('cityA').value = t1;
        $('cityB').value = t2;
        updateAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      grid.appendChild(a);
    });
  }

  // ========== Main Update ==========
  function updateAll() {
    const tzA = $('cityA').value;
    const tzB = $('cityB').value;
    const now = new Date();

    const infoA = cityMap[tzA] || { name: tzA, abbr: tzA.split('/').pop(), country: '' };
    const infoB = cityMap[tzB] || { name: tzB, abbr: tzB.split('/').pop(), country: '' };

    const a = formatCityTime(tzA);
    const b = formatCityTime(tzB);

    // --- Card A ---
    $('countryA').textContent = infoA.country;
    $('nameA').textContent = infoA.name;
    $('tzA').textContent = tzA + ' · ' + infoA.abbr + ' (GMT' + infoA.offset + ')';
    $('clockA').innerHTML = a.time + '<span class="td-cc-sec">:' + a.sec + '</span>';
    $('dateA').textContent = a.date;

    // --- Card B ---
    $('countryB').textContent = infoB.country;
    $('nameB').textContent = infoB.name;
    $('tzB').textContent = tzB + ' · ' + infoB.abbr + ' (GMT' + infoB.offset + ')';
    $('clockB').innerHTML = b.time + '<span class="td-cc-sec">:' + b.sec + '</span>';
    $('dateB').textContent = b.date;

    // --- Work status ---
    function getStatus(hour, day) {
      const isWeekend = day === 'Sat' || day === 'Sun';
      if (isWeekend) return ['night', t('timedifference.status.weekend','周末 · 休息中')];
      if (hour >= 9 && hour < 18) return ['working', t('timedifference.status.working','工作时间')];
      if (hour >= 18 && hour < 22) return ['off', t('timedifference.status.off','下班时间')];
      return ['night', t('timedifference.status.night','深夜休息')];
    }

    const [stA, stTextA] = getStatus(a.hour, a.dayOfWeek);
    const [stB, stTextB] = getStatus(b.hour, b.dayOfWeek);

    ['A','B'].forEach(side => {
      const card = $('card' + side);
      const status = side === 'A' ? stA : stB;
      const text = side === 'A' ? stTextA : stTextB;
      card.className = 'td-clock-card ' + status;
      const statusEl = $('status' + side);
      statusEl.className = 'td-cc-status ' + status;
      $('statusText' + side).textContent = text;
    });

    // --- Difference ---
    const offA = getTimezoneOffset(tzA);
    const offB = getTimezoneOffset(tzB);
    const rawDiff = offA - offB; // positive = A ahead of B (= B behind A)
    const absDiff = Math.abs(rawDiff);
    const diffHours = Math.floor(absDiff);
    const diffMins = Math.round((absDiff - diffHours) * 60);

    let diffStr, diffUnit;
    if (diffMins > 0) {
      diffStr = diffHours;
      diffUnit = t('timedifference.diff.unit.hourmin','时{min}分').replace('{min}', diffMins);
    } else {
      diffStr = diffHours;
      diffUnit = t('timedifference.diff.unit.hour','小时');
    }

    $('diffNum').textContent = diffStr;
    $('diffUnit').textContent = diffUnit;

    if (rawDiff > 0) {
      $('diffDesc').textContent = fmt(t('timedifference.diff.ahead','{city}领先'), {city: infoA.name});
      $('diffArrow').textContent = '\u2190';
      $('diffArrow').style.transform = '';
    } else if (rawDiff < 0) {
      $('diffDesc').textContent = fmt(t('timedifference.diff.ahead','{city}领先'), {city: infoB.name});
      $('diffArrow').textContent = '\u2192';
      $('diffArrow').style.transform = '';
    } else {
      $('diffDesc').textContent = t('timedifference.diff.same','同时区');
      $('diffArrow').textContent = '\u2194';
    }

    // --- Work Hours Visualization ---
    // Working hours 9-18 local → UTC
    // UTC hour = (localHour - offset) % 24
    const A_WORK_START = 9, A_WORK_END = 18;
    const B_WORK_START = 9, B_WORK_END = 18;

    function localToUTC(localHour, offsetHours) {
      return ((localHour - offsetHours) % 24 + 24) % 24;
    }

    const aStart = localToUTC(A_WORK_START, offA);
    const aEnd = localToUTC(A_WORK_END, offA);
    const bStart = localToUTC(B_WORK_START, offB);
    const bEnd = localToUTC(B_WORK_END, offB);

    // UTC now
    const utcNow = now.getUTCHours() + now.getUTCMinutes() / 60;

    // Render timeline labels
    const tlLabels = [];
    for (let i = 0; i <= 24; i += 3) tlLabels.push('<span>' + i + ':00</span>');
    $('tlLabels').innerHTML = tlLabels.join('');

    function toPercent(h) { return (h / 24 * 100).toFixed(1) + '%'; }
    function toWidth(s, e) {
      if (e > s) return ((e - s) / 24 * 100).toFixed(1) + '%';
      return ((24 - s + e) / 24 * 100).toFixed(1) + '%';
    }

    // City A blocks
    function setBar(workEl, blockEl, start, end) {
      if (end > start) {
        workEl.style.left = toPercent(start);
        workEl.style.width = toWidth(start, end);
        blockEl.style.left = '0';
        blockEl.style.width = '0';
      } else {
        // Wraps around midnight: two segments
        workEl.style.left = toPercent(start);
        workEl.style.width = toWidth(start, 24);
        blockEl.style.left = '0';
        blockEl.style.width = toPercent(end);
        blockEl.style.display = 'block';
      }
    }

    function setBarWrap(workEl, blockEl, start, end) {
      blockEl.style.display = 'block';
      if (end > start) {
        workEl.style.left = toPercent(start);
        workEl.style.width = toWidth(start, end);
        blockEl.style.left = '0';
        blockEl.style.width = '0';
        blockEl.style.display = 'none';
      } else {
        workEl.style.left = toPercent(start);
        workEl.style.width = toWidth(start, 24);
        blockEl.style.left = '0';
        blockEl.style.width = toPercent(end);
      }
    }

    setBarWrap($('workA'), $('blockA'), aStart, aEnd);
    setBarWrap($('workB'), $('blockB'), bStart, bEnd);

    $('labelA').textContent = infoA.name;
    $('labelB').textContent = infoB.name;
    $('legendA').textContent = infoA.name + ' ' + t('timedifference.legend.workHours','工作时段');
    $('legendB').textContent = infoB.name + ' ' + t('timedifference.legend.workHours','工作时段');

    // Overlap
    function intervalsOverlap(s1, e1, s2, e2) {
      // Normalize: unwrap both intervals to 0-48 range
      if (e1 <= s1) e1 += 24;
      if (e2 <= s2) e2 += 24;
      // Check direct overlap
      const os = Math.max(s1, s2);
      const oe = Math.min(e1, e2);
      if (oe > os) return [(os % 24), (oe % 24)];
      // Check with interval 1 shifted by +24
      const os2 = Math.max(s1 + 24, s2);
      const oe2 = Math.min(e1 + 24, e2);
      if (oe2 > os2) return [(os2 % 24), (oe2 % 24)];
      return null;
    }

    const overlap = intervalsOverlap(aStart, aEnd, bStart, bEnd);

    // Update city times table
    function formatTimeForUTC(utcH, tz) {
      const localH = ((utcH + getTimezoneOffset(tz)) % 24 + 24) % 24;
      const h = Math.floor(localH);
      const m = Math.round((localH - h) * 60);
      const period = h >= 12 ? t('timedifference.pm','下午') : t('timedifference.am','上午');
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return period + h12 + ':' + String(m).padStart(2, '0');
    }

    if (overlap) {
      const [os, oe] = overlap;
      const overlapHrs = oe > os ? (oe - os) : (24 - os + oe);
      setBarWrap($('overlapWork'), $('overlapFill'), os, oe);
      $('overlapRow').style.display = 'block';
      $('overlapSummary').className = 'td-overlap-summary';
      $('overlapSummary').querySelector('.icon-wrap').textContent = '\u2713';
      $('overlapText').innerHTML = '<strong>' + fmt(t('timedifference.overlap.hasOverlap','{hours} 小时重叠窗口'), {hours: Math.round(overlapHrs)}) + '</strong><br>' + t('timedifference.overlap.hasOverlapDesc','双方都在工作时间的通话黄金时段。建议安排在 UTC ') +
        Math.floor(os).toString().padStart(2, '0') + ':00 – ' + Math.floor(oe).toString().padStart(2, '0') + ':00 ' + t('timedifference.overlap.between','之间');

      // City times during overlap
      const midUTCH = (os + oe) / 2;
      $('cityTimes').innerHTML = [
        '<div class="td-ct-item"><span class="td-ct-city">' + infoA.name + '</span>' + t('timedifference.bestTime','最佳通话时间') + ' <span class="td-ct-time">' + formatTimeForUTC(midUTCH, tzA) + '</span><span class="td-ct-badge good">' + t('timedifference.recommended','推荐') + '</span></div>',
        '<div class="td-ct-item"><span class="td-ct-city">' + infoB.name + '</span>' + t('timedifference.bestTime','最佳通话时间') + ' <span class="td-ct-time">' + formatTimeForUTC(midUTCH, tzB) + '</span><span class="td-ct-badge good">' + t('timedifference.recommended','推荐') + '</span></div>',
      ].join('');
    } else {
      $('overlapWork').style.width = '0';
      $('overlapFill').style.width = '0';
      $('overlapSummary').className = 'td-overlap-summary no-overlap';
      $('overlapSummary').querySelector('.icon-wrap').textContent = '\u2717';
      $('overlapText').innerHTML = '<strong>' + t('timedifference.overlap.noOverlap','无工作时间重叠') + '</strong><br>' + t('timedifference.overlap.noOverlapDesc','两城的工作时间完全错开，需要其中一方在非工作时间配合。建议使用会议规划器找到折中方案。');

      // Show each city's working hours in local time
      $('cityTimes').innerHTML = [
        '<div class="td-ct-item"><span class="td-ct-city">' + infoA.name + '</span>' + t('timedifference.workHours','工作时间') + ' <span class="td-ct-time">09:00–18:00 ' + t('timedifference.local','本地') + '</span><span class="td-ct-badge ok">' + t('timedifference.localOnly','仅限本地') + '</span></div>',
        '<div class="td-ct-item"><span class="td-ct-city">' + infoB.name + '</span>' + t('timedifference.workHours','工作时间') + ' <span class="td-ct-time">09:00–18:00 ' + t('timedifference.local','本地') + '</span><span class="td-ct-badge ok">' + t('timedifference.localOnly','仅限本地') + '</span></div>',
      ].join('');
    }

    // UTC now indicator
    document.querySelectorAll('.td-tl-now').forEach(el => el.remove());
    const rows = [$('rowA'), $('rowB'), $('overlapRow')];
    rows.forEach(row => {
      const nowLine = document.createElement('div');
      nowLine.className = 'td-tl-now';
      nowLine.style.left = toPercent(utcNow);
      row.appendChild(nowLine);
    });
  }

  // ========== Events ==========
  $('swapBtn').addEventListener('click', () => {
    const a = $('cityA').value;
    const b = $('cityB').value;
    $('cityA').value = b;
    $('cityB').value = a;
    updateAll();
  });

  $('cityA').addEventListener('change', updateAll);
  $('cityB').addEventListener('change', updateAll);

  buildQuickLinks();
  updateAll();
  setInterval(updateAll, 1000);
})();
