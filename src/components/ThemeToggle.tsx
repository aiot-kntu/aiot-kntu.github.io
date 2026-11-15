import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Sun03Icon, Moon02Icon } from '@hugeicons/core-free-icons';
import { playTickSound } from '@/lib/sound';

import { Button } from './ui/button';
import { ui } from '@/lib/settings';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const activeTransition = useRef<ViewTransition | null>(null);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = storedTheme || systemTheme;
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setThemeMode = (mode: 'light' | 'dark', event?: React.MouseEvent<HTMLButtonElement>) => {
    if (mode === theme || activeTransition.current) return;

    playTickSound(1100, 0.03);

    const bounds = event?.currentTarget.getBoundingClientRect();
    const pointerClick = event && event.detail > 0;
    const x = pointerClick ? event.clientX : bounds ? bounds.x + bounds.width / 2 : window.innerWidth / 2;
    const y = pointerClick ? event.clientY : bounds ? bounds.y + bounds.height / 2 : window.innerHeight / 2;
    document.documentElement.style.setProperty('--theme-x', `${x}px`);
    document.documentElement.style.setProperty('--theme-y', `${y}px`);

    const apply = () => {
      // Include the selected control in the same snapshot as the page colors.
      flushSync(() => setTheme(mode));
      localStorage.setItem('theme', mode);
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    if (typeof document.startViewTransition === 'function' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.dataset.themeTransition = '1';
      const transition = document.startViewTransition({ update: apply });
      activeTransition.current = transition;
      const cleanup = () => {
        activeTransition.current = null;
        delete document.documentElement.dataset.themeTransition;
      };
      transition.finished.then(cleanup, cleanup);
    } else {
      apply();
    }
  };

  if (!mounted) {
    return <div className="h-11 w-16 opacity-0" />;
  }

  return (
    <div
      className="relative flex h-11 w-16 items-center"
      role="group"
      aria-label={ui.appearance}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 rounded-full border" />
      <span
        aria-hidden="true"
        data-theme-selection
        className="pointer-events-none absolute left-[3px] top-1/2 z-10 grid h-[26px] w-[26px] place-items-center rounded-full bg-secondary text-foreground transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: `translate(${theme === 'dark' ? 32 : 0}px, -50%)`, viewTransitionName: 'theme-selection' }}
      >
        <HugeiconsIcon icon={theme === 'dark' ? Moon02Icon : Sun03Icon} size={14} />
      </span>
      <Button
        type="button"
        onClick={event => setThemeMode('light', event)}
        variant="ghost" size="icon" className="relative h-11 w-8 shrink-0 text-muted-foreground hover:bg-transparent"
        aria-label={ui.lightMode} aria-pressed={theme === 'light'}
      >
        <HugeiconsIcon icon={Sun03Icon} size={14} className={theme === 'light' ? 'opacity-0' : 'relative'} />
      </Button>
      <Button
        type="button"
        onClick={event => setThemeMode('dark', event)}
        variant="ghost" size="icon" className="relative h-11 w-8 shrink-0 text-muted-foreground hover:bg-transparent"
        aria-label={ui.darkMode} aria-pressed={theme === 'dark'}
      >
        <HugeiconsIcon icon={Moon02Icon} size={14} className={theme === 'dark' ? 'opacity-0' : 'relative'} />
      </Button>
    </div>
  );
}
