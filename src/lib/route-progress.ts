import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';

/** One timer owner for the current navigation; stale completions are ignored. */
export function createRouteProgress(getBar: () => HTMLElement | null) {
  let sequence = 0;
  let current = 0;
  let visible = false;
  let value = 0;
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  let tickTimer: ReturnType<typeof setInterval> | undefined;
  let fadeTimer: ReturnType<typeof setTimeout> | undefined;
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  const clearTimers = () => {
    clearTimeout(revealTimer);
    clearInterval(tickTimer);
    clearTimeout(fadeTimer);
    clearTimeout(resetTimer);
  };
  const render = () => {
    const bar = getBar();
    if (!bar) return;
    bar.style.transform = `scaleX(${value})`;
    bar.style.opacity = visible ? '1' : '0';
  };
  const reset = () => {
    clearTimers();
    current = 0;
    visible = false;
    value = 0;
    render();
  };

  return {
    start() {
      reset();
      const id = ++sequence;
      current = id;
      // Fast page changes need no flashing loading indicator.
      revealTimer = setTimeout(() => {
        if (current !== id) return;
        visible = true;
        value = 0.12;
        render();
        tickTimer = setInterval(() => {
          value += (0.9 - value) * 0.12;
          render();
        }, 180);
      }, 120);
      return id;
    },
    finish(id: number) {
      if (!current || id !== current) return;
      clearTimers();
      if (!visible) { reset(); return; }
      value = 1;
      render();
      fadeTimer = setTimeout(() => {
        if (current !== id) return;
        visible = false;
        render();
        resetTimer = setTimeout(() => { if (current === id) reset(); }, 180);
      }, 180);
    },
    cancel(id = current) {
      if (id === current) reset();
    },
    dispose: reset,
  };
}

export function installRouteProgress() {
  const events = new AbortController();
  const progress = createRouteProgress(() => document.getElementById('page-progress'));
  let navigation = 0;
  document.addEventListener('astro:before-preparation', (event: TransitionBeforePreparationEvent) => {
    if (event.defaultPrevented || event.signal.aborted) return;
    const id = progress.start();
    navigation = id;
    event.signal.addEventListener('abort', () => progress.cancel(id), { once: true });
    // A later listener can cancel preparation before Astro calls the loader.
    queueMicrotask(() => { if (event.defaultPrevented) progress.cancel(id); });
    const loader = event.loader;
    event.loader = async () => {
      try {
        await loader();
        if (event.defaultPrevented) progress.cancel(id);
      } catch (error) {
        progress.cancel(id);
        throw error;
      }
    };
  }, { signal: events.signal });
  document.addEventListener('astro:page-load', () => progress.finish(navigation), { signal: events.signal });
  window.addEventListener('pagehide', () => progress.cancel(), { signal: events.signal });
  window.addEventListener('pageshow', event => { if (event.persisted) progress.cancel(); }, { signal: events.signal });
  return () => { events.abort(); progress.dispose(); };
}
