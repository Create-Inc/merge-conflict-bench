import { auth } from "@/auth";
import { createMobileJwtFromSessionUser } from "@/app/api/utils/mobileJwt";

// Anything intended flow (Expo web dev only):
// iframe can't share cookies with the parent, so we postMessage the JWT.
const cacheControl = "no-store, no-cache, must-revalidate, proxy-revalidate";

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": cacheControl,
    },
  });
}

export async function GET() {
  try {
    const session = await auth();
    const sessionUser = session?.user;

    if (!sessionUser) {
      return htmlResponse(
        `
        <html>
          <body>
            <script>
              window.parent.postMessage({ type: 'AUTH_ERROR', error: 'Unauthorized' }, '*');
            </script>
          </body>
        </html>
        `,
        401,
      );
    }

    const payload = await createMobileJwtFromSessionUser(sessionUser);
    const message = {
      type: "AUTH_SUCCESS",
      jwt: payload.jwt,
      user: payload.user,
    };

    return htmlResponse(
      `
      <html>
        <body>
          <script>
            window.parent.postMessage(${JSON.stringify(message)}, '*');
          </script>
        </body>
      </html>
      `,
      200,
    );
  } catch (error) {
    console.error("GET /api/auth/expo-web-success error", error);
    return htmlResponse(
      `
      <html>
        <body>
          <script>
            window.parent.postMessage({ type: 'AUTH_ERROR', error: 'Internal Server Error' }, '*');
          </script>
        </body>
      </html>
      `,
      500,
    );
  }
}

export async function POST() {
  return GET();
}
