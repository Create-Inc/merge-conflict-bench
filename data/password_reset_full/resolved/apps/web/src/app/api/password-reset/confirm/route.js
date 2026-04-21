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

    const hashed = await hash(password);

    // Single-statement reset:
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
        SELECT (SELECT COUNT(*) FROM token_row) AS token_ok;`,
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
