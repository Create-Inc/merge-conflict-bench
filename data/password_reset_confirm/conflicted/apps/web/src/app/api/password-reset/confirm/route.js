<<<<<<< ours
import sql from "@/app/api/utils/sql";
import argon2 from "argon2";

export async function POST(request) {
  try {
    const body = await request.json();
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
          (SELECT user_id FROM token_row) AS user_id,
          COALESCE((SELECT id FROM updated), (SELECT id FROM inserted)) AS account_id,
          (SELECT COUNT(*) FROM token_row) AS token_ok;`,
      [token, hashed],
    );

    const result = rows?.[0] || null;
    const tokenOk = Number(result?.token_ok || 0);

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
=======
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

    if (password.trim().length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const rows = await sql(
      `
        SELECT token, user_id
        FROM password_reset_tokens
        WHERE token = $1
          AND used = false
          AND expires_at > now()
        LIMIT 1
      `,
      [token],
    );

    const reset = rows?.[0] || null;
    if (!reset?.user_id) {
      return Response.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    const userId = Number(reset.user_id);
    const hashedPassword = await hash(password);

    await sql.transaction((txn) => [
      // Update if exists
      txn(
        `
          UPDATE auth_accounts
          SET password = $1
          WHERE "userId" = $2
            AND provider = 'credentials'
            AND type = 'credentials'
        `,
        [hashedPassword, userId],
      ),
      // Insert if missing
      txn(
        `
          INSERT INTO auth_accounts (
            "userId",
            type,
            provider,
            "providerAccountId",
            password
          )
          SELECT $1, 'credentials', 'credentials', $2, $3
          WHERE NOT EXISTS (
            SELECT 1 FROM auth_accounts WHERE "userId" = $1 AND provider = 'credentials' AND type = 'credentials'
          )
        `,
        [userId, String(userId), hashedPassword],
      ),
      // Mark token used
      txn(
        `
          UPDATE password_reset_tokens
          SET used = true
          WHERE token = $1
        `,
        [token],
      ),
    ]);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/password-reset/confirm error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
>>>>>>> theirs
