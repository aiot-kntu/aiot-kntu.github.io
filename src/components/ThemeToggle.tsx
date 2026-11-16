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
    return <div className="h-11 w-11" />;
  }

  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <Button
      type="button"
      onClick={event => setThemeMode(next, event)}
      variant="ghost"
      size="icon"
      className="group h-11 w-11 rounded-full text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
      aria-label={next === 'dark' ? ui.darkMode : ui.lightMode}
      title={next === 'dark' ? ui.darkMode : ui.lightMode}
    >
      <span
        aria-hidden="true"
        className="grid place-items-center transition-transform duration-300 ease-out group-hover:rotate-[15deg] group-active:scale-90 motion-reduce:transition-none"
        style={{ viewTransitionName: 'theme-selection' }}
      >
        {/* Show where you can go, not where you are: a moon in light mode, a sun in dark. */}
        <HugeiconsIcon icon={theme === 'dark' ? Sun03Icon : Moon02Icon} size={17} strokeWidth={1.6} />
      </span>
    </Button>
  );
}
