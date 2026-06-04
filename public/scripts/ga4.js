// GA4 Analytics - Auto-initializes when Measurement ID is configured
(function() {
  // Priority: URL param > meta tag > config file > localStorage
  function getGa4Id() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('ga4_test')) return params.get('ga4_test');

    var meta = document.querySelector('meta[name="ga4-measurement-id"]');
    if (meta && meta.content) return meta.content;

    if (window.GLOBETIMEZONE_GA4_ID && window.GLOBETIMEZONE_GA4_ID !== 'G-14921330046') {
      return window.GLOBETIMEZONE_GA4_ID;
    }

    try {
      var stored = localStorage.getItem('gtz_ga4_id');
      if (stored && stored !== 'G-14921330046') return stored;
    } catch(e) {}

    return null;
  }

  var measurementId = getGa4Id();
  if (!measurementId) return;

  // Google Analytics 4
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', measurementId, {
    'anonymize_ip': true,
    'cookie_flags': 'SameSite=None;Secure',
    'send_page_view': true
  });

  window.gtag = gtag;
  console.log('[GA4] Initialized with ' + measurementId);
})();
