/**
 * 首页交互控制器
 * 严格CSP兼容，零内联，零innerHTML，全异常兜底
 */
(function () {
  'use strict';

  // DOM元素
  const goBtn = document.getElementById('go-btn');
  const cityASelect = document.getElementById('city-a');
  const cityBSelect = document.getElementById('city-b');

  // LocalStorage 可用性检测（无痕模式/禁用时静默降级）
  let storageAvailable = false;
  try {
    const testKey = '__gtz_storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch (e) {
    storageAvailable = false;
  }

  // 回填用户上次选择
  if (storageAvailable) {
    try {
      const saved = JSON.parse(localStorage.getItem('last_cities') || '[]');
      if (Array.isArray(saved) && saved.length === 2) {
        cityASelect.value = saved[0];
        cityBSelect.value = saved[1];
      }
    } catch (e) {
      // 解析失败静默忽略
    }
  }

  // 核心跳转逻辑
  function handleGoClick() {
    const cityA = cityASelect.value;
    const cityB = cityBSelect.value;

    if (!cityA || !cityB) return;

    // 保存用户选择
    if (storageAvailable) {
      try {
        localStorage.setItem('last_cities', JSON.stringify([cityA, cityB]));
      } catch (e) {}
    }

    // 安全跳转
    window.location.href = `/meeting?cities=${encodeURIComponent(cityA)},${encodeURIComponent(cityB)}`;
  }

  goBtn.addEventListener('click', handleGoClick);
})();