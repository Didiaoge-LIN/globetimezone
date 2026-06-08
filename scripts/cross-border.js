/**
 * GlobeTimeZone - 跨境工具箱 v3.0
 * 物流·关税·汇率·HS编码·禁运品·追踪
 * 2026-06-08
 */
(function() {
  'use strict';
  var $ = function(id) { return document.getElementById(id); };

  // ===================== DATA =====================
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
    'us-east': { name:'美国·东部（纽约）', tz:'America/New_York', gmt:'GMT-5', countryCode:'US' },
    'us-west': { name:'美国·西部（洛杉矶）', tz:'America/Los_Angeles', gmt:'GMT-8', countryCode:'US' },
    'uk': { name:'英国·伦敦', tz:'Europe/London', gmt:'GMT+0', countryCode:'GB' },
    'de': { name:'德国·柏林', tz:'Europe/Berlin', gmt:'GMT+1', countryCode:'DE' },
    'fr': { name:'法国·巴黎', tz:'Europe/Paris', gmt:'GMT+1', countryCode:'FR' },
    'jp': { name:'日本·东京', tz:'Asia/Tokyo', gmt:'GMT+9', countryCode:'JP' },
    'au': { name:'澳大利亚·悉尼', tz:'Australia/Sydney', gmt:'GMT+10', countryCode:'AU' },
    'ca': { name:'加拿大·多伦多', tz:'America/Toronto', gmt:'GMT-5', countryCode:'CA' }
  };

  // Tariff rules per country
  var tariffRules = {
    US: { deMinimis:800, vatRate:0, dutyRates:{ electronics:0, clothing:0.12, toys:0, beauty:0.05, shoes:0.09, jewelry:0.055, sports:0.04, auto:0.025 } },
    GB: { deMinimis:135, vatRate:0.20, dutyRates:{ electronics:0, clothing:0.12, toys:0.04, beauty:0.065, shoes:0.08, jewelry:0.04, sports:0.04, auto:0.045 } },
    DE: { deMinimis:0, vatRate:0.19, dutyRates:{ electronics:0, clothing:0.12, toys:0.045, beauty:0.065, shoes:0.08, jewelry:0.04, sports:0.045, auto:0.045 } },
    FR: { deMinimis:0, vatRate:0.20, dutyRates:{ electronics:0, clothing:0.12, toys:0.045, beauty:0.065, shoes:0.08, jewelry:0.04, sports:0.045, auto:0.045 } },
    JP: { deMinimis:10000, vatRate:0.10, dutyRates:{ electronics:0, clothing:0.09, toys:0, beauty:0.05, shoes:0.15, jewelry:0.055, sports:0, auto:0 } },
    AU: { deMinimis:1000, vatRate:0.10, dutyRates:{ electronics:0, clothing:0.10, toys:0.05, beauty:0.05, shoes:0.10, jewelry:0.05, sports:0.05, auto:0.05 } },
    CA: { deMinimis:20, vatRate:0.05, dutyRates:{ electronics:0, clothing:0.17, toys:0.05, beauty:0.065, shoes:0.17, jewelry:0.06, sports:0.05, auto:0.06 } }
  };

  // Exchange rates (approximate, for reference only)
  var fxRates = { CNY:1, USD:0.138, EUR:0.127, GBP:0.109, JPY:20.1, AUD:0.212, CAD:0.190 };

  // HS codes
  var hsCodes = [
    { code:'8471.30', name:'笔记本电脑', rate:'0%' },
    { code:'8517.12', name:'智能手机', rate:'0%' },
    { code:'8518.30', name:'耳机/耳塞', rate:'0%' },
    { code:'9503.00', name:'玩具/模型', rate:'0-4.5%' },
    { code:'6109.10', name:'T恤/上衣', rate:'12%' },
    { code:'6204.62', name:'裤子/牛仔裤', rate:'12%' },
    { code:'6403.99', name:'运动鞋', rate:'9-17%' },
    { code:'4202.22', name:'手提包/箱包', rate:'8-17%' },
    { code:'3304.99', name:'护肤品/面霜', rate:'5-6.5%' },
    { code:'3304.20', name:'眼妆/睫毛膏', rate:'5%' },
    { code:'7117.19', name:'时尚饰品', rate:'4-5.5%' },
    { code:'9506.91', name:'健身器材', rate:'4%' },
    { code:'9403.60', name:'家具/家居', rate:'0-5%' },
    { code:'8525.80', name:'相机/摄像机', rate:'0%' },
    { code:'8471.60', name:'键盘鼠标', rate:'0%' },
    { code:'8544.42', name:'数据线/充电线', rate:'0%' },
    { code:'8504.40', name:'充电器/电源适配器', rate:'0%' },
    { code:'9504.40', name:'扑克牌/桌游', rate:'0%' },
    { code:'9619.00', name:'纸尿裤', rate:'5%' },
    { code:'6110.20', name:'卫衣/帽衫', rate:'12%' }
  ];

  // Prohibited items
  var prohibitedDB = {
    US: { banned:'武器弹药、毒品、象牙制品、古巴雪茄、盗版商品、未批准药品、某些食品（肉类/乳制品）', restricted:'含酒精饮料(21+)、烟草产品(21+)、处方药(需FDA批准)、电子产品(需FCC认证)、儿童产品(需CPSC认证)', deMinimis:'<strong>$800</strong> 以下免税（Section 321），超过需缴关税。6月后可能调整。' },
    GB: { banned:'武器、毒品、濒危动植物、无线设备(未经UKCA认证)、攻击性武器(蝴蝶刀等)、淫秽物品', restricted:'食品(需卫生证书)、药品(需MHRA许可)、含酒精饮料(需缴税)、烟草(高额税)、动植物(需检疫)', deMinimis:'<strong>£135</strong> 以下免征关税（礼品£39），但自2021年起均需缴VAT(20%)。' },
    DE: { banned:'武器、毒品、纳粹相关物品(严格禁止)、假冒商品、未认证电子产品(无CE标志)、危险化学品', restricted:'食品(需欧盟卫生证书)、药品(需EMA许可)、动植物(需检疫证)、无线设备(需CE/RED)、化妆品(需CPNP注册)', deMinimis:'<strong>€0</strong> 起征，即所有进口商品均需缴关税+VAT(19%)。特别注意欧盟EPR合规要求。' },
    JP: { banned:'武器、毒品、淫秽物品(严格)、假冒商品、侵犯知识产权的商品、某些药品(含伪麻黄碱等)', restricted:'食品(需检疫证明)、化妆品(需药事法许可)、电子产品(需PSE/TELEC认证)、动植物(严格检疫)', deMinimis:'<strong>¥10,000</strong> 以下免税。超过需缴关税+10%消费税。' },
    AU: { banned:'武器、毒品、石棉制品、某些植物种子、未经批准的转基因产品、电动滑板车(部分州)', restricted:'食品(严格检疫)、药品(需TGA注册)、动植物制品(需检疫)、无线设备(需ACMA)、化妆品(需AICS注册)', deMinimis:'<strong>A$1,000</strong> 以下免税。超过需缴关税+10%GST。' },
    CA: { banned:'武器(严格限制)、毒品、淫秽物品、仇恨言论材料、某些二手床垫、未申报食品', restricted:'食品(需CFIA许可)、药品(需Health Canada)、无线设备(需ISED认证)、动植物(需检疫)、含酒精饮料(省规)', deMinimis:'<strong>C$20</strong> 起征（极低！），超过即需缴关税+GST(5%)。USMCA协定下部分商品可免税。' }
  };

  // ===================== STATE =====================
  var currentFilter = 'all';
  var currentResults = [];
  var countdownInterval = null;

  // ===================== TOAST =====================
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'xb-toast'; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function() { t.classList.add('show'); });
    setTimeout(function() { t.classList.remove('show'); setTimeout(function() { t.remove(); }, 300); }, 2000);
  }

  // ===================== TAB SWITCHING =====================
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

  // ===================== REAL-TIME CLOCK =====================
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
    } catch(e) {
      if (dtm) dtm.textContent = '--:--';
      if (dd) dd.textContent = '--';
    }
  }

  // ===================== COUNTDOWN =====================
  function getCountdownText(etaStr) {
    var eta = new Date(etaStr);
    var now = new Date();
    var diffMs = eta.getTime() - now.getTime();
    if (diffMs <= 0) return '';
    var diffDays = Math.ceil(diffMs / 86400000);
    if (diffDays <= 0) return '<span class="xb-countdown">今天到达</span>';
    if (diffDays <= 3) return '<span class="xb-countdown">⏱ ' + diffDays + '天后到达</span>';
    return '';
  }

  // ===================== ESTIMATE DDP =====================
  function estimateDDP(destKey, declaredValue) {
    var countryCode = (destinations[destKey] || {}).countryCode || 'US';
    var rules = tariffRules[countryCode] || tariffRules.US;
    if (declaredValue <= rules.deMinimis) {
      return { duty:0, vat:0, total:0, taxable:false, note:'低于免税起征点（' + (countryCode==='US'?'$'+rules.deMinimis:(countryCode==='GB'?'£'+rules.deMinimis:'€'+rules.deMinimis)）+'），无需缴税' };
    }
    // Use generic electronics rate for logistics context
    var dutyRate = 0.05; // assume 5% as average
    var duty = Math.round(declaredValue * dutyRate * 100) / 100;
    var vat = Math.round((declaredValue + duty) * rules.vatRate * 100) / 100;
    var total = Math.round((duty + vat) * 100) / 100;
    return { duty:duty, vat:vat, total:total, taxable:true, note:'基于商品类别平均税率估算，实际以海关核定为准。VAT ' + (rules.vatRate*100) + '%' };
  }

  // ===================== INPUT EVENT: AUTO CALCULATE =====================
  function attachAutoCalc() {
    var inputs = ['weight','length','width','height','destination','shipDate','declaredValue'];
    inputs.forEach(function(id) {
      var el = $(id);
      if (el) {
        el.addEventListener('change', function() { calculate(); });
        if (el.type === 'number') {
          el.addEventListener('input', function() {
            // debounced auto-calc for number inputs
            clearTimeout(el._timer);
            el._timer = setTimeout(function() { calculate(); }, 400);
          });
        }
      }
    });
  }

  // ===================== LOGISTICS CALCULATION =====================
  function calculate() {
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

    currentResults = carriers.map(function(c) {
      var shippingDays = c.shipping[destKey] || 5;
      var totalDays = c.processing + shippingDays + c.customs + c.delivery;
      var freight = Math.round(c.baseRate + billWeight * c.perKgRate);
      var ddpTotal = Math.round((freight + ddpInfo.total) * 100) / 100;
      return {
        carrier: c, totalDays: totalDays, cost: freight, shippingDays: shippingDays,
        billWeight: Math.round(billWeight * 100) / 100, shipDate: shipDate,
        ddpInfo: ddpInfo, ddpTotal: ddpTotal, declaredValue: declaredValue
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
    $('logisticsResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      var etaDate = new Date(r.shipDate);
      etaDate.setDate(etaDate.getDate() + r.totalDays);
      var etaStr = etaDate.getFullYear() + '-' + String(etaDate.getMonth()+1).padStart(2,'0') + '-' + String(etaDate.getDate()).padStart(2,'0');
      var countdown = getCountdownText(etaStr);

      var badges = '';
      if (r.isFastest) badges += '<span class="xb-badge-best xb-badge-fast">最快</span> ';
      if (r.isCheapest) badges += '<span class="xb-badge-best xb-badge-cheap">最省</span> ';
      var daysColor = r.totalDays <= 5 ? 'color:#10b981;' : (r.totalDays <= 10 ? 'color:#f59e0b;' : 'color:#ef4444;');

      // DDP info
      var ddpHtml = '';
      if (r.ddpInfo.taxable) {
        ddpHtml = '<div class="xb-scheme-ddp">含税总价(DDP)：<strong>¥' + r.ddpTotal.toLocaleString() + '</strong>（关税 ¥' + r.ddpInfo.total + '）</div>';
      } else {
        ddpHtml = '<div class="xb-scheme-ddp">含税总价(DDP)：<strong>¥' + r.cost.toLocaleString() + '</strong>（免税）</div>';
      }

      return '<div class="xb-scheme ac-'+c.type+'" onclick="window._xBShowTracking(\''+c.id+'\')">' +
        '<div class="xb-scheme-top">' +
          '<div class="xb-scheme-name">' +
            c.fullName +
            '<span class="xb-type-tag '+c.type+'">'+ (typeLabels[c.type] || c.type) +'</span>' +
            badges +
          '</div>' +
          '<div><div class="xb-scheme-price">&yen;' + r.cost.toLocaleString() + '</div>' + ddpHtml + '</div>' +
        '</div>' +
        '<div class="xb-scheme-meta">' +
          '<span>总时效：<strong style="'+daysColor+'">'+r.totalDays+' 天</strong></span>' +
          '<span>运输 '+r.shippingDays+'天</span>' +
          '<span>可靠性 '+c.reliability+'%</span>' +
        '</div>' +
        '<div class="xb-scheme-eta">预计送达：<strong>'+etaStr+'</strong> · 计费重 '+r.billWeight+' kg' + countdown + '</div>' +
        '<div class="xb-scheme-tags">' + c.features.map(function(f) { return '<span class="xb-tag">'+f+'</span>'; }).join('') + '</div>' +
      '</div>';
    }).join('');
  }

  // ===================== TARIFF CALCULATOR =====================
  function calcTariff() {
    var countryCode = $('tariffDest').value;
    var category = $('tariffCategory').value;
    var declaredValue = parseFloat($('tariffValue').value) || 100;
    var freight = parseFloat($('tariffFreight').value) || 30;
    var qty = parseInt($('tariffQty').value) || 1;

    var rules = tariffRules[countryCode] || tariffRules.US;
    var dutyRate = (rules.dutyRates[category] || 0.05);
    var totalValue = declaredValue * qty;
    var baseValue = totalValue + freight;

    var duty = 0, vat = 0;
    if (totalValue <= rules.deMinimis) {
      duty = 0; vat = 0;
    } else {
      duty = Math.round(totalValue * dutyRate * 100) / 100;
      vat = Math.round((totalValue + duty + freight) * rules.vatRate * 100) / 100;
    }
    var taxTotal = Math.round((duty + vat) * 100) / 100;
    var ddpTotal = Math.round((freight + taxTotal) * 100) / 100;
    var totalAll = Math.round((totalValue + freight + taxTotal) * 100) / 100;

    var categoryNames = { electronics:'电子产品/配件', clothing:'服装/纺织品', toys:'玩具/家居', beauty:'美妆/个护', shoes:'鞋靴/箱包', jewelry:'珠宝/饰品', sports:'运动/户外', auto:'汽车配件' };
    var countryNames = { US:'美国', GB:'英国', DE:'德国/欧盟', FR:'法国/欧盟', JP:'日本', AU:'澳大利亚', CA:'加拿大' };

    var rowsHtml = '';
    rowsHtml += '<div class="xb-tariff-row"><span>商品价值</span><span>$' + totalValue.toFixed(2) + ' (' + qty + '件 × $' + declaredValue + ')</span></div>';
    rowsHtml += '<div class="xb-tariff-row"><span>国际运费</span><span>$' + freight.toFixed(2) + '</span></div>';
    rowsHtml += '<div class="xb-tariff-row"><span>关税（税率 ' + (dutyRate*100).toFixed(1) + '%）</span><span>$' + duty.toFixed(2) + '</span></div>';
    rowsHtml += '<div class="xb-tariff-row"><span>增值税 VAT（' + (rules.vatRate*100) + '%）</span><span>$' + vat.toFixed(2) + '</span></div>';
    rowsHtml += '<div class="xb-tariff-row xb-tariff-total"><span>📦 DDP到门总费用</span><span><strong>$' + ddpTotal.toFixed(2) + '</strong></span></div>';
    rowsHtml += '<div class="xb-tariff-row xb-tariff-total"><span>🛒 含商品总成本</span><span><strong>$' + totalAll.toFixed(2) + '</strong></span></div>';

    var note = '目的地：' + (countryNames[countryCode] || countryCode) +
      ' · 商品类别：' + (categoryNames[category] || category) +
      ' · 免税起征点：' + (countryCode==='US'?'$'+rules.deMinimis:(countryCode==='JP'?'¥'+rules.deMinimis:(countryCode==='AU'?'A$'+rules.deMinimis:(countryCode==='CA'?'C$'+rules.deMinimis:('€'+rules.deMinimis))))) +
      ' · 以上为估算值，实际以目的国海关核定为准';

    if (totalValue <= rules.deMinimis) {
      note = '✅ 申报价值低于' + (countryCode==='US'?'$'+rules.deMinimis:(countryCode==='JP'?'¥'+rules.deMinimis:('€'+rules.deMinimis))) + '免税起征点，无需缴纳关税和VAT！' + note;
    }

    $('tariffRows').innerHTML = rowsHtml;
    $('tariffNote').textContent = note;
    $('tariffResult').classList.add('show');
    $('tariffResult').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ===================== TRACKING LOGIC =====================
  function showTracking(trackingNumber, result, panelPrefix) {
    var prefix = panelPrefix || '';
    var detailEl = document.getElementById(prefix + 'trackingDetail');
    var tabResult = document.getElementById(prefix + 'tabTrackingResult');

    if (panelPrefix === 'tab') {
      if (tabResult) tabResult.style.display = 'block';
      var tnEl = $('tabTrackingTN');
      if (tnEl) tnEl.textContent = trackingNumber;
    } else {
      if (detailEl) detailEl.style.display = 'block';
      var tnEl2 = $('detailTrackingNumber');
      if (tnEl2) tnEl2.textContent = trackingNumber;
    }

    var steps = ['pickup','transit','customs','delivered'];
    var labels = ['已揽收','运输中','清关中','已签收'];
    var icons = ['✓','✈','⚓','🏠'];
    var completeIdx = Math.min(2, Math.floor(Math.random() * 2) + 1);

    steps.forEach(function(step, i) {
      var dotId = panelPrefix === 'tab' ? null : document.getElementById('dot-' + step);
      // For tab tracking, find dots in the tab panel
      if (panelPrefix === 'tab') {
        var tabPanel = $('tab-tracking');
        if (tabPanel) {
          var dots = tabPanel.querySelectorAll('.xb-step-dot');
          var dot = dots[i];
          if (dot) {
            dot.className = 'xb-step-dot';
            if (i < completeIdx) { dot.className += ' done'; dot.innerHTML = '✓'; }
            else if (i === completeIdx) { dot.className += ' on'; dot.innerHTML = icons[i]; }
            else { dot.className += ' wait'; dot.innerHTML = i===3?'🏠':'⚓'; }
          }
        }
      } else if (dotId) {
        dotId.className = 'xb-step-dot';
        if (i < completeIdx) { dotId.className += ' done'; dotId.innerHTML = '✓'; }
        else if (i === completeIdx) { dotId.className += ' on'; dotId.innerHTML = icons[i]; }
        else { dotId.className += ' wait'; dotId.innerHTML = i===3?'🏠':'⚓'; }
      }
    });

    var badgeEl = panelPrefix === 'tab' ? $('tabTrackingStatus') : $('detailStatusBadge');
    if (badgeEl) {
      badgeEl.textContent = labels[completeIdx];
      badgeEl.className = 'xb-track-status ' + (completeIdx >= 2 ? 'done' : 'transit');
    }

    var now = new Date();
    var timeline = [
      { time: fmtTime(new Date(now.getTime() - 72*3600000)), desc: '包裹已揽收，发往分拨中心', loc: '深圳' },
      { time: fmtTime(new Date(now.getTime() - 48*3600000)), desc: '离开深圳分拨中心，发往目的地', loc: '深圳机场' },
      { time: fmtTime(new Date(now.getTime() - 24*3600000)), desc: '已抵达目的地国家，等待清关', loc: '目的地' }
    ];
    if (completeIdx >= 2) {
      timeline.push({ time: fmtTime(new Date(now.getTime() - 12*3600000)), desc: '清关完成，转交当地派送', loc: '派送站' });
    }
    timeline.push({ time: fmtTime(now), desc: completeIdx >= 3 ? '已签收' : '当前状态 — ' + labels[completeIdx], loc: '' });

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
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') +
           ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }

  // ===================== VOLUME WEIGHT =====================
  function calcVolumeWeight() {
    var l = parseFloat($('volL').value) || 20;
    var w = parseFloat($('volW').value) || 15;
    var h = parseFloat($('volH').value) || 10;
    var vol = l * w * h;
    var volWt = vol / 5000;
    $('volResult').innerHTML = '体积：' + vol.toLocaleString() + ' cm³<br>体积重：<strong>' + volWt.toFixed(2) + ' kg</strong>';
    $('volResult').style.color = volWt > 2 ? '#dc2626' : '#065f46';
  }

  // ===================== CURRENCY EXCHANGE =====================
  function calcFX() {
    var amount = parseFloat($('fxAmount').value) || 1;
    var from = $('fxFrom').value;
    var to = $('fxTo').value;
    var result;
    if (from === to) {
      result = amount;
    } else {
      // Convert to CNY first, then to target
      var inCNY = amount / fxRates[from];
      result = Math.round(inCNY * fxRates[to] * 10000) / 10000;
    }
    var symbols = { CNY:'¥', USD:'$', EUR:'€', GBP:'£', JPY:'¥', AUD:'A$', CAD:'C$' };
    $('fxResult').textContent = (symbols[to]||'') + result.toFixed(4) + ' ' + to;
  }

  // ===================== HS CODE =====================
  function renderHSCodes(filter) {
    var list = hsCodes;
    if (filter) {
      var q = filter.toLowerCase();
      list = hsCodes.filter(function(h) { return h.name.toLowerCase().includes(q) || h.code.includes(q); });
    }
    var el = $('hsList');
    el.innerHTML = list.map(function(h) {
      return '<div class="xb-hs-item"><span class="xb-hs-code">' + h.code + '</span><span class="xb-hs-name">' + h.name + '</span><span class="xb-hs-rate">' + h.rate + '</span></div>';
    }).join('');
  }

  // ===================== PROHIBITED ITEMS =====================
  function showProhibited() {
    var country = $('prohCountry').value;
    var data = prohibitedDB[country] || prohibitedDB.US;
    $('prohBanned').textContent = data.banned;
    $('prohRestricted').textContent = data.restricted;
    $('prohDeMinimis').innerHTML = data.deMinimis;
  }

  // ===================== INIT =====================
  function init() {
    // Set today's date
    var now = new Date();
    var yyyy = now.getFullYear();
    var mm = String(now.getMonth()+1).padStart(2,'0');
    var dd = String(now.getDate()).padStart(2,'0');
    var sd = $('shipDate'); if (sd) sd.value = yyyy + '-' + mm + '-' + dd;

    // Tabs
    initTabs();

    // Logistics
    var calcBtn = $('calculateBtn');
    if (calcBtn) calcBtn.addEventListener('click', calculate);
    var destSel = $('destination'); if (destSel) destSel.addEventListener('change', updateTimeDisplay);
    var qTrackBtn = $('quickTrackBtn'); if (qTrackBtn) qTrackBtn.addEventListener('click', quickTrack);
    var qTrackInp = $('quickTrackingNumber');
    if (qTrackInp) qTrackInp.addEventListener('keydown', function(e) { if (e.key === 'Enter') quickTrack(); });

    // Auto-calculate on input change
    attachAutoCalc();

    // Initial auto-calc
    setTimeout(function() { calculate(); }, 300);

    // Filter buttons
    document.querySelectorAll('#tab-logistics .xb-fbtn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('#tab-logistics .xb-fbtn').forEach(function(b) { b.classList.remove('on'); });
        btn.classList.add('on');
        currentFilter = btn.dataset.filter;
        renderResults();
      });
    });

    // Tariff
    var tariffBtn = $('calcTariffBtn'); if (tariffBtn) tariffBtn.addEventListener('click', calcTariff);

    // Tracking tab
    var tabTrackBtn = $('tabTrackBtn'); if (tabTrackBtn) tabTrackBtn.addEventListener('click', tabTrack);
    var tabTrackInp = $('tabTrackingNumber');
    if (tabTrackInp) tabTrackInp.addEventListener('keydown', function(e) { if (e.key === 'Enter') tabTrack(); });

    // Volume weight
    ['volL','volW','volH'].forEach(function(id) {
      var el = $(id); if (el) { el.addEventListener('input', calcVolumeWeight); el.addEventListener('change', calcVolumeWeight); }
    });

    // Currency
    ['fxAmount','fxFrom','fxTo'].forEach(function(id) {
      var el = $(id); if (el) el.addEventListener('change', calcFX);
    });
    var fxAmt = $('fxAmount'); if (fxAmt) fxAmt.addEventListener('input', function() { clearTimeout(fxAmt._fxTimer); fxAmt._fxTimer = setTimeout(calcFX, 300); });

    // HS code search
    var hsSearch = $('hsSearch'); if (hsSearch) hsSearch.addEventListener('input', function() { renderHSCodes(hsSearch.value); });

    // Prohibited
    var prohCountry = $('prohCountry'); if (prohCountry) prohCountry.addEventListener('change', showProhibited);

    // Initial renders
    updateTimeDisplay();
    calcVolumeWeight();
    calcFX();
    renderHSCodes('');
    showProhibited();

    // Periodic updates
    setInterval(updateTimeDisplay, 30000);
    // Refresh countdown every 10 minutes
    setInterval(function() { if (currentResults.length) renderResults(); }, 600000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
