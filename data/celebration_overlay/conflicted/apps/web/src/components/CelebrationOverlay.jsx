"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatGBP } from "@/utils/revenueCalculations";
import { TrendingUp, PartyPopper, X, Volume2, VolumeX } from "lucide-react";

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

<<<<<<< ours
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function playApplePaySuccessChime({ volume = 0.12, onAutoplayBlocked } = {}) {
  if (typeof window === "undefined") return { ok: false, reason: "no-window" };

=======
// Slight overshoot then settle (feels more "premium" than a plain ease).
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function playChime() {
  if (typeof window === "undefined") return;
>>>>>>> theirs
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return { ok: false, reason: "no-audio-context" };

<<<<<<< ours
  // Note: some browsers require a user gesture. We'll attempt anyway.
=======
  // A warmer, more "premium" bell-like chime.
  // Note: some browsers require a user gesture before audio can start; this is best-effort.
>>>>>>> theirs
  const ctx = new AudioCtx();
<<<<<<< ours

=======

  const master = ctx.createGain();
  master.gain.value = 0.12;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -22;
  compressor.knee.value = 18;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.18;

  // Simple "room" using a delay + lowpass feedback (not true reverb, but much nicer than dry).
  const delay = ctx.createDelay(0.35);
  delay.delayTime.value = 0.085;

  const feedback = ctx.createGain();
  feedback.gain.value = 0.23;

  const damp = ctx.createBiquadFilter();
  damp.type = "lowpass";
  damp.frequency.value = 2600;
  damp.Q.value = 0.7;

  // wet path: delay -> damp -> feedback -> delay
  delay.connect(damp);
  damp.connect(feedback);
  feedback.connect(delay);

  // mix: dry + wet -> compressor -> master -> destination
  const wet = ctx.createGain();
  wet.gain.value = 0.18;
  delay.connect(wet);

  const mix = ctx.createGain();
  mix.gain.value = 1;

  wet.connect(mix);
  mix.connect(compressor);
  compressor.connect(master);
  master.connect(ctx.destination);
>>>>>>> theirs

<<<<<<< ours
  const safeClose = () => {
    setTimeout(() => {
      try {
        ctx.close();
      } catch (_e) {
        // ignore
      }
    }, 1100);
  };
=======
  const now = ctx.currentTime;
>>>>>>> theirs

<<<<<<< ours
  try {
    // If suspended, try to resume. If this fails, consider it blocked.
    const resumePromise =
      typeof ctx.resume === "function" ? ctx.resume() : Promise.resolve();
=======
  const scheduleBell = (frequency, startTime, duration, brightness) => {
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const gain = ctx.createGain();
>>>>>>> theirs

<<<<<<< ours
    // If resume rejects, we're definitely blocked.
    resumePromise.catch(() => {
      if (typeof onAutoplayBlocked === "function") {
        onAutoplayBlocked();
      }
      safeClose();
    });
=======
    // Two slightly detuned sines reads as "bell" instead of "old computer".
    oscA.type = "sine";
    oscB.type = "sine";
>>>>>>> theirs

<<<<<<< ours
    // If the context stays suspended shortly after open, treat that as blocked.
    setTimeout(() => {
      if (ctx.state !== "running") {
        if (typeof onAutoplayBlocked === "function") {
          onAutoplayBlocked();
        }
      }
    }, 120);
=======
    oscA.frequency.setValueAtTime(frequency, startTime);
    oscB.frequency.setValueAtTime(frequency * 1.006, startTime);
>>>>>>> theirs

<<<<<<< ours
    const now = ctx.currentTime;
=======
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800 + brightness * 2400, startTime);
    filter.Q.setValueAtTime(0.8, startTime);
>>>>>>> theirs

<<<<<<< ours
    const master = ctx.createGain();
    master.gain.value = Math.max(0, Math.min(volume, 0.35));
    master.connect(ctx.destination);
=======
    // ADSR-ish envelope
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.95, startTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
>>>>>>> theirs

<<<<<<< ours
    // Gentle compression to keep it "premium" (no harsh peaks)
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.knee.value = 18;
    comp.ratio.value = 6;
    comp.attack.value = 0.004;
    comp.release.value = 0.14;
    comp.connect(master);
=======
    // route
    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
>>>>>>> theirs

<<<<<<< ours
    // Small "room" using delay + lowpass feedback.
    const delay = ctx.createDelay(0.25);
    delay.delayTime.value = 0.08;

    const feedback = ctx.createGain();
    feedback.gain.value = 0.18;

    const damp = ctx.createBiquadFilter();
    damp.type = "lowpass";
    damp.frequency.value = 1800;
    damp.Q.value = 0.7;

    delay.connect(damp);
    damp.connect(feedback);
    feedback.connect(delay);

    // Mix a little of the delay back into the compressor.
    const wet = ctx.createGain();
    wet.gain.value = 0.25;
    delay.connect(wet);
    wet.connect(comp);

    // Dry path
    const dry = ctx.createGain();
    dry.gain.value = 0.92;
    dry.connect(comp);

    // A soft low "tap" at the start (feels like Apple Pay's subtle hit)
    const tapOsc = ctx.createOscillator();
    const tapGain = ctx.createGain();
    tapOsc.type = "sine";
    tapOsc.frequency.value = 110;
    tapGain.gain.setValueAtTime(0.0001, now);
    tapGain.gain.exponentialRampToValueAtTime(0.55, now + 0.01);
    tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    tapOsc.connect(tapGain);
    tapGain.connect(dry);
    tapGain.connect(delay);
    tapOsc.start(now);
    tapOsc.stop(now + 0.08);

    // Two-note "Apple-ish" chime: bright but soft. Slight detune for richness.
    const notes = [880, 1320];
    notes.forEach((freq, idx) => {
      const start = now + 0.05 + idx * 0.11;
      const end = start + 0.34;

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
      filter.frequency.setValueAtTime(3400, start);
      filter.frequency.exponentialRampToValueAtTime(2100, end);
      filter.Q.value = 0.8;

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
=======
    // dry
    gain.connect(mix);
    // wet
    gain.connect(delay);

    oscA.start(startTime);
    oscB.start(startTime);
    oscA.stop(startTime + duration);
    oscB.stop(startTime + duration);
  };

  // Gentle low "thump" (adds satisfaction, still subtle)
  const thumpOsc = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thumpOsc.type = "sine";
  thumpOsc.frequency.setValueAtTime(92, now);
  thumpGain.gain.setValueAtTime(0.0001, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.7, now + 0.01);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  thumpOsc.connect(thumpGain);
  thumpGain.connect(compressor);
  thumpOsc.start(now);
  thumpOsc.stop(now + 0.14);

  // A modern "success" triad (C major), slightly staggered.
  scheduleBell(523.25, now + 0.02, 0.55, 0.55); // C5
  scheduleBell(659.25, now + 0.09, 0.52, 0.65); // E5
  scheduleBell(783.99, now + 0.16, 0.58, 0.75); // G5

  // Best-effort cleanup
  setTimeout(() => {
    try {
      ctx.close();
    } catch (_e) {
      // ignore
    }
  }, 1100);
>>>>>>> theirs
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

  const confettiPieces = useMemo(() => {
    // Build once per mount so pieces don't reshuffle while it's open.
<<<<<<< ours
    const colors = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#A855F7"];
    const count = 220;
=======
    // More pieces + bigger + brighter so it's clearly visible.
    const colors = [
      "#22C55E", // emerald
      "#3B82F6", // blue
      "#F59E0B", // amber
      "#EC4899", // pink
      "#A855F7", // purple
      "#FFFFFF", // white sparkle
    ];
>>>>>>> theirs

    const count = 180;

    return Array.from({ length: count }).map((_, idx) => {
      const left = Math.random() * 100;
<<<<<<< ours
      const size = 8 + Math.random() * 10;
      const delay = Math.random() * 0.18;
      const duration = 2.8 + Math.random() * 1.4;
=======
      const size = 8 + Math.random() * 12;
      const delay = Math.random() * 0.25;
      const duration = 2.2 + Math.random() * 1.6;
      const rotate = Math.random() * 360;
      const color = colors[idx % colors.length];
      const drift = (Math.random() - 0.5) * 220;
      const startY = -18 - Math.random() * 22; // start above screen
      const isSparkle = idx % 9 === 0;
>>>>>>> theirs

      const isSparkle = idx % 9 === 0;
      const baseColor = colors[idx % colors.length];
      const color = isSparkle ? "#FFFFFF" : baseColor;
      const opacity = isSparkle ? 0.85 : 1;

      const drift = (Math.random() - 0.5) * 220;
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
<<<<<<< ours
        rotStart,
        rotEnd,
        blur: isSparkle ? 0.5 : 0,
        glow: isSparkle ? 10 : 0,
=======
        startY,
        isSparkle,
>>>>>>> theirs
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
<<<<<<< ours
    const durationMs = 1550;
=======
    const durationMs = 1700;
>>>>>>> theirs

    const tick = (now) => {
      const t = Math.min((now - start) / durationMs, 1);
<<<<<<< ours
      const eased = easeOutExpo(t);
=======
      const eased = t < 0.86 ? easeOutBack(t / 0.86) : 1;
>>>>>>> theirs
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
<<<<<<< ours
    }, 3600);
=======
    }, 3800);
>>>>>>> theirs

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(autoClose);
    };
  }, [open, onDone, safeRevenueAfter, safeRevenueBefore, isSoundEnabled]);

  // Reset strict-mode guard when fully closed
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

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
<<<<<<< ours
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
              "--confetti-rot-start": `${p.rotStart}deg`,
              "--confetti-rot-end": `${p.rotEnd}deg`,
              "--confetti-blur": `${p.blur}px`,
              "--confetti-glow": `${p.glow}px`,
            };
=======
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map((p) => {
          const heightPx = Math.max(6, p.size * 0.55);
          const baseStyle = {
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${heightPx}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
            "--confetti-drift": `${p.drift}px`,
            "--confetti-start-y": `${p.startY}vh`,
          };
>>>>>>> theirs

<<<<<<< ours
            return (
              <div key={p.key} className="celebrate-confetti" style={style} />
            );
          })}
        </div>
      )}
