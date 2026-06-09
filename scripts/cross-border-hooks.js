/**
 * GlobeTimeZone 钩子系统 — 跨境工具专用
 * 自动记忆 · 价值量化 · 智能推荐 · 通知中心 · 分享系统
 * v1.0 2026-06-09
 */
var HookSystem = (function() {
  'use strict';

  var shippingHistory = [];
  var trackingHistory = [];
  var notifications = [];

  function $(id) { return document.getElementById(id); }

  // ═══════════ INIT ═══════════
  function init() {
    loadHistory();
    initBell();
    initClearHistory();
    checkDailyReminders();
  }

  // ═══════════ 1. 自动记忆系统 ═══════════

  function loadHistory() {
    try {
      var sh = localStorage.getItem('gtz_hk_shipping');
      if (sh) shippingHistory = JSON.parse(sh);
      renderShippingHistory();

      var th = localStorage.getItem('gtz_hk_tracking');
      if (th) trackingHistory = JSON.parse(th);
      renderTrackingHistory();
    } catch(e) { /* fail silently */ }
  }

  function saveShippingRecord(data) {
    var record = {
      id: Date.now(),
      origin: data.origin || '',
      destination: data.destination || '',
      weight: data.weight || 1,
      dimensions: data.dimensions || '',
      bestCost: data.bestCost || 0,
      bestCarrier: data.bestCarrier || '',
      totalDays: data.totalDays || 0,
      timestamp: new Date().toISOString()
    };

    shippingHistory.unshift(record);
    if (shippingHistory.length > 10) shippingHistory = shippingHistory.slice(0, 10);
    localStorage.setItem('gtz_hk_shipping', JSON.stringify(shippingHistory));
    renderShippingHistory();
  }

  function saveTrackingRecord(tn, status, label) {
    var record = {
      id: Date.now(),
      number: tn,
      status: status,
      label: label || status,
      lastUpdate: new Date().toISOString()
    };

    trackingHistory = trackingHistory.filter(function(r) { return r.number !== tn; });
    trackingHistory.unshift(record);
    if (trackingHistory.length > 15) trackingHistory = trackingHistory.slice(0, 15);
    localStorage.setItem('gtz_hk_tracking', JSON.stringify(trackingHistory));
    renderTrackingHistory();
  }

  // ═══════════ 2. 渲染引擎 ═══════════

  function renderShippingHistory() {
    var container = $('hkShippingHistory');
    if (!container) return;

    if (!shippingHistory.length) {
      container.innerHTML = '<div style="text-align:center;padding:16px 0;color:#94a3b8;font-size:0.8rem;">暂无查询记录</div>';
      return;
    }

    container.innerHTML = '';
    shippingHistory.slice(0, 5).forEach(function(r) {
      var div = document.createElement('div');
      div.className = 'hk-memory-card hk-fade-in';
      div.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
          '<div>' +
            '<p style="font-weight:600;margin:0;font-size:0.85rem;">' + esc(r.origin) + ' → ' + esc(r.destination) + '</p>' +
            '<p style="font-size:0.73rem;color:#94a3b8;margin:4px 0 0;">' + esc(r.weight) + 'kg | ' + esc(r.dimensions) + '</p>' +
          '</div>' +
          '<div style="text-align:right;flex-shrink:0;">' +
            '<p style="font-weight:700;color:#2563eb;font-size:0.95rem;">¥ ' + (r.bestCost || 0).toLocaleString() + '</p>' +
            '<p style="font-size:0.72rem;color:#94a3b8;margin-top:2px;">' + esc(r.bestCarrier) + '</p>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;margin-top:8px;">' +
          '<span style="color:#2563eb;font-size:0.76rem;cursor:pointer;font-weight:600;" data-requery="' + r.id + '">再查一次</span>' +
        '</div>';
      div.querySelector('[data-requery]').addEventListener('click', function() { requeryShipping(r); });
      container.appendChild(div);
    });
  }

  function renderTrackingHistory() {
    var container = $('hkTrackingHistory');
    if (!container) return;

    if (!trackingHistory.length) {
      container.innerHTML = '<div style="text-align:center;padding:16px 0;color:#94a3b8;font-size:0.8rem;">暂无追踪记录</div>';
      return;
    }

    var statusMap = {
      '已签收': { bg:'#d1fae5', color:'#065f46' },
      '运输中': { bg:'#dbeafe', color:'#1d4ed8' },
      '清关中': { bg:'#fef3c7', color:'#92400e' },
      '已揽收': { bg:'#e0e7ff', color:'#3730a3' },
      '派送失败': { bg:'#fef2f2', color:'#991b1b' },
      '滞留异常': { bg:'#fef2f2', color:'#991b1b' }
    };

    container.innerHTML = '';
    trackingHistory.slice(0, 8).forEach(function(r) {
      var s = statusMap[r.status] || statusMap[r.label] || { bg:'#f1f5f9', color:'#64748b' };
      var div = document.createElement('div');
      div.className = 'hk-fade-in';
      div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-radius:8px;margin-bottom:4px;transition:.15s;cursor:pointer;';
      div.onmouseenter = function() { div.style.background = '#f8fafc'; };
      div.onmouseleave = function() { div.style.background = ''; };
      div.innerHTML =
        '<span style="font-family:monospace;font-size:0.82rem;font-weight:600;">' + esc(r.number) + '</span>' +
        '<span style="padding:3px 10px;border-radius:100px;font-size:0.7rem;font-weight:600;background:' + s.bg + ';color:' + s.color + ';">' + esc(r.label || r.status) + '</span>';
      div.addEventListener('click', function() { retrackPackage(r.number); });
      container.appendChild(div);
    });
  }

  function requeryShipping(record) {
    var originMap = {
      '深圳': 'shenzhen', '广州': 'guangzhou', '义乌': 'yiwu', '上海': 'shanghai', '宁波': 'ningbo', '青岛': 'qingdao'
    };
    var originVal = Object.keys(originMap).find(function(k) { return record.origin.indexOf(k) >= 0; }) || 'shenzhen';
    if ($('origin')) $('origin').value = originMap[originVal] || originVal;

    var destMap = {
      '美国东部·纽约': 'us-east', '美国西部·洛杉矶': 'us-west',
      '美国东部': 'us-east', '美国西部': 'us-west',
      '英国·伦敦': 'uk', '英国': 'uk',
      '德国·柏林': 'de', '德国': 'de',
      '法国·巴黎': 'fr', '法国': 'fr',
      '日本·东京': 'jp', '日本': 'jp',
      '澳大利亚·悉尼': 'au', '澳大利亚': 'au',
      '加拿大·多伦多': 'ca', '加拿大': 'ca'
    };
    var destVal = Object.keys(destMap).find(function(k) { return record.destination.indexOf(k) >= 0; });
    if ($('destination') && destVal) $('destination').value = destMap[destVal];
    if ($('weight')) $('weight').value = record.weight;

    var dims = record.dimensions.split('×');
    if (dims.length >= 3) {
      if ($('length')) $('length').value = parseInt(dims[0]) || 20;
      if ($('width')) $('width').value = parseInt(dims[1]) || 15;
      if ($('height')) $('height').value = parseInt(dims[2]) || 10;
    }

    // Switch to logistics tab
    var logisticsTab = document.querySelector('.xb-tab-btn[data-tab="tab-logistics"]');
    if (logisticsTab) logisticsTab.click();

    setTimeout(function() {
      var btn = $('calculateBtn');
      if (btn) btn.click();
    }, 200);
  }

  function retrackPackage(number) {
    // Switch to tracking tab
    var trackingTab = document.querySelector('.xb-tab-btn[data-tab="tab-tracking"]');
    if (trackingTab) trackingTab.click();

    setTimeout(function() {
      var input = $('tabTrackingNumber');
      if (input) input.value = number;
      var btn = $('tabTrackBtn');
      if (btn) btn.click();
    }, 200);
  }

  function clearAllHistory() {
    if (!confirm('确定要清空所有历史记录吗？')) return;
    localStorage.removeItem('gtz_hk_shipping');
    localStorage.removeItem('gtz_hk_tracking');
    shippingHistory = [];
    trackingHistory = [];
    renderShippingHistory();
    renderTrackingHistory();
  }

  // ═══════════ 3. 价值量化展示 ═══════════

  function showShippingValue(results) {
    if (!results || !results.length) return;

    var costs = results.map(function(r) { return r.cost; });
    var days = results.map(function(r) { return r.totalDays; });
    var minCost = Math.min.apply(null, costs);
    var maxCost = Math.max.apply(null, costs);
    var saved = maxCost - minCost;
    var minDays = Math.min.apply(null, days);
    var maxDays = Math.max.apply(null, days);
    var savedDays = maxDays - minDays;
    var avoidedLoss = Math.round(minCost * 0.15);

    var cheapest = results.find(function(r) { return r.cost === minCost; });
    var bestCarrier = cheapest ? (cheapest.carrier.fullName || cheapest.carrier.name) : '';

    // Collect origin/destination info for saving
    var origEl = $('origin');
    var destEl = $('destination');
    var originName = origEl ? (origEl.options[origEl.selectedIndex] || {}).text || '' : '';
    var destName = destEl ? (destEl.options[destEl.selectedIndex] || {}).text || '' : '';

    // Remove existing value bar
    var existing = document.querySelector('.hk-value-bar');
    if (existing) existing.remove();

    var bar = document.createElement('div');
    bar.className = 'hk-value-bar hk-fade-in';
    bar.innerHTML =
      '<div class="hk-value-grid">' +
        '<div class="hk-value-item"><p class="hk-value-num" style="color:#10b981;">¥ ' + saved.toLocaleString() + '</p><p class="hk-value-label">已为你节省运费</p></div>' +
        '<div class="hk-value-item"><p class="hk-value-num" style="color:#2563eb;">' + savedDays + ' 天</p><p class="hk-value-label">最快可提前到达</p></div>' +
        '<div class="hk-value-item"><p class="hk-value-num" style="color:#f59e0b;">¥ ' + avoidedLoss.toLocaleString() + '+</p><p class="hk-value-label">避免潜在延误损失</p></div>' +
        '<div class="hk-value-item" style="display:flex;align-items:center;justify-content:center;">' +
          '<button class="hk-share-btn" onclick="HookSystem.shareResult()">分享给同行</button>' +
        '</div>' +
      '</div>';

    var resultsContainer = $('logisticsResults');
    if (resultsContainer && resultsContainer.style.display !== 'none') {
      var firstCard = resultsContainer.querySelector('.xb-card');
      if (firstCard) {
        firstCard.parentNode.insertBefore(bar, firstCard);
      }
    }

    // Save to memory
    saveShippingRecord({
      origin: originName,
      destination: destName,
      weight: ($('weight') || {}).value || 1,
      dimensions: (($('length') || {}).value || 20) + '×' + (($('width') || {}).value || 15) + '×' + (($('height') || {}).value || 10),
      bestCost: minCost,
      bestCarrier: bestCarrier,
      totalDays: minDays
    });

    // Show recommendations
    showRecommendations('shipping');
  }

  function showTrackingValue(trackingData) {
    if (!trackingData || !trackingData.number) return;
    saveTrackingRecord(trackingData.number, trackingData.status, trackingData.label || trackingData.status);

    // Alert for abnormal status
    if (trackingData.status === '清关中' || trackingData.status === '派送失败' || trackingData.status === '滞留异常') {
      addNotification({
        type: 'warning',
        title: '包裹异常提醒',
        message: '运单 ' + trackingData.number + ' · ' + (trackingData.label || trackingData.status) + ' — 点击查看处理建议'
      });
    }
  }

  // ═══════════ 4. 智能推荐系统 ═══════════

  function showRecommendations(type) {
    var existing = $('hkRecommendations');
    if (existing) existing.remove();

    var recs = {
      shipping: [
        { title:'计算真实利润', desc:'输入售价和成本，一键计算净利润和ROI', icon:'🧮', action: function() {
          var tariffTab = document.querySelector('.xb-tab-btn[data-tab="tab-tariff"]');
          if (tariffTab) tariffTab.click();
        }},
        { title:'预估进口关税', desc:'提前计算关税和DDP总价，避免意外成本', icon:'💰', action: function() {
          var tariffTab = document.querySelector('.xb-tab-btn[data-tab="tab-tariff"]');
          if (tariffTab) tariffTab.click();
        }},
        { title:'查看目的地禁运品', desc:'发货前确认目的地有无特殊限制', icon:'🚫', action: function() {
          var prohTab = document.querySelector('.xb-tab-btn[data-tab="tab-prohibited"]');
          if (prohTab) prohTab.click();
        }}
      ],
      tracking: [
        { title:'查看物流方案', desc:'对比不同物流商的价格和时效', icon:'📦', action: function() {
          var logTab = document.querySelector('.xb-tab-btn[data-tab="tab-logistics"]');
          if (logTab) logTab.click();
        }},
        { title:'清关延误怎么办', desc:'了解清关延误的常见原因和解决方案', icon:'⚓', action: function() {
          var tariffTab = document.querySelector('.xb-tab-btn[data-tab="tab-tariff"]');
          if (tariffTab) tariffTab.click();
        }},
        { title:'计算订单利润', desc:'输入成本，计算这个订单的真实利润', icon:'🧮', action: function() {
          var tariffTab = document.querySelector('.xb-tab-btn[data-tab="tab-tariff"]');
          if (tariffTab) tariffTab.click();
        }}
      ]
    };

    var items = recs[type] || recs.shipping;
    var container = document.createElement('div');
    container.id = 'hkRecommendations';
    container.className = 'hk-fade-in';
    container.style.cssText = 'background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-top:16px;';

    container.innerHTML =
      '<h4 style="font-weight:700;font-size:0.9rem;margin:0 0 14px;display:flex;align-items:center;gap:6px;">' +
        '💡 为你推荐' +
      '</h4>' +
      '<div class="hk-rec-grid">' +
        items.map(function(rec, i) {
          return '<div class="hk-rec-card" data-rec-idx="' + i + '">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
              '<span style="font-size:1.1rem;">' + rec.icon + '</span>' +
              '<p style="font-weight:600;margin:0;font-size:0.85rem;">' + esc(rec.title) + '</p>' +
            '</div>' +
            '<p style="font-size:0.76rem;color:#94a3b8;margin:0;">' + esc(rec.desc) + '</p>' +
          '</div>';
        }).join('') +
      '</div>';

    container.querySelectorAll('.hk-rec-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-rec-idx'));
        if (items[idx] && items[idx].action) items[idx].action();
      });
    });

    var resultsContainer = $('logisticsResults');
    if (resultsContainer) resultsContainer.appendChild(container);
  }

  // ═══════════ 5. 通知系统 ═══════════

  function initBell() {
    var bell = $('hkBell');
    var dropdown = $('hkDropdown');
    if (!bell || !dropdown) return;

    bell.addEventListener('click', function(e) {
      e.stopPropagation();
      var isShow = dropdown.classList.contains('show');
      dropdown.classList.toggle('show', !isShow);
      if (!isShow) {
        var dot = $('hkBellDot');
        if (dot) dot.classList.remove('show');
      }
    });

    document.addEventListener('click', function() {
      dropdown.classList.remove('show');
    });

    dropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }

  function addNotification(notif) {
    notifications.unshift({
      type: notif.type || 'info',
      title: notif.title || '',
      message: notif.message || '',
      time: new Date().toLocaleString('zh-CN', { hour12: false })
    });

    if (notifications.length > 20) notifications = notifications.slice(0, 20);
    renderNotifications();

    var dot = $('hkBellDot');
    if (dot) dot.classList.add('show');
  }

  function renderNotifications() {
    var container = $('hkNotifList');
    if (!container) return;

    if (!notifications.length) {
      container.innerHTML = '<div class="hk-notif-empty">暂无新通知</div>';
      return;
    }

    var iconMap = { info:'🔵', success:'🟢', warning:'🟡', error:'🔴' };
    container.innerHTML = '';
    notifications.slice(0, 10).forEach(function(n) {
      var div = document.createElement('div');
      div.className = 'hk-notif-item';
      div.innerHTML =
        '<div style="display:flex;gap:10px;">' +
          '<span style="font-size:0.85rem;flex-shrink:0;margin-top:1px;">' + (iconMap[n.type] || '🔵') + '</span>' +
          '<div>' +
            '<p style="font-weight:600;font-size:0.83rem;margin:0;">' + esc(n.title) + '</p>' +
            '<p style="font-size:0.76rem;color:#64748b;margin:3px 0 0;">' + esc(n.message) + '</p>' +
            '<p style="font-size:0.68rem;color:#94a3b8;margin:4px 0 0;">' + esc(n.time) + '</p>' +
          '</div>' +
        '</div>';
      container.appendChild(div);
    });
  }

  function checkDailyReminders() {
    var lastCheck = localStorage.getItem('gtz_hk_daily_check');
    var today = new Date().toDateString();
    if (lastCheck === today) return;

    // US Independence Day reminder
    var now = new Date();
    var july4th = new Date(now.getFullYear(), 6, 4);
    var daysUntil = Math.ceil((july4th - now) / 86400000);

    if (daysUntil > 0 && daysUntil <= 21) {
      addNotification({
        type: 'warning',
        title: '📅 美国独立日临近',
        message: '距离7月4日还有' + daysUntil + '天，物流时效将延长3-5天，建议提前发货'
      });
    }

    // Dragon Boat Festival 2026
    var dragonBoat = new Date(2026, 5, 14); // June 14
    var dbDays = Math.ceil((dragonBoat - now) / 86400000);
    if (dbDays > 0 && dbDays <= 7) {
      addNotification({
        type: 'info',
        title: '📅 端午节提醒',
        message: '距离端午节(6月14日)还有' + dbDays + '天，中国仓库将放假1-3天'
      });
    }

    localStorage.setItem('gtz_hk_daily_check', today);
  }

  // ═══════════ 6. 分享系统 ═══════════

  function shareResult() {
    var origEl = $('origin');
    var destEl = $('destination');
    var weightEl = $('weight');
    if (!origEl || !destEl || !weightEl) return;

    var origin = origEl.options[origEl.selectedIndex].text;
    var dest = destEl.options[destEl.selectedIndex].text;
    var weight = weightEl.value;

    var costs = document.querySelectorAll('#logisticsList .xb-scheme-price');
    var minCost = '?';
    if (costs.length) {
      var nums = Array.from(costs).map(function(el) { return parseInt(el.textContent.replace(/[^0-9]/g, '')); }).filter(Boolean);
      if (nums.length) minCost = Math.min.apply(null, nums).toLocaleString();
    }

    var text = '📦 我用 GlobeTimeZone 查了' + origin + '发' + dest + '的运费，' + weight + 'kg货最低只要¥' + minCost + '元！\n👉 立即查询：https://globetimezone.com/tools/cross-border/';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        alert('✅ 分享链接已复制到剪贴板！快分享给你的同行吧');
      }).catch(function() {
        alert(text);
      });
    } else {
      alert(text);
    }
  }

  // ═══════════ 7. 清空历史 ═══════════

  function initClearHistory() {
    var btn = $('hkClearAllHistory');
    if (btn) btn.addEventListener('click', clearAllHistory);
  }

  // ═══════════ UTILS ═══════════

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ═══════════ PUBLIC API ═══════════

  // Wait for DOM, then init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    showShippingValue: showShippingValue,
    showTrackingValue: showTrackingValue,
    shareResult: shareResult,
    addNotification: addNotification
  };

})();
