import { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon } from '@hugeicons/core-free-icons';
import type { LabPublication } from '@/data/publications';
import { ui, text } from '@/lib/settings';
const labels = ui.publications;
interface Props { pub: LabPublication; }

export function PublicationItem({ pub }: Props) {
  const citationId = useId();
  const [showBibtex, setShowBibtex] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const paperUrl = pub.url || (pub.doi ? `https://doi.org/${pub.doi}` : undefined);
  const statusLabel = labels.statuses.find(status => status.id === pub.status)?.label;
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  const copyBibtex = async () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(pub.bibtex);
      setCopyState('copied');
      copyTimer.current = setTimeout(() => setCopyState('idle'), 2000);
    } catch { setCopyState('error'); }
  };
  return <article className="min-w-0 rounded-lg bg-background p-5 text-foreground sm:p-6" aria-labelledby={`${pub.id}-title`}>
      <h3 id={`${pub.id}-title`} className="type-item">
        {paperUrl ? <a href={paperUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-[5px] decoration-foreground/35 hover:underline">{pub.title}</a> : pub.title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground/75">{pub.authors.join(' · ')}</p>
      <div className="type-meta mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {pub.venue && <p>{pub.venue}</p>}
        {statusLabel && <span className="inline-flex shrink-0 items-center gap-3">
          {pub.venue && <span aria-hidden="true">/</span>}
          {statusLabel}
        </span>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {paperUrl && <a href={paperUrl} target="_blank" rel="noopener noreferrer" aria-label={text(ui.readPaperLabel, { title: pub.title })} className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">
          {ui.readPaper}<span aria-hidden="true">↗</span>
        </a>}
        {pub.code && <a href={pub.code} target="_blank" rel="noopener noreferrer" aria-label={text(ui.viewCodeLabel, { title: pub.title })} className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">
          {ui.viewCode}<span aria-hidden="true">↗</span>
        </a>}
        <button type="button" className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-transparent px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent motion-reduce:transition-none" onClick={() => setShowBibtex(open => !open)} aria-expanded={showBibtex} aria-controls={citationId} aria-label={text(labels.bibtexLabel, { title: pub.title })}>
          {labels.bibtex}<span aria-hidden="true" className="font-mono">{showBibtex ? '−' : '+'}</span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {showBibtex && <motion.div
          id={citationId}
          key="bibtex"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="mt-4 min-w-0 rounded-sm bg-accent/50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2"><span className="type-label">{labels.citation}</span><button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent motion-reduce:transition-none" onClick={copyBibtex} aria-label={text(labels.copyLabel, { title: pub.title })}><HugeiconsIcon icon={Copy01Icon} size={14} aria-hidden="true" />{copyState === 'copied' ? labels.copied : labels.copy}</button></div>
            <pre tabIndex={0} aria-label={text(labels.citationLabel, { title: pub.title })} className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-[1.8] text-muted-foreground">{pub.bibtex}</pre>
            <p role="status" aria-live="polite" className={copyState === 'error' ? 'mt-3 text-xs leading-relaxed text-muted-foreground' : 'sr-only'}>{copyState === 'copied' ? labels.copySuccess : copyState === 'error' ? labels.copyError : ''}</p>
          </div>
        </motion.div>}
      </AnimatePresence>
  </article>;
}
