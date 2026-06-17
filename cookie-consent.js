(function () {
  if (localStorage.getItem('cookie-consent')) return;

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;background:#1a1a2e;color:#fff;padding:16px;text-align:center;z-index:99999;';
  banner.innerHTML =
    'We use cookies to improve your experience. <button id="cookie-accept" style="margin-left:12px;padding:8px 16px;background:#0066cc;color:#fff;border:none;border-radius:4px;cursor:pointer;">Accept</button>';

  document.body.appendChild(banner);

  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem('cookie-consent', 'true');
    banner.remove();
  });
})();
