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
// - Mobile devices exchange the web session cookie for a JWT at /api/auth/token
// - This route must NOT be cached.
const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

export async function GET() {
  try {
    const session = await auth();
    const sessionUser = session?.user;

    if (!sessionUser) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: noStoreHeaders },
      );
    }

    const payload = await createMobileJwtFromSessionUser(sessionUser);
    return Response.json(payload, { headers: noStoreHeaders });
  } catch (error) {
    console.error("GET /api/auth/token error", error);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500, headers: noStoreHeaders },
    );
=======
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
>>>>>>> theirs
  }

<<<<<<< ours
export async function POST() {
  // Some clients use POST; keep parity.
  return GET();
=======
  return new Response(
    JSON.stringify({
      jwt: token,
      user: {
        id: jwt.sub,
        email: jwt.email,
        name: jwt.name,
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
>>>>>>> theirs
}
