/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // D&D + Retro Gaming Theme
        "deep-forest": "#1A2F1A",
        "dungeon-moss": "#2A4A2A",
        "forest-shade": "#1F3D1F",
        "emerald-glow": "#3A5F3A",
        "ancient-gold": "#D4AF37",
        "treasure-gold": "#FFD700",
        "dragon-gold": "#B8860B",
        "burnished-bronze": "#CD7F32",
        "dragon-blood": "#8B1A1A",
        "crimson-danger": "#B22222",
        "ruby-accent": "#CC3333",
        parchment: "#F4E8D0",
        "old-paper": "#E8DCC8",
        "cream-white": "#FFF8E7",
        "void-black": "#0A0A0A",
        "dungeon-stone": "#1A1A1A",
        "charcoal-gray": "#2A2A2A",
        "slate-gray": "#3A3A3A",
        "pixel-border": "#4A4A4A",

<<<<<<< ours
        // Text helpers (so we stop sprinkling raw hex for muted text)
        "ink-secondary": "#D4C8B0",
        "ink-muted": "#A89A82",

        // Retro console accent colors (Dreamcast/SNES energy) — used sparingly
        // to keep the UI unique without becoming "neon".
        "dreamcast-teal": "#00D1C1",
        "mana-cyan": "#4AF0FF",
        "arcade-blue": "#2C7DF6",

        // IMPORTANT: Site-wide aesthetic migration
        // Map Tailwind's purple/pink utilities to our D&D + retro palette.
        // This lets older pages keep their classnames while matching the new theme.
=======
        // NEW: Dreamcast / SNES-ish accent (teal) to keep us away from “Twitch purple”.
        // We intentionally remap Tailwind's `purple-*` utilities to a teal range,
        // so existing older classnames still work but feel unique.
>>>>>>> theirs
        purple: {
          50: "#ECFFFD",
          100: "#C9FFFB",
          200: "#8FFFF6",
          300: "#4EF3E8",
          400: "#19E4D6",
          500: "#00D1C1", // dreamcast-teal
          600: "#00B4A7",
          700: "#008A80",
          800: "#00635C",
          900: "#003C38",
          950: "#012624",
        },
        // Keep pink -> ruby/crimson for “danger” and “rare loot” vibes.
        pink: {
          50: "#FFF1F2",
          100: "#FFE4E6",
          200: "#FECDD3",
          300: "#FDA4AF",
          400: "#FB7185",
          500: "#CC3333", // ruby-accent
          600: "#B22222", // crimson-danger
          700: "#8B1A1A", // dragon-blood
          800: "#651414",
          900: "#3A0B0B",
          950: "#1F0505",
        },
      },
      fontFamily: {
        cinzel: ["Cinzel", "serif"],
        inter: ["Inter", "system-ui", "sans-serif"],
        "press-start-2p": ['"Press Start 2P"', "monospace"],
      },
      boxShadow: {
        "gold-glow":
          "0 0 20px rgba(212, 175, 55, 0.4), 0 0 40px rgba(212, 175, 55, 0.2)",
        "forest-glow":
          "0 0 20px rgba(58, 95, 58, 0.3), 0 0 40px rgba(58, 95, 58, 0.1)",
        // Subtle teal glow for interactive elements
        "teal-glow":
          "0 0 18px rgba(0, 209, 193, 0.28), 0 0 36px rgba(0, 209, 193, 0.12)",
      },
      borderWidth: {
        3: "3px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
