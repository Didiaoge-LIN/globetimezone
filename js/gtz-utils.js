// gtz-utils.js — GlobeTimeZone 全局工具函数库 v1.0
// 所有通用逻辑集中管理，统一错误处理，避免重复代码
// IIFE 模式，暴露 window.GTZ_Utils
(() => {
  'use strict';

  /**
   * 全局错误处理装饰器
   * @param {Function} fn 目标函数
   * @param {string} moduleName 模块名称
   * @returns {Function} 包装后的函数
   */
  function withErrorHandling(fn, moduleName) {
    return function (...args) {
      try {
        const result = fn.apply(this, args);
        if (result && typeof result.catch === 'function') {
          return result.catch(err => {
            console.error('[' + moduleName + '] 异步错误:', err);
            return null;
          });
        }
        return result;
      } catch (error) {
        console.error('[' + moduleName + '] 错误:', error);
        return null;
      }
    };
  }

  /**
   * 本地存储工具类（带类型校验和过期时间）
   */
  const Storage = {
    get(key, defaultValue) {
      try {
        const item = localStorage.getItem(key);
        if (!item) return defaultValue;
        const parsed = JSON.parse(item);
        if (parsed && parsed.__gtz_storage === true) {
          if (parsed.expires && Date.now() > parsed.expires) {
            localStorage.removeItem(key);
            return defaultValue;
          }
          return parsed.value;
        }
        return parsed;
      } catch (error) {
        return defaultValue;
      }
    },

    set(key, value, expiresIn) {
      try {
        const data = {
          __gtz_storage: true,
          value: value,
          expires: expiresIn ? Date.now() + expiresIn : null
        };
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('[GTZ_Storage] 写入错误:', error);
        return false;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        return false;
      }
    }
  };

  /**
   * 时间计算工具类（核心·全模块复用）
   */
  const TimeUtils = {
    /**
     * 时区转换（基于IANA时区）
     * @param {Date} date 基准时间
     * @param {string} targetTimezone 目标时区
     * @returns {Date} 目标时区时间
     */
    convertTimezone: withErrorHandling(function (date, targetTimezone) {
      if (!targetTimezone || typeof targetTimezone !== 'string') return null;
      return new Date(date.toLocaleString('en-US', { timeZone: targetTimezone }));
    }, 'TimeUtils'),

    /**
     * 计算两个时区的时差（小时）
     * @param {string} tz1 时区1
     * @param {string} tz2 时区2
     * @returns {number} 时差（tz2 - tz1）
     */
    getTimezoneOffset: withErrorHandling(function (tz1, tz2) {
      const now = new Date();
      const d1 = new Date(now.toLocaleString('en-US', { timeZone: tz1 }));
      const d2 = new Date(now.toLocaleString('en-US', { timeZone: tz2 }));
      return Math.round((d2 - d1) / (1000 * 60 * 60) * 10) / 10;
    }, 'TimeUtils'),

    /**
     * 判断是否为工作日
     * @param {Date} date 日期
     * @returns {boolean}
     */
    isWeekday(date) {
      const day = date.getDay();
      return day !== 0 && day !== 6;
    },

    /**
     * 解析时间字符串（支持所有主流格式）
     * @param {string} str 时间字符串
     * @returns {Object|null} { hour, minute }
     */
    parseTimeString: withErrorHandling(function (str) {
      str = str.trim().toLowerCase();

      // 1530
      if (/^\d{4}$/.test(str)) {
        return { hour: parseInt(str.slice(0, 2)), minute: parseInt(str.slice(2, 4)) };
      }

      // 15:30
      if (/^\d{1,2}:\d{2}$/.test(str)) {
        const parts = str.split(':').map(Number);
        return { hour: parts[0], minute: parts[1] };
      }

      // 3pm / 3:30am
      const ampmMatch = str.match(/^(\d{1,2})(:(\d{2}))?\s*(am|pm)$/);
      if (ampmMatch) {
        let hour = parseInt(ampmMatch[1]);
        const minute = ampmMatch[3] ? parseInt(ampmMatch[3]) : 0;
        if (ampmMatch[4] === 'pm' && hour !== 12) hour += 12;
        if (ampmMatch[4] === 'am' && hour === 12) hour = 0;
        return { hour, minute };
      }

      // 上午9点 / 下午3点
      const cnMatch = str.match(/^(上午|下午)(\d{1,2})/);
      if (cnMatch) {
        let hour = parseInt(cnMatch[2]);
        if (cnMatch[1] === '下午' && hour !== 12) hour += 12;
        if (cnMatch[1] === '上午' && hour === 12) hour = 0;
        return { hour, minute: 0 };
      }

      return null;
    }, 'TimeUtils'),

    /**
     * 获取某时区在某UTC小时的本地小时
     * @param {string} tz IANA时区
     * @param {number} utcHour UTC小时
     * @returns {number} 本地小时
     */
    localHourAtUTC(tz, utcHour) {
      try {
        const now = new Date();
        const nowUTC = now.getUTCHours();
        const offsetMs = (utcHour - nowUTC) * 3600000;
        const fakeDate = new Date(now.getTime() + offsetMs);
        const h = parseInt(
          new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(fakeDate),
          10
        );
        return isNaN(h) ? -1 : h;
      } catch { return -1; }
    }
  };

  /**
   * Toast提示工具类（全站统一）
   */
  const Toast = {
    _activeToast: null,
    show(message, duration) {
      duration = duration || 2000;
      // 防止重复弹出
      if (Toast._activeToast) {
        Toast._activeToast.remove();
      }
      const toast = document.createElement('div');
      toast.className = 'gtz-toast';
      toast.textContent = message;
      toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);' +
        'padding:10px 20px;background:rgba(0,0,0,0.8);color:#fff;border-radius:5px;z-index:99999;' +
        'font-size:14px;transition:opacity 0.3s;pointer-events:none;';
      document.body.appendChild(toast);
      Toast._activeToast = toast;
      setTimeout(function () {
        toast.style.opacity = '0';
        setTimeout(function () { toast.remove(); Toast._activeToast = null; }, 300);
      }, duration);
    }
  };

  /**
   * 全局事件总线（模块间通信）
   */
  const EventBus = {
    events: {},

    on(event, callback) {
      if (!this.events[event]) this.events[event] = [];
      this.events[event].push(callback);
    },

    off(event, callback) {
      if (!this.events[event]) return;
      this.events[event] = this.events[event].filter(function (cb) { return cb !== callback; });
    },

    emit(event) {
      var args = Array.prototype.slice.call(arguments, 1);
      if (!this.events[event]) return;
      this.events[event].forEach(function (callback) {
        try { callback.apply(null, args); }
        catch (error) { console.error('[EventBus] 事件' + event + '执行错误:', error); }
      });
    }
  };

  // 暴露到全局
  window.GTZ_Utils = {
    withErrorHandling: withErrorHandling,
    Storage: Storage,
    TimeUtils: TimeUtils,
    Toast: Toast,
    EventBus: EventBus
  };

})();
