/**
 * GlobeTimeZone - 跨境工具箱 v4.1.0 (i18n)
 * Smart Dashboard + Timezone-aware ETA + Best Shipping Day
 * 2026-06-10: Full i18n — all Chinese UI text via GTZ_T()
 */
(function() {
  'use strict';
  var $ = function(id) { return document.getElementById(id); };
  var T = window.GTZ_T || function(k, fb) { return fb || k; };

  // ═══════════ DATA ═══════════
  var carriers = [
    { id:'dhl', name:'DHL', fullName:T('xb.carrier.dhl','DHL 国际快递'), type:'express', processing:1, shipping:{'us-east':3,'us-west':2,'uk':3,'de':3,'fr':3,'jp':2,'au':3,'ca':3}, customs:1, delivery:1, baseRate:120, perKgRate:45, reliability:98, features:[T('xb.feat.fastest','最快时效'),T('xb.feat.tracking','全程追踪'),T('xb.feat.priority','优先清关')] },
    { id:'ups', name:'UPS', fullName:T('xb.carrier.ups','UPS 国际快递'), type:'express', processing:1, shipping:{'us-east':4,'us-west':3,'uk':4,'de':4,'fr':4,'jp':3,'au':4,'ca':4}, customs:1, delivery:1, baseRate:110, perKgRate:42, reliability:97, features:[T('xb.feat.reliable','稳定可靠'),T('xb.feat.na','北美优势'),T('xb.feat.pickup','上门取件')] },
    { id:'fedex', name:'FedEx', fullName:T('xb.carrier.fedex','FedEx 联邦快递'), type:'express', processing:1, shipping:{'us-east':4,'us-west':3,'uk':4,'de':4,'fr':4,'jp':3,'au':4,'ca':4}, customs:1, delivery:1, baseRate:105, perKgRate:40, reliability:96, features:[T('xb.feat.global','全球覆盖'),T('xb.feat.economical','经济实惠'),T('xb.feat.ontime','准时率高')] },
    { id:'tnt', name:'TNT', fullName:T('xb.carrier.tnt','TNT 国际快递'), type:'express', processing:2, shipping:{'us-east':5,'us-west':4,'uk':3,'de':3,'fr':3,'jp':4,'au':5,'ca':5}, customs:2, delivery:1, baseRate:95, perKgRate:38, reliability:95, features:[T('xb.feat.europe','欧洲优势'),T('xb.feat.customs','清关能力强'),T('xb.feat.midprice','价格适中')] },
    { id:'ems', name:'EMS', fullName:T('xb.carrier.ems','EMS 国际特快'), type:'express', processing:2, shipping:{'us-east':7,'us-west':6,'uk':7,'de':7,'fr':7,'jp':4,'au':7,'ca':7}, customs:2, delivery:2, baseRate:80, perKgRate:30, reliability:90, features:[T('xb.feat.customs','清关优势'),T('xb.feat.novol','不计体积重'),T('xb.feat.postal','邮政渠道')] },
    { id:'amazon-fba', name:T('xb.carrier.fba.name','亚马逊FBA'), fullName:T('xb.carrier.fba','亚马逊 FBA 专线'), type:'air', processing:3, shipping:{'us-east':8,'us-west':6,'uk':7,'de':8,'fr':8,'jp':5,'au':9,'ca':8}, customs:3, delivery:2, baseRate:65, perKgRate:25, reliability:92, features:[T('xb.feat.fba','FBA入仓'),T('xb.feat.ddp','双清包税'),T('xb.feat.cheap','价格优惠')] },
    { id:'air-special', name:T('xb.carrier.air.name','空运专线'), fullName:T('xb.carrier.air','空运专线'), type:'air', processing:3, shipping:{'us-east':10,'us-west':8,'uk':9,'de':10,'fr':10,'jp':6,'au':11,'ca':10}, customs:3, delivery:3, baseRate:50, perKgRate:20, reliability:88, features:[T('xb.feat.costeffective','性价比高'),T('xb.feat.bulk','大货优势'),T('xb.feat.ddp','双清包税')] },
    { id:'sea-fast', name:T('xb.carrier.sea.name','海运快船'), fullName:T('xb.carrier.sea','海运快船'), type:'sea', processing:5, shipping:{'us-east':20,'us-west':14,'uk':25,'de':28,'fr':27,'jp':7,'au':18,'ca':18}, customs:5, delivery:5, baseRate:20, perKgRate:8, reliability:85, features:[T('xb.feat.oversize','超大货优势'),T('xb.feat.lowest','成本最低'),T('xb.feat.ddp','双清包税')] }
  ];

  var destinations = {
    'us-east': { name:T('xb.dest.useast','美国东部·纽约'), tz:'America/New_York', gmt:'GMT-5', countryCode:'US' },
    'us-west': { name:T('xb.dest.uswest','美国西部·洛杉矶'), tz:'America/Los_Angeles', gmt:'GMT-8', countryCode:'US' },
    'uk':      { name:T('xb.dest.uk','英国·伦敦'), tz:'Europe/London', gmt:'GMT+0', countryCode:'GB' },
    'de':      { name:T('xb.dest.de','德国·柏林'), tz:'Europe/Berlin', gmt:'GMT+1', countryCode:'DE' },
    'fr':      { name:T('xb.dest.fr','法国·巴黎'), tz:'Europe/Paris', gmt:'GMT+1', countryCode:'FR' },
    'jp':      { name:T('xb.dest.jp','日本·东京'), tz:'Asia/Tokyo', gmt:'GMT+9', countryCode:'JP' },
    'au':      { name:T('xb.dest.au','澳大利亚·悉尼'), tz:'Australia/Sydney', gmt:'GMT+10', countryCode:'AU' },
    'ca':      { name:T('xb.dest.ca','加拿大·多伦多'), tz:'America/Toronto', gmt:'GMT-5', countryCode:'CA' }
  };

  var originNames = {
    'shenzhen':T('xb.origin.shenzhen','深圳'),'guangzhou':T('xb.origin.guangzhou','广州'),'yiwu':T('xb.origin.yiwu','义乌'),'shanghai':T('xb.origin.shanghai','上海'),'ningbo':T('xb.origin.ningbo','宁波'),'qingdao':T('xb.origin.qingdao','青岛')
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
    { code:'8471.30', name:T('xb.hs.laptop','笔记本电脑'), rate:'0%' },{ code:'8517.12', name:T('xb.hs.phone','智能手机'), rate:'0%' },
    { code:'8518.30', name:T('xb.hs.earphone','耳机/耳塞'), rate:'0%' },{ code:'9503.00', name:T('xb.hs.toy','玩具/模型'), rate:'0-4.5%' },
    { code:'6109.10', name:T('xb.hs.tshirt','T恤/上衣'), rate:'12%' },{ code:'6204.62', name:T('xb.hs.pants','裤子/牛仔裤'), rate:'12%' },
    { code:'6403.99', name:T('xb.hs.shoes','运动鞋'), rate:'9-17%' },{ code:'4202.22', name:T('xb.hs.bag','手提包/箱包'), rate:'8-17%' },
    { code:'3304.99', name:T('xb.hs.skincare','护肤品/面霜'), rate:'5-6.5%' },{ code:'3304.20', name:T('xb.hs.makeup','眼妆/睫毛膏'), rate:'5%' },
    { code:'7117.19', name:T('xb.hs.jewelry','时尚饰品'), rate:'4-5.5%' },{ code:'9506.91', name:T('xb.hs.fitness','健身器材'), rate:'4%' },
    { code:'9403.60', name:T('xb.hs.furniture','家具/家居'), rate:'0-5%' },{ code:'8525.80', name:T('xb.hs.camera','相机/摄像机'), rate:'0%' },
    { code:'8471.60', name:T('xb.hs.keyboard','键盘鼠标'), rate:'0%' },{ code:'8544.42', name:T('xb.hs.cable','数据线/充电线'), rate:'0%' },
    { code:'8504.40', name:T('xb.hs.charger','充电器/电源适配器'), rate:'0%' },{ code:'6110.20', name:T('xb.hs.hoodie','卫衣/帽衫'), rate:'12%' }
  ];

  var prohibitedDB = {
    US: { banned:T('xb.proh.US.banned','武器弹药、毒品、象牙制品、古巴雪茄、盗版商品、未批准药品、肉类乳制品'), restricted:T('xb.proh.US.restricted','含酒精饮料、烟草产品、处方药(FDA)、电子产品(FCC)、儿童产品(CPSC)'), deMinimis:T('xb.proh.US.deminimis','<strong>$800</strong> 以下免税（Section 321）') },
    GB: { banned:T('xb.proh.GB.banned','武器、毒品、濒危动植物、未经UKCA认证无线设备、攻击性武器'), restricted:T('xb.proh.GB.restricted','食品(卫生证书)、药品(MHRA)、含酒精饮料、烟草、动植物(检疫)'), deMinimis:T('xb.proh.GB.deminimis','<strong>£135</strong> 以下免征关税，但均需缴VAT(20%)') },
    DE: { banned:T('xb.proh.DE.banned','武器、毒品、纳粹物品、假冒商品、无CE标志电子产品、危险化学品'), restricted:T('xb.proh.DE.restricted','食品(欧盟卫生证书)、药品(EMA)、动植物(检疫)、无线设备(CE/RED)、化妆品(CPNP)'), deMinimis:T('xb.proh.DE.deminimis','<strong>€0</strong> 起征 — 所有进口均需缴税。注意EPR合规。') },
    JP: { banned:T('xb.proh.JP.banned','武器、毒品、淫秽物品、假冒商品、侵权商品、含伪麻黄碱药品'), restricted:T('xb.proh.JP.restricted','食品(检疫)、化妆品(药事法)、电子产品(PSE/TELEC)、动植物(严格检疫)'), deMinimis:T('xb.proh.JP.deminimis','<strong>¥10,000</strong> 以下免税') },
    AU: { banned:T('xb.proh.AU.banned','武器、毒品、石棉制品、未经批准转基因产品'), restricted:T('xb.proh.AU.restricted','食品(严格检疫)、药品(TGA)、动植物制品(检疫)、无线设备(ACMA)'), deMinimis:T('xb.proh.AU.deminimis','<strong>A$1,000</strong> 以下免税') },
    CA: { banned:T('xb.proh.CA.banned','武器、毒品、淫秽物品、仇恨言论材料、未申报食品'), restricted:T('xb.proh.CA.restricted','食品(CFIA)、药品(Health Canada)、无线设备(ISED)、动植物(检疫)'), deMinimis:T('xb.proh.CA.deminimis','<strong>C$20</strong> 起征（极低）') }
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
        dr.innerHTML = '<div class="xb-dash-empty">' + T('xb.dash.empty_route','查询物流后，点击"收藏此路线"即可快速复用') + '</div>';
      } else {
        dr.innerHTML = routes.map(function(r, i) {
          return '<span class="xb-dash-route-btn" onclick="window._xBLoadRoute(' + i + ')" title="' + T('xb.dash.click_fill','点击一键填入') + '">' +
            (originNames[r.origin] || r.origin) + ' → ' + (destinations[r.destination] ? destinations[r.destination].name : r.destination) +
            (r.label ? ' (' + r.label + ')' : '') +
            '</span>';
        }).join('');
      }
      if ($('dashRouteCount')) $('dashRouteCount').textContent = routes.length + T('xb.dash.routes','条路线');
    }

    // Tracking
    var dt = $('dashTracking');
    if (dt) {
      if (tracking.length === 0) {
        dt.innerHTML = '<div class="xb-dash-empty">' + T('xb.dash.empty_track','追踪包裹后，点击"添加到关注列表"保存') + '</div>';
      } else {
        dt.innerHTML = tracking.map(function(t, i) {
          return '<div class="xb-dash-track-item">' +
            '<div><div class="xb-dash-track-tn">' + escapeHtml(t.tn) + '</div>' +
            '<div style="font-size:0.7rem;color:var(--xb-muted);">' + (t.label || '') + ' · ' + T('xb.dash.last_update','上次更新：') + (t.lastChecked || '--') + '</div></div>' +
            '<div class="xb-dash-track-actions">' +
            '<button onclick="window._xBRefreshTrack(' + i + ')">🔄</button>' +
            '<button class="del" onclick="window._xBRemoveTrack(' + i + ')">✕</button>' +
            '</div></div>';
        }).join('');
      }
      if ($('dashTrackCount')) $('dashTrackCount').textContent = tracking.length + T('xb.dash.parcels','个包裹');
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
      el.innerHTML = '<span style="font-size:0.78rem;">' + T('xb.sidebar.no_routes','暂无收藏路线') + '</span>';
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
      el.innerHTML = '<span style="font-size:0.78rem;">' + T('xb.sidebar.no_tracks','暂无追踪包裹') + '</span>';
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
      toast(T('xb.toast.route_updated','路线已更新！'));
    } else {
      if (routes.length >= 10) routes.shift();
      routes.push(route);
      toast(T('xb.toast.route_saved','路线已收藏！⭐'));
    }

    saveRoutes(routes);
    renderDashboard();
    // Update save button style
    var btn = $('saveRouteBtn');
    if (btn) { btn.classList.add('saved'); btn.textContent = T('xb.btn.saved','✅ 已收藏，下次一键调用'); setTimeout(function() { btn.textContent = T('xb.btn.save_route','📌 收藏此路线，下次一键调用'); btn.classList.remove('saved'); }, 2000); }
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
    toast(T('xb.toast.track_added','已添加到关注列表 📌'));
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
    if (dn) dn.textContent = T('xb.dest_label','目的地') + ' · ' + dest.name.split('·')[1].trim();
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
      // Weekday map via GTZ_T
      var cnWeek = { Mon:T('xb.weekday.mon','周一'), Tue:T('xb.weekday.tue','周二'), Wed:T('xb.weekday.wed','周三'), Thu:T('xb.weekday.thu','周四'), Fri:T('xb.weekday.fri','周五'), Sat:T('xb.weekday.sat','周六'), Sun:T('xb.weekday.sun','周日') };
      var dow = cnWeek[dayName] || dayName;
      var sat = T('xb.weekday.sat','周六'), sun = T('xb.weekday.sun','周日');

      var cls = 'ok', icon = '✅', msg = T('xb.eta.working','派送员正在工作');
      if (dow === sat || dow === sun) { cls = 'bad'; icon = '⚠️'; msg = T('xb.eta.weekend','周末到达，可能下周一才派送'); }
      else if (hour < 8 || hour >= 18) { cls = 'warn'; icon = '⚠️'; msg = T('xb.eta.offhours','非工作时间到达，可能次日派送'); }

      return { cls:cls, icon:icon, dow:dow, time:text, msg:msg };
    } catch(e) {
      return { cls:'ok', icon:'✅', dow:'', time:'', msg:T('xb.eta.ontime','预计准时到达') };
    }
  }

  // ═══════════ BEST SHIPPING DAY ═══════════
  function getBestShippingDay(shipDateStr, totalDays, destTz) {
    var shipDate = new Date(shipDateStr);
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var shipDay = new Date(shipDate.getFullYear(), shipDate.getMonth(), shipDate.getDate());
    var diffDays = Math.floor((shipDay - today) / 86400000);
    var dayNames = [T('xb.weekday.sun','周日'),T('xb.weekday.mon','周一'),T('xb.weekday.tue','周二'),T('xb.weekday.wed','周三'),T('xb.weekday.thu','周四'),T('xb.weekday.fri','周五'),T('xb.weekday.sat','周六')];
    if (diffDays <= 0) {
      var etaDate = new Date(today.getTime() + totalDays * 86400000);
      var tzETA = getTimezoneETA(etaDate, destTz);
      if (tzETA.cls === 'bad') {
        return { text:T('xb.ship.today_bad','⚠️ 今天发货') + dayNames[today.getDay()] + T('xb.ship.arrive_but','到，但') + tzETA.dow + T('xb.ship.delay_suggest','才派送。建议等一天。'), cls:'warn' };
      }
      return { text:T('xb.ship.today_ok','✅ 今天发货，预计') + tzETA.dow + T('xb.ship.arrive','到达'), cls:'ok' };
    } else if (diffDays === 1) {
      return { text:T('xb.ship.tomorrow','明天(') + dayNames[shipDay.getDay()] + T('xb.ship.ship',')发货'), cls:'ok' };
    }
    return { text:diffDays + T('xb.ship.days_later','天后发货'), cls:'ok' };
  }

  // ═══════════ COUNTDOWN ═══════════
  function getCountdownText(etaStr) {
    var eta = new Date(etaStr);
    var now = new Date();
    var diffMs = eta.getTime() - now.getTime();
    if (diffMs <= 0) return '';
    var diffDays = Math.ceil(diffMs / 86400000);
    if (diffDays <= 3) return '<span class="xb-countdown">⏱ ' + diffDays + T('xb.countdown.arrive','天后到达') + '</span>';
    return '';
  }

  // ═══════════ DDP ESTIMATION ═══════════
  function estimateDDP(destKey, declaredValue) {
    var countryCode = (destinations[destKey] || {}).countryCode || 'US';
    var rules = tariffRules[countryCode] || tariffRules.US;
    if (declaredValue <= rules.deMinimis) {
      return { duty:0, vat:0, total:0, taxable:false, note:T('xb.ddp.exempt','低于免税起征点，无需缴税') };
    }
    var dutyRate = 0.05;
    var duty = Math.round(declaredValue * dutyRate * 100) / 100;
    var vat = Math.round((declaredValue + duty) * rules.vatRate * 100) / 100;
    var total = Math.round((duty + vat) * 100) / 100;
    return { duty:duty, vat:vat, total:total, taxable:true, note:T('xb.ddp.estimate','基于平均税率估算，实际以海关核定为准。') + 'VAT ' + (rules.vatRate*100) + '%' };
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
      list.innerHTML = '<div class="xb-empty"><div class="xb-empty-icon">📦</div><p>' + T('xb.result.empty','没有匹配的物流方案') + '</p></div>';
      return;
    }

    var typeLabels = { express:T('xb.type.express','快递'), air:T('xb.type.air','空运'), sea:T('xb.type.sea','海运') };

    list.innerHTML = filtered.map(function(r) {
      var c = r.carrier;
      var countdown = getCountdownText(r.etaStr);
      var badges = '';
      if (r.isFastest) badges += '<span class="xb-badge-best xb-badge-fast">' + T('xb.badge.fastest','最快') + '</span> ';
      if (r.isCheapest) badges += '<span class="xb-badge-best xb-badge-cheap">' + T('xb.badge.cheapest','最省') + '</span> ';
      var daysColor = r.totalDays <= 5 ? 'color:#10b981;' : (r.totalDays <= 10 ? 'color:#f59e0b;' : 'color:#ef4444;');

      var ddpHtml = '';
      if (r.ddpInfo.taxable) {
        ddpHtml = '<div class="xb-scheme-ddp">' + T('xb.result.ddp_total','含税总价(DDP)：') + '<strong> ¥' + r.ddpTotal.toLocaleString() + '</strong>（' + T('xb.result.duty','关税') + ' ¥' + r.ddpInfo.total + '）</div>';
      } else {
        ddpHtml = '<div class="xb-scheme-ddp">' + T('xb.result.ddp_total','含税总价(DDP)：') + '<strong> ¥' + r.cost.toLocaleString() + '</strong>（' + T('xb.result.tax_free','免税 ✅') + '）</div>';
      }

      // Timezone-aware ETA
      var tzEtaHtml = '<div class="xb-tz-eta ' + r.tzEta.cls + '">' +
        '<span class="xb-tz-eta-icon">' + r.tzEta.icon + '</span>' +
        '<span class="xb-tz-eta-text"><strong>' + r.tzEta.dow + ' ' + T('xb.result.local_time','当地时间') + ' ' + r.tzEta.time + '</strong> · ' + r.tzEta.msg + '</span>' +
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
          '<span>' + T('xb.result.total_days','总时效：') + '<strong style="'+daysColor+'">'+r.totalDays+' ' + T('xb.result.days','天') + '</strong></span>' +
          '<span>' + T('xb.result.transit','运输') + ' '+r.shippingDays+T('xb.result.days_unit','天') + '</span>' +
          '<span>' + T('xb.result.reliability','可靠性') + ' '+c.reliability+'%</span>' +
        '</div>' +
        '<div class="xb-scheme-eta">' + T('xb.result.eta','预计送达：') + '<strong>'+r.etaStr+'</strong> · ' + T('xb.result.bill_weight','计费重') + ' '+r.billWeight+' kg' + countdown + '</div>' +
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
    var catNames = { electronics:T('xb.cat.electronics','电子产品/配件'), clothing:T('xb.cat.clothing','服装/纺织品'), toys:T('xb.cat.toys','玩具/家居'), beauty:T('xb.cat.beauty','美妆/个护'), shoes:T('xb.cat.shoes','鞋靴/箱包'), jewelry:T('xb.cat.jewelry','珠宝/饰品'), sports:T('xb.cat.sports','运动/户外'), auto:T('xb.cat.auto','汽车配件') };
    var ctyNames = { US:T('xb.cty.US','美国'), GB:T('xb.cty.GB','英国'), DE:T('xb.cty.DE','德国/欧盟'), FR:T('xb.cty.FR','法国/欧盟'), JP:T('xb.cty.JP','日本'), AU:T('xb.cty.AU','澳大利亚'), CA:T('xb.cty.CA','加拿大') };

    var rowsHtml = '';
    rowsHtml += '<div class="xb-tariff-row"><span>' + T('xb.tariff.goods_value','商品价值') + '</span><span>$' + totalValue.toFixed(2) + '</span></div>';
    rowsHtml += '<div class="xb-tariff-row"><span>' + T('xb.tariff.freight','国际运费') + '</span><span>$' + freight.toFixed(2) + '</span></div>';
    rowsHtml += '<div class="xb-tariff-row"><span>' + T('xb.tariff.duty','关税') + '（' + (dutyRate*100).toFixed(1) + '%）</span><span>$' + duty.toFixed(2) + '</span></div>';
    rowsHtml += '<div class="xb-tariff-row"><span>' + T('xb.tariff.vat','增值税VAT') + '（' + (rules.vatRate*100) + '%）</span><span>$' + vat.toFixed(2) + '</span></div>';
    rowsHtml += '<div class="xb-tariff-row xb-tariff-total"><span>📦 ' + T('xb.tariff.ddp_total','DDP到门总费用') + '</span><span><strong>$' + ddpTotal.toFixed(2) + '</strong></span></div>';
    rowsHtml += '<div class="xb-tariff-row xb-tariff-total"><span>🛒 ' + T('xb.tariff.total_cost','含商品总成本') + '</span><span><strong>$' + totalAll.toFixed(2) + '</strong></span></div>';

    var note = T('xb.tariff.dest','目的地：') + (ctyNames[countryCode]||countryCode) + ' · ' + T('xb.tariff.category','商品类别：') + (catNames[category]||category);
    if (totalValue <= rules.deMinimis) note = T('xb.tariff.exempt','✅ 低于免税起征点，无需缴关税和VAT！') + note;

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
    var labels = [T('xb.track.picked_up','已揽收'),T('xb.track.transit','运输中'),T('xb.track.customs','清关中'),T('xb.track.delivered','已签收')];
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
      { time: fmtTime(new Date(now.getTime()-72*3600000)), desc: T('xb.tl.picked_up','包裹已揽收，发往分拨中心'), loc: T('xb.loc.shenzhen','深圳') },
      { time: fmtTime(new Date(now.getTime()-48*3600000)), desc: T('xb.tl.left_sz','离开深圳分拨中心，发往目的地'), loc: T('xb.loc.sz_airport','深圳机场') },
      { time: fmtTime(new Date(now.getTime()-24*3600000)), desc: T('xb.tl.arrived','已抵达目的地国家，等待清关'), loc: T('xb.loc.destination','目的地') }
    ];
    if (completeIdx >= 2) timeline.push({ time: fmtTime(new Date(now.getTime()-12*3600000)), desc: T('xb.tl.cleared','清关完成，转交当地派送'), loc: T('xb.loc.delivery','派送站') });
    timeline.push({ time: fmtTime(now), desc: completeIdx>=3?labels[3]:T('xb.tl.current','当前状态 — ')+labels[completeIdx], loc: '' });

    // Add tracking to watchlist
    saveTrackingNumber(trackingNumber, '');
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
    if (!tn) { toast(T('xb.toast.enter_tn','请输入运单号')); return; }
    showTracking(tn, null, '');
  }
  function tabTrack() {
    var tn = ($('tabTrackingNumber') || {}).value;
    if (!tn || !tn.trim()) { toast(T('xb.toast.enter_tn','请输入运单号')); return; }
    showTracking(tn.trim(), null, 'tab');
  }
  function fmtTime(d) {
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  }

  // ═══════════ VOLUME WEIGHT ═══════════
  function calcVolumeWeight() {
    var l = parseFloat($('volL').value) || 20, w = parseFloat($('volW').value) || 15, h = parseFloat($('volH').value) || 10;
    var vol = l * w * h, volWt = vol / 5000;
    $('volResult').innerHTML = T('xb.vol.volume','体积：') + vol.toLocaleString() + ' cm³<br>' + T('xb.vol.weight','体积重：') + '<strong>' + volWt.toFixed(2) + ' kg</strong>';
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

    if (typeof HookSystem !== 'undefined') { HookSystem.init(); }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
