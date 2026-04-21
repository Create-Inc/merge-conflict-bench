import ClientProviders from "@/components/ClientProviders";

const SOCIAL_SHARE_IMAGE_URL =
  "https://ucarecdn.com/781885a3-3a0c-4aac-afd0-929bb4d175b6/-/format/jpeg/";

export const metadata = {
  title: "Press A 2 Start | Local Retro Gaming Marketplace & Community",
  description:
    "Press A 2 Start is a local gaming community and retro gaming marketplace. Buy/sell/trade games and consoles locally, find gaming allies, post LFG, track your quest log, and message gamers near you.",
  metadataBase: new URL("https://www.thegamingguild.org"),
  openGraph: {
    title: "Press A 2 Start | Local Retro Gaming Marketplace & Community",
    description:
      "Press A 2 Start is a local gaming community and retro gaming marketplace. Buy/sell/trade games and consoles locally, find gaming allies, post LFG, track your quest log, and message gamers near you.",
    url: "https://www.thegamingguild.org",
    siteName: "Press A 2 Start",
    type: "website",
    images: [
      {
        url: SOCIAL_SHARE_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Press A 2 Start",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Press A 2 Start | Local Retro Gaming Marketplace & Community",
    description:
      "Press A 2 Start is a local gaming community and retro gaming marketplace. Buy/sell/trade games and consoles locally, find gaming allies, post LFG, track your quest log, and message gamers near you.",
    images: [SOCIAL_SHARE_IMAGE_URL],
  },
  icons: {
    icon: "https://raw.createusercontent.com/cb4af92c-76e3-40b6-8b4e-d219bde95ff5/-/preview/32x32/-/format/png/",
    apple:
      "https://raw.createusercontent.com/cb4af92c-76e3-40b6-8b4e-d219bde95ff5/-/preview/180x180/-/format/png/",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="https://raw.createusercontent.com/cb4af92c-76e3-40b6-8b4e-d219bde95ff5/-/preview/32x32/-/format/png/"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="https://raw.createusercontent.com/cb4af92c-76e3-40b6-8b4e-d219bde95ff5/-/preview/16x16/-/format/png/"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="https://raw.createusercontent.com/cb4af92c-76e3-40b6-8b4e-d219bde95ff5/-/preview/180x180/-/format/png/"
        />
        {/* Explicit OG tags for maximum compatibility */}
        <meta
          property="og:title"
          content="Press A 2 Start | Local Retro Gaming Marketplace & Community"
        />
        <meta
          property="og:description"
          content="Press A 2 Start is a local gaming community and retro gaming marketplace. Buy/sell/trade games and consoles locally, find gaming allies, post LFG, track your quest log, and message gamers near you."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.thegamingguild.org" />
        <meta property="og:site_name" content="Press A 2 Start" />
        <meta property="og:image" content={SOCIAL_SHARE_IMAGE_URL} />
        <meta property="og:image:secure_url" content={SOCIAL_SHARE_IMAGE_URL} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Press A 2 Start" />
        <meta property="og:image:type" content="image/jpeg" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Press A 2 Start | Local Retro Gaming Marketplace & Community"
        />
        <meta
          name="twitter:description"
          content="Press A 2 Start is a local gaming community and retro gaming marketplace. Buy/sell/trade games and consoles locally, find gaming allies, post LFG, track your quest log, and message gamers near you."
        />
        <meta name="twitter:image" content={SOCIAL_SHARE_IMAGE_URL} />
        <meta name="twitter:image:alt" content="Press A 2 Start" />

        {/* D&D + Retro Gaming Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@400;500;600;700&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
<<<<<<< ours
        className="overflow-x-hidden bg-void-black text-cream-white font-inter"
=======
        className="overflow-x-hidden bg-[#07110F] text-[#FFF8E7]"
>>>>>>> theirs
      >
<<<<<<< ours
        {/*
          New background approach:
          - Remove the large animated blur-orbs (they read as "generic dark site" and cost GPU).
          - Use a simple, *static* layered background: subtle teal + gold aura + pixel grid + scanlines.
          This keeps the vibe (D&D + retro console) but looks less like Twitch/modern neon.
        */}
=======
        {/* Background: D&D dungeon-ink + Dreamcast teal accents (static + lightweight) */}
>>>>>>> theirs
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
<<<<<<< ours
          {/* Soft aura layer */}
=======
          {/* Base vignette */}
>>>>>>> theirs
          <div
<<<<<<< ours
            className="absolute inset-0 opacity-60"
=======
            className="absolute inset-0"
>>>>>>> theirs
            style={{
<<<<<<< ours
              backgroundImage:
                "radial-gradient(900px 520px at 15% 10%, rgba(0, 209, 193, 0.10), rgba(0,0,0,0) 55%), radial-gradient(900px 520px at 85% 25%, rgba(212, 175, 55, 0.08), rgba(0,0,0,0) 60%), radial-gradient(900px 620px at 50% 95%, rgba(42, 74, 42, 0.16), rgba(0,0,0,0) 62%)",
=======
              background:
                "radial-gradient(900px 600px at 18% 12%, rgba(0, 209, 193, 0.12), rgba(0, 209, 193, 0) 55%), radial-gradient(900px 600px at 82% 88%, rgba(212, 175, 55, 0.10), rgba(212, 175, 55, 0) 55%), radial-gradient(1200px 800px at 50% 50%, rgba(42, 74, 42, 0.18), rgba(7, 17, 15, 0) 62%)",
>>>>>>> theirs
            }}
          />
<<<<<<< ours

          {/* Pixel grid overlay (very subtle) */}
          <div className="absolute inset-0 pixel-grid-bg opacity-40" />

          {/* CRT scanlines overlay (super subtle) */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.0) 0px, rgba(0,0,0,0.0) 2px, rgba(0,0,0,0.55) 3px, rgba(0,0,0,0.55) 4px)",
            }}
          />
=======

          {/* Subtle pixel grid overlay (retro menu vibe) */}
          <div className="absolute inset-0 opacity-70 pixel-grid-bg" />

          {/* Very subtle scanlines for “CRT” nostalgia (kept light for readability) */}
          <div className="absolute inset-0 opacity-20 crt-scanlines" />
>>>>>>> theirs
        </div>

        <div className="relative min-h-screen">
          <ClientProviders>{children}</ClientProviders>
        </div>

        <style jsx global>{`
          /* Global Pixel Grid Background */
          .pixel-grid-bg {
<<<<<<< ours
            background-image:
              linear-gradient(rgba(212, 175, 55, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212, 175, 55, 0.05) 1px, transparent 1px);
=======
            background-image:
              linear-gradient(rgba(0, 209, 193, 0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212, 175, 55, 0.03) 1px, transparent 1px);
>>>>>>> theirs
            background-size: 16px 16px;
          }
<<<<<<< ours

=======

          /* CRT scanlines (very subtle) */
          .crt-scanlines {
            background-image: linear-gradient(
              rgba(0, 0, 0, 0.18) 50%,
              transparent 50%
            );
            background-size: 100% 4px;
          }

>>>>>>> theirs
          /* Scrollbar Styling */
          ::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }

          ::-webkit-scrollbar-track {
<<<<<<< ours
            background: #1a1a1a;
=======
            background: #0b1211;
>>>>>>> theirs
          }

          ::-webkit-scrollbar-thumb {
<<<<<<< ours
            background: #4a4a4a;
=======
            background: #223330;
>>>>>>> theirs
            border-radius: 6px;
<<<<<<< ours
            border: 2px solid #1a1a1a;
=======
            border: 2px solid #0b1211;
>>>>>>> theirs
          }

          ::-webkit-scrollbar-thumb:hover {
<<<<<<< ours
            background: #d4af37;
=======
            background: #00d1c1;
>>>>>>> theirs
          }
        `}</style>
      </body>
    </html>
  );
}
