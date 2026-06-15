/**
 * 会议规划器核心控制器
 * 零依赖、零XSS、无内存泄漏、全边界兜底
 */
(function () {
  'use strict';

  class MeetingPlanner {
    /**
     * @param {object} options 配置项
     * @param {string} options.containerId 容器ID
     * @param {string} options.trackSelector 时间轴轨道选择器
     * @param {string[]} [options.initialCities=[]] 初始城市时区列表
     * @param {number} [options.defaultDuration=60] 默认会议时长（分钟）
     */
    constructor(options) {
      this.container = document.getElementById(options.containerId);
      this.timelineTrack = document.querySelector(options.trackSelector);
      this.cities = Array.isArray(options.initialCities) ? options.initialCities : [];
      this.duration = options.defaultDuration || 60;

      this.debounceTimer = null;
      this.abortController = null;
      this.hasInteracted = false;
      this._unloadHandler = null;

      this._init();
    }

    _init() {
      this._bindLifecycle();
      if (this.cities.length >= 2) {
        this.debouncedFetch();
      }
    }

    _bindLifecycle() {
      this._unloadHandler = () => this.destroy();
      window.addEventListener('beforeunload', this._unloadHandler);
    }

    /**
     * 更新城市列表
     * @param {string[]} cities 时区列表
     */
    updateCities(cities) {
      if (!Array.isArray(cities)) return;
      this.cities = cities;
      this.debouncedFetch();
    }

    /**
     * 设置会议时长
     * @param {number} minutes 分钟数
     */
    setDuration(minutes) {
      const num = parseInt(minutes, 10);
      if (isNaN(num) || num < 15 || num > 480) return;
      this.duration = num;
      this.debouncedFetch();
    }

    /**
     * 防抖请求
     */
    debouncedFetch() {
      if (this.cities.length < 2) {
        this.clearSlots();
        this.showEmptyTip();
        return;
      }

      clearTimeout(this.debounceTimer);
      // 取消未完成的请求
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }

      this.debounceTimer = setTimeout(() => {
        this._fetchOverlap();
      }, 300);
    }

    async _fetchOverlap() {
      if (!this.timelineTrack) return;

      this.timelineTrack.classList.add('loading');
      this.abortController = new AbortController();

      const params = new URLSearchParams({
        cities: this.cities.join(','),
        duration: this.duration
      });

      try {
        const res = await fetch(`/api/v1/overlap?${params}`, {
          signal: this.abortController.signal,
          credentials: 'same-origin'
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        if (json.code === 0 && Array.isArray(json.data?.overlap_slots)) {
          this._renderSlots(json.data.overlap_slots);
          // 首次加载成功延迟触发分享引导
          if (!this.hasInteracted && json.data.overlap_slots.length > 0) {
            this.hasInteracted = true;
            setTimeout(() => this.showShareGuide(), 3000);
          }
        } else {
          this.clearSlots();
          this.showEmptyTip();
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('获取重叠时段失败:', error);
          this.clearSlots();
          this.showErrorTip();
        }
      } finally {
        this.timelineTrack.classList.remove('loading');
      }
    }

    _renderSlots(slots) {
      this.clearSlots();
      if (!this.timelineTrack || slots.length === 0) return;

      const DAY_MS = 24 * 60 * 60 * 1000;

      slots.forEach((slot) => {
        // 字段强校验
        if (!slot.slot_utc_start || !slot.slot_utc_end) return;
        const startDate = new Date(slot.slot_utc_start);
        const endDate = new Date(slot.slot_utc_end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

        const startMs = startDate.getUTCHours() * 3600000 + startDate.getUTCMinutes() * 60000;
        const endMs = endDate.getUTCHours() * 3600000 + endDate.getUTCMinutes() * 60000;

        const leftPercent = (startMs / DAY_MS) * 100;
        const widthPercent = ((endMs - startMs) / DAY_MS) * 100;
        if (widthPercent <= 0) return;

        // 纯DOM创建，全程textContent，从根源杜绝XSS
        const slotEl = document.createElement('div');
        slotEl.className = 'time-slot';
        slotEl.style.left = `${leftPercent}%`;
        slotEl.style.width = `${widthPercent}%`;
        slotEl.dataset.start = slot.slot_utc_start;
        slotEl.dataset.end = slot.slot_utc_end;

        const label = document.createElement('span');
        label.className = 'slot-label';
        const hour = startDate.getUTCHours().toString().padStart(2, '0');
        const minute = startDate.getUTCMinutes().toString().padStart(2, '0');
        label.textContent = `${hour}:${minute} UTC`;

        slotEl.appendChild(label);
        slotEl.addEventListener('click', () => this._onSlotClick(slot));
        this.timelineTrack.appendChild(slotEl);
      });
    }

    /**
     * 清空所有时段与提示
     */
    clearSlots() {
      if (!this.timelineTrack) return;
      const elements = this.timelineTrack.querySelectorAll('.time-slot, .empty-tip, .error-tip');
      elements.forEach(el => el.remove());
    }

    showEmptyTip() {
      if (!this.timelineTrack) return;
      const tip = document.createElement('div');
      tip.className = 'empty-tip';
      tip.textContent = '未找到所有城市均处于工作时段的重叠时间';
      this.timelineTrack.appendChild(tip);
    }

    showErrorTip() {
      if (!this.timelineTrack) return;
      const tip = document.createElement('div');
      tip.className = 'error-tip';
      tip.textContent = '加载失败，请刷新页面重试';
      this.timelineTrack.appendChild(tip);
    }

    _onSlotClick(slot) {
      const start = new Date(slot.slot_utc_start);
      const end = new Date(slot.slot_utc_end);
      const text = `跨时区会议时间\nUTC时间：${start.toISOString().slice(0, 16)} - ${end.toISOString().slice(0, 16)}\n请在日历中添加对应时区的提醒`;

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => this.showToast('会议时间已复制到剪贴板'))
          .catch(() => this.showToast('复制失败，请手动复制'));
      } else {
        this.showToast('当前环境不支持自动复制');
      }
    }

    /**
     * 分享引导（可自定义扩展）
     */
    showShareGuide() {
      console.log('[MeetingPlanner] 触发分享引导');
    }

    /**
     * 通用Toast提示
     * @param {string} message 提示内容
     */
    showToast(message) {
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#111827;color:#fff;padding:10px 20px;border-radius:8px;z-index:9999;font-size:14px;';
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }

    /**
     * 销毁实例，彻底清理所有资源，杜绝内存泄漏
     */
    destroy() {
      clearTimeout(this.debounceTimer);
      if (this.abortController) {
        this.abortController.abort();
      }
      if (this._unloadHandler) {
        window.removeEventListener('beforeunload', this._unloadHandler);
      }

      this.debounceTimer = null;
      this.abortController = null;
      this.timelineTrack = null;
      this.container = null;
      this.cities = [];
    }
  }

  // 挂载到全局
  window.MeetingPlanner = MeetingPlanner;
})();