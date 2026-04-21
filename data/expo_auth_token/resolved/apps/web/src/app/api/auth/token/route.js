import { auth } from "@/auth";
import { createMobileJwtFromSessionUser } from "@/app/api/utils/mobileJwt";

// Anything intended flow:
// Mobile exchanges the web session cookie for a JWT at this endpoint.
// This MUST NOT be cached.
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
  }
}

export async function POST() {
  // Keep parity for clients that use POST.
  return GET();
}
