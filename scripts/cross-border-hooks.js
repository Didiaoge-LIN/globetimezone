/**
 * GlobeTimeZone 钩子系统 — 跨境工具专用
 * 自动记忆 · 价值量化 · 智能推荐 · 通知中心 · 分享系统
 * v2.0 2026-06-09
 *
 * 升级内容：
 * - 丰富节假日提醒（春节/感恩节/圣诞/端午/独立日）
 * - 推荐卡片新增"最佳发货时间"真实功能
 * - 分享文案增加时效说明
 * - 追踪"滞留异常"状态支持
 * - 修复：与 cross-border.js HookSystem 命名冲突（旧版已从 cross-border.js 移除）
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

    // 更新计数徽章
    var countEl = $('hkShippingCount');
    if (countEl) countEl.textContent = shippingHistory.length || 0;

    if (!shippingHistory.length) {
      container.innerHTML = '<div style="text-align:center;padding:16px 0;color:#94a3b8;font-size:0.8rem;">暂无查询记录<br><span style="font-size:0.72rem;display:block;margin-top:4px;">查询物流后自动保存</span></div>';
      return;
    }

    container.innerHTML = '';
    shippingHistory.slice(0, 5).forEach(function(r) {
      var div = document.createElement('div');
      div.className = 'hk-memory-card hk-fade-in';

      // 格式化时间
      var timeStr = '';
      try {
        var d = new Date(r.timestamp);
        timeStr = (d.getMonth()+1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
      } catch(e) {}

      div.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
          '<div style="flex:1;min-width:0;">' +
            '<p style="font-weight:600;margin:0;font-size:0.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(r.origin) + ' → ' + esc(r.destination) + '</p>' +
            '<p style="font-size:0.72rem;color:#94a3b8;margin:3px 0 0;">' + esc(r.weight) + 'kg · ' + esc(r.dimensions) + (timeStr ? ' · ' + timeStr : '') + '</p>' +
          '</div>' +
          '<div style="text-align:right;flex-shrink:0;margin-left:8px;">' +
            '<p style="font-weight:700;color:#2563eb;font-size:0.93rem;margin:0;">¥ ' + (r.bestCost || 0).toLocaleString() + '</p>' +
            '<p style="font-size:0.7rem;color:#94a3b8;margin:2px 0 0;">' + esc(r.bestCarrier) + ' · ' + (r.totalDays || '--') + '天</p>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;margin-top:8px;">' +
          '<span class="hk-requery-btn" data-requery="' + r.id + '" style="color:#2563eb;font-size:0.75rem;cursor:pointer;font-weight:600;padding:2px 8px;border-radius:5px;background:rgba(37,99,235,0.06);transition:.15s;" ' +
            'onmouseenter="this.style.background=\'rgba(37,99,235,0.12)\'" onmouseleave="this.style.background=\'rgba(37,99,235,0.06)\'">↻ 再查一次</span>' +
        '</div>';

      div.querySelector('[data-requery]').addEventListener('click', function() { requeryShipping(r); });
      container.appendChild(div);
    });
  }

  function renderTrackingHistory() {
    var container = $('hkTrackingHistory');
    if (!container) return;

    // 更新计数徽章
    var countEl = $('hkTrackingCount');
    if (countEl) countEl.textContent = trackingHistory.length || 0;

    if (!trackingHistory.length) {
      container.innerHTML = '<div style="text-align:center;padding:16px 0;color:#94a3b8;font-size:0.8rem;">暂无追踪记录<br><span style="font-size:0.72rem;display:block;margin-top:4px;">追踪包裹后自动保存</span></div>';
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
        '<span style="font-family:monospace;font-size:0.81rem;font-weight:600;color:#1e293b;">' + esc(r.number) + '</span>' +
        '<span style="padding:3px 10px;border-radius:100px;font-size:0.69rem;font-weight:600;background:' + s.bg + ';color:' + s.color + ';">' + esc(r.label || r.status) + '</span>';
      div.addEventListener('click', function() { retrackPackage(r.number); });
      container.appendChild(div);
    });
  }

  function requeryShipping(record) {
    var originMap = {
      '深圳': 'shenzhen', '广州': 'guangzhou', '义乌': 'yiwu', '上海': 'shanghai', '宁波': 'ningbo', '青岛': 'qingdao'
    };
    var originKey = Object.keys(originMap).find(function(k) { return record.origin.indexOf(k) >= 0; }) || null;
    if ($('origin') && originKey) $('origin').value = originMap[originKey];

    var destMap = {
      '美国东部': 'us-east', '纽约': 'us-east',
      '美国西部': 'us-west', '洛杉矶': 'us-west',
      '英国': 'uk', '伦敦': 'uk',
      '德国': 'de', '柏林': 'de',
      '法国': 'fr', '巴黎': 'fr',
      '日本': 'jp', '东京': 'jp',
      '澳大利亚': 'au', '悉尼': 'au',
      '加拿大': 'ca', '多伦多': 'ca'
    };
    var destKey = Object.keys(destMap).find(function(k) { return record.destination.indexOf(k) >= 0; });
    if ($('destination') && destKey) $('destination').value = destMap[destKey];
    if ($('weight')) $('weight').value = record.weight;

    if (record.dimensions) {
      var dims = record.dimensions.split('×');
      if (dims.length >= 3) {
        if ($('length')) $('length').value = parseInt(dims[0]) || 20;
        if ($('width'))  $('width').value  = parseInt(dims[1]) || 15;
        if ($('height')) $('height').value = parseInt(dims[2]) || 10;
      }
    }

    // 切换到物流计算 Tab
    var logisticsTab = document.querySelector('.xb-tab-btn[data-tab="tab-logistics"]');
    if (logisticsTab) logisticsTab.click();

    setTimeout(function() {
      var btn = $('calculateBtn');
      if (btn) btn.click();
    }, 200);
  }

  function retrackPackage(number) {
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

    var costs  = results.map(function(r) { return r.cost; });
    var days   = results.map(function(r) { return r.totalDays; });
    var minCost = Math.min.apply(null, costs);
    var maxCost = Math.max.apply(null, costs);
    var saved   = maxCost - minCost;
    var minDays = Math.min.apply(null, days);
    var maxDays = Math.max.apply(null, days);
    var savedDays   = maxDays - minDays;
    var avoidedLoss = Math.round(minCost * 0.15);

    var cheapest   = results.find(function(r) { return r.cost === minCost; });
    var bestCarrier = cheapest ? (cheapest.carrier.fullName || cheapest.carrier.name) : '';

    var origEl = $('origin');
    var destEl = $('destination');
    var originName = origEl ? ((origEl.options[origEl.selectedIndex] || {}).text || '') : '';
    var destName   = destEl ? ((destEl.options[destEl.selectedIndex] || {}).text || '') : '';

    // 移除旧的价值条
    var existing = document.querySelector('.hk-value-bar');
    if (existing) existing.remove();

    var bar = document.createElement('div');
    bar.className = 'hk-value-bar hk-fade-in';
    bar.innerHTML =
      '<div class="hk-value-grid">' +
        '<div class="hk-value-item">' +
          '<p class="hk-value-num" style="color:#10b981;">¥ ' + saved.toLocaleString() + '</p>' +
          '<p class="hk-value-label">已为你节省运费</p>' +
        '</div>' +
        '<div class="hk-value-item">' +
          '<p class="hk-value-num" style="color:#2563eb;">' + savedDays + ' 天</p>' +
          '<p class="hk-value-label">最快可提前到达</p>' +
        '</div>' +
        '<div class="hk-value-item">' +
          '<p class="hk-value-num" style="color:#f59e0b;">¥ ' + avoidedLoss.toLocaleString() + '+</p>' +
          '<p class="hk-value-label">避免潜在延误损失</p>' +
        '</div>' +
        '<div class="hk-value-item" style="display:flex;align-items:center;justify-content:center;">' +
          '<button class="hk-share-btn" onclick="HookSystem.shareResult()">📤 分享给同行</button>' +
        '</div>' +
      '</div>';

    var resultsContainer = $('logisticsResults');
    if (resultsContainer && resultsContainer.style.display !== 'none') {
      var firstCard = resultsContainer.querySelector('.xb-card');
      if (firstCard) {
        firstCard.parentNode.insertBefore(bar, firstCard);
      }
    }

    // 保存记忆
    saveShippingRecord({
      origin: originName,
      destination: destName,
      weight: ($('weight') || {}).value || 1,
      dimensions: (($('length') || {}).value || 20) + '×' + (($('width') || {}).value || 15) + '×' + (($('height') || {}).value || 10),
      bestCost: minCost,
      bestCarrier: bestCarrier,
      totalDays: minDays
    });

    // 显示智能推荐
    showRecommendations('shipping');
  }

  function showTrackingValue(trackingData) {
    if (!trackingData || !trackingData.number) return;
    var status = trackingData.status || '暂无信息';
    saveTrackingRecord(trackingData.number, status, trackingData.label || status);

    // 异常状态提醒
    var abnormalStatuses = ['清关中', '派送失败', '滞留异常'];
    if (abnormalStatuses.indexOf(status) >= 0) {
      var msgMap = {
        '清关中':  '正在等待清关，建议联系物流商了解进度',
        '派送失败': '派送失败，建议确认收件地址是否正确',
        '滞留异常': '包裹异常滞留，建议立即联系物流商处理'
      };
      addNotification({
        type: 'warning',
        title: '⚠️ 包裹异常提醒',
        message: '运单 ' + trackingData.number + ' · ' + status + ' — ' + (msgMap[status] || '点击查看处理建议')
      });
    }
  }

  // ═══════════ 4. 智能推荐系统 ═══════════

  function showRecommendations(type) {
    var existing = $('hkRecommendations');
    if (existing) existing.remove();

    var recs = {
      shipping: [
        {
          title: '计算真实利润',
          desc: '输入售价和成本，一键计算净利润和ROI',
          icon: '🧮',
          action: function() {
            var tariffTab = document.querySelector('.xb-tab-btn[data-tab="tab-tariff"]');
            if (tariffTab) tariffTab.click();
            setTimeout(function() {
              var el = $('tab-tariff');
              if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
            }, 200);
          }
        },
        {
          title: '最佳发货时间',
          desc: '查看今天发货的目的地到达时间和派送安排',
          icon: '📅',
          action: function() {
            // 读取当前查询的最优方案 ETA 信息
            var schemeEtaEls = document.querySelectorAll('.xb-tz-eta');
            if (schemeEtaEls.length) {
              var first = schemeEtaEls[0];
              first.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // 高亮闪烁
              first.style.transition = 'box-shadow .3s';
              first.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.35)';
              setTimeout(function() { first.style.boxShadow = ''; }, 1500);
            } else {
              // 没有结果，引导查询
              var calcBtn = $('calculateBtn');
              if (calcBtn) {
                calcBtn.focus();
                calcBtn.style.animation = 'hkPulse 0.6s ease-in-out 2';
                setTimeout(function() { calcBtn.style.animation = ''; }, 1200);
              }
            }
          }
        },
        {
          title: '预估进口关税',
          desc: '提前计算关税和DDP总价，避免意外成本',
          icon: '💰',
          action: function() {
            var tariffTab = document.querySelector('.xb-tab-btn[data-tab="tab-tariff"]');
            if (tariffTab) tariffTab.click();
          }
        }
      ],
      tracking: [
        {
          title: '查看物流方案',
          desc: '对比不同物流商的价格和时效',
          icon: '📦',
          action: function() {
            var logTab = document.querySelector('.xb-tab-btn[data-tab="tab-logistics"]');
            if (logTab) logTab.click();
          }
        },
        {
          title: '清关延误查询',
          desc: '了解各国清关要求，避免扣关',
          icon: '⚓',
          action: function() {
            var prohTab = document.querySelector('.xb-tab-btn[data-tab="tab-prohibited"]');
            if (prohTab) prohTab.click();
          }
        },
        {
          title: '计算订单利润',
          desc: '输入成本，计算这个订单的真实利润',
          icon: '🧮',
          action: function() {
            var tariffTab = document.querySelector('.xb-tab-btn[data-tab="tab-tariff"]');
            if (tariffTab) tariffTab.click();
          }
        }
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
    var bell     = $('hkBell');
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

  // ═══════════ 6. 每日节假日提醒 ═══════════

  function checkDailyReminders() {
    var lastCheck = localStorage.getItem('gtz_hk_daily_check');
    var today = new Date().toDateString();
    if (lastCheck === today) return;

    var now = new Date();
    var year = now.getFullYear();

    var holidays = [
      // 美国独立日
      { date: new Date(year, 6, 4),  name: '美国独立日',   warn: 25, msg: '物流时效将延长2-4天，建议提前发货', type: 'warning' },
      // 感恩节 (11月第四个周四)
      { date: getNthWeekdayOfMonth(year, 10, 4, 4), name: '美国感恩节', warn: 21, msg: '购物旺季，物流爆仓风险高，建议提前15天发货', type: 'warning' },
      // 圣诞节
      { date: new Date(year, 11, 25), name: '圣诞节',       warn: 30, msg: '旺季高峰，建议提前20-25天备货发货', type: 'warning' },
      // 端午节 2026-06-14
      { date: new Date(2026, 5, 14),  name: '端午节(中国)', warn: 7,  msg: '中国仓库将放假1-3天，影响国内揽收', type: 'info' },
      // 春节 2027-01-29 (动态，这里给2027)
      { date: new Date(2027, 0, 29),  name: '春节',         warn: 45, msg: '春节前后30天为物流高峰，建议提前备货', type: 'warning' }
    ];

    holidays.forEach(function(h) {
      if (!h.date || isNaN(h.date.getTime())) return;
      var daysUntil = Math.ceil((h.date - now) / 86400000);
      if (daysUntil > 0 && daysUntil <= h.warn) {
        addNotification({
          type: h.type,
          title: '📅 ' + h.name + '还有' + daysUntil + '天',
          message: h.msg
        });
      }
    });

    localStorage.setItem('gtz_hk_daily_check', today);
  }

  // 获取某年某月第N个星期几（0=周日...6=周六）
  function getNthWeekdayOfMonth(year, month, nth, weekday) {
    var d = new Date(year, month, 1);
    var count = 0;
    while (d.getMonth() === month) {
      if (d.getDay() === weekday) {
        count++;
        if (count === nth) return new Date(d);
      }
      d.setDate(d.getDate() + 1);
    }
    return null;
  }

  // ═══════════ 7. 分享系统 ═══════════

  function shareResult() {
    var origEl   = $('origin');
    var destEl   = $('destination');
    var weightEl = $('weight');
    if (!origEl || !destEl || !weightEl) return;

    var origin  = origEl.options[origEl.selectedIndex].text;
    var dest    = destEl.options[destEl.selectedIndex].text;
    var weight  = weightEl.value;

    // 读取最优方案
    var schemePrices = document.querySelectorAll('#logisticsList .xb-scheme-price');
    var minCost = '--';
    var minDays = '--';

    if (schemePrices.length) {
      var nums = Array.from(schemePrices).map(function(el) {
        return parseInt(el.textContent.replace(/[^0-9]/g, ''));
      }).filter(Boolean);
      if (nums.length) minCost = Math.min.apply(null, nums).toLocaleString();
    }

    // 获取最快时效
    var schemeMeta = document.querySelectorAll('#logisticsList .xb-scheme-meta strong');
    if (schemeMeta.length) {
      var daysArr = Array.from(schemeMeta).map(function(el) {
        return parseInt(el.textContent);
      }).filter(function(n) { return !isNaN(n); });
      if (daysArr.length) minDays = Math.min.apply(null, daysArr);
    }

    var text = '📦 我用 GlobeTimeZone 查了' + origin + '发' + dest + '的运费\n' +
      '· ' + weight + 'kg货最低只要 ¥' + minCost + '元\n' +
      '· 最快 ' + minDays + ' 天到达\n' +
      '· 支持8家物流商实时比价\n' +
      '👉 免费查询：https://globetimezone.com/tools/cross-border/';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        showToastMsg('✅ 分享文案已复制，快发给你的同行吧！');
      }).catch(function() {
        prompt('复制以下分享文案：', text);
      });
    } else {
      prompt('复制以下分享文案：', text);
    }
  }

  // ═══════════ 8. 清空历史 ═══════════

  function initClearHistory() {
    var btn = $('hkClearAllHistory');
    if (btn) btn.addEventListener('click', clearAllHistory);
  }

  // ═══════════ UTILS ═══════════

  function esc(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToastMsg(msg) {
    var t = document.querySelector('.xb-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'xb-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2500);
  }

  // ═══════════ PUBLIC API ═══════════

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    showShippingValue:  showShippingValue,
    showTrackingValue:  showTrackingValue,
    shareResult:        shareResult,
    addNotification:    addNotification,
    saveShippingRecord: saveShippingRecord,
    saveTrackingRecord: saveTrackingRecord,
    init:               init
  };

})();
