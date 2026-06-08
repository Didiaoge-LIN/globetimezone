// Baidu Tongji (百度统计) — reads HM ID from meta tag and loads tracker
(function() {
  var meta = document.querySelector('meta[name="baidu-tongji-id"]');
  if (!meta) return;
  var hmId = meta.getAttribute('content');
  if (!hmId) return;

  // Ensure window._hmt exists
  window._hmt = window._hmt || [];

  var hm = document.createElement('script');
  hm.async = true;
  hm.src = 'https://hm.baidu.com/hm.js?' + hmId;
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(hm, s);
})();
