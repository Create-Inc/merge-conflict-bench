"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatGBP } from "@/utils/revenueCalculations";
import { TrendingUp, PartyPopper, X, Volume2, VolumeX } from "lucide-react";

// Slight overshoot then settle (feels more "premium" than a plain ease).
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function playApplePaySuccessChime({ volume = 0.12, onAutoplayBlocked } = {}) {
  if (typeof window === "undefined") return { ok: false, reason: "no-window" };

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return { ok: false, reason: "no-audio-context" };

  // Best-effort: some browsers require a user gesture before audio can start.
  const ctx = new AudioCtx();

  const safeClose = () => {
    setTimeout(() => {
      try {
        ctx.close();
      } catch (_e) {
        // ignore
      }
    }, 1200);
  };

  try {
    const resumePromise =
      typeof ctx.resume === "function" ? ctx.resume() : Promise.resolve();

    resumePromise.catch(() => {
      if (typeof onAutoplayBlocked === "function") {
        onAutoplayBlocked();
      }
      safeClose();
    });

    // If the context stays suspended shortly after open, treat that as blocked.
    setTimeout(() => {
      if (ctx.state !== "running") {
        if (typeof onAutoplayBlocked === "function") {
          onAutoplayBlocked();
        }
      }
    }, 140);

    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = Math.max(0, Math.min(Number(volume) || 0.12, 0.35));
    master.connect(ctx.destination);

    // Gentle compression to keep it "premium" (no harsh peaks)
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.knee.value = 18;
    comp.ratio.value = 5;
    comp.attack.value = 0.004;
    comp.release.value = 0.14;
    comp.connect(master);

    // Small "room" using delay + lowpass feedback.
    const delay = ctx.createDelay(0.25);
    delay.delayTime.value = 0.085;

    const feedback = ctx.createGain();
    feedback.gain.value = 0.2;

    const damp = ctx.createBiquadFilter();
    damp.type = "lowpass";
    damp.frequency.value = 2200;
    damp.Q.value = 0.7;

    delay.connect(damp);
    damp.connect(feedback);
    feedback.connect(delay);

    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    delay.connect(wet);
    wet.connect(comp);

    const dry = ctx.createGain();
    dry.gain.value = 0.92;
    dry.connect(comp);

    // Soft low "tap" at the start (subtle but satisfying)
    const tapOsc = ctx.createOscillator();
    const tapGain = ctx.createGain();
    tapOsc.type = "sine";
    tapOsc.frequency.value = 92;
    tapGain.gain.setValueAtTime(0.0001, now);
    tapGain.gain.exponentialRampToValueAtTime(0.65, now + 0.01);
    tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    tapOsc.connect(tapGain);
    tapGain.connect(dry);
    tapGain.connect(delay);
    tapOsc.start(now);
    tapOsc.stop(now + 0.14);

    // Two-note "Apple-ish" chime: bright but soft. Slight detune for richness.
    const notes = [880, 1320];
    notes.forEach((freq, idx) => {
      const start = now + 0.05 + idx * 0.11;
      const end = start + 0.36;

      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      oscA.type = "sine";
      oscB.type = "triangle";
      oscA.frequency.value = freq;
      oscB.frequency.value = freq;
      oscA.detune.value = -7;
      oscB.detune.value = 6;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3500, start);
      filter.frequency.exponentialRampToValueAtTime(2200, end);
      filter.Q.value = 0.85;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(1.0, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain);
      gain.connect(dry);
      gain.connect(delay);

      oscA.start(start);
      oscB.start(start);
      oscA.stop(end);
      oscB.stop(end);
    });

    safeClose();
    return { ok: true };
  } catch (e) {
    console.error("Failed to play chime", e);
    safeClose();
    return { ok: false, reason: "exception" };
  }
}

