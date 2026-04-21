<<<<<<< ours
import sql from "@/app/api/utils/sql";
import { hash } from "argon2";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body?.token || "").trim();
    const password = String(body?.password || "");

    if (!token || !password) {
      return Response.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const tokenRows = await sql(
      "SELECT token, user_id, used, expires_at FROM password_reset_tokens WHERE token = $1 LIMIT 1",
      [token],
    );

    const resetRow = tokenRows?.[0] || null;
    if (!resetRow) {
      return Response.json({ error: "Invalid reset link" }, { status: 400 });
    }

    if (resetRow.used) {
      return Response.json(
        { error: "This reset link was already used" },
        { status: 400 },
      );
    }

    // Expires check in SQL to avoid timezone issues
    const validRows = await sql(
      "SELECT 1 FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW() LIMIT 1",
      [token],
    );

    if (!validRows?.length) {
      return Response.json(
        { error: "This reset link has expired" },
        { status: 400 },
      );
    }

    const hashed = await hash(password);
    const userId = resetRow.user_id;

    // Update credentials password, or create a credentials account if it doesn't exist.
    await sql(
      `WITH updated AS (
        UPDATE auth_accounts
        SET password = $1
        WHERE "userId" = $2 AND provider = 'credentials'
        RETURNING id
      )
      INSERT INTO auth_accounts (
        "userId",
        type,
        provider,
        "providerAccountId",
        password
      )
      SELECT $2, 'credentials', 'credentials', $3, $1
      WHERE NOT EXISTS (SELECT 1 FROM updated);`,
      [hashed, userId, String(userId)],
    );

    await sql("UPDATE password_reset_tokens SET used = true WHERE token = $1", [
      token,
    ]);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("POST /api/password-reset/confirm error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
=======
import sql from "@/app/api/utils/sql";
import argon2 from "argon2";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body?.token || "").trim();
    const password = String(body?.password || "");

    if (!token || !password) {
      return Response.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const hashed = await argon2.hash(password);

    // Single-statement transactional reset:
    // - validate token (unused + unexpired)
    // - mark token used
    // - update existing credentials password OR insert credentials account if missing
    const rows = await sql(
      `WITH token_row AS (
          SELECT user_id
          FROM password_reset_tokens
          WHERE token = $1
            AND used = false
            AND expires_at > NOW()
          FOR UPDATE
        ),
        mark_used AS (
          UPDATE password_reset_tokens
          SET used = true
          WHERE token = $1
            AND EXISTS (SELECT 1 FROM token_row)
          RETURNING user_id
        ),
        updated AS (
          UPDATE auth_accounts
          SET password = $2
          WHERE "userId" = (SELECT user_id FROM token_row)
            AND provider = 'credentials'
          RETURNING id
        ),
        inserted AS (
          INSERT INTO auth_accounts ("userId", type, provider, "providerAccountId", password)
          SELECT (SELECT user_id FROM token_row), 'credentials', 'credentials', (SELECT user_id FROM token_row)::text, $2
          WHERE EXISTS (SELECT 1 FROM token_row)
            AND NOT EXISTS (SELECT 1 FROM updated)
          RETURNING id
        )
        SELECT
          (SELECT COUNT(*) FROM token_row) AS token_ok;`,
      [token, hashed],
    );

    const tokenOk = Number(rows?.[0]?.token_ok || 0);

    if (!tokenOk) {
      return Response.json(
        {
          error:
            "That reset link is invalid or expired. Please request a new one.",
        },
        { status: 400 },
      );
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("POST /api/password-reset/confirm error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
>>>>>>> theirs
