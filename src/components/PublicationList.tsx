import { useMemo, useState } from 'react';
import type { LabPublication } from '@/data/publications';
import { site, ui } from '@/lib/settings';
import { PublicationItem } from './PublicationItem';

interface Props {
  publications: LabPublication[];
  page?: { title: string; description: string };
}
const labels = ui.publications;
const statusOptions = [{ id: 'all', label: labels.all }, ...labels.statuses];

export function PublicationList({ publications, page }: Props) {
  const [status, setStatus] = useState('all');
  const years = useMemo(() => [...new Set(publications.map(pub => pub.year))].sort((a, b) => b - a), [publications]);
  const filtered = useMemo(() => status === 'all' ? publications : publications.filter(pub => pub.status === status), [publications, status]);
  const reset = () => setStatus('all');

  const nav = (
    <nav aria-label={labels.statusLabel} className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
      {statusOptions.map(option => {
        const count = option.id === 'all' ? publications.length : publications.filter(pub => pub.status === option.id).length;
        const active = status === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => setStatus(option.id)}
            className={`text-[13px] font-medium underline-offset-4 transition-colors hover:underline ${
              active ? 'text-foreground underline' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
            <span className="ml-1 font-mono text-xs opacity-60">
              {String(count).padStart(2, '0')}
            </span>
          </button>
        );
      })}
    </nav>
  );

  return <div>
    {page ? (
      <header className="page-intro pb-12 sm:pb-16" data-viewport-reveal>
        <p className="type-label">{site.name}</p>
        <h1 className="type-title mt-3">{page.title}</h1>
        <p className="type-lead mt-3">{page.description}</p>
        {nav}
      </header>
    ) : (
      nav
    )}
    <div className="space-y-14 sm:space-y-16">
      {years.map((groupYear, index) => {
        const group = filtered.filter(pub => pub.year === groupYear);
        if (!group.length) return null;
        return <section key={groupYear} id={`year-${groupYear}`} aria-labelledby={`publications-${groupYear}`} className="scroll-mt-8 border-t pt-8 sm:pt-10" data-viewport-reveal data-reveal-delay={(index % 4) * 75}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 id={`publications-${groupYear}`} className="type-section tabular-nums">{groupYear}</h2>
            <span className="type-label tabular-nums">{String(group.length).padStart(2, '0')}</span>
          </div>
          <div className="mt-6 space-y-3">{group.map(pub => <PublicationItem key={pub.id} pub={pub} />)}</div>
        </section>;
      })}
      {filtered.length === 0 && <div className="border-t pt-8 sm:pt-10" data-viewport-reveal>
        <h2 className="type-section">{labels.emptyTitle}</h2><p className="mt-2 text-sm text-muted-foreground">{labels.emptyDescription}</p><button type="button" onClick={reset} className="mt-3 min-h-11 text-[13px] underline underline-offset-4">{labels.reset}</button>
      </div>}
    </div>
  </div>;
}
