export default function Head() {
<<<<<<< ours
  // Use a same-origin API route for the favicon.
  // On some custom domain setups, paths like /favicon.ico or /favicon.png may not resolve,
  // but /api routes do.
  // Cache-bust because Chrome/CDNs cache favicons very aggressively.
  const faviconVersion = "20260107";
=======
  // Chrome is extremely aggressive about favicon caching and may ignore query params.
  // So we use a *versioned path* (not just ?v=) to force a refresh.
  const faviconPath = "/api/site-icon-v20260107";
>>>>>>> theirs

<<<<<<< ours
  const faviconUrl = `/api/favicon?v=${faviconVersion}`;

=======

>>>>>>> theirs
  return (
    <>
      <title>MINERSME</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />

<<<<<<< ours
      {/* Icons */}
      <link rel="icon" type="image/png" href={faviconUrl} />
      <link rel="icon" type="image/png" sizes="32x32" href={faviconUrl} />
      <link rel="icon" type="image/png" sizes="16x16" href={faviconUrl} />
      <link rel="shortcut icon" href={faviconUrl} />
      <link rel="apple-touch-icon" sizes="180x180" href={faviconUrl} />
=======
      {/* Icons (same-origin, versioned path) */}
      <link rel="icon" type="image/png" sizes="32x32" href={faviconPath} />
      <link rel="icon" type="image/png" sizes="16x16" href={faviconPath} />
      <link rel="shortcut icon" href={faviconPath} />
      <link rel="apple-touch-icon" sizes="180x180" href={faviconPath} />
>>>>>>> theirs

      {/* Small polish for mobile browser UI */}
      <meta name="theme-color" content="#0A0F1C" />
    </>
  );
}
