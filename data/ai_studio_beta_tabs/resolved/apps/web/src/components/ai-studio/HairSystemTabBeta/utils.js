// Shared helpers for the Hair System Beta UI.
// These used to live in the legacy HairSystemTab folder.

export const SYSTEM_TYPES = [
  {
    key: "wig",
    label: "Wig",
    description:
      "Full coverage hair replacement system. Perfect for complete style transformations or hair loss coverage.",
    image:
      "https://ucarecdn.com/5859a3ba-12ac-45c5-850a-bed5245c3492/-/format/auto/",
  },
  {
    key: "toupee",
    label: "Hair System",
    description:
      "Partial coverage system typically for men. Covers specific areas like crown or hairline.",
    image:
      "https://ucarecdn.com/c6cf84e0-3e7a-46db-b18c-7918d7b3a7a2/-/format/auto/",
  },
  {
    key: "extensions",
    label: "Hair Extensions",
    description:
      "Length and volume addition to existing hair. Blend with natural hair for enhanced styling.",
    image:
      "https://ucarecdn.com/8be1de22-b25e-4966-bd52-999d1c6b0efe/-/format/auto/",
  },
];

export const normalizeEyeColor = (val) => {
  if (!val) return { key: null, custom: null };
  const s = String(val).toLowerCase();
  if (s.includes("blue")) return { key: "blue", custom: null };
  if (s.includes("green")) return { key: "green", custom: null };
  if (s.includes("hazel")) return { key: "hazel", custom: null };
  if (s.includes("brown")) return { key: "brown", custom: null };
  if (s.includes("amber")) return { key: "amber", custom: null };
  if (s.includes("grey") || s.includes("gray"))
    return { key: "gray", custom: null };
  return { key: "custom", custom: String(val) };
};

export const getStyleSummary = (style) => {
  if (!style) return null;
  switch (style.id) {
    case "textured_bob":
      return "modern shag haircut with choppy, piecey layers, lived-in movement, soft face-framing, light fringe/curtain bangs; avoid long beach waves";
    case "pixie_cut":
      return "classic pixie cut, cropped sides and back, soft texture on top, clean nape";
    case "straight_bob":
      return "sleek blunt bob, chin-length, minimal layering, clean lines";
    case "wavy_lob":
      return "wavy long bob (lob) with soft layers, airy movement, understated volume";
    case "shoulder_curls":
      return "shoulder-length curly updo, defined curls, elegant pinned finish";
    case "beach_waves":
      return "long hair with loose beach waves, subtle layers, soft side sweep";
    case "long_straight":
      return "very long straight hair, sleek finish, minimal layering";
    case "long_side_part":
      return "long hair with curtain bangs, face-framing layers, side part";
    case "buzz_cut":
      return "very short buzz cut, uniform length, clean hairline";
    case "side_part":
      return "classic crew cut, short top with tapered sides, clean hairline";
    case "textured_quiff":
      return "man bun: hair gathered into a bun, clean sides and top smoothed back";
    case "pompadour":
      return "classic pompadour, heightened crown, neat sides";
    case "slicked_back":
      return "classic fade: clean gradient on the sides with tidy, short top";
    case "fade_clean":
      return "traditional side part, neat combed finish with tidy sides";
    case "short_curls":
      return "textured crop: short choppy top with taper on the sides, matte finish";
    case "bowl_cut":
      return "bowl cut with even fringe, rounded outline, uniform length";
    case "crown_braids":
      return "crown braids wrapped around head, clean partings, polished finish";
    case "box_braids":
      return "box braids, medium size, clean sections, lengths past shoulders";
    case "cornrows":
      return "cornrows with neat parts, close to scalp, symmetrical pattern";
    case "natural_afro":
      return "silk press on natural hair, sleek, high shine, smooth finish";
    case "twist_out":
      return "twist-out on natural hair, defined coils, soft volume";
    case "locs":
      return "shoulder-length locs, neat grooming, natural finish";
    default:
      return null;
  }
};

export const inferHairAttributes = (style) => {
  const lenByCat = {
    women_short: "short",
    women_medium: "medium",
    women_long: "long",
    men_classic: "short",
    men_modern: "short",
    braided: "long",
    natural: "medium",
  };
  const texById = {
    textured_bob: "wavy",
    wavy_lob: "wavy",
    long_straight: "straight",
    beach_waves: "wavy",
    short_curls: "curly",
    natural_afro: "coily",
    twist_out: "coily",
  };

  const inferredLen = lenByCat[style.category];
  const inferredTex = texById[style.id];
  return { length: inferredLen, texture: inferredTex };
};