=======
          const className = p.isSparkle
            ? "celebrate-confetti celebrate-confetti-sparkle"
            : "celebrate-confetti";

          return <div key={p.key} className={className} style={baseStyle} />;
        })}
      </div>
>>>>>>> theirs

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
                    <span className="text-sm font-medium text-gray-500">
                      /mo
                    </span>
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
<<<<<<< ours
            transform: translate3d(0, -18vh, 0) rotate(var(--confetti-rot-start));
=======
            transform: translate3d(0, var(--confetti-start-y), 0) rotate(0deg);
>>>>>>> theirs
            opacity: 0;
          }
          6% {
            opacity: 1;
          }
          100% {
<<<<<<< ours
            transform: translate3d(var(--confetti-drift), 112vh, 0)
              rotate(var(--confetti-rot-end));
=======
            transform: translate3d(
                var(--confetti-drift),
                112vh,
                0
              )
              rotate(860deg);
>>>>>>> theirs
            opacity: 0;
          }
        }

        .celebrate-confetti {
          position: absolute;
          top: -10vh;
          animation-name: celebrateConfettiFall;
<<<<<<< ours
          animation-timing-function: cubic-bezier(0.18, 0.8, 0.2, 1);
=======
          animation-timing-function: cubic-bezier(0.14, 0.72, 0.18, 1);
>>>>>>> theirs
          animation-iteration-count: 1;
          will-change: transform, opacity;
<<<<<<< ours
          filter: blur(var(--confetti-blur))
            drop-shadow(0 10px 18px rgba(0, 0, 0, 0.18));
          box-shadow: 0 0 var(--confetti-glow) rgba(255, 255, 255, 0.55);
          mix-blend-mode: screen;
=======
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.28));
>>>>>>> theirs
        }

        .celebrate-confetti-sparkle {
          box-shadow:
            0 0 10px rgba(255, 255, 255, 0.9),
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
<<<<<<< ours
          animation: celebrateNumberPulse 520ms ease-out;
          text-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
=======
          animation: celebrateNumberPulse 520ms ease-out;
          text-shadow: 0 12px 26px rgba(0, 0, 0, 0.14);
>>>>>>> theirs
        }

        @media (prefers-reduced-motion: reduce) {
          .celebrate-confetti {
            display: none;
          }

          .celebrate-number {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
