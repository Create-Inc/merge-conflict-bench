import sql from "@/app/api/utils/sql";

function getTokenFromRequest(request, body) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token && token !== "undefined") {
      return token;
    }
  }

  const headerToken = request.headers.get("x-session-token");
  if (headerToken) {
    const token = headerToken.trim();
    if (token && token !== "undefined") {
      return token;
    }
  }

  // Fallback for environments that might strip auth headers
  if (body?.token) {
    const token = String(body.token).trim();
    if (token && token !== "undefined") {
      return token;
    }
  }

  // Last-resort fallback (not used by the app, but handy for debugging)
  try {
    const url = new URL(request.url);
    const tokenFromQuery = url.searchParams.get("token");
    if (tokenFromQuery) {
      const token = tokenFromQuery.trim();
      if (token && token !== "undefined") {
        return token;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

async function requireUserIdFromToken(token) {
  const [session] = await sql`
    SELECT user_id
    FROM sessions
    WHERE token = ${token} AND expires_at > NOW()
  `;

  if (!session) {
    return { userId: null, error: "Invalid or expired token" };
  }

  return { userId: session.user_id, error: null };
}

// Get user's watchlist
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request, null);
    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, error } = await requireUserIdFromToken(token);
    if (!userId) {
      return Response.json({ error }, { status: 401 });
    }

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
    const body = await request.json().catch(() => ({}));
    const token = getTokenFromRequest(request, body);

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, error } = await requireUserIdFromToken(token);
    if (!userId) {
      return Response.json({ error }, { status: 401 });
    }

    const { listing_id } = body;

    if (!listing_id) {
      return Response.json(
        { error: "listing_id is required" },
        { status: 400 },
      );
    }

    const listing = await sql`
      SELECT id FROM listings 
      WHERE id = ${listing_id} AND deleted_at IS NULL
    `;

    if (listing.length === 0) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

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
    const body = await request.json().catch(() => ({}));
    const token = getTokenFromRequest(request, body);

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, error } = await requireUserIdFromToken(token);
    if (!userId) {
      return Response.json({ error }, { status: 401 });
    }

    const { listing_id } = body;

    if (!listing_id) {
      return Response.json(
        { error: "listing_id is required" },
        { status: 400 },
      );
    }

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
