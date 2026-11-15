import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import logoPaths from '@/content/settings/logo-paths.json';
import { site } from '@/lib/settings';
import './logo-morph.css';

// Bounds of the antenna mark plus the stacked wordmark, in Figma frame units.
const viewBox = '-71 -27 340 294';
const globeCentreX = 99;
const loopSeconds = 3;

// The four meridians cross the globe in one direction, a quarter-cycle apart.
// Phases 0.25 and 0.75 match the two resting halves of the ellipse; the other
// two wait until they reach the globe's edge so the loop starts without a jump.
const meridianPhases = [
  { phase: 0.25, atRest: true },
  { phase: 0.5, atRest: false },
  { phase: 0.75, atRest: true },
  { phase: 0, atRest: false },
];
const meridianPath = logoPaths.find((p) => p.loopBase)!;
// Width 1 is the resting ellipse half; ±1.6006 reaches the ring (radius 80 / rx 50).
const meridianWidths = [-1, -0.973, -0.895, -0.775, -0.623, -0.452, -0.279, -0.112, 0, 0.112, 0.279, 0.452, 0.623, 0.775, 0.895, 0.973, 1]
  .map((width) => width * 1.6006);
// Morph coordinates instead of scaling the stroke, including at the centre line.
const meridianFrames = meridianWidths.map((width) => {
  let coordinate = 0;
  return meridianPath.d.replace(/-?\d*\.?\d+/g, (value) => {
    const number = Number(value);
    return coordinate++ % 2 === 0
      ? (globeCentreX + (number - globeCentreX) * width).toFixed(4)
      : value;
  });
}).join(';');

function loopBeginOffset(phase: number, atRest: boolean) {
  // Negative offsets start mid-cycle; positive ones delay until the edge fade.
  return atRest ? -phase * loopSeconds : ((1 - phase) % 1) * loopSeconds;
}

interface Props {
  className?: string;
  onAnimationComplete?: () => void;
}

