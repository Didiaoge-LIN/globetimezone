(function() {
  const containers = document.querySelectorAll('.ad-container[data-ad-slot]');
  if (!containers.length) return;
  let retryCount = 0;
  const MAX_RETRIES = 3;

  function loadAds() {
    if (!(window as any).adsbygoogle) {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      script.onload = initAds;
      script.onerror = () => handleFailure();
      document.head.appendChild(script);
      setTimeout(() => {
        if (!(window as any).adsbygoogle) handleFailure();
      }, 3000);
    } else {
      initAds();
    }
  }

  function initAds() {
    try {
      containers.forEach(c => {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        c.classList.add('loaded');
      });
    } catch (e) {
      handleFailure();
    }
  }

  function handleFailure() {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(loadAds, 5000);
    } else {
      hideAll();
    }
  }

  function hideAll() {
    containers.forEach(c => c.style.display = 'none');
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadAds, { timeout: 2000 });
  } else {
    setTimeout(loadAds, 2000);
  }
})();
