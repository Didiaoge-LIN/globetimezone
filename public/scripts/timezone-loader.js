// ===== GlobeTimeZone - Timezone Data Loader v1.0 =====
// 带重试、容错、降级的时区数据异步加载系统

class TimezoneDataLoader {
  constructor() {
    this.data = null;
    this.isLoaded = false;
    this._loadPromise = null;
  }

  /**
   * 异步加载时区数据
   * @returns {Promise<Object>} 时区数据
   */
  async load() {
    if (this.isLoaded) return this.data;

    // 防止重复请求
    if (this._loadPromise) return this._loadPromise;

    this._loadPromise = this._fetchData();
    return this._loadPromise;
  }

  async _fetchData() {
    try {
      const response = await fetch('/api/timezones', {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.data = await response.json();
      this.isLoaded = true;

      // 将数据挂载到全局（兼容现有代码）
      if (this.data.cities) {
        window.ALL_CITIES = this.data.cities;
      }
      if (this.data.timezones) {
        window.ALL_TIMEZONES = this.data.timezones;
      }

      console.log('[TimezoneLoader] 时区数据加载成功');
      return this.data;
    } catch (error) {
      console.error('[TimezoneLoader] 加载失败:', error.message);
      this._loadPromise = null;  // 允许重试
      throw error;
    }
  }

  /**
   * 带自动重试的加载
   * @param {number} maxRetries - 最大重试次数
   * @param {number} delayMs - 重试间隔毫秒
   * @returns {Promise<Object>} 时区数据
   */
  async loadWithRetry(maxRetries = 3, delayMs = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.load();
      } catch (error) {
        if (i === maxRetries - 1) {
          // 最后一次重试失败，显示降级 UI
          console.error('[TimezoneLoader] 所有重试均失败');
          this._showFallbackUI();
          throw error;
        }
        console.warn(`[TimezoneLoader] 第 ${i + 1} 次重试...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * 显示降级 UI（当数据加载完全失败时）
   */
  _showFallbackUI() {
    const containers = [
      '#timezone-converter',
      '.converter-section',
      '.main-content'
    ];

    // 尝试找到主内容容器
    let container = null;
    for (const selector of containers) {
      container = document.querySelector(selector);
      if (container) break;
    }

    if (container) {
      container.innerHTML = `
        <div class="error-state" role="alert" style="text-align:center;padding:48px 24px;">
          <div style="font-size:4rem;margin-bottom:16px;">&#9888;&#65039;</div>
          <h3 style="margin-bottom:12px;color:var(--text);">Data Loading Failed</h3>
          <p style="color:var(--text-muted);margin-bottom:20px;">
            Unable to load timezone data. Please check your network connection.
          </p>
          <button onclick="location.reload()" class="btn" style="
            display:inline-block;padding:12px 24px;background:var(--primary);
            color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;">
            Refresh Page
          </button>
          <p style="color:var(--text-muted);font-size:0.85rem;margin-top:16px;">
            If the problem persists, contact <a href="mailto:support@globetimezone.com">support@globetimezone.com</a>
          </p>
        </div>
      `;
    }
  }

  /**
   * 获取数据（如果未加载则返回默认数据）
   * @returns {Object|null}
   */
  getData() {
    return this.data;
  }

  /**
   * 获取城市列表
   * @returns {Array}
   */
  getCities() {
    return this.data ? (this.data.cities || []) : [];
  }

  /**
   * 获取时区列表
   * @returns {Array}
   */
  getTimezones() {
    return this.data ? (this.data.timezones || []) : [];
  }
}

// 全局单例
const tzLoader = new TimezoneDataLoader();

// 自动初始化（主页使用时）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    tzLoader.loadWithRetry().then(() => {
      console.log('[TimezoneLoader] 就绪，触发应用初始化');
      if (typeof initApp === 'function') {
        initApp();
      }
    }).catch(() => {
      // 降级 UI 已在 _showFallbackUI 中处理
    });
  });
} else {
  // DOM 已加载
  tzLoader.loadWithRetry().then(() => {
    if (typeof initApp === 'function') {
      initApp();
    }
  }).catch(() => {});
}
