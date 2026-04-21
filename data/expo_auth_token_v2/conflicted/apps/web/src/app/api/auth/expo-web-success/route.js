import { getToken } from "@auth/core/jwt";

function safeRequestUrl(request) {
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
<<<<<<< ours
  const urlObj = safeParseUrl(request.url);

  // Compute secureCookie based on request URL when possible to avoid cookie-name mismatches.
  const isSecure = urlObj?.protocol
    ? urlObj.protocol === "https:"
    : !!process.env.AUTH_URL && process.env.AUTH_URL.startsWith("https");

=======
  const reqUrl = safeRequestUrl(request);
  const isSecure = reqUrl.protocol === "https:";

>>>>>>> theirs
  const [token, jwt] = await Promise.all([
    getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: isSecure,
      raw: true,
    }),
    getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: isSecure,
    }),
  ]);

  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  };

  if (!jwt) {
    return new Response(
      htmlWithPostMessage({
        type: "AUTH_ERROR",
        error: "Unauthorized",
        details: "No session cookie/token found on callback.",
      }),
      {
        status: 401,
<<<<<<< ours
        headers,
=======
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
        },
>>>>>>> theirs
      },
    );
  }

<<<<<<< ours
  if (!token) {
    return new Response(
      htmlWithPostMessage({
        type: "AUTH_ERROR",
        error: "TokenExchangeFailed",
        details: "Session decoded, but raw token string was not available.",
      }),
      {
        status: 500,
        headers,
      },
    );
  }

=======
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

>>>>>>> theirs
  const message = {
    type: "AUTH_SUCCESS",
    jwt: token,
    user: {
      id: jwt.sub,
      email: jwt.email,
      name: jwt.name,
    },
  };

  return new Response(htmlWithPostMessage(message), {
<<<<<<< ours
    headers,
=======
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-store",
    },
>>>>>>> theirs
  });
}
