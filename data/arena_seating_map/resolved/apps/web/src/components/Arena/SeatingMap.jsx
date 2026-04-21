import { useMemo } from "react";

function clamp01(n) {
  if (typeof n !== "number") return 0;
  return Math.max(0, Math.min(1, n));
}

function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(a)})`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function polarEllipse(cx, cy, rx, ry, angleRad) {
  return {
    x: cx + Math.cos(angleRad) * rx,
    y: cy + Math.sin(angleRad) * ry,
  };
}

function arcWedgePath({ cx, cy, rx0, ry0, rx1, ry1, a0, a1 }) {
  // Outer arc (rx1, ry1) from a0 -> a1, then inner arc back.
  const p0 = polarEllipse(cx, cy, rx1, ry1, a0);
  const p1 = polarEllipse(cx, cy, rx1, ry1, a1);
  const p2 = polarEllipse(cx, cy, rx0, ry0, a1);
  const p3 = polarEllipse(cx, cy, rx0, ry0, a0);

  const delta = a1 - a0;
  const large = Math.abs(delta) > Math.PI ? 1 : 0;
  const sweep = delta >= 0 ? 1 : 0;
  const sweepBack = sweep ? 0 : 1;

  return [
    `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`,
    `A ${rx1.toFixed(2)} ${ry1.toFixed(2)} 0 ${large} ${sweep} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `A ${rx0.toFixed(2)} ${ry0.toFixed(2)} 0 ${large} ${sweepBack} ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function getEnergyColor(t) {
  // Simple cold -> warm -> hot ramp
  const tt = clamp01(t);
  const cold = hexToRgb("#2A4DFF");
  const warm = hexToRgb("#FFD166");
  const hot = hexToRgb("#FF5252");

  const lerpRgb = (a, b, k) => ({
    r: lerp(a.r, b.r, k),
    g: lerp(a.g, b.g, k),
    b: lerp(a.b, b.b, k),
  });

  const toHex = ({ r, g, b }) => {
    const h = (n) =>
      Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`;
  };

  if (tt <= 0.5) {
    return toHex(lerpRgb(cold, warm, tt / 0.5));
  }
  return toHex(lerpRgb(warm, hot, (tt - 0.5) / 0.5));
}

function safeInt(n, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.floor(v);
}

