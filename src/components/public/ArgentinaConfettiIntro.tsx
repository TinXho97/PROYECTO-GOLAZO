import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

const CONFETTI_PIECES = [
  { left: '4%', width: 7, height: 14, color: '#74ACDF', delay: 0, duration: 4.4, drift: '24px', rotation: '260deg' },
  { left: '8%', width: 6, height: 12, color: '#FFFFFF', delay: 0.12, duration: 4.7, drift: '-18px', rotation: '-220deg' },
  { left: '12%', width: 8, height: 14, color: '#DDF3FF', delay: 0.2, duration: 4.5, drift: '34px', rotation: '320deg' },
  { left: '17%', width: 5, height: 11, color: '#FFFFFF', delay: 0.34, duration: 4.2, drift: '-26px', rotation: '-260deg' },
  { left: '22%', width: 7, height: 13, color: '#F6C453', delay: 0.08, duration: 4.8, drift: '20px', rotation: '300deg' },
  { left: '27%', width: 6, height: 12, color: '#74ACDF', delay: 0.28, duration: 4.3, drift: '-30px', rotation: '-280deg' },
  { left: '32%', width: 8, height: 15, color: '#FFFFFF', delay: 0.42, duration: 4.6, drift: '18px', rotation: '240deg' },
  { left: '38%', width: 6, height: 13, color: '#DDF3FF', delay: 0.16, duration: 4.7, drift: '-22px', rotation: '-320deg' },
  { left: '44%', width: 7, height: 14, color: '#74ACDF', delay: 0.36, duration: 4.4, drift: '28px', rotation: '280deg' },
  { left: '50%', width: 5, height: 12, color: '#FFE49A', delay: 0.04, duration: 4.9, drift: '-16px', rotation: '-240deg' },
  { left: '56%', width: 8, height: 15, color: '#74ACDF', delay: 0.22, duration: 4.5, drift: '30px', rotation: '340deg' },
  { left: '61%', width: 6, height: 12, color: '#FFFFFF', delay: 0.5, duration: 4.2, drift: '-28px', rotation: '-300deg' },
  { left: '66%', width: 7, height: 13, color: '#DDF3FF', delay: 0.14, duration: 4.6, drift: '22px', rotation: '260deg' },
  { left: '72%', width: 6, height: 14, color: '#F6C453', delay: 0.32, duration: 4.8, drift: '-18px', rotation: '-260deg' },
  { left: '78%', width: 8, height: 15, color: '#DDF3FF', delay: 0.18, duration: 4.4, drift: '26px', rotation: '320deg' },
  { left: '84%', width: 5, height: 12, color: '#FFFFFF', delay: 0.44, duration: 4.7, drift: '-34px', rotation: '-340deg' },
  { left: '90%', width: 7, height: 14, color: '#74ACDF', delay: 0.26, duration: 4.5, drift: '18px', rotation: '260deg' },
  { left: '95%', width: 6, height: 12, color: '#FFFFFF', delay: 0.06, duration: 4.9, drift: '-24px', rotation: '-280deg' },
  { left: '15%', width: 5, height: 10, color: '#DDF3FF', delay: 0.72, duration: 4.1, drift: '38px', rotation: '300deg' },
  { left: '30%', width: 7, height: 12, color: '#FFFFFF', delay: 0.86, duration: 4.0, drift: '-36px', rotation: '-260deg' },
  { left: '47%', width: 6, height: 11, color: '#74ACDF', delay: 0.68, duration: 4.2, drift: '24px', rotation: '280deg' },
  { left: '63%', width: 5, height: 10, color: '#FFE49A', delay: 0.8, duration: 4.1, drift: '-22px', rotation: '-240deg' },
  { left: '82%', width: 7, height: 12, color: '#DDF3FF', delay: 0.64, duration: 4.3, drift: '30px', rotation: '320deg' },
  { left: '98%', width: 5, height: 11, color: '#FFFFFF', delay: 0.76, duration: 4.0, drift: '-42px', rotation: '-300deg' },
];

export function ArgentinaConfettiIntro() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    setIsVisible(true);
    const timeout = window.setTimeout(() => {
      setIsVisible(false);
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

          @keyframes golazoArgentinaIntroPanel {
            0% {
              opacity: 0;
              transform: translate3d(0, 12px, 0) scale(0.96);
            }
            14% {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
            84% {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate3d(0, -10px, 0) scale(0.985);
            }
          }

          @keyframes golazoArgentinaRibbon {
            0% {
              opacity: 0;
              transform: scaleX(0.72);
            }
            18%, 86% {
              opacity: 1;
              transform: scaleX(1);
            }
            100% {
              opacity: 0;
              transform: scaleX(0.86);
            }
          }
        `}
      </style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(116,172,223,0.18),transparent_30%),linear-gradient(180deg,rgba(8,26,51,0.04)_0%,rgba(8,26,51,0.18)_100%)]" />

      <div className="absolute left-1/2 top-10 w-[min(680px,88vw)] -translate-x-1/2" style={{ animation: 'golazoArgentinaRibbon 4.8s ease-out forwards' }}>
        <div className="grid h-3 grid-cols-[1fr_0.7fr_1fr] overflow-hidden rounded-full shadow-[0_0_24px_rgba(116,172,223,0.22)]">
          <div className="bg-[#74ACDF]" />
          <div className="bg-white" />
          <div className="bg-[#74ACDF]" />
        </div>
      </div>

      <div
        className="absolute left-1/2 top-24 w-[min(560px,88vw)] -translate-x-1/2 rounded-[32px] border border-[#74ACDF]/45 bg-[#081A33]/64 px-5 py-5 text-center text-white shadow-[0_24px_90px_rgba(8,26,51,0.34),0_0_44px_rgba(116,172,223,0.16)] backdrop-blur-xl sm:px-8"
        style={{ animation: 'golazoArgentinaIntroPanel 4.9s ease-out forwards' }}
      >
        <div className="mb-3 flex items-center justify-center gap-2 text-[#F6C453] drop-shadow-[0_0_14px_rgba(246,196,83,0.52)]">
          <span className="text-xl leading-none">★</span>
          <span className="text-2xl leading-none">★</span>
          <span className="text-xl leading-none">★</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#DDF3FF]">
          ARGENTINA VIVE EL MUNDIAL
        </p>
        <p className="mt-2 text-lg font-black leading-tight tracking-[-0.03em] text-white sm:text-2xl">
          Reservá tu cancha y viví cada partido
        </p>
      </div>

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
