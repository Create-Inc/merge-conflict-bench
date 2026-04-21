<<<<<<< ours
import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";

    if (!slug) {
      return Response.json(
        { ok: false, error: "Missing slug" },
        { status: 400 },
      );
    }

    const rows = await sql(
      "SELECT id, active FROM products WHERE slug = $1 LIMIT 1",
      [slug],
    );

    const product = rows?.[0] || null;
    if (!product || product.active !== true) {
      // Don't leak which slugs exist; just no-op.
      return Response.json({ ok: true, skipped: true });
    }

    const session = await auth();
    const userIdRaw = session?.user?.id;
    const userId = Number(userIdRaw);
    const safeUserId = Number.isFinite(userId) ? userId : null;

    await sql(
      "INSERT INTO product_view_events (product_id, user_id) VALUES ($1, $2)",
      [product.id, safeUserId],
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/product-views error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
=======
import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

function safeInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.floor(n);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";

    if (!slug) {
      return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    const rows = await sql(
      "SELECT id FROM products WHERE slug = $1 AND active = true LIMIT 1",
      [slug],
    );

    const productId = rows?.[0]?.id;
    if (!productId) {
      // Don't leak inactive/unlisted products
      return Response.json({ ok: true, skipped: true });
    }

    const session = await auth();
    const userIdRaw = session?.user?.id;
    const userId = Number.isFinite(Number(userIdRaw))
      ? safeInt(userIdRaw, null)
      : null;

    await sql(
      "INSERT INTO product_view_events (product_id, user_id) VALUES ($1, $2)",
      [productId, userId],
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/product-views error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
>>>>>>> theirs