function blendHex(aHex, bHex, t) {
  const aa = hexToRgb(aHex);
  const bb = hexToRgb(bHex);
  const tt = clamp01(t);
  const mix = {
    r: lerp(aa.r, bb.r, tt),
    g: lerp(aa.g, bb.g, tt),
    b: lerp(aa.b, bb.b, tt),
  };
  const toHex = (n) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(mix.r)}${toHex(mix.g)}${toHex(mix.b)}`;
}

/**
 * SeatingMap (Arena Bowl)
 *
 * This is intentionally NOT a "dot per seat" heatmap.
 * It renders an arena bowl with tiers + sections (like the user's reference),
 * and it scales to very large capacities without dumping thousands of circles into the DOM.
 *
 * Props:
 * - seats: array of seat objects (can be only occupied seats)
 * - capacity: total seat capacity
 * - homeColor / awayColor: team accent colors
 * - energyByUserId: Map<user_id, 0..1>
 * - variant: "card" (default) | "fullscreen" (fills the parent)
 */
export function SeatingMap({
  seats,
  capacity,
  homeColor = "#4DA3FF",
  awayColor = "#FF5252",
  energyByUserId,
  variant = "card",
}) {
  const seatList = Array.isArray(seats) ? seats : [];
  const cap = Math.max(0, safeInt(capacity, seatList.length));

  const isFullscreen = variant === "fullscreen";

  const occupied = useMemo(() => {
    // Map seats into normalized index 0..cap-1 so we can aggregate into sections.
    const out = [];
    for (const s of seatList) {
      if (!s?.user_id) continue;
      const sn = Number(s?.seat_number);
      if (!Number.isFinite(sn) || sn <= 0 || cap <= 0) continue;
      out.push({
        seatNumber: sn,
        userId: s.user_id,
        teamSide: String(s?.team_side || ""),
      });
    }
    return out;
  }, [cap, seatList]);

  const sections = useMemo(() => {
    // Three tiers like a real arena.
    const tierCount = 3;
    const perTier = 18; // total sections per tier
    const total = tierCount * perTier;

    const arr = [];
    for (let i = 0; i < total; i += 1) {
      arr.push({
        idx: i,
        occupiedCount: 0,
        energySum: 0,
        teamSide: null,
      });
    }

    if (cap <= 0) return { tierCount, perTier, total, arr };

    const sideFromAngle = (a) => {
      // Top half = home, bottom half = away.
      const norm = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const isTop = norm >= Math.PI && norm <= Math.PI * 2;
      return isTop ? "home" : "away";
    };

    for (const s of occupied) {
      const sn = s.seatNumber;
      const t = cap > 0 ? clamp01((sn - 1) / cap) : 0;
      const angle = -Math.PI / 2 + t * Math.PI * 2;

      const explicit = String(s.teamSide).toLowerCase();
      const whichSide =
        explicit === "home" || explicit === "away" ? explicit : sideFromAngle(angle);

      // Spread people across tiers too, based on seat number.
      const tier = Math.min(tierCount - 1, Math.floor(t * tierCount));
      const withinTier = Math.floor((t * tierCount - tier) * perTier);
      const sectionIndex =
        tier * perTier + Math.min(perTier - 1, Math.max(0, withinTier));

      const sec = arr[sectionIndex];
      if (!sec) continue;

      sec.occupiedCount += 1;

      const e = energyByUserId && s.userId ? energyByUserId.get(s.userId) : null;
      const ee = typeof e === "number" ? clamp01(e) : 0.25;
      sec.energySum += ee;

      // Determine side dominance for the section
      if (!sec.teamSide) {
        sec.teamSide = whichSide;
      } else if (sec.teamSide !== whichSide) {
        // mixed; keep it neutral (we'll render with a blended look)
        sec.teamSide = "mixed";
      }
    }

    return { tierCount, perTier, total, arr };
  }, [cap, energyByUserId, occupied]);

  const stats = useMemo(() => {
    const occupiedCount = occupied.length;
    const fill = cap > 0 ? clamp01(occupiedCount / cap) : 0;
    return { occupiedCount, fill };
  }, [cap, occupied.length]);

  const svg = useMemo(() => {
    // Roughly match the vibe of an arena blueprint/overhead.
    const vbW = 680;
    const vbH = 360;
    const cx = vbW / 2;
    const cy = vbH / 2;

    // Outer bowl ellipse
    const outerRx = 300;
    const outerRy = 140;

    // Inner bowl ellipse
    const innerRx = 170;
    const innerRy = 78;

    // Tier thicknesses
    const tierCount = sections.tierCount;

    const tierOuterRx = [];
    const tierOuterRy = [];
    const tierInnerRx = [];
    const tierInnerRy = [];

    for (let t = 0; t < tierCount; t += 1) {
      const k0 = t / tierCount;
      const k1 = (t + 1) / tierCount;

      const rx0 = lerp(innerRx, outerRx, k0);
      const ry0 = lerp(innerRy, outerRy, k0);
      const rx1 = lerp(innerRx, outerRx, k1);
      const ry1 = lerp(innerRy, outerRy, k1);

      tierInnerRx.push(rx0);
      tierInnerRy.push(ry0);
      tierOuterRx.push(rx1);
      tierOuterRy.push(ry1);
    }

    return {
      vbW,
      vbH,
      cx,
      cy,
      outerRx,
      outerRy,
      innerRx,
      innerRy,
      tierOuterRx,
      tierOuterRy,
      tierInnerRx,
      tierInnerRy,
    };
  }, [sections.tierCount]);

  const seatFillForSection = (sec, fallbackSide) => {
    if (!sec) return "rgba(255,255,255,0.06)";

    const baseSide = sec.teamSide || fallbackSide;
    const baseColor =
      baseSide === "away"
        ? awayColor
        : baseSide === "home"
          ? homeColor
          : "#AAB1C3";

    if (!sec.occupiedCount) {
      // Empty = subtle stadium fabric
      return rgba(baseColor, 0.1);
    }

    const avg = sec.energySum / Math.max(1, sec.occupiedCount);
    const heat = getEnergyColor(avg);

    // Keep some team identity even when hot.
    return blendHex(heat, baseColor, 0.35);
  };

  const seatStrokeForSection = (sec) => {
    if (!sec?.occupiedCount) return "rgba(255,255,255,0.12)";
    return "rgba(255,255,255,0.22)";
  };

  const outerWrapStyle = isFullscreen
    ? { width: "100%", height: "100%", margin: 0 }
    : { width: "100%", maxWidth: 1200, margin: "0 auto" };

  const cardStyle = isFullscreen
    ? {
        height: "100%",
        borderRadius: 0,
        border: "none",
        background:
          "radial-gradient(140% 140% at 50% 50%, rgba(255,255,255,0.05) 0%, rgba(18,24,38,0.55) 42%, rgba(11,15,25,0.92) 100%)",
        overflow: "hidden",
      }
    : {
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "radial-gradient(120% 120% at 50% 50%, rgba(255,255,255,0.05) 0%, rgba(18,24,38,0.55) 40%, rgba(11,15,25,0.92) 100%)",
        overflow: "hidden",
      };

  const svgHeight = isFullscreen ? "100%" : 260;

  return (
    <div style={outerWrapStyle}>
      <div style={cardStyle}>
        {!isFullscreen ? (
          <div
            style={{
              padding: "12px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              color: "#AAB1C3",
              fontSize: 12,
            }}
          >
            <div>
              Arena • {cap.toLocaleString()} capacity •{" "}
              {stats.occupiedCount.toLocaleString()} in seats
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: rgba(homeColor, 0.75),
                    border: "1px solid rgba(255,255,255,0.20)",
                  }}
                />
                <span>Home</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: rgba(awayColor, 0.75),
                    border: "1px solid rgba(255,255,255,0.20)",
                  }}
                />
                <span>Away</span>
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ padding: isFullscreen ? 0 : 10, height: isFullscreen ? "100%" : "auto" }}>
          <svg
            viewBox={`0 0 ${svg.vbW} ${svg.vbH}`}
            width="100%"
            height={svgHeight}
            preserveAspectRatio="xMidYMid meet"
            style={isFullscreen ? { display: "block" } : undefined}
          >
            <defs>
              <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
              </linearGradient>
              <radialGradient id="courtGlow" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
              </radialGradient>
            </defs>

            {/* Outer bowl */}
            <ellipse
              cx={svg.cx}
              cy={svg.cy}
              rx={svg.outerRx}
              ry={svg.outerRy}
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1.2}
            />

            {/* Inner bowl */}
            <ellipse
              cx={svg.cx}
              cy={svg.cy}
              rx={svg.innerRx}
              ry={svg.innerRy}
              fill="rgba(11,15,25,0.60)"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth={1}
            />

            {/* Seating tiers + sections */}
            {sections.arr.map((sec) => {
              const tier = Math.floor(sec.idx / sections.perTier);
              const i = sec.idx % sections.perTier;

              // Start at -90 degrees (top) and go clockwise
              const a0 = -Math.PI / 2 + (i / sections.perTier) * Math.PI * 2;
              const a1 =
                -Math.PI / 2 + ((i + 1) / sections.perTier) * Math.PI * 2;
              const mid = (a0 + a1) / 2;
              const fallbackSide = Math.sin(mid) < 0 ? "home" : "away";

              const rx0 = svg.tierInnerRx[tier];
              const ry0 = svg.tierInnerRy[tier];
              const rx1 = svg.tierOuterRx[tier];
              const ry1 = svg.tierOuterRy[tier];

              const d = arcWedgePath({
                cx: svg.cx,
                cy: svg.cy,
                rx0,
                ry0,
                rx1,
                ry1,
                a0,
                a1,
              });

              const fill = seatFillForSection(sec, fallbackSide);
              const stroke = seatStrokeForSection(sec);

              return (
                <path
                  key={`sec-${sec.idx}`}
                  d={d}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={0.8}
                >
                  <title>
                    {`Tier ${tier + 1} • Section ${i + 1} • ${sec.occupiedCount} fans`}
                  </title>
                </path>
              );
            })}

            {/* Court */}
            <g>
              <rect
                x={svg.cx - 86}
                y={svg.cy - 42}
                width={172}
                height={84}
                rx={12}
                fill="rgba(18,24,38,0.92)"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={1}
              />
              <rect
                x={svg.cx - 72}
                y={svg.cy - 34}
                width={144}
                height={68}
                rx={10}
                fill="rgba(11,15,25,0.40)"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth={1}
              />
              <circle
                cx={svg.cx}
                cy={svg.cy}
                r={16}
                fill="rgba(255,255,255,0.02)"
                stroke="rgba(255,255,255,0.16)"
              />
              <line
                x1={svg.cx}
                y1={svg.cy - 34}
                x2={svg.cx}
                y2={svg.cy + 34}
                stroke="rgba(255,255,255,0.12)"
              />
              <rect
                x={svg.cx - 86}
                y={svg.cy - 42}
                width={172}
                height={84}
                rx={12}
                fill="url(#courtGlow)"
              />
            </g>

            {/* Glass overlay */}
            <rect
              x={0}
              y={0}
              width={svg.vbW}
              height={svg.vbH}
              fill="url(#glass)"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
