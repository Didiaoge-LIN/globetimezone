class PrefetchStrategy {
  private observer: IntersectionObserver;

  constructor() {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      { rootMargin: '100px' }
    );
  }

  observeLinks(): void {
    document.querySelectorAll('a[data-prefetch]').forEach(link => {
      this.observer.observe(link);
    });
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLAnchorElement;
        const href = el.getAttribute('href');
        if (href) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = href;
          document.head.appendChild(link);
        }
        this.observer.unobserve(el);
      }
    });
  }

  prefetchOnIdle(url: string): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        fetch(url, { priority: 'low' }).catch(() => {});
      });
    } else {
      setTimeout(() => fetch(url, { priority: 'low' }).catch(() => {}), 2000);
    }
  }
}

export const prefetchStrategy = new PrefetchStrategy();
