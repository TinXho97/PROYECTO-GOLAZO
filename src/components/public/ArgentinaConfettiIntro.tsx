import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

const CONFETTI_SESSION_KEY = 'golazo_argentina_confetti_seen';

const CONFETTI_PIECES = [
  { left: '4%', width: 7, height: 14, color: '#7dd3fc', delay: 0, duration: 4.4, drift: '24px', rotation: '260deg' },
  { left: '8%', width: 6, height: 12, color: '#ffffff', delay: 0.12, duration: 4.7, drift: '-18px', rotation: '-220deg' },
  { left: '12%', width: 8, height: 14, color: '#bae6fd', delay: 0.2, duration: 4.5, drift: '34px', rotation: '320deg' },
  { left: '17%', width: 5, height: 11, color: '#f8fafc', delay: 0.34, duration: 4.2, drift: '-26px', rotation: '-260deg' },
  { left: '22%', width: 7, height: 13, color: '#facc15', delay: 0.08, duration: 4.8, drift: '20px', rotation: '300deg' },
  { left: '27%', width: 6, height: 12, color: '#38bdf8', delay: 0.28, duration: 4.3, drift: '-30px', rotation: '-280deg' },
  { left: '32%', width: 8, height: 15, color: '#ffffff', delay: 0.42, duration: 4.6, drift: '18px', rotation: '240deg' },
  { left: '38%', width: 6, height: 13, color: '#93c5fd', delay: 0.16, duration: 4.7, drift: '-22px', rotation: '-320deg' },
  { left: '44%', width: 7, height: 14, color: '#e0f2fe', delay: 0.36, duration: 4.4, drift: '28px', rotation: '280deg' },
  { left: '50%', width: 5, height: 12, color: '#fef3c7', delay: 0.04, duration: 4.9, drift: '-16px', rotation: '-240deg' },
  { left: '56%', width: 8, height: 15, color: '#7dd3fc', delay: 0.22, duration: 4.5, drift: '30px', rotation: '340deg' },
  { left: '61%', width: 6, height: 12, color: '#ffffff', delay: 0.5, duration: 4.2, drift: '-28px', rotation: '-300deg' },
  { left: '66%', width: 7, height: 13, color: '#bae6fd', delay: 0.14, duration: 4.6, drift: '22px', rotation: '260deg' },
  { left: '72%', width: 6, height: 14, color: '#facc15', delay: 0.32, duration: 4.8, drift: '-18px', rotation: '-260deg' },
  { left: '78%', width: 8, height: 15, color: '#e0f2fe', delay: 0.18, duration: 4.4, drift: '26px', rotation: '320deg' },
  { left: '84%', width: 5, height: 12, color: '#ffffff', delay: 0.44, duration: 4.7, drift: '-34px', rotation: '-340deg' },
  { left: '90%', width: 7, height: 14, color: '#38bdf8', delay: 0.26, duration: 4.5, drift: '18px', rotation: '260deg' },
  { left: '95%', width: 6, height: 12, color: '#f8fafc', delay: 0.06, duration: 4.9, drift: '-24px', rotation: '-280deg' },
  { left: '15%', width: 5, height: 10, color: '#e0f2fe', delay: 0.72, duration: 4.1, drift: '38px', rotation: '300deg' },
  { left: '30%', width: 7, height: 12, color: '#ffffff', delay: 0.86, duration: 4.0, drift: '-36px', rotation: '-260deg' },
  { left: '47%', width: 6, height: 11, color: '#7dd3fc', delay: 0.68, duration: 4.2, drift: '24px', rotation: '280deg' },
  { left: '63%', width: 5, height: 10, color: '#fef3c7', delay: 0.8, duration: 4.1, drift: '-22px', rotation: '-240deg' },
  { left: '82%', width: 7, height: 12, color: '#bae6fd', delay: 0.64, duration: 4.3, drift: '30px', rotation: '320deg' },
  { left: '98%', width: 5, height: 11, color: '#ffffff', delay: 0.76, duration: 4.0, drift: '-42px', rotation: '-300deg' },
];

export function ArgentinaConfettiIntro() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const markConfettiComplete = () => {
      try {
        sessionStorage.setItem(CONFETTI_SESSION_KEY, 'complete');
      } catch {
        // Storage can be unavailable in private or embedded contexts; the effect should still be harmless.
      }
    };

    try {
      const status = sessionStorage.getItem(CONFETTI_SESSION_KEY);
      if (status === 'complete') return;
      if (status !== 'running') {
        sessionStorage.setItem(CONFETTI_SESSION_KEY, 'running');
      }
    } catch {
      // Storage can be unavailable in private or embedded contexts; the effect should still be harmless.
    }

    setIsVisible(true);
    const timeout = window.setTimeout(() => {
      setIsVisible(false);
      markConfettiComplete();
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[65] overflow-hidden"
    >
      <style>
        {`
          @keyframes golazoArgentinaConfettiFall {
            0% {
              opacity: 0;
              transform: translate3d(0, -18px, 0) rotate(0deg);
            }
            12% {
              opacity: 0.95;
            }
            100% {
              opacity: 0;
              transform: translate3d(var(--confetti-drift), 105vh, 0) rotate(var(--confetti-rotation));
            }
          }
        `}
      </style>
      {CONFETTI_PIECES.map((piece, index) => (
        <span
          key={`${piece.left}-${index}`}
          data-golazo-confetti-piece="true"
          className="absolute -top-6 rounded-[2px] shadow-sm"
          style={{
            left: piece.left,
            width: `${piece.width}px`,
            height: `${piece.height}px`,
            backgroundColor: piece.color,
            animation: `golazoArgentinaConfettiFall ${piece.duration}s cubic-bezier(0.18, 0.76, 0.36, 1) ${piece.delay}s forwards`,
            '--confetti-drift': piece.drift,
            '--confetti-rotation': piece.rotation,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
