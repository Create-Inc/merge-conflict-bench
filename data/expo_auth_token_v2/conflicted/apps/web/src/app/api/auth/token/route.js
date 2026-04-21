import { getToken } from "@auth/core/jwt";

function safeRequestUrl(request) {
  // In some runtime environments, request.url may be relative.
  // new URL(relative) throws, which can cause the platform to return a bare "null" body.
  const fallbackBase =
    process.env.APP_URL ||
    process.env.AUTH_URL ||
    process.env.EXPO_PUBLIC_BASE_URL ||
    "https://localhost";

  try {
    return new URL(request.url);
  } catch (_) {
    return new URL(request.url, fallbackBase);
  }
}

function isSecureRequest(request) {
  try {
    return safeRequestUrl(request).protocol === "https:";
  } catch (_) {
    return !!process.env.AUTH_URL && process.env.AUTH_URL.startsWith("https");
  }
}

function htmlWithPostMessage(message) {
  const safe = JSON.stringify(message);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Signing you in…</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial; padding: 24px;">
    <div style="font-size: 16px;">Signing you in…</div>
    <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">You can close this window if it doesn’t close automatically.</div>
    <script>
      (function(){
        var msg = ${safe};
        function post(){
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify(msg));
            }
          } catch (e) {}
          try {
            if (window.parent && window.parent.postMessage) {
              window.parent.postMessage(msg, '*');
            }
          } catch (e) {}
        }
        post();
        setTimeout(post, 50);
        setTimeout(post, 250);
        setTimeout(post, 1000);
      })();
    </script>
  </body>
</html>`;
}

function safeParseUrl(rawUrl) {
  try {
    return new URL(rawUrl);
  } catch (_) {
    const base = process.env.APP_URL || process.env.AUTH_URL;
    if (!base) return null;
    try {
      return new URL(rawUrl, base);
    } catch (_) {
      return null;
    }
  }
}

export async function GET(request) {
  try {
<<<<<<< ours
    // Use a safe URL parser because in some runtimes request.url may be relative.
    const urlObj = safeParseUrl(request.url);

    // Compute secureCookie based on the incoming request URL when possible.
    let isSecure = false;
    if (urlObj?.protocol) {
      isSecure = urlObj.protocol === "https:";
    } else {
      isSecure =
        !!process.env.AUTH_URL && process.env.AUTH_URL.startsWith("https");
    }
=======
    // IMPORTANT:
    // GET is used as a browser/WebView navigation target (the callbackUrl in mobile auth).
    // In iOS WKWebView, if this endpoint returns JSON (or bare `null`), JS may not run,
    // and the app never receives AUTH_SUCCESS.
    // So: for GET, ALWAYS return an HTML document that posts a message.
>>>>>>> theirs

    const secureCookie = isSecureRequest(request);

    const [token, jwt] = await Promise.all([
      getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie,
        raw: true,
      }),
      getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie,
      }),
    ]);

<<<<<<< ours
    const format = (urlObj?.searchParams.get("format") || "").toLowerCase();
=======
    if (!jwt) {
      return new Response(
        htmlWithPostMessage({
          type: "AUTH_ERROR",
          error: "Unauthorized",
          details: "No session cookie/token found on callback.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "no-store",
          },
        },
      );
    }
>>>>>>> theirs

    if (!token) {
      return new Response(
        htmlWithPostMessage({
          type: "AUTH_ERROR",
          error: "TokenExchangeFailed",
          details: "Session decoded, but raw token string was not available.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return new Response(
      htmlWithPostMessage({
        type: "AUTH_SUCCESS",
        jwt: token,
        user: {
          id: jwt.sub,
          email: jwt.email,
          name: jwt.name,
        },
      }),
      {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    console.error("GET /api/auth/token error", err);

<<<<<<< ours
    const commonHeaders = wantsHtml
      ? {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        }
      : {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        };

=======
    return new Response(
      htmlWithPostMessage({
        type: "AUTH_ERROR",
        error: "InternalError",
        details: err?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

export async function POST(request) {
  try {
    // POST is for programmatic token exchange (returns JSON).
    const secureCookie = isSecureRequest(request);

    const [token, jwt] = await Promise.all([
      getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie,
        raw: true,
      }),
      getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie,
      }),
    ]);

>>>>>>> theirs
    if (!jwt) {
<<<<<<< ours
      if (wantsHtml) {
        return new Response(
          htmlWithPostMessage({
            type: "AUTH_ERROR",
            error: "Unauthorized",
            details: "No session cookie/token found on callback.",
          }),
          { status: 401, headers: commonHeaders },
        );
      }

=======

>>>>>>> theirs
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
<<<<<<< ours
        headers: commonHeaders,
=======
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
>>>>>>> theirs
      });
    }

    if (!token) {
<<<<<<< ours
      if (wantsHtml) {
        return new Response(
          htmlWithPostMessage({
            type: "AUTH_ERROR",
            error: "TokenExchangeFailed",
            details: "Session decoded, but raw token string was not available.",
          }),
          { status: 500, headers: commonHeaders },
        );
      }

=======

>>>>>>> theirs
      return new Response(
        JSON.stringify({
          error: "TokenExchangeFailed",
          details: "Session decoded, but raw token string was not available.",
        }),
        {
          status: 500,
<<<<<<< ours
          headers: commonHeaders,
=======
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
>>>>>>> theirs
        },
      );
    }

<<<<<<< ours
    const payload = {
      jwt: token,
      user: {
        id: jwt.sub,
        email: jwt.email,
        name: jwt.name,
      },
    };

    if (wantsHtml) {
      return new Response(
        htmlWithPostMessage({ type: "AUTH_SUCCESS", ...payload }),
        {
          headers: commonHeaders,
=======
    return new Response(
      JSON.stringify({
        jwt: token,
        user: { id: jwt.sub, email: jwt.email, name: jwt.name },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
>>>>>>> theirs
        },
<<<<<<< ours
      );
    }

    return new Response(JSON.stringify(payload), { headers: commonHeaders });
=======
      },
    );
>>>>>>> theirs
  } catch (err) {
    console.error("POST /api/auth/token error", err);

<<<<<<< ours
    // Avoid throwing inside the error handler (request.url may be relative).
    const urlObj = safeParseUrl(request.url);
    const format = (urlObj?.searchParams.get("format") || "").toLowerCase();
    const accept = (request.headers.get("accept") || "").toLowerCase();
    const secFetchDest = (
      request.headers.get("sec-fetch-dest") || ""
    ).toLowerCase();

    const wantsHtml =
      format === "html" ||
      accept.includes("text/html") ||
      secFetchDest === "document" ||
      String(request.url || "").includes("format=html");

    if (wantsHtml) {
      return new Response(
        htmlWithPostMessage({
          type: "AUTH_ERROR",
          error: "InternalError",
          details: err?.message || "Unknown error",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        },
      );
    }

=======

>>>>>>> theirs
    return new Response(
      JSON.stringify({ error: "InternalError", details: err?.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
