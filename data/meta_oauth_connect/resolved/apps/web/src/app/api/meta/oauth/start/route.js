import crypto from "crypto";
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
    // AUTH_SECRET is set by the platform. If it's not present, fail safely.
    throw new Error("AUTH_SECRET is not configured");
  }
  return base64UrlEncode(
    crypto.createHmac("sha256", secret).update(payloadB64).digest(),
  );
}

function safeDashboardRedirect(businessId, metaState) {
  const id = encodeURIComponent(String(businessId));
  const m = encodeURIComponent(String(metaState || ""));
  return `/dashboard/${id}?tab=profile&meta=${m}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessIdRaw = searchParams.get("businessId");
    const businessId = businessIdRaw ? Number(businessIdRaw) : null;

    if (!businessId || Number.isNaN(businessId)) {
      return Response.json(
        { error: "businessId is required" },
        { status: 400 },
      );
    }

    const access = await requireBusinessAccess(request, businessId);
    if (!access.ok) {
      // If the user navigated here via a normal link click, don't strand them on a JSON API page.
      const accept = request.headers.get("accept") || "";
      const wantsHtml = accept.includes("text/html");
      const status = access?.response?.status;

      if (wantsHtml) {
        if (status === 401) {
          // Send them to sign in, then resume the connect flow.
          const cb = `/api/meta/oauth/start?businessId=${encodeURIComponent(String(businessId))}`;
          return Response.redirect(
            `/account/signin?callbackUrl=${encodeURIComponent(cb)}`,
            302,
          );
        }

        if (status === 403) {
          return Response.redirect(
            safeDashboardRedirect(businessId, "forbidden"),
            302,
          );
        }

        return Response.redirect(safeDashboardRedirect(businessId, "error"), 302);
      }

      return access.response;
    }

    const appId = process.env.META_APP_ID;
    if (!appId) {
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
            "META_APP_ID is not set. Add it in Project Settings → Secrets (dev + prod).",
        },
        { status: 500 },
      );
    }

    // Backend-only secret
    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
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
            "META_APP_SECRET is not set. Add it in Project Settings → Secrets (dev + prod).",
        },
        { status: 500 },
      );
    }

    const baseUrl = getAppUrl(request);
    const redirectUri = `${baseUrl}/api/meta/oauth/callback`;

    const payload = {
      businessId: String(businessId),
      nonce: crypto.randomBytes(16).toString("hex"),
      ts: Date.now(),
      redirectUri,
    };

    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const sig = signState(payloadB64);
    const state = `${payloadB64}.${sig}`;

    // Note: Meta might require app review for some of these for non-admin users.
    // Keep the list aligned with what you actually use.
    const scope = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ].join(",");

    const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);

    // Helpful for testing + re-connecting after changing scopes.
    url.searchParams.set("auth_type", "rerequest");

    return Response.redirect(url.toString(), 302);
  } catch (e) {
    console.error(e);

    // Best-effort: send them back somewhere usable.
    try {
      const { searchParams } = new URL(request.url);
      const businessId = searchParams.get("businessId");
      if (businessId) {
        return Response.redirect(safeDashboardRedirect(businessId, "error"), 302);
      }
    } catch (err) {
      // ignore
    }

    return Response.json(
      { error: "Failed to start Meta OAuth" },
      { status: 500 },
    );
  }
}

// Exported for reuse in callback route
export const __stateUtils = { base64UrlDecode, signState };
