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

// Support clearing cookies with varying Domain/SameSite/Path to ensure deletion matches how they were set.
function clearCookie(name, { secure, path = "/", domain, sameSite = "Lax" }) {
  const cookieOptions = [
    `${name}=`,
    `Path=${path}`,
    // Domain must match exactly for deletion. Only include when provided.
    ...(domain ? [`Domain=${domain}`] : []),
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

function getHostNameFromRequest(request) {
  const host = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  ).toString();
  return host.split(":")[0].trim();
}

function getCandidateDomains(hostname) {
  if (!hostname) return [];

  const parts = hostname.split(".").filter(Boolean);
  const apex = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;

  const domains = [hostname, `.${hostname}`];

  if (apex && apex !== hostname) {
    domains.push(apex, `.${apex}`);
  }

  return Array.from(new Set(domains));
}

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

export async function POST(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const tokenA = getCookieValue(cookieHeader, "authjs.session-token");
    const tokenB = getCookieValue(cookieHeader, "__Secure-authjs.session-token");
    const tokenC = getCookieValue(cookieHeader, "__Host-authjs.session-token");

    const sessionToken = tokenA || tokenB || tokenC;

    if (sessionToken) {
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

    // Chrome: reliably clear cookies/storage for this origin.
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
      // Older/alternate names
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

    for (const name of cookieNames) {
      appendClearCookies(res, name, request);
    }

    return res;
  } catch (error) {
    console.error("Platform signout error:", error);
    return Response.json({ error: "Signout failed" }, { status: 500 });
  }
}