export default function CelebrationOverlay({
  open,
  title,
  subtitle,
  revenueBefore,
  revenueAfter,
  addedMonthlyFee,
  onDone,
}) {
  const [displayRevenue, setDisplayRevenue] = useState(
    Number.isFinite(Number(revenueBefore)) ? Number(revenueBefore) : 0,
  );
  const rafRef = useRef(null);
  const startedRef = useRef(false);

  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [soundBlocked, setSoundBlocked] = useState(false);

  const safeRevenueBefore = useMemo(() => {
    const n = Number(revenueBefore);
    return Number.isFinite(n) ? n : 0;
  }, [revenueBefore]);

  const safeRevenueAfter = useMemo(() => {
    const n = Number(revenueAfter);
    return Number.isFinite(n) ? n : safeRevenueBefore;
  }, [revenueAfter, safeRevenueBefore]);

  const safeAddedMonthlyFee = useMemo(() => {
    const n = Number(addedMonthlyFee);
    return Number.isFinite(n)
      ? n
      : Math.max(safeRevenueAfter - safeRevenueBefore, 0);
  }, [addedMonthlyFee, safeRevenueAfter, safeRevenueBefore]);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const confettiPieces = useMemo(() => {
    // More pieces + bigger + brighter so it's clearly visible.
    const colors = [
      "#22C55E", // emerald
      "#3B82F6", // blue
      "#F59E0B", // amber
      "#EC4899", // pink
      "#A855F7", // purple
    ];

    const count = 220;

    return Array.from({ length: count }).map((_, idx) => {
      const left = Math.random() * 100;
      const size = 8 + Math.random() * 12;
      const delay = Math.random() * 0.2;
      const duration = 2.6 + Math.random() * 1.6;

      const drift = (Math.random() - 0.5) * 240;
      const startY = -18 - Math.random() * 26; // start above screen

      const isSparkle = idx % 9 === 0;
      const color = isSparkle ? "#FFFFFF" : colors[idx % colors.length];
      const opacity = isSparkle ? 0.9 : 1;

      const rotStart = Math.random() * 360;
      const rotEnd = rotStart + 900 + Math.random() * 540;

      // Shapes: thin rectangle, square, or ribbon
      const shape = idx % 3;
      const w = shape === 0 ? size * 0.9 : size;
      const h = shape === 0 ? size * 0.25 : shape === 1 ? size : size * 0.4;
      const radius = shape === 1 ? 3 : 9999;

      return {
        key: `confetti-${idx}`,
        left,
        w,
        h,
        radius,
        delay,
        duration,
        color,
        opacity,
        drift,
        startY,
        rotStart,
        rotEnd,
        isSparkle,
      };
    });
  }, []);

  const playSoundIfPossible = () => {
    if (!isSoundEnabled) return;
    playApplePaySuccessChime({
      volume: 0.12,
      onAutoplayBlocked: () => setSoundBlocked(true),
    });
  };

  useEffect(() => {
    if (!open) return;

    // Prevent double-play in React strict mode.
    if (!startedRef.current) {
      startedRef.current = true;
      setSoundBlocked(false);
      playSoundIfPossible();
    }

    setDisplayRevenue(safeRevenueBefore);

    const start = performance.now();
    const durationMs = 1700;

    const tick = (now) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = t < 0.86 ? easeOutBack(t / 0.86) : 1;
      const next =
        safeRevenueBefore + (safeRevenueAfter - safeRevenueBefore) * eased;

      setDisplayRevenue(next);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayRevenue(safeRevenueAfter);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    const autoClose = setTimeout(() => {
      if (typeof onDone === "function") onDone();
    }, 3800);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(autoClose);
    };
  }, [open, onDone, safeRevenueAfter, safeRevenueBefore, isSoundEnabled]);

  useEffect(() => {
    if (open) return;
    startedRef.current = false;
  }, [open]);

  if (!open) return null;

  const displayed = Math.round(displayRevenue);
  const yearlyRunRate = displayed * 12;

  const finalRevenue = Math.round(safeRevenueAfter);
  const finalYearly = finalRevenue * 12;

  const headerTitle = title || "Client added";
  const headerSubtitle = subtitle || "Nice work — that one counts.";

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={() => (typeof onDone === "function" ? onDone() : null)}
        role="button"
        tabIndex={-1}
        aria-label="Close celebration"
      />

      {/* Confetti */}
      {prefersReducedMotion ? null : (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confettiPieces.map((p) => {
            const style = {
              left: `${p.left}%`,
              width: `${p.w}px`,
              height: `${p.h}px`,
              borderRadius: `${p.radius}px`,
              backgroundColor: p.color,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--confetti-drift": `${p.drift}px`,
              "--confetti-start-y": `${p.startY}vh`,
              "--confetti-rot-start": `${p.rotStart}deg`,
              "--confetti-rot-end": `${p.rotEnd}deg`,
            };

            const className = p.isSparkle
              ? "celebrate-confetti celebrate-confetti-sparkle"
              : "celebrate-confetti";

            return <div key={p.key} className={className} style={style} />;
          })}
        </div>
      )}

      {/* Card */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 p-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <PartyPopper className="h-5 w-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-gray-900 truncate">
                    {headerTitle}
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5 truncate">
                    {headerSubtitle}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                onClick={() => setIsSoundEnabled((v) => !v)}
                aria-label={isSoundEnabled ? "Mute sound" : "Unmute sound"}
                title={isSoundEnabled ? "Mute" : "Unmute"}
              >
                {isSoundEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </button>

              <button
                type="button"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                onClick={() => (typeof onDone === "function" ? onDone() : null)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-6 pb-6">
            {soundBlocked && isSoundEnabled ? (
              <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
                <div className="text-xs text-gray-600">
                  Sound is blocked by your browser.
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800"
                  onClick={() => {
                    setSoundBlocked(false);
                    playSoundIfPossible();
                  }}
                >
                  Play sound
                </button>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-semibold text-gray-600">Added</div>
                <div className="mt-1 text-lg font-semibold text-emerald-700 tabular-nums">
                  {formatGBP(safeAddedMonthlyFee)}/mo
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-gray-600">
                    Revenue pipeline (monthly)
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <TrendingUp className="h-4 w-4" />
                    <span className="tabular-nums">
                      {formatGBP(finalRevenue)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-baseline justify-between gap-4">
                  <div className="celebrate-number text-3xl sm:text-4xl font-semibold text-gray-900 tabular-nums">
                    {formatGBP(displayed)}
                    <span className="text-sm font-medium text-gray-500">/mo</span>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold text-gray-600">
                      Run-rate
                    </div>
                    <div className="mt-1 text-lg font-semibold text-gray-900 tabular-nums">
                      {formatGBP(yearlyRunRate)}/yr
                    </div>
                    <div className="text-xs text-gray-500 tabular-nums">
                      final {formatGBP(finalYearly)}/yr
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Tip: This is based on your Active clients' monthly fees.
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          .celebrate-confetti {
            display: none !important;
          }
          .celebrate-number {
            animation: none !important;
          }
        }

        @keyframes celebrateConfettiFall {
          0% {
            transform: translate3d(0, var(--confetti-start-y), 0)
              rotate(var(--confetti-rot-start));
            opacity: 0;
          }
          6% {
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--confetti-drift), 112vh, 0)
              rotate(var(--confetti-rot-end));
            opacity: 0;
          }
        }

        .celebrate-confetti {
          position: absolute;
          top: 0;
          animation-name: celebrateConfettiFall;
          animation-timing-function: cubic-bezier(0.14, 0.72, 0.18, 1);
          animation-iteration-count: 1;
          will-change: transform, opacity;
          filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.22));
        }

        .celebrate-confetti-sparkle {
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.9),
            0 0 18px rgba(255, 255, 255, 0.65);
          mix-blend-mode: screen;
        }

        @keyframes celebrateNumberPulse {
          0% {
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          35% {
            transform: translateY(-2px) scale(1.01);
            filter: blur(0.2px);
          }
          100% {
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }

        .celebrate-number {
          animation: celebrateNumberPulse 520ms ease-out;
          text-shadow: 0 12px 26px rgba(0, 0, 0, 0.14);
        }
      `}</style>
    </div>
  );
}
