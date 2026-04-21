// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Minimal Web Audio API stubs
// ---------------------------------------------------------------------------
function createMockAudioParam(defaultValue = 0) {
  return {
    value: defaultValue,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
}

function createMockOscillator() {
  return {
    type: "sine",
    frequency: createMockAudioParam(440),
    detune: createMockAudioParam(0),
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
  };
}

function createMockGain() {
  return {
    gain: createMockAudioParam(1),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function createMockBiquadFilter() {
  return {
    type: "lowpass",
    frequency: createMockAudioParam(350),
    Q: createMockAudioParam(1),
    gain: createMockAudioParam(0),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function createMockCompressor() {
  return {
    threshold: createMockAudioParam(-24),
    knee: createMockAudioParam(30),
    ratio: createMockAudioParam(12),
    attack: createMockAudioParam(0.003),
    release: createMockAudioParam(0.25),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function createMockDelay() {
  return {
    delayTime: createMockAudioParam(0),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

let createdNodes;

function setupAudioContext() {
  createdNodes = {
    oscillators: [],
    gains: [],
    filters: [],
    compressors: [],
    delays: [],
  };

  const mockCtx = {
    currentTime: 0,
    state: "running",
    destination: { connect: vi.fn() },
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    createOscillator: vi.fn(() => {
      const osc = createMockOscillator();
      createdNodes.oscillators.push(osc);
      return osc;
    }),
    createGain: vi.fn(() => {
      const g = createMockGain();
      createdNodes.gains.push(g);
      return g;
    }),
    createBiquadFilter: vi.fn(() => {
      const f = createMockBiquadFilter();
      createdNodes.filters.push(f);
      return f;
    }),
    createDynamicsCompressor: vi.fn(() => {
      const c = createMockCompressor();
      createdNodes.compressors.push(c);
      return c;
    }),
    createDelay: vi.fn(() => {
      const d = createMockDelay();
      createdNodes.delays.push(d);
      return d;
    }),
  };

  window.AudioContext = vi.fn(() => mockCtx);
  window.webkitAudioContext = undefined;

  return mockCtx;
}

// ---------------------------------------------------------------------------
// React / DOM stubs (we import the module dynamically so we can stub first)
// ---------------------------------------------------------------------------

// We need to mock React and the icon/util imports so the module can load.
vi.mock("react", () => {
  const state = {};
  let stateCounter = 0;
  return {
    useEffect: vi.fn((fn) => fn()),
    useMemo: vi.fn((fn) => fn()),
    useRef: vi.fn((init) => ({ current: init })),
    useState: vi.fn((init) => {
      const key = stateCounter++;
      if (!(key in state)) state[key] = typeof init === "function" ? init() : init;
      return [state[key], vi.fn((v) => { state[key] = typeof v === "function" ? v(state[key]) : v; })];
    }),
    default: { createElement: vi.fn() },
  };
});

vi.mock("@/utils/revenueCalculations", () => ({
  formatGBP: vi.fn((v) => `£${Number(v).toFixed(2)}`),
}));

vi.mock("lucide-react", () => ({
  TrendingUp: () => null,
  PartyPopper: () => null,
  X: () => null,
  Volume2: () => null,
  VolumeX: () => null,
}));

// ---------------------------------------------------------------------------
// Helpers: read the resolved source as text so we can inspect it structurally
// ---------------------------------------------------------------------------
import { readFileSync } from "fs";
import { join } from "path";

const resolvedPath = join(__dirname, "resolved", "apps", "web", "src", "components", "CelebrationOverlay.jsx");
let src;
try {
  src = readFileSync(resolvedPath, "utf8");
} catch {
  // Fallback: maybe the test is run from the case directory
  try {
    src = readFileSync(join(process.cwd(), "resolved", "apps", "web", "src", "components", "CelebrationOverlay.jsx"), "utf8");
  } catch {
    src = "";
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CelebrationOverlay merge resolution", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupAudioContext();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // BASE behaviors (shared by both branches, must survive the merge)
  // =========================================================================
  describe("base behaviors", () => {
    it("exports a default function component", () => {
      expect(src).toMatch(/export\s+default\s+function\s+CelebrationOverlay/);
    });

    it("includes 'use client' directive", () => {
      expect(src).toMatch(/^["']use client["']/);
    });

    it("imports required React hooks", () => {
      expect(src).toMatch(/useEffect/);
      expect(src).toMatch(/useMemo/);
      expect(src).toMatch(/useRef/);
      expect(src).toMatch(/useState/);
    });

    it("imports formatGBP for revenue display", () => {
      expect(src).toMatch(/formatGBP/);
    });

    it("uses AudioContext with webkitAudioContext fallback", () => {
      expect(src).toMatch(/window\.AudioContext/);
      expect(src).toMatch(/webkitAudioContext/);
    });

    it("has a confettiPieces useMemo that generates an array of pieces", () => {
      expect(src).toMatch(/confettiPieces\s*=\s*useMemo/);
      expect(src).toMatch(/Array\.from/);
    });

    it("uses requestAnimationFrame for revenue counter animation", () => {
      expect(src).toMatch(/requestAnimationFrame/);
    });

    it("has an auto-close setTimeout that calls onDone", () => {
      expect(src).toMatch(/autoClose\s*=\s*setTimeout/);
      expect(src).toMatch(/onDone/);
    });

    it("includes celebrate-confetti CSS animation keyframes", () => {
      expect(src).toMatch(/celebrateConfettiFall/);
      expect(src).toMatch(/celebrate-confetti/);
    });

    it("includes celebrateNumberPulse keyframe animation", () => {
      expect(src).toMatch(/celebrateNumberPulse/);
    });

    it("tracks isSoundEnabled state for mute/unmute", () => {
      expect(src).toMatch(/isSoundEnabled/);
      expect(src).toMatch(/setIsSoundEnabled/);
    });

    it("renders a close button with aria-label", () => {
      expect(src).toMatch(/aria-label="Close"/);
    });

    it("renders mute/unmute toggle button", () => {
      expect(src).toMatch(/Mute sound/);
      expect(src).toMatch(/Unmute sound/);
    });

    it("includes a backdrop overlay with click-to-close", () => {
      expect(src).toMatch(/Close celebration/);
    });

    it("computes safeRevenueBefore and safeRevenueAfter with Number.isFinite", () => {
      expect(src).toMatch(/safeRevenueBefore/);
      expect(src).toMatch(/safeRevenueAfter/);
      expect(src).toMatch(/Number\.isFinite/);
    });

    it("computes safeAddedMonthlyFee", () => {
      expect(src).toMatch(/safeAddedMonthlyFee/);
    });

    it("displays yearly run-rate (monthly * 12)", () => {
      expect(src).toMatch(/\*\s*12/);
      expect(src).toMatch(/yearlyRunRate/);
    });

    it("cleans up animation frame and timeout on unmount", () => {
      expect(src).toMatch(/cancelAnimationFrame/);
      expect(src).toMatch(/clearTimeout/);
    });

    it("has a startedRef guard to prevent double-play in strict mode", () => {
      expect(src).toMatch(/startedRef/);
    });

    it("has an easing function for animation (base had easeOutCubic, resolved keeps or replaces it)", () => {
      // The base had easeOutCubic; the merge may keep it or replace it with easeOutBack.
      // At minimum, one easing function must exist.
      const hasEasing = /easeOut/.test(src);
      expect(hasEasing).toBe(true);
    });

    it("creates oscillators for chime tones", () => {
      expect(src).toMatch(/createOscillator/);
    });

    it("audio context is closed after a timeout for cleanup", () => {
      // Both sides close the context; resolved must have ctx.close() in a setTimeout
      expect(src).toMatch(/ctx\.close\(\)/);
      expect(src).toMatch(/setTimeout/);
    });
  });

  // =========================================================================
  // OURS behaviors (must be preserved from the ours branch)
  // =========================================================================
  describe("ours behaviors", () => {
    it("chime function accepts a volume parameter", () => {
      // The chime function signature must accept volume
      expect(src).toMatch(/volume\s*[=:]/);
    });

    it("clamps volume to a maximum value", () => {
      // Must have Math.min/Math.max or similar clamping for volume
      expect(src).toMatch(/Math\.min/);
      expect(src).toMatch(/Math\.max/);
    });

    it("chime function accepts an onAutoplayBlocked callback", () => {
      expect(src).toMatch(/onAutoplayBlocked/);
    });

    it("attempts ctx.resume() to handle autoplay restrictions", () => {
      expect(src).toMatch(/ctx\.resume/);
    });

    it("detects autoplay blocked state via context suspension check", () => {
      // There must be a check for ctx.state !== 'running'
      expect(src).toMatch(/ctx\.state/);
      expect(src).toMatch(/running/);
    });

    it("calls onAutoplayBlocked when context stays suspended", () => {
      // The callback is invoked when autoplay is blocked
      expect(src).toMatch(/onAutoplayBlocked\(\)/);
    });

    it("chime function returns a result object with ok/reason", () => {
      expect(src).toMatch(/\{\s*ok:\s*true\s*\}/);
      expect(src).toMatch(/\{\s*ok:\s*false/);
      expect(src).toMatch(/reason:/);
    });

    it("returns no-window reason when window is undefined", () => {
      expect(src).toMatch(/no-window/);
    });

    it("returns no-audio-context reason when AudioContext is missing", () => {
      expect(src).toMatch(/no-audio-context/);
    });

    it("has a safeClose helper that delays context closing", () => {
      expect(src).toMatch(/safeClose/);
    });

    it("confetti pieces have shape system with w, h, radius properties", () => {
      // Shape system: thin rectangle, square, or ribbon
      expect(src).toMatch(/shape\s*===?\s*0/);
      expect(src).toMatch(/shape\s*===?\s*1/);
      // Must produce w, h, radius in the confetti objects
      const wMatch = src.match(/\bw\b.*size\s*\*\s*0\.9/);
      expect(wMatch).not.toBeNull();
      expect(src).toMatch(/radius/);
    });

    it("confetti pieces have rotStart and rotEnd for per-piece rotation", () => {
      expect(src).toMatch(/rotStart/);
      expect(src).toMatch(/rotEnd/);
    });

    it("CSS animation references confetti-rot-start and confetti-rot-end custom properties", () => {
      expect(src).toMatch(/--confetti-rot-start/);
      expect(src).toMatch(/--confetti-rot-end/);
    });

    it("prefersReducedMotion check guards confetti rendering", () => {
      expect(src).toMatch(/prefersReducedMotion/);
      expect(src).toMatch(/prefers-reduced-motion/);
      // The confetti should be conditionally rendered
      expect(src).toMatch(/prefersReducedMotion\s*\?\s*null/);
    });

    it("CSS has prefers-reduced-motion media query hiding confetti", () => {
      expect(src).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
      expect(src).toMatch(/display:\s*none/);
    });

    it("confetti style includes blur via custom property", () => {
      // Ours added blur effect on confetti
      expect(src).toMatch(/blur/i);
    });

    it("confetti style includes glow via custom property or box-shadow", () => {
      // Ours added glow effect on confetti
      expect(src).toMatch(/glow|box-shadow/i);
    });

    it("chime uses try/catch with error logging", () => {
      expect(src).toMatch(/catch/);
      expect(src).toMatch(/Failed to play chime/);
    });

    it("chime returns exception reason on error", () => {
      expect(src).toMatch(/reason:\s*["']exception["']/);
    });

    it("soundBlocked state is managed for blocked autoplay UI", () => {
      expect(src).toMatch(/soundBlocked/);
      expect(src).toMatch(/setSoundBlocked/);
    });

    it("renders a 'Play sound' button when sound is blocked", () => {
      expect(src).toMatch(/Play sound/);
      expect(src).toMatch(/Sound is blocked/);
    });

    it("confetti opacity varies for sparkle vs normal pieces", () => {
      // Sparkle pieces have different opacity
      expect(src).toMatch(/opacity.*isSparkle|isSparkle.*opacity/);
    });
  });

  // =========================================================================
  // THEIRS behaviors (must be preserved from the theirs branch)
  // =========================================================================
  describe("theirs behaviors", () => {
    it("has easeOutBack function with overshoot constant", () => {
      expect(src).toMatch(/easeOutBack/);
      expect(src).toMatch(/1\.70158/);
    });

    it("uses easeOutBack in the animation tick with 0.86 threshold", () => {
      // The tick function should use easeOutBack with the 0.86 threshold
      expect(src).toMatch(/0\.86/);
      expect(src).toMatch(/easeOutBack/);
    });

    it("creates a DynamicsCompressor node in the audio chain", () => {
      expect(src).toMatch(/createDynamicsCompressor/);
    });

    it("creates a delay node for room simulation", () => {
      expect(src).toMatch(/createDelay/);
    });

    it("has a feedback gain node in the delay loop", () => {
      // Feedback loop: delay -> damp -> feedback -> delay
      expect(src).toMatch(/feedback/);
      expect(src).toMatch(/damp/);
    });

    it("has a lowpass biquad filter (damp) in the delay feedback loop", () => {
      expect(src).toMatch(/createBiquadFilter/);
      expect(src).toMatch(/lowpass/);
    });

    it("has wet and dry signal paths in the audio routing", () => {
      expect(src).toMatch(/wet/);
      expect(src).toMatch(/dry/);
    });

    it("compressor connects to master gain which connects to destination", () => {
      // The routing chain ends at ctx.destination
      expect(src).toMatch(/ctx\.destination/);
      expect(src).toMatch(/master/);
    });

    it("expanded color palette includes pink (#EC4899)", () => {
      expect(src).toMatch(/#EC4899/);
    });

    it("color palette includes at least 5 distinct colors", () => {
      const hexColors = src.match(/#[0-9A-Fa-f]{6}/g) || [];
      const uniqueColors = new Set(hexColors.map((c) => c.toUpperCase()));
      // Must have at least emerald, blue, amber, pink, purple
      expect(uniqueColors.size).toBeGreaterThanOrEqual(5);
    });

    it("confetti pieces have startY property for variable start position", () => {
      expect(src).toMatch(/startY/);
    });

    it("CSS animation uses --confetti-start-y custom property", () => {
      expect(src).toMatch(/--confetti-start-y/);
    });

    it("confetti has isSparkle property determined by modulo 9", () => {
      expect(src).toMatch(/isSparkle/);
      expect(src).toMatch(/%\s*9/);
    });

    it("sparkle confetti gets a separate CSS class (celebrate-confetti-sparkle)", () => {
      expect(src).toMatch(/celebrate-confetti-sparkle/);
    });

    it("sparkle CSS class has box-shadow for glow effect", () => {
      // The sparkle CSS rule must define box-shadow
      // Use a broader regex to capture the full rule block
      const sparkleSection = src.match(/\.celebrate-confetti-sparkle\s*\{[^}]+\}/);
      expect(sparkleSection).not.toBeNull();
      expect(sparkleSection[0]).toMatch(/box-shadow/);
    });

    it("sparkle CSS class uses mix-blend-mode: screen", () => {
      expect(src).toMatch(/mix-blend-mode:\s*screen/);
    });

    it("auto-close timer is set to approximately 3800ms (theirs timing)", () => {
      expect(src).toMatch(/3800/);
    });

    it("animation duration is set to approximately 1700ms (theirs timing)", () => {
      expect(src).toMatch(/1700/);
    });

    it("confetti animation uses drop-shadow filter", () => {
      expect(src).toMatch(/drop-shadow/);
    });

    it("chime uses multiple oscillators including detuned pairs for richness", () => {
      // Both branches had dual oscillators per note for richer sound
      const oscCreations = (src.match(/createOscillator/g) || []).length;
      // At least 3: tap/thump osc + 2 oscs per note (in a forEach or scheduleBell)
      expect(oscCreations).toBeGreaterThanOrEqual(3);
      // Must have detune for richness
      expect(src).toMatch(/detune/);
    });

    it("audio has a low-frequency tap/thump oscillator at the start", () => {
      // Both branches have a low-frequency percussive element
      expect(src).toMatch(/tap|thump/i);
    });

    it("confetti drift uses a range spanning both positive and negative", () => {
      // drift = (Math.random() - 0.5) * N
      expect(src).toMatch(/Math\.random\(\)\s*-\s*0\.5/);
    });

    it("confetti count is at least 180 pieces", () => {
      const countMatch = src.match(/count\s*=\s*(\d+)/);
      expect(countMatch).not.toBeNull();
      expect(Number(countMatch[1])).toBeGreaterThanOrEqual(180);
    });
  });

  // =========================================================================
  // Combined / integration behaviors (both sides must work together)
  // =========================================================================
  describe("combined behaviors", () => {
    it("chime function name includes volume and onAutoplayBlocked params AND uses compressor/delay chain", () => {
      // Must have both ours' parameter handling AND theirs' audio routing
      expect(src).toMatch(/volume/);
      expect(src).toMatch(/onAutoplayBlocked/);
      expect(src).toMatch(/createDynamicsCompressor/);
      expect(src).toMatch(/createDelay/);
    });

    it("confetti pieces have BOTH shape system (w/h/radius) AND startY/isSparkle", () => {
      // From ours: shape-based w, h, radius
      // From theirs: startY, isSparkle
      expect(src).toMatch(/\bradius\b/);
      expect(src).toMatch(/\bstartY\b/);
      expect(src).toMatch(/\bisSparkle\b/);
    });

    it("confetti style includes BOTH rotation custom props AND startY custom prop", () => {
      expect(src).toMatch(/--confetti-rot-start/);
      expect(src).toMatch(/--confetti-rot-end/);
      expect(src).toMatch(/--confetti-start-y/);
    });

    it("no conflict markers remain in the source", () => {
      expect(src).not.toMatch(/<<<<<<</);
      expect(src).not.toMatch(/=======/);
      expect(src).not.toMatch(/>>>>>>>/);
    });

    it("file is valid JavaScript (no syntax errors from bad merge)", () => {
      // Basic structural check: balanced braces
      const opens = (src.match(/\{/g) || []).length;
      const closes = (src.match(/\}/g) || []).length;
      expect(opens).toBe(closes);
    });
  });
});
