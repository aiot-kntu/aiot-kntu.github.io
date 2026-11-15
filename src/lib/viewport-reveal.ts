let dispose = () => {};
const revealed = new WeakSet<HTMLElement>();

export const stopViewportReveals = () => dispose();

export function initViewportReveals() {
  dispose();
  const page = document.querySelector<HTMLElement>('main');
  if (!page) return;

  const selector = '[data-viewport-reveal]';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // HTML stays readable without JS. Only prepared Web Animations hold elements
  // in their entrance pose; cancelling an animation restores the visible HTML.
  if (reducedMotion.matches || !('IntersectionObserver' in window) || !('animate' in Element.prototype)) {
    page.querySelectorAll<HTMLElement>(selector).forEach(item => { revealed.add(item); });
    return;
  }

  const pending = new Map<HTMLElement, Animation>();
  const running = new Map<HTMLElement, Animation>();
  let observing = false;

  const revealImmediately = (item: HTMLElement) => {
    observer.unobserve(item);
    revealed.add(item);
    pending.get(item)?.cancel();
    running.get(item)?.cancel();
    pending.delete(item);
    running.delete(item);
  };
  const finishRunning = () => {
    [...running.keys()].forEach(revealImmediately);
  };

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const item = entry.target as HTMLElement;
      const animation = pending.get(item);
      if (!animation) continue;
      observer.unobserve(item);
      revealed.add(item);
      pending.delete(item);
      if (reducedMotion.matches || document.documentElement.hasAttribute('data-theme-transition')) {
        animation.cancel();
        continue;
      }
      running.set(item, animation);
      animation.play();
      const settled = () => {
        if (running.get(item) !== animation) return;
        running.delete(item);
        // Remove the fill effect once complete so hover transforms stay free.
        animation.cancel();
      };
      animation.finished.then(settled, settled);
    }
  }, { rootMargin: '0px 0px -64px 0px', threshold: 0 });

  const prepareNewItems = () => {
    page.querySelectorAll<HTMLElement>(selector).forEach(item => {
      if (revealed.has(item) || pending.has(item)) return;
      if (reducedMotion.matches || item.getBoundingClientRect().bottom <= 0) {
        revealed.add(item);
        return;
      }
      const animation = item.animate([
        { opacity: 0, transform: 'translate3d(0, 24px, 0)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ], {
        duration: 650,
        delay: Math.max(0, Math.min(Number(item.dataset.revealDelay) || 0, 300)),
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill: 'both',
      });
      animation.pause();
      animation.currentTime = 0;
      pending.set(item, animation);
      if (observing) observer.observe(item);
    });
    // React filters can replace nodes while their entrance is pending.
    for (const item of [...pending.keys(), ...running.keys()]) {
      if (!item.isConnected) revealImmediately(item);
    }
  };
  const startObservation = () => {
    if (observing || document.querySelector('[data-logo-intro]')) return;
    observing = true;
    pending.forEach((_, item) => observer.observe(item));
  };

  prepareNewItems();
  startObservation();
  const contentObserver = new MutationObserver(prepareNewItems);
  contentObserver.observe(page, { childList: true, subtree: true });

  const focus = (event: FocusEvent) => {
    if (!(event.target instanceof Element)) return;
    const item = event.target.closest<HTMLElement>('[data-viewport-reveal]');
    if (item) revealImmediately(item);
  };
  const motionPreference = () => {
    if (!reducedMotion.matches) return;
    observer.disconnect();
    [...pending.keys(), ...running.keys()].forEach(revealImmediately);
  };
  // Entrance motion waits for the existing logo intro, and theme snapshots
  // capture completed content rather than an in-flight transparent frame.
  const pageStateObserver = new MutationObserver(() => {
    startObservation();
    if (document.documentElement.hasAttribute('data-theme-transition')) finishRunning();
  });
  pageStateObserver.observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: ['data-theme-transition', 'data-logo-intro'],
  });
  page.addEventListener('focusin', focus);
  reducedMotion.addEventListener('change', motionPreference);

  dispose = () => {
    observer.disconnect();
    contentObserver.disconnect();
    pageStateObserver.disconnect();
    [...pending.keys(), ...running.keys()].forEach(revealImmediately);
    page.removeEventListener('focusin', focus);
    reducedMotion.removeEventListener('change', motionPreference);
    dispose = () => {};
  };
}
