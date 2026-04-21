import crypto from "crypto";
import sql from "@/app/api/utils/sql";
import getAppUrl from "@/app/api/utils/get-app-url";
import requireBusinessAccess from "@/app/api/utils/require-business-access";

const GRAPH_VERSION = "v20.0";

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const withPad = padded + "=".repeat(padLength);
  return Buffer.from(withPad, "base64").toString("utf8");
}

function signState(payloadB64) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return base64UrlEncode(
    crypto.createHmac("sha256", secret).update(payloadB64).digest(),
  );
}

async function readJsonSafe(response) {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function graphUrl(path, params) {
  const base = `https://graph.facebook.com/${GRAPH_VERSION}${path}`;
  const sp = new URLSearchParams();
  const obj = params && typeof params === "object" ? params : {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) {
      return;
    }
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

async function graphGet(path, params) {
  const url = graphUrl(path, params);
  const res = await fetch(url, { method: "GET" });
  const json = await readJsonSafe(res);
  if (!res.ok) {
    const message =
      json?.error?.message ||
      `Meta Graph GET ${path} failed: [${res.status}] ${res.statusText}`;
    return { ok: false, status: res.status, message, json };
  }
  return { ok: true, status: res.status, json };
}

async function applySelectedPage({ businessId, page }) {
  const pageId = typeof page?.id === "string" ? page.id : "";
  const pageName = typeof page?.name === "string" ? page.name : "";
  const pageToken =
    typeof page?.access_token === "string" ? page.access_token : "";

  if (!pageId || !pageToken) {
    return {
      ok: false,
      error:
        "Could not resolve a Facebook Page access token. Please reconnect and try again.",
    };
  }

  const igLookup = await graphGet(`/${encodeURIComponent(pageId)}`, {
    fields: "instagram_business_account",
    access_token: pageToken,
  });

  let igId = "";
  if (igLookup.ok) {
    const raw = igLookup.json?.instagram_business_account?.id;
    igId = typeof raw === "string" ? raw : "";
  }

  let igUsername = "";
  if (igId) {
    const igUser = await graphGet(`/${encodeURIComponent(igId)}`, {
      fields: "username",
      access_token: pageToken,
    });

    if (igUser.ok) {
      const u = igUser.json?.username;
      igUsername = typeof u === "string" ? u : "";
    }
  }

  await sql(
    "UPDATE meta_connections SET page_id = $1, page_name = $2, page_access_token = $3, instagram_business_account_id = $4, instagram_username = $5, updated_at = CURRENT_TIMESTAMP WHERE business_id = $6",
    [pageId, pageName, pageToken, igId || null, igUsername || null, businessId],
  );

  return {
    ok: true,
    data: {
      connected: true,
      pageId,
      pageName,
      instagramConnected: Boolean(igId),
      instagramUsername: igUsername,
    },
  };
}

function safeDashboardRedirect(businessId, metaState) {
  const id = encodeURIComponent(String(businessId));
  const m = encodeURIComponent(String(metaState || ""));
  return `/dashboard/${id}?tab=profile&meta=${m}`;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return Response.json(
        { error: "Missing code or state from Meta" },
        { status: 400 },
      );
    }

    const [payloadB64, sig] = String(state).split(".");
    if (!payloadB64 || !sig) {
      return Response.json({ error: "Invalid state" }, { status: 400 });
    }

    const expectedSig = signState(payloadB64);
    if (sig !== expectedSig) {
      return Response.json(
        { error: "Invalid state signature" },
        { status: 400 },
      );
    }

    const payloadRaw = base64UrlDecode(payloadB64);
    const payload = payloadRaw ? JSON.parse(payloadRaw) : null;

    const businessIdRaw = payload?.businessId;
    const businessId = businessIdRaw ? Number(businessIdRaw) : null;
    if (!businessId || Number.isNaN(businessId)) {
      return Response.json({ error: "Missing business id" }, { status: 400 });
    }

    const access = await requireBusinessAccess(request, businessId);
    if (!access.ok) {
      // If the user got logged out (or cookies didn't carry across www/non-www),
      // don't leave them staring at a JSON API response. Send them to sign in,
      // then back to this exact callback URL (code+state preserved).
      const accept = request.headers.get("accept") || "";
      const wantsHtml = accept.includes("text/html");
      const status = access?.response?.status;

      if (wantsHtml && status === 401) {
        const cb = `${url.pathname}${url.search}`;
        return Response.redirect(
          `/account/signin?callbackUrl=${encodeURIComponent(cb)}`,
          302,
        );
      }

      if (wantsHtml && status === 403) {
        return Response.redirect(safeDashboardRedirect(businessId, "forbidden"), 302);
      }

      return access.response;
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      // Prefer a friendly redirect when this is loaded in the browser.
      const accept = request.headers.get("accept") || "";
      if (accept.includes("text/html")) {
        return Response.redirect(
          safeDashboardRedirect(businessId, "config_error"),
          302,
        );
      }

      return Response.json(
        {
          error:
            "META_APP_ID / META_APP_SECRET are not set. Add them in Project Settings → Secrets (dev + prod).",
        },
        { status: 500 },
      );
    }

    // IMPORTANT: Use the exact redirectUri that was used when starting OAuth.
    // This prevents token exchange failures caused by subtle host differences
    // (www vs non-www, proxy hosts, etc.).
    const baseUrl = getAppUrl(request);
    const redirectUriFromState =
      typeof payload?.redirectUri === "string" ? payload.redirectUri : "";
    const redirectUri =
      redirectUriFromState && redirectUriFromState.startsWith(baseUrl)
        ? redirectUriFromState
        : `${baseUrl}/api/meta/oauth/callback`;

    const tokenUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`,
    );
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString(), { method: "GET" });
    const tokenJson = await readJsonSafe(tokenRes);

    if (!tokenRes.ok) {
      console.error("Meta token exchange failed", tokenJson);
      return Response.redirect(safeDashboardRedirect(businessId, "error"), 302);
    }

    const accessToken =
      typeof tokenJson?.access_token === "string" ? tokenJson.access_token : "";

    if (!accessToken) {
      return Response.redirect(safeDashboardRedirect(businessId, "error"), 302);
    }

    // NEW: Fetch the Meta user identity so we can show "Connected as …" in the UI.
    const me = await graphGet("/me", {
      fields: "id,name",
      access_token: accessToken,
    });

    const connectedAsId =
      me.ok && typeof me.json?.id === "string" ? me.json.id : "";
    const connectedAsName =
      me.ok && typeof me.json?.name === "string" ? me.json.name : "";

    // Store the user token. Clear previously selected page so the user can re-pick
    // (important if they connected different pages this time).
    const tokenDebug = {
      obtained_at: new Date().toISOString(),
      expires_in: tokenJson?.expires_in,
      token_type: tokenJson?.token_type,
      connected_as_id: connectedAsId || null,
      connected_as_name: connectedAsName || null,
    };

    await sql(
      "INSERT INTO meta_connections (business_id, user_access_token, token_debug, page_id, page_name, page_access_token, instagram_business_account_id, instagram_username, updated_at) VALUES ($1, $2, $3::jsonb, NULL, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP) ON CONFLICT (business_id) DO UPDATE SET user_access_token = EXCLUDED.user_access_token, token_debug = EXCLUDED.token_debug, page_id = NULL, page_name = NULL, page_access_token = NULL, instagram_business_account_id = NULL, instagram_username = NULL, updated_at = CURRENT_TIMESTAMP",
      [businessId, accessToken, JSON.stringify(tokenDebug)],
    );

    // Fetch Pages right away. If there's only one, auto-select it.
    const accounts = await graphGet("/me/accounts", {
      fields: "id,name,access_token",
      limit: 50,
      access_token: accessToken,
    });

    if (!accounts.ok) {
      console.error("Meta /me/accounts failed", accounts.json);
      return Response.redirect(safeDashboardRedirect(businessId, "connected"), 302);
    }

    const pages = Array.isArray(accounts.json?.data) ? accounts.json.data : [];
    const cleanedPages = pages
      .map((p) => ({
        id: typeof p?.id === "string" ? p.id : "",
        name: typeof p?.name === "string" ? p.name : "",
        access_token:
          typeof p?.access_token === "string" ? p.access_token : "",
      }))
      .filter((p) => p.id && p.name);

    if (cleanedPages.length === 1) {
      const applied = await applySelectedPage({
        businessId,
        page: cleanedPages[0],
      });

      if (applied.ok) {
        return Response.redirect(safeDashboardRedirect(businessId, "connected"), 302);
      }

      console.error("Meta applySelectedPage failed", applied.error);
      return Response.redirect(safeDashboardRedirect(businessId, "pick_page"), 302);
    }

    if (cleanedPages.length > 1) {
      return Response.redirect(safeDashboardRedirect(businessId, "pick_page"), 302);
    }

    return Response.redirect(safeDashboardRedirect(businessId, "connected"), 302);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Meta OAuth callback failed" }, { status: 500 });
  }
}
