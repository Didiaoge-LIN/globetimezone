(function initSkipLink() {
  if (document.querySelector('.skip-link')) return;

  const link = document.createElement('a');
  link.className = 'skip-link';
  link.href = '#main-content';
  link.textContent = 'Skip to main content';
  document.body.prepend(link);

  const main = document.querySelector('main') || document.querySelector('.main-content');
  if (main && !main.id) {
    main.id = 'main-content';
  }

  const style = document.createElement('style');
  style.textContent = `
    .skip-link {
      position: absolute;
      top: -100px;
      left: 0;
      background: #0066cc;
      color: #fff;
      padding: 8px 16px;
      z-index: 10000;
      text-decoration: none;
      border-radius: 0 0 4px 0;
      transition: top 0.2s ease;
    }
    .skip-link:focus {
      top: 0;
      outline: 3px solid #fff;
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);
})();
