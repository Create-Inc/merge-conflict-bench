import { getToken } from "@auth/core/jwt";
export async function GET(request) {
  const [token, jwt] = await Promise.all([
    getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.AUTH_URL.startsWith("https"),
      raw: true,
    }),
    getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.AUTH_URL.startsWith("https"),
    }),
  ]);

<<<<<<< ours
// Anything intended:
// Expo Web dev can't read iframe cookies from the parent page.
// So the iframe redirects here, and we postMessage the JWT back to the parent.
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
=======
  if (!jwt) {
    return new Response(
>>>>>>> theirs
      `
			<html>
				<body>
					<script>
						window.parent.postMessage({ type: 'AUTH_ERROR', error: 'Unauthorized' }, '*');
					</script>
				</body>
			</html>
			`,
      {
        status: 401,
        headers: {
          "Content-Type": "text/html",
        },
      },
    );
  }

<<<<<<< ours
export async function POST() {
  return GET();
=======
  const message = {
    type: "AUTH_SUCCESS",
    jwt: token,
    user: {
      id: jwt.sub,
      email: jwt.email,
      name: jwt.name,
    },
  };

  return new Response(
    `
		<html>
			<body>
				<script>
					window.parent.postMessage(${JSON.stringify(message)}, '*');
				</script>
			</body>
		</html>
		`,
    {
      headers: {
        "Content-Type": "text/html",
      },
    },
  );
>>>>>>> theirs
}
