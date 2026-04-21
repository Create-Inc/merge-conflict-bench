import sql from "@/app/api/utils/sql";

<<<<<<< ours
function getTokenFromRequest(request, body) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      return token;
    }
  }

  const headerToken = request.headers.get("x-session-token");
  if (headerToken) {
    return headerToken.trim();
  }

  // fallback for environments that might strip auth headers
  if (body?.token) {
    return String(body.token).trim();
  }

  // last-resort fallback (not used by the app, but handy for debugging)
  try {
    const url = new URL(request.url);
    const tokenFromQuery = url.searchParams.get("token");
    if (tokenFromQuery) {
      return tokenFromQuery.trim();
    }
  } catch {
    // ignore
  }
=======
const getUserIdFromBearerToken = async (request) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const token = authHeader.substring(7);
  if (!token || token === "undefined") {
    return { error: "Unauthorized", status: 401 };
  }
>>>>>>> theirs

<<<<<<< ours
  return null;
}
=======
  const [session] = await sql`
    SELECT user_id
    FROM sessions
    WHERE token = ${token} AND expires_at > NOW()
  `;
>>>>>>> theirs

<<<<<<< ours
async function requireUserIdFromToken(token) {
  const [session] = await sql`
    SELECT user_id
    FROM sessions
    WHERE token = ${token} AND expires_at > NOW()
  `;
=======
  if (!session) {
    return { error: "Invalid or expired token", status: 401 };
  }
>>>>>>> theirs

<<<<<<< ours
  if (!session) {
    return { userId: null, error: "Invalid or expired token" };
  }
=======
  const [profile] = await sql`
    SELECT user_id
    FROM user_profiles
    WHERE user_id = ${session.user_id}
  `;
>>>>>>> theirs

<<<<<<< ours
  return { userId: session.user_id, error: null };
}

// Get user's watchlist
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request, null);
    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
=======
  if (!profile) {
    return { error: "Profile not found", status: 404 };
  }

  return { userId: profile.user_id };
};

// Get user's watchlist
export async function GET(request) {
  try {
    const auth = await getUserIdFromBearerToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
>>>>>>> theirs
    }

<<<<<<< ours
    const { userId, error } = await requireUserIdFromToken(token);
    if (!userId) {
      return Response.json({ error }, { status: 401 });
    }
=======
    const userId = auth.userId;
>>>>>>> theirs

    // Get watchlist items with listing details (exclude deleted listings)
    const watchlistItems = await sql`
      SELECT 
        w.id as watchlist_id,
        w.created_at as saved_at,
        l.*,
        up.username as seller_username,
        up.avatar_url as seller_avatar
      FROM watchlist w
      JOIN listings l ON w.listing_id = l.id
      JOIN user_profiles up ON l.seller_id = up.user_id
      WHERE w.user_id = ${userId}
        AND l.deleted_at IS NULL
      ORDER BY w.created_at DESC
    `;

    return Response.json({ watchlist: watchlistItems });
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return Response.json(
      { error: "Failed to fetch watchlist" },
      { status: 500 },
    );
  }
}

// Add item to watchlist
export async function POST(request) {
  try {
<<<<<<< ours
    const body = await request.json().catch(() => ({}));
    const token = getTokenFromRequest(request, body);

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
=======
    const auth = await getUserIdFromBearerToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
>>>>>>> theirs
    }

<<<<<<< ours
    const { userId, error } = await requireUserIdFromToken(token);
    if (!userId) {
      return Response.json({ error }, { status: 401 });
    }

    const { listing_id } = body;
=======
    const userId = auth.userId;
    const { listing_id } = await request.json();
>>>>>>> theirs

    if (!listing_id) {
      return Response.json(
        { error: "listing_id is required" },
        { status: 400 },
      );
    }

    // Check if listing exists and is not deleted
    const listing = await sql`
      SELECT id FROM listings 
      WHERE id = ${listing_id} AND deleted_at IS NULL
    `;

    if (listing.length === 0) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    // Add to watchlist (ON CONFLICT DO NOTHING to handle duplicates gracefully)
    await sql`
      INSERT INTO watchlist (user_id, listing_id)
      VALUES (${userId}, ${listing_id})
      ON CONFLICT (user_id, listing_id) DO NOTHING
    `;

    return Response.json({ success: true, message: "Added to watchlist" });
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return Response.json(
      { error: "Failed to add to watchlist" },
      { status: 500 },
    );
  }
}

// Remove item from watchlist
export async function DELETE(request) {
  try {
<<<<<<< ours
    const body = await request.json().catch(() => ({}));
    const token = getTokenFromRequest(request, body);

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
=======
    const auth = await getUserIdFromBearerToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
>>>>>>> theirs
    }

<<<<<<< ours
    const { userId, error } = await requireUserIdFromToken(token);
    if (!userId) {
      return Response.json({ error }, { status: 401 });
    }

    const { listing_id } = body;
=======
    const userId = auth.userId;
    const { listing_id } = await request.json();
>>>>>>> theirs

    if (!listing_id) {
      return Response.json(
        { error: "listing_id is required" },
        { status: 400 },
      );
    }

    // Remove from watchlist
    await sql`
      DELETE FROM watchlist
      WHERE user_id = ${userId} AND listing_id = ${listing_id}
    `;

    return Response.json({ success: true, message: "Removed from watchlist" });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return Response.json(
      { error: "Failed to remove from watchlist" },
      { status: 500 },
    );
  }
}
