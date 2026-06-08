/**
 * GlobeTimeZone - 跨境工具箱 v4.0.1
 * Smart Dashboard + Timezone-aware ETA + Best Shipping Day
 * Fix: auto-scroll on init competes with tab navigation
 * 2026-06-08
 */
(function() {
  'use strict';
  var $ = function(id) { return document.getElementById(id); };

  // ═══════════ DATA ═══════════
  var carriers = [
    { id:'dhl', name:'DHL', fullName:'DHL 国际快递', type:'express', processing:1, shipping:{'us-east':3,'us-west':2,'uk':3,'de':3,'fr':3,'jp':2,'au':3,'ca':3}, customs:1, delivery:1, baseRate:120, perKgRate:45, reliability:98, features:['最快时效','全程追踪','优先清关'] },
    { id:'ups', name:'UPS', fullName:'UPS 国际快递', type:'express', processing:1, shipping:{'us-east':4,'us-west':3,'uk':4,'de':4,'fr':4,'jp':3,'au':4,'ca':4}, customs:1, delivery:1, baseRate:110, perKgRate:42, reliability:97, features:['稳定可靠','北美优势','上门取件'] },
    { id:'fedex', name:'FedEx', fullName:'FedEx 联邦快递', type:'express', processing:1, shipping:{'us-east':4,'us-west':3,'uk':4,'de':4,'fr':4,'jp':3,'au':4,'ca':4}, customs:1, delivery:1, baseRate:105, perKgRate:40, reliability:96, features:['全球覆盖','经济实惠','准时率高'] },
    { id:'tnt', name:'TNT', fullName:'TNT 国际快递', type:'express', processing:2, shipping:{'us-east':5,'us-west':4,'uk':3,'de':3,'fr':3,'jp':4,'au':5,'ca':5}, customs:2, delivery:1, baseRate:95, perKgRate:38, reliability:95, features:['欧洲优势','清关能力强','价格适中'] },
    { id:'ems', name:'EMS', fullName:'EMS 国际特快', type:'express', processing:2, shipping:{'us-east':7,'us-west':6,'uk':7,'de':7,'fr':7,'jp':4,'au':7,'ca':7}, customs:2, delivery:2, baseRate:80, perKgRate:30, reliability:90, features:['清关优势','不计体积重','邮政渠道'] },
    { id:'amazon-fba', name:'亚马逊FBA', fullName:'亚马逊 FBA 专线', type:'air', processing:3, shipping:{'us-east':8,'us-west':6,'uk':7,'de':8,'fr':8,'jp':5,'au':9,'ca':8}, customs:3, delivery:2, baseRate:65, perKgRate:25, reliability:92, features:['FBA入仓','双清包税','价格优惠'] },
    { id:'air-special', name:'空运专线', fullName:'空运专线', type:'air', processing:3, shipping:{'us-east':10,'us-west':8,'uk':9,'de':10,'fr':10,'jp':6,'au':11,'ca':10}, customs:3, delivery:3, baseRate:50, perKgRate:20, reliability:88, features:['性价比高','大货优势','双清包税'] },
    { id:'sea-fast', name:'海运快船', fullName:'海运快船', type:'sea', processing:5, shipping:{'us-east':20,'us-west':14,'uk':25,'de':28,'fr':27,'jp':7,'au':18,'ca':18}, customs:5, delivery:5, baseRate:20, perKgRate:8, reliability:85, features:['超大货优势','成本最低','双清包税'] }
  ];

  var destinations = {
    'us-east': { name:'美国东部·纽约', tz:'America/New_York', gmt:'GMT-5', countryCode:'US' },
    'us-west': { name:'美国西部·洛杉矶', tz:'America/Los_Angeles', gmt:'GMT-8', countryCode:'US' },
    'uk':      { name:'英国·伦敦', tz:'Europe/London', gmt:'GMT+0', countryCode:'GB' },
    'de':      { name:'德国·柏林', tz:'Europe/Berlin', gmt:'GMT+1', countryCode:'DE' },
    'fr':      { name:'法国·巴黎', tz:'Europe/Paris', gmt:'GMT+1', countryCode:'FR' },
    'jp':      { name:'日本·东京', tz:'Asia/Tokyo', gmt:'GMT+9', countryCode:'JP' },
    'au':      { name:'澳大利亚·悉尼', tz:'Australia/Sydney', gmt:'GMT+10', countryCode:'AU' },
    'ca':      { name:'加拿大·多伦多', tz:'America/Toronto', gmt:'GMT-5', countryCode:'CA' }
  };

  var originNames = {
    'shenzhen':'深圳','guangzhou':'广州','yiwu':'义乌','shanghai':'上海','ningbo':'宁波','qingdao':'青岛'
  };

  var tariffRules = {
    US: { deMinimis:800, vatRate:0, dutyRates:{ electronics:0, clothing:0.12, toys:0, beauty:0.05, shoes:0.09, jewelry:0.055, sports:0.04, auto:0.025 } },
    GB: { deMinimis:135, vatRate:0.20, dutyRates:{ electronics:0, clothing:0.12, toys:0.04, beauty:0.065, shoes:0.08, jewelry:0.04, sports:0.04, auto:0.045 } },
    DE: { deMinimis:0, vatRate:0.19, dutyRates:{ electronics:0, clothing:0.12, toys:0.045, beauty:0.065, shoes:0.08, jewelry:0.04, sports:0.045, auto:0.045 } },
    FR: { deMinimis:0, vatRate:0.20, dutyRates:{ electronics:0, clothing:0.12, toys:0.045, beauty:0.065, shoes:0.08, jewelry:0.04, sports:0.045, auto:0.045 } },
    JP: { deMinimis:10000, vatRate:0.10, dutyRates:{ electronics:0, clothing:0.09, toys:0, beauty:0.05, shoes:0.15, jewelry:0.055, sports:0, auto:0 } },
    AU: { deMinimis:1000, vatRate:0.10, dutyRates:{ electronics:0, clothing:0.10, toys:0.05, beauty:0.05, shoes:0.10, jewelry:0.05, sports:0.05, auto:0.05 } },
    CA: { deMinimis:20, vatRate:0.05, dutyRates:{ electronics:0, clothing:0.17, toys:0.05, beauty:0.065, shoes:0.17, jewelry:0.06, sports:0.05, auto:0.06 } }
  };

  var fxRates = { CNY:1, USD:0.138, EUR:0.127, GBP:0.109, JPY:20.1, AUD:0.212, CAD:0.190 };

  var hsCodes = [
    { code:'8471.30', name:'笔记本电脑', rate:'0%' },{ code:'8517.12', name:'智能手机', rate:'0%' },
    { code:'8518.30', name:'耳机/耳塞', rate:'0%' },{ code:'9503.00', name:'玩具/模型', rate:'0-4.5%' },
    { code:'6109.10', name:'T恤/上衣', rate:'12%' },{ code:'6204.62', name:'裤子/牛仔裤', rate:'12%' },
    { code:'6403.99', name:'运动鞋', rate:'9-17%' },{ code:'4202.22', name:'手提包/箱包', rate:'8-17%' },
    { code:'3304.99', name:'护肤品/面霜', rate:'5-6.5%' },{ code:'3304.20', name:'眼妆/睫毛膏', rate:'5%' },
    { code:'7117.19', name:'时尚饰品', rate:'4-5.5%' },{ code:'9506.91', name:'健身器材', rate:'4%' },
    { code:'9403.60', name:'家具/家居', rate:'0-5%' },{ code:'8525.80', name:'相机/摄像机', rate:'0%' },
    { code:'8471.60', name:'键盘鼠标', rate:'0%' },{ code:'8544.42', name:'数据线/充电线', rate:'0%' },
    { code:'8504.40', name:'充电器/电源适配器', rate:'0%' },{ code:'6110.20', name:'卫衣/帽衫', rate:'12%' }
  ];

  var prohibitedDB = {
    US: { banned:'武器弹药、毒品、象牙制品、古巴雪茄、盗版商品、未批准药品、肉类乳制品', restricted:'含酒精饮料、烟草产品、处方药(FDA)、电子产品(FCC)、儿童产品(CPSC)', deMinimis:'<strong>$800</strong> 以下免税（Section 321）' },
    GB: { banned:'武器、毒品、濒危动植物、未经UKCA认证无线设备、攻击性武器', restricted:'食品(卫生证书)、药品(MHRA)、含酒精饮料、烟草、动植物(检疫)', deMinimis:'<strong>£135</strong> 以下免征关税，但均需缴VAT(20%)' },
    DE: { banned:'武器、毒品、纳粹物品、假冒商品、无CE标志电子产品、危险化学品', restricted:'食品(欧盟卫生证书)、药品(EMA)、动植物(检疫)、无线设备(CE/RED)、化妆品(CPNP)', deMinimis:'<strong>€0</strong> 起征 — 所有进口均需缴税。注意EPR合规。' },
    JP: { banned:'武器、毒品、淫秽物品、假冒商品、侵权商品、含伪麻黄碱药品', restricted:'食品(检疫)、化妆品(药事法)、电子产品(PSE/TELEC)、动植物(严格检疫)', deMinimis:'<strong>¥10,000</strong> 以下免税' },
    AU: { banned:'武器、毒品、石棉制品、未经批准转基因产品', restricted:'食品(严格检疫)、药品(TGA)、动植物制品(检疫)、无线设备(ACMA)', deMinimis:'<strong>A$1,000</strong> 以下免税' },
    CA: { banned:'武器、毒品、淫秽物品、仇恨言论材料、未申报食品', restricted:'食品(CFIA)、药品(Health Canada)、无线设备(ISED)、动植物(检疫)', deMinimis:'<strong>C$20</strong> 起征（极低）' }
  };

  // ═══════════ STATE ═══════════
  var currentFilter = 'all';
  var currentResults = [];
  var currentQuery = null;

  // ═══════════ LOCAL STORAGE ═══════════
  function loadRoutes() {
    try { return JSON.parse(localStorage.getItem('gtz_routes') || '[]'); } catch(e) { return []; }
  }
  function saveRoutes(routes) {
    try { localStorage.setItem('gtz_routes', JSON.stringify(routes)); } catch(e) {}
  }
  function loadTracking() {
    try { return JSON.parse(localStorage.getItem('gtz_tracking') || '[]'); } catch(e) { return []; }
  }
  function saveTracking(list) {
    try { localStorage.setItem('gtz_tracking', JSON.stringify(list)); } catch(e) {}
  }
  function loadLastQuery() {
    try { return JSON.parse(localStorage.getItem('gtz_last_query') || 'null'); } catch(e) { return null; }
  }
  function saveLastQuery(q) {
    try { localStorage.setItem('gtz_last_query', JSON.stringify(q)); } catch(e) {}
  }

  // ═══════════ TOAST ═══════════
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'xb-toast'; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function() { t.classList.add('show'); });
    setTimeout(function() { t.classList.remove('show'); setTimeout(function() { t.remove(); }, 300); }, 2000);
  }

  // ═══════════ DASHBOARD RENDERING ═══════════
  function renderDashboard() {
    var routes = loadRoutes();
    var tracking = loadTracking();
    var dash = $('smartDashboard');
    var hasData = routes.length > 0 || tracking.length > 0;

    if (dash) {
      dash.classList.toggle('show', hasData);
    }

    // Routes
    var dr = $('dashRoutes');
    if (dr) {
      if (routes.length === 0) {
        dr.innerHTML = '<div class="xb-dash-empty">查询物流后，点击"收藏此路线"即可快速复用</div>';
      } else {
        dr.innerHTML = routes.map(function(r, i) {
          return '<span class="xb-dash-route-btn" onclick="window._xBLoadRoute(' + i + ')" title="点击一键填入">' +
            (originNames[r.origin] || r.origin) + ' → ' + (destinations[r.destination] ? destinations[r.destination].name : r.destination) +
            (r.label ? ' (' + r.label + ')' : '') +
            '</span>';
        }).join('');
      }
      if ($('dashRouteCount')) $('dashRouteCount').textContent = routes.length + '条路线';
    }

    // Tracking
    var dt = $('dashTracking');
    if (dt) {
      if (tracking.length === 0) {
        dt.innerHTML = '<div class="xb-dash-empty">追踪包裹后，点击"添加到关注列表"保存</div>';
      } else {
        dt.innerHTML = tracking.map(function(t, i) {
          return '<div class="xb-dash-track-item">' +
            '<div><div class="xb-dash-track-tn">' + escapeHtml(t.tn) + '</div>' +
            '<div style="font-size:0.7rem;color:var(--xb-muted);">' + (t.label || '') + ' · 上次更新：' + (t.lastChecked || '--') + '</div></div>' +
            '<div class="xb-dash-track-actions">' +
            '<button onclick="window._xBRefreshTrack(' + i + ')">🔄</button>' +
            '<button class="del" onclick="window._xBRemoveTrack(' + i + ')">✕</button>' +
            '</div></div>';
        }).join('');
      }
      if ($('dashTrackCount')) $('dashTrackCount').textContent = tracking.length + '个包裹';
    }

    // Sidebar
    renderSidebarRoutes();
    renderSidebarTracking();
  }

  function renderSidebarRoutes() {
    var routes = loadRoutes();
    var el = $('sidebarRoutes');
    if (!el) return;
    if (routes.length === 0) {
      el.innerHTML = '<span style="font-size:0.78rem;">暂无收藏路线</span>';
    } else {
      el.innerHTML = routes.slice(0, 5).map(function(r, i) {
        return '<div style="padding:4px 0;font-size:0.78rem;cursor:pointer;display:flex;justify-content:space-between;" onclick="window._xBLoadRoute(' + i + ')">' +
          '<span>' + (originNames[r.origin] || r.origin) + ' → ' + (destinations[r.destination] ? destinations[r.destination].name : r.destination) + '</span>' +
          '<span onclick="event.stopPropagation();window._xBRemoveRoute(' + i + ')" style="color:var(--xb-muted);cursor:pointer;font-size:0.7rem;">✕</span>' +
          '</div>';
      }).join('');
    }
  }

  function renderSidebarTracking() {
    var tracking = loadTracking();
    var el = $('sidebarTracking');
    if (!el) return;
    if (tracking.length === 0) {
      el.innerHTML = '<span style="font-size:0.78rem;">暂无追踪包裹</span>';
    } else {
      el.innerHTML = tracking.slice(0, 5).map(function(t, i) {
        return '<div style="padding:4px 0;font-size:0.78rem;display:flex;justify-content:space-between;">' +
          '<span style="font-family:monospace;color:var(--xb-primary);">' + escapeHtml(t.tn) + '</span>' +
          '<span onclick="window._xBRefreshTrack(' + i + ')" style="cursor:pointer;">🔄</span>' +
          '</div>';
      }).join('');
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ═══════════ ROUTE OPERATIONS ═══════════
  function saveCurrentRoute() {
    var origin = $('origin').value;
    var destination = $('destination').value;
    var weight = parseFloat($('weight').value) || 1;
    var routes = loadRoutes();

    var label = (originNames[origin] || origin) + '→' + (destinations[destination] ? destinations[destination].name.split('·')[0] : destination);
    var route = { origin: origin, destination: destination, weight: weight, label: (originNames[origin]||origin) + ' → ' + (destinations[destination]?destinations[destination].name:destination) };

    // Check duplicate
    var dup = routes.findIndex(function(r) { return r.origin === origin && r.destination === destination; });
    if (dup >= 0) {
      routes[dup] = route;
      toast('路线已更新！');
    } else {
      if (routes.length >= 10) routes.shift();
      routes.push(route);
      toast('路线已收藏！⭐');
    }

    saveRoutes(routes);
    renderDashboard();
    // Update save button style
    var btn = $('saveRouteBtn');
    if (btn) { btn.classList.add('saved'); btn.textContent = '✅ 已收藏，下次一键调用'; setTimeout(function() { btn.textContent = '📌 收藏此路线，下次一键调用'; btn.classList.remove('saved'); }, 2000); }
  }

  window._xBLoadRoute = function(index) {
    var routes = loadRoutes();
    var r = routes[index];
    if (!r) return;
    $('origin').value = r.origin;
    $('destination').value = r.destination;
    if (r.weight) $('weight').value = r.weight;

    // Switch to logistics tab
    document.querySelectorAll('.xb-tab-btn').forEach(function(b) { b.classList.remove('active'); });
    var logisticsTab = document.querySelector('.xb-tab-btn[data-tab="tab-logistics"]');
    if (logisticsTab) logisticsTab.classList.add('active');
    document.querySelectorAll('.xb-tab-panel').forEach(function(p) { p.classList.remove('active'); });
    var panel = $('tab-logistics');
    if (panel) panel.classList.add('active');

    calculate();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window._xBRemoveRoute = function(index) {
    var routes = loadRoutes();
    routes.splice(index, 1);
    saveRoutes(routes);
    renderDashboard();
  };

  // ═══════════ TRACKING OPERATIONS ═══════════
  function saveTrackingNumber(tn, label) {
    var list = loadTracking();
    // Check dup
    var idx = list.findIndex(function(t) { return t.tn === tn; });
    var now = new Date();
    var nowStr = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    if (idx >= 0) {
      list[idx].lastChecked = nowStr;
    } else {
      if (list.length >= 20) list.shift();
      list.push({ tn: tn, label: label || '', lastChecked: nowStr });
    }
    saveTracking(list);
    renderDashboard();
    toast('已添加到关注列表 📌');
  }

  window._xBRefreshTrack = function(index) {
    var list = loadTracking();
    var t = list[index];
    if (!t) return;
    // Refresh timestamp
    var now = new Date();
    t.lastChecked = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    saveTracking(list);
    showTracking(t.tn, null, '');
    renderDashboard();
  };

  window._xBRemoveTrack = function(index) {
    var list = loadTracking();
    list.splice(index, 1);
    saveTracking(list);
    renderDashboard();
  };

  // ═══════════ TABS ═══════════
  function initTabs() {
    document.querySelectorAll('.xb-tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.xb-tab-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        document.querySelectorAll('.xb-tab-panel').forEach(function(p) { p.classList.remove('active'); });
        var panel = document.getElementById(btn.dataset.tab);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ═══════════ REAL-TIME CLOCK ═══════════
  function updateTimeDisplay() {
    var destSelect = $('destination');
    if (!destSelect) return;
    var dest = destinations[destSelect.value];
    if (!dest) return;
    var now = new Date();
    var cnTime = now.toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit', hour12:false });
    var cnDate = now.toLocaleDateString('zh-CN', { month:'short', day:'numeric', weekday:'short' });
    var ot = $('originTime'), od = $('originDate');
    if (ot) ot.textContent = cnTime;
    if (od) od.textContent = cnDate;
    var dn = $('destName'), dtm = $('destTime'), dd = $('destDate'), dtz = $('destTz');
    if (dn) dn.textContent = '目的地 · ' + dest.name.split('·')[1].trim();
    if (dtz) dtz.textContent = dest.gmt;
    try {
      var dTime = new Intl.DateTimeFormat('zh-CN', { timeZone: dest.tz, hour:'2-digit', minute:'2-digit', hour12:false }).format(now);
      var dDate = new Intl.DateTimeFormat('zh-CN', { timeZone: dest.tz, month:'short', day:'numeric', weekday:'short' }).format(now);
      if (dtm) dtm.textContent = dTime;
      if (dd) dd.textContent = dDate;
    } catch(e) { if (dtm) dtm.textContent = '--:--'; }
  }

  // ═══════════ TIMEZONE-AWARE ETA ═══════════
  function getTimezoneETA(etaDate, destTz) {
    try {
      var fmt = new Intl.DateTimeFormat('zh-CN', { timeZone: destTz, weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false, month:'numeric', day:'numeric' });
      var parts = fmt.formatToParts(etaDate);
      var text = '';
      parts.forEach(function(p) { text += p.value; });
      // Parse hour
      var hourFmt = new Intl.DateTimeFormat('en-US', { timeZone: destTz, hour:'numeric', hour12:false });
      var hour = parseInt(hourFmt.format(etaDate));
      var dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: destTz, weekday:'short' });
      var dayName = dayFmt.format(etaDate);
      // Chinese weekday
      var cnWeek = { Mon:'周一', Tue:'周二', Wed:'周三', Thu:'周四', Fri:'周五', Sat:'周六', Sun:'周日' };
      var dow = cnWeek[dayName] || dayName;

      var cls = 'ok', icon = '✅', msg = '派送员正在工作';
      if (dow === '周六' || dow === '周日') { cls = 'bad'; icon = '⚠️'; msg = '周末到达，可能下周一才派送'; }
      else if (hour < 8 || hour >= 18) { cls = 'warn'; icon = '⚠️'; msg = '非工作时间到达，可能次日派送'; }

      return { cls:cls, icon:icon, dow:dow, time:text, msg:msg };
    } catch(e) {
      return { cls:'ok', icon:'✅', dow:'', time:'', msg:'预计准时到达' };
    }
  }

  // ═══════════ BEST SHIPPING DAY ═══════════
  function getBestShippingDay(shipDateStr, totalDays, destTz) {
    var shipDate = new Date(shipDateStr);
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var shipDay = new Date(shipDate.getFullYear(), shipDate.getMonth(), shipDate.getDate());
    var diffDays = Math.floor((shipDay - today) / 86400000);
    var dayNames = ['周日','周一','周二','周三','周四','周五','周六'];
    if (diffDays <= 0) {
      var etaDate = new Date(today.getTime() + totalDays * 86400000);
      var tzETA = getTimezoneETA(etaDate, destTz);
      if (tzETA.cls === 'bad') {
        return { text:'⚠️ 今天发货' + dayNames[today.getDay()] + '到，但' + tzETA.dow + '才派送。建议等一天。', cls:'warn' };
      }
      return { text:'✅ 今天发货，预计' + tzETA.dow + '到达', cls:'ok' };
    } else if (diffDays === 1) {
      return { text:'明天(' + dayNames[shipDay.getDay()] + ')发货', cls:'ok' };
    }
    return { text:diffDays + '天后发货', cls:'ok' };
  }

  // ═══════════ COUNTDOWN ═══════════
  function getCountdownText(etaStr) {
    var eta = new Date(etaStr);
    var now = new Date();
    var diffMs = eta.getTime() - now.getTime();
    if (diffMs <= 0) return '';
    var diffDays = Math.ceil(diffMs / 86400000);
    if (diffDays <= 3) return '<span class="xb-countdown">⏱ ' + diffDays + '天后到达</span>';
    return '';
  }

  // ═══════════ DDP ESTIMATION ═══════════
  function estimateDDP(destKey, declaredValue) {
    var countryCode = (destinations[destKey] || {}).countryCode || 'US';
    var rules = tariffRules[countryCode] || tariffRules.US;
    if (declaredValue <= rules.deMinimis) {
      return { duty:0, vat:0, total:0, taxable:false, note:'低于免税起征点，无需缴税' };
    }
    var dutyRate = 0.05;
    var duty = Math.round(declaredValue * dutyRate * 100) / 100;
    var vat = Math.round((declaredValue + duty) * rules.vatRate * 100) / 100;
    var total = Math.round((duty + vat) * 100) / 100;
    return { duty:duty, vat:vat, total:total, taxable:true, note:'基于平均税率估算，实际以海关核定为准。VAT ' + (rules.vatRate*100) + '%' };
  }

  // ═══════════ AUTO CALC ═══════════
  function attachAutoCalc() {
    ['weight','length','width','height','destination','shipDate','declaredValue'].forEach(function(id) {
      var el = $(id);
      if (el) {
        el.addEventListener('change', function() { calculate(); });
        if (el.type === 'number') {
          el.addEventListener('input', function() {
            clearTimeout(el._timer);
            el._timer = setTimeout(function() { calculate(); }, 400);
          });
        }
      }
    });
  }

  // ═══════════ LOGISTICS CALCULATION ═══════════
  function calculate(shouldScroll) {
    var destKey = $('destination').value;
    var weight = parseFloat($('weight').value) || 1;
    var length = parseFloat($('length').value) || 20;
    var width = parseFloat($('width').value) || 15;
    var height = parseFloat($('height').value) || 10;
    var shipDate = $('shipDate').value;
    var declaredValue = parseFloat($('declaredValue').value) || 50;

    if (!shipDate) {
      var today = new Date();
      shipDate = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
      $('shipDate').value = shipDate;
    }

    var volWeight = (length * width * height) / 5000;
    var billWeight = Math.max(weight, volWeight);
    var ddpInfo = estimateDDP(destKey, declaredValue);
    var destTz = (destinations[destKey] || {}).tz || 'UTC';

    // Save last query
    currentQuery = { origin: $('origin').value, destination: destKey, weight: weight, declaredValue: declaredValue, timestamp: Date.now() };
    saveLastQuery(currentQuery);

    currentResults = carriers.map(function(c) {
      var shippingDays = c.shipping[destKey] || 5;
      var totalDays = c.processing + shippingDays + c.customs + c.delivery;
      var freight = Math.round(c.baseRate + billWeight * c.perKgRate);
      var ddpTotal = Math.round((freight + ddpInfo.total) * 100) / 100;

      // Calc ETA and timezone ETA
      var etaDate = new Date(shipDate);
      etaDate.setDate(etaDate.getDate() + totalDays);
      var etaStr = etaDate.getFullYear() + '-' + String(etaDate.getMonth()+1).padStart(2,'0') + '-' + String(etaDate.getDate()).padStart(2,'0');
      var tzEta = getTimezoneETA(etaDate, destTz);

      return {
        carrier: c, totalDays: totalDays, cost: freight, shippingDays: shippingDays,
        billWeight: Math.round(billWeight * 100) / 100, shipDate: shipDate,
        ddpInfo: ddpInfo, ddpTotal: ddpTotal, declaredValue: declaredValue,
        etaStr: etaStr, tzEta: tzEta, destTz: destTz
      };
    });

    currentResults.sort(function(a, b) { return a.totalDays - b.totalDays; });
    var minDays = currentResults[0].totalDays;
    var minCost = Infinity;
    currentResults.forEach(function(r) { if (r.cost < minCost) minCost = r.cost; });
    currentResults.forEach(function(r) {
      r.isFastest = r.totalDays === minDays;
      r.isCheapest = r.cost === minCost;
    });

    currentFilter = 'all';
    document.querySelectorAll('#tab-logistics .xb-fbtn').forEach(function(b) { b.classList.remove('on'); });
    var allBtn = document.querySelector('#tab-logistics .xb-fbtn[data-filter="all"]');
    if (allBtn) allBtn.classList.add('on');

    renderResults();
    $('logisticsResults').style.display = 'block';
    $('trackingDetail').style.display = 'none';
    // HookSystem: 价值量化
    if (typeof HookSystem !== 'undefined' && currentResults.length > 0) {
      setTimeout(function() { HookSystem.showShippingValue(currentResults); }, 50);
    }
    if (shouldScroll !== false) { $('logisticsResults').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  function renderResults() {
    var filtered = currentResults;
    if (currentFilter === 'express') filtered = currentResults.filter(function(r) { return r.carrier.type === 'express'; });
    else if (currentFilter === 'air') filtered = currentResults.filter(function(r) { return r.carrier.type === 'air'; });
    else if (currentFilter === 'sea') filtered = currentResults.filter(function(r) { return r.carrier.type === 'sea'; });

    var list = $('logisticsList');
    if (!filtered.length) {
      list.innerHTML = '<div class="xb-empty"><div class="xb-empty-icon">📦</div><p>没有匹配的物流方案</p></div>';
      return;
    }

    var typeLabels = { express:'快递', air:'空运', sea:'海运' };

    list.innerHTML = filtered.map(function(r) {
      var c = r.carrier;
      var countdown = getCountdownText(r.etaStr);
      var badges = '';
      if (r.isFastest) badges += '<span class="xb-badge-best xb-badge-fast">最快</span> ';
      if (r.isCheapest) badges += '<span class="xb-badge-best xb-badge-cheap">最省</span> ';
      var daysColor = r.totalDays <= 5 ? 'color:#10b981;' : (r.totalDays <= 10 ? 'color:#f59e0b;' : 'color:#ef4444;');

      var ddpHtml = '';
      if (r.ddpInfo.taxable) {
        ddpHtml = '<div class="xb-scheme-ddp">含税总价(DDP)：<strong> ¥' + r.ddpTotal.toLocaleString() + '</strong>（关税 ¥' + r.ddpInfo.total + '）</div>';
      } else {
        ddpHtml = '<div class="xb-scheme-ddp">含税总价(DDP)：<strong> ¥' + r.cost.toLocaleString() + '</strong>（免税 ✅）</div>';
      }

      // Timezone-aware ETA
      var tzEtaHtml = '<div class="xb-tz-eta ' + r.tzEta.cls + '">' +
        '<span class="xb-tz-eta-icon">' + r.tzEta.icon + '</span>' +
        '<span class="xb-tz-eta-text"><strong>' + r.tzEta.dow + ' 当地时间 ' + r.tzEta.time + '</strong> · ' + r.tzEta.msg + '</span>' +
        '</div>';

      return '<div class="xb-scheme ac-'+c.type+'" onclick="window._xBShowTracking(\''+c.id+'\')">' +
        '<div class="xb-scheme-top">' +
          '<div class="xb-scheme-name">' +
            c.fullName +
            '<span class="xb-type-tag '+c.type+'">'+ (typeLabels[c.type] || c.type) +'</span>' +
            badges +
          '</div>' +
          '<div><div class="xb-scheme-price">¥' + r.cost.toLocaleString() + '</div>' + ddpHtml + '</div>' +
        '</div>' +
        '<div class="xb-scheme-meta">' +
          '<span>总时效：<strong style="'+daysColor+'">'+r.totalDays+' 天</strong></span>' +
          '<span>运输 '+r.shippingDays+'天</span>' +
          '<span>可靠性 '+c.reliability+'%</span>' +
        '</div>' +
        '<div class="xb-scheme-eta">预计送达：<strong>'+r.etaStr+'</strong> · 计费重 '+r.billWeight+' kg' + countdown + '</div>' +
        tzEtaHtml +
        '<div class="xb-scheme-tags">' + c.features.map(function(f) { return '<span class="xb-tag">'+f+'</span>'; }).join('') + '</div>' +
      '</div>';
    }).join('');
  }

  // ═══════════ TARIFF CALCULATOR ═══════════
  function calcTariff() {
    var countryCode = $('tariffDest').value;
    var category = $('tariffCategory').value;
    var declaredValue = parseFloat($('tariffValue').value) || 100;
    var freight = parseFloat($('tariffFreight').value) || 30;
    var qty = parseInt($('tariffQty').value) || 1;
    var rules = tariffRules[countryCode] || tariffRules.US;
    var dutyRate = (rules.dutyRates[category] || 0.05);
    var totalValue = declaredValue * qty;
    var duty = 0, vat = 0;
    if (totalValue <= rules.deMinimis) { duty = 0; vat = 0; }
    else {
      duty = Math.round(totalValue * dutyRate * 100) / 100;
      vat = Math.round((totalValue + duty + freight) * rules.vatRate * 100) / 100;
    }
    var taxTotal = Math.round((duty + vat) * 100) / 100;
    var ddpTotal = Math.round((freight + taxTotal) * 100) / 100;
    var totalAll = Math.round((totalValue + freight + taxTotal) * 100) / 100;
    var catNames = { electronics:'电子产品/配件', clothing:'服装/纺织品', toys:'玩具/家居', beauty:'美妆/个护', shoes:'鞋靴/箱包', jewelry:'珠宝/饰品', sports:'运动/户外', auto:'汽车配件' };
    var ctyNames = { US:'美国', GB:'英国', DE:'德国/欧盟', FR:'法国/欧盟', JP:'日本', AU:'澳大利亚', CA:'加拿大' };

    var rowsHtml = '';
    rowsHtml += '<div class="xb-tariff-row"><span>商品价值</span><span>$' + totalValue.toFixed(2) + '</span></div>';
    rowsHtml += '<div class="xb-tariff-row"><span>国际运费</span><span>$' + freight.toFixed(2) + '</span></div>';
    rowsHtml += '<div class="xb-tariff-row"><span>关税（' + (dutyRate*100).toFixed(1) + '%）</span><span>$' + duty.toFixed(2) + '</span></div>';
    rowsHtml += '<div class="xb-tariff-row"><span>增值税VAT（' + (rules.vatRate*100) + '%）</span><span>$' + vat.toFixed(2) + '</span></div>';
    rowsHtml += '<div class="xb-tariff-row xb-tariff-total"><span>📦 DDP到门总费用</span><span><strong>$' + ddpTotal.toFixed(2) + '</strong></span></div>';
    rowsHtml += '<div class="xb-tariff-row xb-tariff-total"><span>🛒 含商品总成本</span><span><strong>$' + totalAll.toFixed(2) + '</strong></span></div>';

    var note = '目的地：' + (ctyNames[countryCode]||countryCode) + ' · 商品类别：' + (catNames[category]||category);
    if (totalValue <= rules.deMinimis) note = '✅ 低于免税起征点，无需缴关税和VAT！' + note;

    $('tariffRows').innerHTML = rowsHtml;
    $('tariffNote').textContent = note;
    $('tariffResult').classList.add('show');
    $('tariffResult').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ═══════════ TRACKING ═══════════
  function showTracking(trackingNumber, result, panelPrefix) {
    var prefix = panelPrefix || '';
    var detailEl = $('trackingDetail');
    var tabResult = $('tabTrackingResult');

    if (panelPrefix === 'tab') {
      if (tabResult) tabResult.style.display = 'block';
      var tnEl = $('tabTrackingTN'); if (tnEl) tnEl.textContent = trackingNumber;
    } else {
      if (detailEl) detailEl.style.display = 'block';
      $('detailTrackingNumber').textContent = trackingNumber;
    }

    var steps = ['pickup','transit','customs','delivered'];
    var labels = ['已揽收','运输中','清关中','已签收'];
    var icons = ['✓','✈','⚓','🏠'];
    var completeIdx = Math.min(2, Math.floor(Math.random() * 2) + 1);

    steps.forEach(function(step, i) {
      var dotId = panelPrefix === 'tab' ? null : document.getElementById('dot-' + step);
      if (panelPrefix === 'tab') {
        var dots = ($('tab-tracking') || {}).querySelectorAll ? ($('tab-tracking').querySelectorAll('.xb-step-dot')) : [];
        if (dots[i]) {
          dots[i].className = 'xb-step-dot';
          if (i < completeIdx) { dots[i].className += ' done'; dots[i].innerHTML = '✓'; }
          else if (i === completeIdx) { dots[i].className += ' on'; dots[i].innerHTML = icons[i]; }
          else { dots[i].className += ' wait'; dots[i].innerHTML = i===3?'🏠':'⚓'; }
        }
      } else if (dotId) {
        dotId.className = 'xb-step-dot';
        if (i < completeIdx) { dotId.className += ' done'; dotId.innerHTML = '✓'; }
        else if (i === completeIdx) { dotId.className += ' on'; dotId.innerHTML = icons[i]; }
        else { dotId.className += ' wait'; dotId.innerHTML = i===3?'🏠':'⚓'; }
      }
    });

    var badgeEl = panelPrefix === 'tab' ? $('tabTrackingStatus') : $('detailStatusBadge');
    if (badgeEl) { badgeEl.textContent = labels[completeIdx]; badgeEl.className = 'xb-track-status ' + (completeIdx>=2?'done':'transit'); }

    var now = new Date();
    var timeline = [
      { time: fmtTime(new Date(now.getTime()-72*3600000)), desc: '包裹已揽收，发往分拨中心', loc: '深圳' },
      { time: fmtTime(new Date(now.getTime()-48*3600000)), desc: '离开深圳分拨中心，发往目的地', loc: '深圳机场' },
      { time: fmtTime(new Date(now.getTime()-24*3600000)), desc: '已抵达目的地国家，等待清关', loc: '目的地' }
    ];
    if (completeIdx >= 2) timeline.push({ time: fmtTime(new Date(now.getTime()-12*3600000)), desc: '清关完成，转交当地派送', loc: '派送站' });
    timeline.push({ time: fmtTime(now), desc: completeIdx>=3?'已签收':'当前状态 — '+labels[completeIdx], loc: '' });

    // Add tracking to watchlist
    saveTrackingNumber(trackingNumber, '');
    // HookSystem: 追踪记录 + 异常提醒
    if (typeof HookSystem !== 'undefined') {
      HookSystem.showTrackingValue({ number: trackingNumber, status: labels[completeIdx] });
    }

    var tlEl = panelPrefix === 'tab' ? $('tabTrackingTL') : $('trackingTimeline');
    if (tlEl) {
      tlEl.innerHTML = '<div class="xb-tl-line"></div>' + timeline.map(function(t, i) {
        return '<div class="xb-tl-node"><div class="xb-tl-dot '+(i===timeline.length-1?'now':'')+'"></div><div class="xb-tl-time">'+t.time+'</div><div class="xb-tl-desc">'+t.desc+'</div>'+(t.loc?'<div class="xb-tl-loc">'+t.loc+'</div>':'')+'</div>';
      }).join('');
    }

    var scrollEl = panelPrefix === 'tab' ? tabResult : detailEl;
    if (scrollEl) scrollEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  window._xBShowTracking = function(carrierId) {
    var result = currentResults.find(function(r) { return r.carrier.id === carrierId; });
    var fakeTN = carrierId.toUpperCase() + '-' + Math.floor(Math.random()*90000000+10000000);
    showTracking(fakeTN, result, '');
  };

  function quickTrack() {
    var tn = $('quickTrackingNumber').value.trim();
    if (!tn) { toast('请输入运单号'); return; }
    showTracking(tn, null, '');
  }
  function tabTrack() {
    var tn = ($('tabTrackingNumber') || {}).value;
    if (!tn || !tn.trim()) { toast('请输入运单号'); return; }
    showTracking(tn.trim(), null, 'tab');
  }
  function fmtTime(d) {
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  }

  // ═══════════ VOLUME WEIGHT ═══════════
  function calcVolumeWeight() {
    var l = parseFloat($('volL').value) || 20, w = parseFloat($('volW').value) || 15, h = parseFloat($('volH').value) || 10;
    var vol = l * w * h, volWt = vol / 5000;
    $('volResult').innerHTML = '体积：' + vol.toLocaleString() + ' cm³<br>体积重：<strong>' + volWt.toFixed(2) + ' kg</strong>';
    $('volResult').style.color = volWt > 2 ? '#dc2626' : '#065f46';
  }

  // ═══════════ CURRENCY ═══════════
  function calcFX() {
    var amount = parseFloat($('fxAmount').value) || 1, from = $('fxFrom').value, to = $('fxTo').value, result;
    if (from === to) result = amount;
    else { var inCNY = amount / fxRates[from]; result = Math.round(inCNY * fxRates[to] * 10000) / 10000; }
    var symbols = { CNY:'¥', USD:'$', EUR:'€', GBP:'£', JPY:'¥', AUD:'A$', CAD:'C$' };
    $('fxResult').textContent = (symbols[to]||'') + result.toFixed(4) + ' ' + to;
  }

  // ═══════════ HS CODES ═══════════
  function renderHSCodes(filter) {
    var list = filter ? hsCodes.filter(function(h) { return h.name.toLowerCase().includes(filter.toLowerCase()) || h.code.includes(filter); }) : hsCodes;
    $('hsList').innerHTML = list.map(function(h) {
      return '<div class="xb-hs-item"><span class="xb-hs-code">' + h.code + '</span><span class="xb-hs-name">' + h.name + '</span><span class="xb-hs-rate">' + h.rate + '</span></div>';
    }).join('');
  }

  // ═══════════ PROHIBITED ═══════════
  function showProhibited() {
    var data = prohibitedDB[$('prohCountry').value] || prohibitedDB.US;
    $('prohBanned').textContent = data.banned;
    $('prohRestricted').textContent = data.restricted;
    $('prohDeMinimis').innerHTML = data.deMinimis;
  }

  // ═══════════ INIT ═══════════
  function init() {
    var now = new Date();
    var yyyy = now.getFullYear(), mm = String(now.getMonth()+1).padStart(2,'0'), dd = String(now.getDate()).padStart(2,'0');
    var sd = $('shipDate'); if (sd) sd.value = yyyy + '-' + mm + '-' + dd;

    // Restore last query
    var lastQ = loadLastQuery();
    if (lastQ && lastQ.origin) {
      $('origin').value = lastQ.origin;
      $('destination').value = lastQ.destination;
      if (lastQ.weight) $('weight').value = lastQ.weight;
      if (lastQ.declaredValue) $('declaredValue').value = lastQ.declaredValue;
    }

    initTabs();

    // Logistics
    var calcBtn = $('calculateBtn'); if (calcBtn) calcBtn.addEventListener('click', function() { calculate(true); });
    var destSel = $('destination'); if (destSel) destSel.addEventListener('change', updateTimeDisplay);
    var qTrackBtn = $('quickTrackBtn'); if (qTrackBtn) qTrackBtn.addEventListener('click', quickTrack);
    var qTrackInp = $('quickTrackingNumber'); if (qTrackInp) qTrackInp.addEventListener('keydown', function(e) { if (e.key === 'Enter') quickTrack(); });
    var saveBtn = $('saveRouteBtn'); if (saveBtn) saveBtn.addEventListener('click', saveCurrentRoute);

    attachAutoCalc();
    setTimeout(function() { calculate(false); }, 300);

    // Filters
    document.querySelectorAll('#tab-logistics .xb-fbtn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('#tab-logistics .xb-fbtn').forEach(function(b) { b.classList.remove('on'); });
        btn.classList.add('on'); currentFilter = btn.dataset.filter; renderResults();
      });
    });

    // Tariff
    var tariffBtn = $('calcTariffBtn'); if (tariffBtn) tariffBtn.addEventListener('click', calcTariff);

    // Tracking tab
    var tabTrackBtn = $('tabTrackBtn'); if (tabTrackBtn) tabTrackBtn.addEventListener('click', tabTrack);
    var tabTrackInp = $('tabTrackingNumber'); if (tabTrackInp) tabTrackInp.addEventListener('keydown', function(e) { if (e.key === 'Enter') tabTrack(); });

    // Sidebar tools
    ['volL','volW','volH'].forEach(function(id) { var el = $(id); if (el) { el.addEventListener('input', calcVolumeWeight); el.addEventListener('change', calcVolumeWeight); } });
    ['fxAmount','fxFrom','fxTo'].forEach(function(id) { var el = $(id); if (el) el.addEventListener('change', calcFX); });
    var fxAmt = $('fxAmount'); if (fxAmt) fxAmt.addEventListener('input', function() { clearTimeout(fxAmt._fxTimer); fxAmt._fxTimer = setTimeout(calcFX, 300); });
    var hsSearch = $('hsSearch'); if (hsSearch) hsSearch.addEventListener('input', function() { renderHSCodes(hsSearch.value); });
    var prohCountry = $('prohCountry'); if (prohCountry) prohCountry.addEventListener('change', showProhibited);

    // Initial renders
    updateTimeDisplay(); calcVolumeWeight(); calcFX(); renderHSCodes(''); showProhibited();
    renderDashboard();
    setInterval(updateTimeDisplay, 30000);

    // HookSystem 初始化
    if (typeof HookSystem !== 'undefined') { HookSystem.init(); }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();

// ═══════════════════════════════════════════════════════════
// GlobeTimeZone 钩子系统 v1.0
// 自动记忆 · 价值量化 · 智能推荐 · 通知中心 · 分享
// ═══════════════════════════════════════════════════════════
var HookSystem = {
  history: { shipping: [], tracking: [] },
  notifications: [],

  // ═══════ 初始化 ═══════
  init: function() {
    this.loadHistory();
    this.initNotifications();
    this.initEventListeners();
    this.checkDailyReminders();
  },

  // ═══════ 1. 自动记忆系统 ═══════
  saveShippingRecord: function(data) {
    var record = {
      id: Date.now(),
      origin: data.origin,
      destination: data.destination,
      weight: data.weight,
      bestPrice: data.bestPrice,
      bestChannel: data.bestChannel,
      shippingTime: data.shippingTime,
      timestamp: new Date().toISOString()
    };
    this.history.shipping.unshift(record);
    if (this.history.shipping.length > 10) this.history.shipping = this.history.shipping.slice(0, 10);
    this._persistShipping();
    this.renderShippingHistory();
  },

  saveTrackingRecord: function(trackingNumber, status) {
    // 去重
    this.history.tracking = this.history.tracking.filter(function(r) { return r.number !== trackingNumber; });
    this.history.tracking.unshift({
      id: Date.now(), number: trackingNumber, status: status,
      lastUpdate: new Date().toISOString()
    });
    if (this.history.tracking.length > 15) this.history.tracking = this.history.tracking.slice(0, 15);
    this._persistTracking();
    this.renderTrackingHistory();

    // 异常状态通知
    if (status === '清关中' || status === '派送失败') {
      this.addNotification({
        type: 'warning',
        title: '包裹 ' + trackingNumber,
        message: '当前状态：' + status + '，请注意跟进处理'
      });
    }
  },

  loadHistory: function() {
    try {
      var s = localStorage.getItem('gtz_hook_shipping');
      if (s) { this.history.shipping = JSON.parse(s); this.renderShippingHistory(); }
    } catch(e) {}
    try {
      var t = localStorage.getItem('gtz_hook_tracking');
      if (t) { this.history.tracking = JSON.parse(t); this.renderTrackingHistory(); }
    } catch(e) {}
  },

  _persistShipping: function() {
    try { localStorage.setItem('gtz_hook_shipping', JSON.stringify(this.history.shipping)); } catch(e) {}
  },
  _persistTracking: function() {
    try { localStorage.setItem('gtz_hook_tracking', JSON.stringify(this.history.tracking)); } catch(e) {}
  },

  // ═══════ 渲染历史 ═══════
  renderShippingHistory: function() {
    var c = document.getElementById('hkShippingHistory');
    if (!c) return;
    if (this.history.shipping.length === 0) {
      c.innerHTML = '<div style="text-align:center;padding:16px 0;color:#94a3b8;font-size:0.8rem;">暂无查询记录</div>';
      return;
    }
    c.innerHTML = this.history.shipping.slice(0, 5).map(function(r) {
      return '<div class="hk-memory-card hk-fade-in" onclick="HookSystem.requeryShipping(' + r.id + ')">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
          '<div><p style="font-weight:600;font-size:0.85rem;">' + HookSystem._esc(r.origin) + ' → ' + HookSystem._esc(r.destination) + '</p>' +
          '<p style="font-size:0.72rem;color:#94a3b8;margin-top:2px;">' + r.weight + 'kg · ' + (r.dimensions || '') + '</p></div>' +
          '<div style="text-align:right;"><p style="font-weight:700;color:#2563eb;">¥ ' + r.bestPrice + '</p>' +
          '<p style="font-size:0.7rem;color:#94a3b8;margin-top:2px;">' + HookSystem._esc(r.shippingTime) + '</p></div>' +
        '</div>' +
        '<div style="text-align:right;margin-top:8px;"><span style="color:#2563eb;font-size:0.75rem;font-weight:600;">再查一次 →</span></div>' +
      '</div>';
    }).join('');
  },

  renderTrackingHistory: function() {
    var c = document.getElementById('hkTrackingHistory');
    if (!c) return;
    if (this.history.tracking.length === 0) {
      c.innerHTML = '<div style="text-align:center;padding:16px 0;color:#94a3b8;font-size:0.8rem;">暂无追踪记录</div>';
      return;
    }
    var statusMap = {
      '已签收': ['#d1fae5','#065f46'],
      '运输中': ['#dbeafe','#1d4ed8'],
      '清关中': ['#fef3c7','#92400e'],
      '派送失败': ['#fee2e2','#991b1b'],
      '暂无信息': ['#f1f5f9','#64748b']
    };
    c.innerHTML = this.history.tracking.slice(0, 8).map(function(r) {
      var s = statusMap[r.status] || ['#f1f5f9','#64748b'];
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-radius:8px;cursor:pointer;transition:.15s;font-size:0.8rem;" ' +
        'onmouseenter="this.style.background=\'#f8fafc\'" onmouseleave="this.style.background=\'transparent\'" onclick="HookSystem.retrackPackage(\'' + HookSystem._esc(r.number) + '\')">' +
        '<span style="font-family:monospace;font-weight:600;color:#2563eb;">' + HookSystem._esc(r.number) + '</span>' +
        '<span style="padding:2px 8px;border-radius:999px;font-size:0.7rem;font-weight:600;background:' + s[0] + ';color:' + s[1] + ';">' + HookSystem._esc(r.status) + '</span>' +
      '</div>';
    }).join('');
  },

  // ═══════ 重新查询/追踪 ═══════
  requeryShipping: function(id) {
    var r = this.history.shipping.find(function(x) { return x.id === id; });
    if (!r) return;
    // 自动填充表单
    var originEl = document.getElementById('origin');
    var destEl = document.getElementById('destination');
    var wtEl = document.getElementById('weight');
    if (originEl) originEl.value = r.originKey || 'shenzhen';
    if (destEl) destEl.value = r.destKey || 'us-west';
    if (wtEl) wtEl.value = r.weight;
    // 切换到物流计算 tab
    var tabs = document.querySelectorAll('.xb-tab-btn');
    tabs.forEach(function(b) { b.classList.remove('active'); });
    var logTab = document.querySelector('.xb-tab-btn[data-tab="tab-logistics"]');
    if (logTab) logTab.classList.add('active');
    var panels = document.querySelectorAll('.xb-tab-panel');
    panels.forEach(function(p) { p.classList.remove('active'); });
    var panel = document.getElementById('tab-logistics');
    if (panel) panel.classList.add('active');
    // 触发查询
    var btn = document.getElementById('calculateBtn');
    if (btn) btn.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  retrackPackage: function(number) {
    var el = document.getElementById('quickTrackingNumber');
    if (el) el.value = number;
    var btn = document.getElementById('quickTrackBtn');
    if (btn) btn.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ═══════ 清空历史 ═══════
  clearAllHistory: function() {
    if (!confirm('确定要清空所有历史记录吗？此操作不可撤销。')) return;
    localStorage.removeItem('gtz_hook_shipping');
    localStorage.removeItem('gtz_hook_tracking');
    this.history.shipping = [];
    this.history.tracking = [];
    this.renderShippingHistory();
    this.renderTrackingHistory();
  },

  // ═══════ 2. 价值量化展示 ═══════
  showShippingValue: function(results) {
    if (!results || results.length < 2) return;
    var costs = results.map(function(r) { return r.cost; });
    var days = results.map(function(r) { return r.totalDays; });
    var minCost = Math.min.apply(null, costs);
    var maxCost = Math.max.apply(null, costs);
    var minDays = Math.min.apply(null, days);
    var maxDays = Math.max.apply(null, days);
    var savedMoney = maxCost - minCost;
    var savedDays = maxDays - minDays;
    var avoidedLoss = Math.round(minCost * 0.15);
    var bestChannel = results.find(function(r) { return r.cost === minCost; });

    // 移除旧条
    var old = document.getElementById('hkValueBar');
    if (old) old.remove();

    var bar = document.createElement('div');
    bar.id = 'hkValueBar';
    bar.className = 'hk-value-bar hk-fade-in';
    bar.innerHTML =
      '<div class="hk-value-grid">' +
        '<div class="hk-value-item"><p class="hk-value-num" style="color:#059669;">¥ ' + savedMoney.toLocaleString() + '</p><p class="hk-value-label">已为你节省运费</p></div>' +
        '<div class="hk-value-item"><p class="hk-value-num" style="color:#2563eb;">' + savedDays + ' 天</p><p class="hk-value-label">最快可提前到达</p></div>' +
        '<div class="hk-value-item"><p class="hk-value-num" style="color:#ea580c;">¥ ' + avoidedLoss.toLocaleString() + '+</p><p class="hk-value-label">避免潜在延误损失</p></div>' +
        '<div class="hk-value-item" style="display:flex;align-items:center;justify-content:center;">' +
          '<button class="hk-share-btn" onclick="HookSystem.shareResult()">📤 分享给同行</button>' +
        '</div>' +
      '</div>';

    var container = document.getElementById('logisticsResults');
    if (container) container.insertBefore(bar, container.firstChild);

    // 保存记录
    var originEl = document.getElementById('origin');
    var destEl = document.getElementById('destination');
    var wtEl = document.getElementById('weight');
    var originText = originEl ? (originEl.options[originEl.selectedIndex] || {}).text || '' : '';
    var destText = destEl ? (destEl.options[destEl.selectedIndex] || {}).text || '' : '';
    this.saveShippingRecord({
      origin: originText, destKey: destEl ? destEl.value : '',
      destination: destText, originKey: originEl ? originEl.value : '',
      weight: wtEl ? wtEl.value : '1',
      bestPrice: minCost,
      bestChannel: bestChannel ? bestChannel.carrier.fullName : '',
      shippingTime: bestChannel ? (bestChannel.totalDays + '天') : ''
    });

    // 智能推荐
    this.showRecommendations('shipping');
  },

  showTrackingValue: function(data) {
    this.saveTrackingRecord(data.number, data.status);
  },

  // ═══════ 3. 智能推荐系统 ═══════
  showRecommendations: function(type) {
    var old = document.getElementById('hkRecommendations');
    if (old) old.remove();

    var recs = {
      shipping: [
        { title: '计算关税与DDP', desc: '输入申报价值，一键计算进口关税和到门总价', icon: '💰', action: function() { var b = document.querySelector('.xb-tab-btn[data-tab="tab-tariff"]'); if (b) b.click(); } },
        { title: '查看禁运品清单', desc: '发货前确认目的地禁运清单，避免扣关风险', icon: '🚫', action: function() { var b = document.querySelector('.xb-tab-btn[data-tab="tab-prohibited"]'); if (b) b.click(); } },
        { title: '追踪包裹状态', desc: '输入运单号，实时查看包裹物流轨迹', icon: '🚚', action: function() { var b = document.querySelector('.xb-tab-btn[data-tab="tab-tracking"]'); if (b) b.click(); } }
      ],
      tracking: [
        { title: '估算进口关税', desc: '提前计算关税和增值税，避免客户拒收', icon: '💰', action: function() { var b = document.querySelector('.xb-tab-btn[data-tab="tab-tariff"]'); if (b) b.click(); } },
        { title: '查询物流方案', desc: '比较8大物流商的价格和时效', icon: '📦', action: function() { var b = document.querySelector('.xb-tab-btn[data-tab="tab-logistics"]'); if (b) b.click(); } },
        { title: '体积重速算', desc: '快速计算包裹体积重，避免多花冤枉钱', icon: '📐', action: function() { var el = document.getElementById('volL'); if (el) { el.scrollIntoView({ behavior: 'smooth' }); el.focus(); } } }
      ]
    };

    var items = recs[type] || recs.shipping;
    var container = document.createElement('div');
    container.id = 'hkRecommendations';
    container.className = 'xb-card hk-fade-in';
    container.innerHTML =
      '<h4 style="font-weight:700;font-size:0.93rem;margin:0 0 14px;display:flex;align-items:center;gap:6px;">💡 为你推荐</h4>' +
      '<div class="hk-rec-grid">' +
        items.map(function(rec, i) {
          return '<div class="hk-rec-card" id="hkRec' + i + '">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="font-size:1.2rem;">' + rec.icon + '</span><p style="font-weight:600;font-size:0.85rem;">' + rec.title + '</p></div>' +
            '<p style="font-size:0.75rem;color:#94a3b8;">' + rec.desc + '</p></div>';
        }).join('') +
      '</div>';

    var resultsC = document.getElementById('logisticsResults');
    if (resultsC) {
      resultsC.appendChild(container);
      // Bind click events
      items.forEach(function(rec, i) {
        var el = document.getElementById('hkRec' + i);
        if (el) el.addEventListener('click', rec.action);
      });
    }
  },

  // ═══════ 4. 通知系统 ═══════
  initNotifications: function() {
    var self = this;
    var bell = document.getElementById('hkBell');
    var dropdown = document.getElementById('hkDropdown');
    if (!bell || !dropdown) return;

    bell.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('show');
      document.getElementById('hkBellDot').classList.remove('show');
    });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
    dropdown.addEventListener('click', function(e) { e.stopPropagation(); });
  },

  addNotification: function(notif) {
    this.notifications.unshift({
      type: notif.type || 'info',
      title: notif.title,
      message: notif.message,
      id: Date.now(),
      time: new Date().toLocaleString('zh-CN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
    });
    if (this.notifications.length > 20) this.notifications = this.notifications.slice(0, 20);
    this.renderNotifications();
    var dot = document.getElementById('hkBellDot');
    if (dot) dot.classList.add('show');
  },

  renderNotifications: function() {
    var c = document.getElementById('hkNotifList');
    if (!c) return;
    if (this.notifications.length === 0) {
      c.innerHTML = '<div class="hk-notif-empty">暂无新通知</div>';
      return;
    }
    var iconColors = { info: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444' };
    c.innerHTML = this.notifications.slice(0, 10).map(function(n) {
      var color = iconColors[n.type] || '#3b82f6';
      return '<div class="hk-notif-item">' +
        '<div style="display:flex;gap:10px;">' +
        '<span style="color:' + color + ';font-size:0.85rem;flex-shrink:0;">🔔</span>' +
        '<div><p style="font-weight:600;font-size:0.82rem;margin:0;">' + HookSystem._esc(n.title) + '</p>' +
        '<p style="font-size:0.75rem;color:#64748b;margin:3px 0;">' + HookSystem._esc(n.message) + '</p>' +
        '<p style="font-size:0.68rem;color:#94a3b8;margin:0;">' + n.time + '</p></div>' +
        '</div></div>';
    }).join('');
  },

  // ═══════ 每日提醒 ═══════
  checkDailyReminders: function() {
    var lastCheck = localStorage.getItem('gtz_hook_daily');
    var today = new Date().toDateString();
    if (lastCheck === today) return;

    var now = new Date();
    // 端午节提醒
    var dragonBoat = new Date(2026, 5, 14); // June 14
    var daysDB = Math.ceil((dragonBoat - now) / 86400000);
    if (daysDB > 0 && daysDB <= 7) {
      this.addNotification({
        type: 'warning',
        title: '端午节 🇨🇳',
        message: '还有' + daysDB + '天，中国放假3天，物流可能延误1-2天。建议提前发货。'
      });
    }
    // 美国独立日提醒
    var july4 = new Date(2026, 6, 4);
    var daysJ4 = Math.ceil((july4 - now) / 86400000);
    if (daysJ4 > 0 && daysJ4 <= 14) {
      this.addNotification({
        type: 'info',
        title: '美国独立日 🇺🇸',
        message: '还有' + daysJ4 + '天（7月4日），物流时效可能延长2-3天。'
      });
    }
    localStorage.setItem('gtz_hook_daily', today);
  },

  // ═══════ 5. 分享系统 ═══════
  shareResult: function() {
    var originEl = document.getElementById('origin');
    var destEl = document.getElementById('destination');
    var wtEl = document.getElementById('weight');
    var oText = originEl ? originEl.options[originEl.selectedIndex].text : '';
    var dText = destEl ? destEl.options[destEl.selectedIndex].text : '';
    var weight = wtEl ? wtEl.value : '';

    // 获取最低价
    var prices = document.querySelectorAll('#logisticsList .xb-scheme-price');
    var minPrice = '--';
    if (prices.length > 0) {
      var nums = [];
      prices.forEach(function(p) { var m = p.textContent.match(/[\d,]+/); if (m) nums.push(parseInt(m[0].replace(/,/g,''))); });
      if (nums.length) minPrice = Math.min.apply(null, nums);
    }

    var shareText = '📦 我用 GlobeTimeZone 查了' + oText + '发' + dText + '的运费，' + weight + 'kg货最低只要¥' + minPrice + '元！\n跨境物流比价、关税计算、包裹追踪一站搞定。\n👉 ' + window.location.origin + '/tools/cross-border/';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(function() {
        HookSystem._toast('分享链接已复制，快发给你的同行吧！📤');
      }).catch(function() {
        HookSystem._toast(shareText);
      });
    } else {
      // Fallback
      var ta = document.createElement('textarea');
      ta.value = shareText; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      HookSystem._toast('分享链接已复制！📤');
    }
  },

  // ═══════ 事件监听 ═══════
  initEventListeners: function() {
    var self = this;
    var clearBtn = document.getElementById('hkClearAllHistory');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() { self.clearAllHistory(); });
    }
  },

  // ═══════ 辅助 ═══════
  _esc: function(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = s; return d.innerHTML; },
  _toast: function(msg) {
    var t = document.createElement('div');
    t.className = 'xb-toast'; t.textContent = msg; t.style.zIndex = '9999';
    document.body.appendChild(t);
    requestAnimationFrame(function() { t.classList.add('show'); });
    setTimeout(function() { t.classList.remove('show'); setTimeout(function() { t.remove(); }, 300); }, 2500);
  }
};