export function LogoMorphIntro({ className = '', onAnimationComplete }: Props) {
  const [stage, setStage] = useState<'drawing' | 'moving' | 'docked'>('drawing');
  const dock = useRef<HTMLDivElement>(null);
  const animatedLogo = useRef<HTMLDivElement>(null);
  const meridianLoop = useRef<SVGGElement>(null);

  const isIntro = stage !== 'docked';
  const completed = useRef(false);
  const completionCallback = useRef(onAnimationComplete);
  useEffect(() => { completionCallback.current = onAnimationComplete; }, [onAnimationComplete]);
  const finishIntro = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    setStage('docked');
    completionCallback.current?.();
  }, []);

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (site.branding.mode === 'image' || reducedMotion.matches) {
      finishIntro();
      return;
    }

    let frame = 0;
    const moveTimer = window.setTimeout(() => {
      const logo = animatedLogo.current;
      if (!logo || !dock.current) {
        finishIntro();
        return;
      }
      setStage('moving');
      const origin = logo.getBoundingClientRect();
      const fromX = origin.left + origin.width / 2;
      const fromY = origin.top + origin.height / 2;
      const startedAt = performance.now();

      const move = (now: number) => {
        const target = dock.current?.getBoundingClientRect();
        if (!target) {
          finishIntro();
          return;
        }
        const progress = Math.min(1, (now - startedAt) / 900);
        const eased = 1 - Math.pow(1 - progress, 4);
        // Read the live destination so scroll restoration, scrolling, and
        // viewport changes cannot detach the flight from its header slot.
        const x = fromX + (target.left + target.width / 2 - fromX) * eased;
        const y = fromY + (target.top + target.height / 2 - fromY) * eased;
        const scale = 1.35 - 0.35 * eased;
        logo.style.left = '0';
        logo.style.top = '0';
        logo.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
        if (progress < 1) frame = requestAnimationFrame(move);
        else finishIntro();
      };
      frame = requestAnimationFrame(move);
    }, 1100);

    const skipMotion = () => {
      if (!reducedMotion.matches) return;
      clearTimeout(moveTimer);
      cancelAnimationFrame(frame);
      finishIntro();
    };
    reducedMotion.addEventListener('change', skipMotion);
    return () => {
      clearTimeout(moveTimer);
      cancelAnimationFrame(frame);
      reducedMotion.removeEventListener('change', skipMotion);
    };
  }, [finishIntro]);

  useLayoutEffect(() => {
    if (stage !== 'docked' || !meridianLoop.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = meridianLoop.current.querySelectorAll<SVGAnimationElement>('animate');
    const startLoop = () => {
      if (reducedMotion.matches) return;
      animations.forEach((animation) => animation.beginElementAt(
        loopBeginOffset(Number(animation.dataset.phase), animation.dataset.rest === 'true'),
      ));
    };
    const updateMotion = () => {
      if (reducedMotion.matches) animations.forEach((animation) => animation.endElement());
      else startLoop();
    };
    startLoop();
    reducedMotion.addEventListener('change', updateMotion);
    return () => reducedMotion.removeEventListener('change', updateMotion);
  }, [stage]);

  // Distinguish stroke geometry from fill letters
  const strokePaths = logoPaths.filter((p) => p.stroke);
  const fillPaths = logoPaths.filter((p) => p.fill);

  if (site.branding.mode === 'image') return <img src={site.branding.image} alt={site.branding.alt} width={site.branding.width} height={site.branding.height} className={className} />;

  return (
    <div
      ref={dock}
      className="relative flex flex-col items-center"
      style={{ width: site.branding.width, height: site.branding.height }}
      data-logo-intro={isIntro ? 'true' : undefined}
      data-logo-loop={stage === 'docked' ? 'true' : undefined}
    >
      {/* Dimmed backdrop while centered */}
      <AnimatePresence>
        {stage !== 'docked' && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: stage === 'moving' ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-40 pointer-events-none bg-background"
          />
        )}
      </AnimatePresence>

      {/* The reserved header slot stays in flow while the intro uses viewport coordinates. */}
      <div className={isIntro ? 'pointer-events-none fixed inset-0 z-50' : 'relative'}>
        <div
          ref={animatedLogo}
          style={isIntro ? {
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: site.branding.width,
            height: site.branding.height,
            transform: 'translate(-50%, -50%) scale(1.35)',
            willChange: 'transform',
          } : undefined}
          className={className}
        >
          <svg
            width={site.branding.width}
            height={site.branding.height}
            aria-hidden="true"
            viewBox={viewBox}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="max-w-full text-foreground"
          >
            {/* Stroked Geometry (Compass, meridians, inner star) */}
            {stage === 'docked' && (
              <g ref={meridianLoop} className="logo-loop-meridians" stroke="currentColor" strokeWidth={meridianPath.strokeWidth}>
                {meridianPhases.map(({ phase, atRest }) => (
                  // Hidden until its animation begins, so delayed meridians never flash.
                  <g key={phase} opacity={0}>
                    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.0625;0.9375;1" dur={`${loopSeconds}s`} repeatCount="indefinite" begin="indefinite" data-phase={phase} data-rest={atRest} />
                    <path d={meridianPath.d}>
                      <animate attributeName="d" values={meridianFrames} dur={`${loopSeconds}s`} repeatCount="indefinite" begin="indefinite" data-phase={phase} data-rest={atRest} />
                    </path>
                  </g>
                ))}
              </g>
            )}
            {strokePaths.map((p, i) => (
              <motion.path
                key={`stroke-${i}`}
                d={p.d}
                stroke="currentColor"
                strokeWidth={p.strokeWidth || '1.33'}
                strokeLinecap={(p.strokeLinecap as any) || undefined}
                strokeLinejoin={(p.strokeLinejoin as any) || undefined}
                className={p.className}
                initial={isIntro ? { pathLength: 0, opacity: 0 } : false}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={
                  isIntro
                    ? {
                        duration: 0.95,
                        ease: [0.16, 1, 0.3, 1],
                        delay: i * 0.04,
                      }
                    : { duration: 0 }
                }
              />
            ))}

            {/* Filled Typography & Accent Letters */}
            {fillPaths.map((p, i) => (
              <g key={`fill-${i}`} transform={p.transform}>
                <motion.path
                  d={p.d}
                  fill="currentColor"
                  initial={isIntro ? { opacity: 0, scale: 0.8 } : false}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={
                    isIntro
                      ? {
                          duration: 0.5,
                          ease: 'easeOut',
                          delay: 0.45 + i * 0.015,
                        }
                      : { duration: 0 }
                  }
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
