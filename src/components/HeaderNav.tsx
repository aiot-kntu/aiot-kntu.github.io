import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { navigate } from 'astro:transitions/client';
import { playTickSound } from '@/lib/sound';
import { site, ui } from '@/lib/settings';
import { Button } from './ui/button';

interface Props { currentPath: string; }
export interface NavItem { label: string; href: string; aliases?: string[]; }
export const navItems: NavItem[] = site.navigation;
export function isItemActive(item: NavItem, path: string): boolean {
  const current = path.replace(/\/+$/, '') || '/';
  return [item.href, ...(item.aliases ?? [])].some(href => current === href || (href !== '/' && current.startsWith(`${href}/`)));
}
export function HeaderNav({ currentPath }: Props) {
  const [activePath, setActivePath] = useState(currentPath);
  const [hovered, setHovered] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => setActivePath(currentPath), [currentPath]);
  useEffect(() => {
    const sync = () => setActivePath(window.location.pathname);
    document.addEventListener('astro:after-swap', sync);
    window.addEventListener('popstate', sync);
    return () => { document.removeEventListener('astro:after-swap', sync); window.removeEventListener('popstate', sync); };
  }, []);

  return <nav className="flex flex-wrap justify-center gap-0.5 sm:gap-1" aria-label={ui.navigation} onMouseLeave={() => setHovered(null)}>
    {navItems.map(item => {
      const active = isItemActive(item, activePath);
      return <Button key={item.href} asChild variant="ghost" size="sm" className={`relative h-11 px-2 text-xs hover:bg-transparent sm:px-3 sm:text-[13px] ${active ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground hover:text-foreground'}`}>
        <a href={item.href} aria-current={active ? 'page' : undefined} onMouseEnter={() => { setHovered(item.href); playTickSound(1200, 0.015); }} onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          event.preventDefault();
          if (item.href === activePath) return;
          setActivePath(item.href);
          playTickSound(800, 0.02);
          void navigate(item.href);
        }}>
          {active && <motion.span aria-hidden="true" layoutId="active-nav-pill" className="pointer-events-none absolute inset-x-0 inset-y-2 rounded-md bg-foreground/[0.08]" transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }} />}
          {!active && hovered === item.href && <motion.span aria-hidden="true" layoutId="hover-nav-pill" className="pointer-events-none absolute inset-x-0 inset-y-2 rounded-md bg-foreground/[0.04]" transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }} />}
          <span className="relative">{item.label}</span>
        </a>
      </Button>;
    })}
  </nav>;
}
