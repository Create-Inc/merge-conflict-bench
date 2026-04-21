export default function Head() {
  // Chrome is extremely aggressive about favicon caching and may ignore query params.
  // So we use a versioned PATH (not just ?v=) to force a refresh.
  // If you ever change the favicon again, bump this path (e.g. /api/site-icon-vYYYYMMDD).
  const faviconPath = "/api/site-icon-v20260107";

  return (
    <>
      <title>MINERSME</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Icons (same-origin, versioned path) */}
      <link rel="icon" type="image/png" href={faviconPath} />
      <link rel="icon" type="image/png" sizes="32x32" href={faviconPath} />
      <link rel="icon" type="image/png" sizes="16x16" href={faviconPath} />
      <link rel="shortcut icon" href={faviconPath} />
      <link rel="apple-touch-icon" sizes="180x180" href={faviconPath} />

      {/* Small polish for mobile browser UI */}
      <meta name="theme-color" content="#0A0F1C" />
    </>
  );
}
