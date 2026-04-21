import sql from "@/app/api/utils/sql";

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(`${name}=`)) {
      return decodeURIComponent(p.slice(name.length + 1));
    }
  }
  return null;
}

<<<<<<< ours
// Support clearing cookies with varying Domain/SameSite/Path to ensure deletion matches how they were set.
function clearCookie(
  name,
  { secure, path = "/", domain = null, sameSite = "Lax" },
) {
=======
// Support clearing cookies for different Path values (some browsers/storefronts differ)
function clearCookie(name, { secure, path = "/", domain, sameSite = "Lax" }) {
>>>>>>> theirs
  const cookieOptions = [
    `${name}=`,
    `Path=${path}`,
<<<<<<< ours
    // Domain must be omitted for __Host- cookies; only add when explicitly requested
    ...(domain ? [`Domain=${domain}`] : []),
=======
    // Domain must match exactly for deletion. Only include when provided.
    ...(domain ? [`Domain=${domain}`] : []),
>>>>>>> theirs
    "HttpOnly",
    `SameSite=${sameSite}`,
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];
  if (secure) {
    cookieOptions.push("Secure");
  }
  return cookieOptions.join("; ");
}

<<<<<<< ours
function normalizeHost(hostHeader) {
  if (!hostHeader) return null;
  const host = String(hostHeader).trim();
  // strip port if present
  return host.split(":")[0];
}
=======
function getHostNameFromRequest(request) {
  const host = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  ).toString();
  // strip port
  return host.split(":")[0].trim();
}
>>>>>>> theirs

<<<<<<< ours
function getApexDomain(host) {
  if (!host) return null;
  // localhost or single-label hosts have no apex domain logic
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return host;
  return parts.slice(-2).join(".");
=======
function getCandidateDomains(hostname) {
  if (!hostname) return [];

  const parts = hostname.split(".").filter(Boolean);
  const apex = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;

  // Order matters a bit; we’ll try a few common possibilities.
  const domains = [hostname, `.${hostname}`];

  if (apex && apex !== hostname) {
    domains.push(apex, `.${apex}`);
  }

  // de-dupe
  return Array.from(new Set(domains));
>>>>>>> theirs
}

<<<<<<< ours
function appendClearCookies(res, name, hostHeader) {
  const host = normalizeHost(hostHeader);
  const apex = host ? getApexDomain(host) : null;

  const paths = ["/", "/api/auth"]; // clear scoped + root variants

  // Most common domain variants seen in the wild
  const domains = [
    null,
    host,
    host ? `.${host}` : null,
    apex,
    apex ? `.${apex}` : null,
  ].filter((d, i, arr) => arr.indexOf(d) === i); // uniq

  const sameSiteVariants = [
    { sameSite: "Lax", secure: false },
    { sameSite: "Lax", secure: true },
    // Some deployments use SameSite=None + Secure
    { sameSite: "None", secure: true },
  ];

  for (const path of paths) {
    for (const domain of domains) {
      for (const v of sameSiteVariants) {
        // IMPORTANT: __Host- cookies MUST NOT include Domain and MUST be Path=/
        if (name.startsWith("__Host-") && (domain || path !== "/")) {
          continue;
        }
        res.headers.append(
          "Set-Cookie",
          clearCookie(name, {
            path,
            domain,
            secure: v.secure,
            sameSite: v.sameSite,
          }),
        );
      }
    }
  }
}

=======
function appendClearCookies(res, name, request) {
  const hostname = getHostNameFromRequest(request);
  const domains = getCandidateDomains(hostname);

  const isHostCookie = name.startsWith("__Host-");

  // __Host- cookies must be Secure, path=/, and MUST NOT include Domain.
  if (isHostCookie) {
    res.headers.append(
      "Set-Cookie",
      clearCookie(name, { secure: true, path: "/", sameSite: "Lax" }),
    );
    // Some setups may have SameSite=None on secure cookies
    res.headers.append(
      "Set-Cookie",
      clearCookie(name, { secure: true, path: "/", sameSite: "None" }),
    );
    return;
  }

  const paths = ["/", "/api/auth"];

  for (const path of paths) {
    // no Domain variant
    res.headers.append(
      "Set-Cookie",
      clearCookie(name, { secure: false, path, sameSite: "Lax" }),
    );
    res.headers.append(
      "Set-Cookie",
      clearCookie(name, { secure: true, path, sameSite: "Lax" }),
    );
    res.headers.append(
      "Set-Cookie",
      clearCookie(name, { secure: true, path, sameSite: "None" }),
    );

    // domain variants (best-effort)
    for (const domain of domains) {
      res.headers.append(
        "Set-Cookie",
        clearCookie(name, { secure: false, path, domain, sameSite: "Lax" }),
      );
      res.headers.append(
        "Set-Cookie",
        clearCookie(name, { secure: true, path, domain, sameSite: "Lax" }),
      );
      res.headers.append(
        "Set-Cookie",
        clearCookie(name, { secure: true, path, domain, sameSite: "None" }),
      );
    }
  }
}

>>>>>>> theirs
export async function POST(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    // Try common session cookie names
    const tokenA = getCookieValue(cookieHeader, "authjs.session-token");
    const tokenB = getCookieValue(
      cookieHeader,
      "__Secure-authjs.session-token",
    );
    const tokenC = getCookieValue(cookieHeader, "__Host-authjs.session-token");

    const sessionToken = tokenA || tokenB || tokenC;

    if (sessionToken) {
      // Best-effort cleanup; don’t fail the request if this errors.
      try {
        await sql`
          DELETE FROM auth_sessions
          WHERE "sessionToken" = ${sessionToken}
        `;
      } catch (e) {
        console.error("Failed to delete auth session during signout", e);
      }
    }

    const res = Response.json({ success: true });
    res.headers.set("Cache-Control", "no-store, max-age=0");

    // Ask Chrome to clear cookies/storage for this origin.
    // This is a big hammer, but it makes sign-out reliable in cases where Domain/Path variants are unknown.
    res.headers.set("Clear-Site-Data", '"cookies", "storage", "cache"');

    const cookieNames = [
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "__Host-authjs.session-token",
      "authjs.csrf-token",
      "__Secure-authjs.csrf-token",
      "__Host-authjs.csrf-token",
      "authjs.callback-url",
      "__Secure-authjs.callback-url",
      "__Host-authjs.callback-url",
      "authjs.pkce.code_verifier",
      "__Secure-authjs.pkce.code_verifier",
      "__Host-authjs.pkce.code_verifier",
      // EXTRA: clear older/alternate cookie names some deployments used
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "__Host-next-auth.session-token",
      "next-auth.csrf-token",
      "__Secure-next-auth.csrf-token",
      "__Host-next-auth.csrf-token",
      "next-auth.callback-url",
      "__Secure-next-auth.callback-url",
      "__Host-next-auth.callback-url",
    ];

    const hostHeader = request.headers.get("host");
    for (const name of cookieNames) {
<<<<<<< ours
      appendClearCookies(res, name, hostHeader);
=======
      appendClearCookies(res, name, request);
>>>>>>> theirs
    }

    return res;
  } catch (error) {
    console.error("Platform signout error:", error);
    return Response.json({ error: "Signout failed" }, { status: 500 });
  }
}
