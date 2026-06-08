/**
 * GlobeTimeZone - 跨境物流时效计算器
 * v2.0 — 深度优化版
 * 2026-06-08
 */
(function() {
  'use strict';

  // ==================== DATA ====================
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
    'us-east': { name:'美国 · 东部（纽约）', tz:'America/New_York', gmt:'GMT-5', countryCode:'US' },
    'us-west': { name:'美国 · 西部（洛杉矶）', tz:'America/Los_Angeles', gmt:'GMT-8', countryCode:'US' },
    'uk': { name:'英国 · 伦敦', tz:'Europe/London', gmt:'GMT+0', countryCode:'GB' },
    'de': { name:'德国 · 柏林', tz:'Europe/Berlin', gmt:'GMT+1', countryCode:'DE' },
    'fr': { name:'法国 · 巴黎', tz:'Europe/Paris', gmt:'GMT+1', countryCode:'FR' },
    'jp': { name:'日本 · 东京', tz:'Asia/Tokyo', gmt:'GMT+9', countryCode:'JP' },
    'au': { name:'澳大利亚 · 悉尼', tz:'Australia/Sydney', gmt:'GMT+10', countryCode:'AU' },
    'ca': { name:'加拿大 · 多伦多', tz:'America/Toronto', gmt:'GMT-5', countryCode:'CA' }
  };

  var holidaysDB = {
    'CN': ['2026-01-01','2026-01-29','2026-01-30','2026-01-31','2026-02-01','2026-02-02','2026-02-03','2026-02-04','2026-04-04','2026-05-01','2026-06-14','2026-10-01','2026-10-02','2026-10-03','2026-10-04','2026-10-05','2026-10-06','2026-10-07'],
    'US': ['2026-01-01','2026-01-20','2026-02-17','2026-05-26','2026-07-04','2026-09-01','2026-10-13','2026-11-11','2026-11-27','2026-12-25'],
    'GB': ['2026-01-01','2026-04-10','2026-04-13','2026-05-04','2026-05-25','2026-08-31','2026-12-25','2026-12-26'],
    'DE': ['2026-01-01','2026-04-10','2026-04-13','2026-05-01','2026-05-21','2026-06-01','2026-10-03','2026-12-25','2026-12-26'],
    'FR': ['2026-01-01','2026-04-10','2026-04-13','2026-05-01','2026-05-08','2026-05-21','2026-06-01','2026-07-14','2026-08-15','2026-11-01','2026-11-11','2026-12-25'],
    'JP': ['2026-01-01','2026-01-13','2026-02-11','2026-03-20','2026-04-29','2026-05-03','2026-05-04','2026-05-05','2026-07-20','2026-08-11','2026-09-21','2026-09-22','2026-10-12','2026-11-03','2026-11-23'],
    'AU': ['2026-01-01','2026-01-26','2026-03-09','2026-04-10','2026-04-13','2026-06-08','2026-10-05','2026-12-25','2026-12-26'],
    'CA': ['2026-01-01','2026-02-17','2026-04-10','2026-04-13','2026-05-18','2026-07-01','2026-08-03','2026-09-07','2026-10-12','2026-11-11','2026-12-25','2026-12-26']
  };

  // ==================== STATE ====================
  var currentFilter = 'all';
  var currentResults = [];

  function $(id) { return document.getElementById(id); }

  // ==================== TOAST (replaces alert) ====================
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'xb-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function() { t.classList.add('show'); });
    setTimeout(function() { t.classList.remove('show'); setTimeout(function() { t.remove(); }, 300); }, 2000);
  }

  // ==================== INIT ====================
  function init() {
    var now = new Date();
    var yyyy = now.getFullYear();
    var mm = String(now.getMonth()+1).padStart(2,'0');
    var dd = String(now.getDate()).padStart(2,'0');
    $('shipDate').value = yyyy + '-' + mm + '-' + dd;

    $('calculateBtn').addEventListener('click', calculate);
    $('quickTrackBtn').addEventListener('click', quickTrack);
    $('destination').addEventListener('change', updateTimeDisplay);

    $('quickTrackingNumber').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') quickTrack();
    });

    // Filter buttons (xb-fbtn)
    document.querySelectorAll('.xb-fbtn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.xb-fbtn').forEach(function(b) { b.classList.remove('on'); });
        btn.classList.add('on');
        currentFilter = btn.dataset.filter;
        renderResults();
      });
    });

    updateTimeDisplay();
    setInterval(updateTimeDisplay, 30000);
  }

  // ==================== REAL-TIME CLOCK ====================
  function updateTimeDisplay() {
    var dest = destinations[$('destination').value];
    if (!dest) return;

    var now = new Date();

    // China time
    var cnTime = now.toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit', hour12:false });
    var cnDate = now.toLocaleDateString('zh-CN', { month:'short', day:'numeric', weekday:'short' });
    $('originTime').textContent = cnTime;
    $('originDate').textContent = cnDate;

    // Destination time
    $('destinationName').textContent = '目的地 · ' + dest.name.split('·')[1].trim();
    $('destinationTz').textContent = dest.gmt;

    try {
      var destTime = new Intl.DateTimeFormat('zh-CN', { timeZone: dest.tz, hour:'2-digit', minute:'2-digit', hour12:false }).format(now);
      var destDate = new Intl.DateTimeFormat('zh-CN', { timeZone: dest.tz, month:'short', day:'numeric', weekday:'short' }).format(now);
      $('destinationTime').textContent = destTime;
      $('destinationDate').textContent = destDate;
    } catch(e) {
      $('destinationTime').textContent = '--:--';
      $('destinationDate').textContent = '--';
    }
  }

  // ==================== CALCULATION ENGINE ====================
  function calculate() {
    var destKey = $('destination').value;
    var weight = parseFloat($('weight').value) || 1;
    var length = parseFloat($('length').value) || 20;
    var width = parseFloat($('width').value) || 15;
    var height = parseFloat($('height').value) || 10;
    var shipDate = $('shipDate').value;

    if (!shipDate) {
      var today = new Date();
      shipDate = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
      $('shipDate').value = shipDate;
    }

    var volWeight = (length * width * height) / 5000;
    var billWeight = Math.max(weight, volWeight);

    currentResults = carriers.map(function(c) {
      var shippingDays = c.shipping[destKey] || 5;
      var totalDays = c.processing + shippingDays + c.customs + c.delivery;
      var cost = Math.round(c.baseRate + billWeight * c.perKgRate);
      return {
        carrier: c,
        totalDays: totalDays,
        cost: cost,
        shippingDays: shippingDays,
        billWeight: Math.round(billWeight * 100) / 100,
        shipDate: shipDate
      };
    });

    currentResults.sort(function(a, b) { return a.totalDays - b.totalDays; });

    // Mark fastest and cheapest
    var minDays = currentResults[0].totalDays;
    var minCost = Infinity;
    currentResults.forEach(function(r) { if (r.cost < minCost) minCost = r.cost; });
    currentResults.forEach(function(r) {
      r.isFastest = r.totalDays === minDays;
      r.isCheapest = r.cost === minCost;
    });

    currentFilter = 'all';
    document.querySelectorAll('.xb-fbtn').forEach(function(b) { b.classList.remove('on'); });
    var allBtn = document.querySelector('.xb-fbtn[data-filter="all"]');
    if (allBtn) allBtn.classList.add('on');

    renderResults();
    $('logisticsResults').style.display = 'block';
    $('trackingDetail').style.display = 'none';
    $('logisticsResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ==================== RENDER RESULTS ====================
  function renderResults() {
    var filtered = currentResults;

    if (currentFilter === 'express') {
      filtered = currentResults.filter(function(r) { return r.carrier.type === 'express'; });
    } else if (currentFilter === 'air') {
      filtered = currentResults.filter(function(r) { return r.carrier.type === 'air'; });
    } else if (currentFilter === 'sea') {
      filtered = currentResults.filter(function(r) { return r.carrier.type === 'sea'; });
    } else if (currentFilter === 'fast') {
      filtered = currentResults.filter(function(r) { return r.isFastest; });
    } else if (currentFilter === 'cheap') {
      filtered = currentResults.filter(function(r) { return r.isCheapest || r.carrier.type === 'sea'; });
    }

    var list = $('logisticsList');
    if (!filtered.length) {
      if (currentResults.length === 0) {
        list.innerHTML = '<div class="xb-empty"><div class="xb-empty-icon">&#128230;</div><p>点击上方「查询物流方案」开始计算</p></div>';
        $('logisticsResults').style.display = 'block';
      } else {
        list.innerHTML = '<div class="xb-empty"><p>没有匹配的物流方案</p></div>';
      }
      return;
    }

    var typeLabels = { 'express':'快递', 'air':'空运', 'sea':'海运' };

    list.innerHTML = filtered.map(function(r) {
      var c = r.carrier;
      var etaDate = new Date(r.shipDate);
      etaDate.setDate(etaDate.getDate() + r.totalDays);
      var etaStr = etaDate.getFullYear() + '-' + String(etaDate.getMonth()+1).padStart(2,'0') + '-' + String(etaDate.getDate()).padStart(2,'0');

      var badges = '';
      if (r.isFastest) badges += '<span class="xb-badge-best xb-badge-fast">最快</span> ';
      if (r.isCheapest) badges += '<span class="xb-badge-best xb-badge-cheap">最省</span> ';

      var daysColor = r.totalDays <= 5 ? 'color:#10b981;' : (r.totalDays <= 10 ? 'color:#f59e0b;' : 'color:#ef4444;');

      return '<div class="xb-scheme ac-'+c.type+'" onclick="window._crossBorderShowTracking(\''+c.id+'\')">' +
        '<div class="xb-scheme-top">' +
          '<div class="xb-scheme-name">' +
            c.fullName +
            '<span class="xb-type-tag '+c.type+'">'+ (typeLabels[c.type] || c.type) +'</span>' +
            badges +
          '</div>' +
          '<div class="xb-scheme-price">&yen;' + r.cost.toLocaleString() + '</div>' +
        '</div>' +
        '<div class="xb-scheme-meta">' +
          '<span>总时效：<strong style="'+daysColor+'">'+r.totalDays+' 天</strong></span>' +
          '<span>运输 '+r.shippingDays+'天</span>' +
          '<span>处理 '+c.processing+'天 + 清关 '+c.customs+'天</span>' +
          '<span>可靠性 '+c.reliability+'%</span>' +
        '</div>' +
        '<div class="xb-scheme-eta">预计送达：<strong>'+etaStr+'</strong> · 计费重量 '+r.billWeight+' kg</div>' +
        '<div class="xb-scheme-tags">' + c.features.map(function(f) {
          return '<span class="xb-tag">'+f+'</span>';
        }).join('') + '</div>' +
      '</div>';
    }).join('');
  }

  // ==================== QUICK TRACKING ====================
  function quickTrack() {
    var tn = $('quickTrackingNumber').value.trim();
    if (!tn) {
      toast('请输入运单号');
      return;
    }
    showTracking(tn);
  }

  // ==================== TRACKING DISPLAY ====================
  window._crossBorderShowTracking = function(carrierId) {
    var result = currentResults.find(function(r) { return r.carrier.id === carrierId; });
    if (!result) return;
    var fakeTN = carrierId.toUpperCase() + '-' + Math.floor(Math.random()*90000000+10000000);
    showTracking(fakeTN, result);
  };

  function showTracking(trackingNumber, result) {
    $('trackingDetail').style.display = 'block';
    $('detailTrackingNumber').textContent = trackingNumber;

    // Progress steps
    var steps = ['pickup','transit','customs','delivered'];
    var labels = ['已揽收','运输中','清关中','已签收'];
    var icons = ['&#10003;','&#9992;','&#9873;','&#127968;'];
    var completeIdx = Math.min(2, Math.floor(Math.random() * 2) + 1);

    steps.forEach(function(step, i) {
      var dot = document.getElementById('dot-' + step);
      dot.className = 'xb-step-dot';
      if (i < completeIdx) {
        dot.className += ' done';
        dot.innerHTML = '&#10003;';
      } else if (i === completeIdx) {
        dot.className += ' on';
        dot.innerHTML = icons[i];
      } else {
        dot.className += ' wait';
        dot.innerHTML = i === 3 ? '&#127968;' : '&#9873;';
      }
    });

    // Status badge
    var badge = $('detailStatusBadge');
    badge.textContent = labels[completeIdx];
    badge.className = 'xb-track-status';
    if (completeIdx >= 2) {
      badge.classList.add('done');
    } else {
      badge.classList.add('transit');
    }

    // Timeline
    var now = new Date();
    var timeline = [];
    timeline.push({ time: fmtTime(new Date(now.getTime() - 72*3600000)), desc: '包裹已揽收，发往分拨中心', loc: '深圳' });
    timeline.push({ time: fmtTime(new Date(now.getTime() - 48*3600000)), desc: '离开深圳分拨中心，发往目的地', loc: '深圳机场' });
    timeline.push({ time: fmtTime(new Date(now.getTime() - 24*3600000)), desc: '已抵达目的地国家，等待清关', loc: '目的地' });
    if (completeIdx >= 2) {
      timeline.push({ time: fmtTime(new Date(now.getTime() - 12*3600000)), desc: '清关完成，转交当地派送', loc: '派送站' });
    }
    timeline.push({ time: fmtTime(now), desc: completeIdx >= 3 ? '已签收' : '当前状态 — ' + labels[completeIdx], loc: '' });

    var tl = $('trackingTimeline');
    tl.innerHTML = '<div class="xb-tl-line"></div>' +
      timeline.map(function(t, i) {
        var isLast = i === timeline.length - 1;
        return '<div class="xb-tl-node">' +
          '<div class="xb-tl-dot '+(isLast?'now':'')+'"></div>' +
          '<div class="xb-tl-time">'+t.time+'</div>' +
          '<div class="xb-tl-desc">'+t.desc+'</div>' +
          (t.loc ? '<div class="xb-tl-loc">'+t.loc+'</div>' : '') +
        '</div>';
      }).join('');

    $('trackingDetail').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function fmtTime(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') +
           ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }

  // ==================== STARTUP ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
