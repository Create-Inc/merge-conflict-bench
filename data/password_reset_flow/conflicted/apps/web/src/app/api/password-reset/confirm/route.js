<<<<<<< ours
import sql from "@/app/api/utils/sql";
import { hash } from "argon2";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

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

    const tokens = await sql(
      `
        SELECT token, user_id, used, expires_at
        FROM password_reset_tokens
        WHERE token = $1
          AND used = false
          AND expires_at > now()
        LIMIT 1
      `,
      [token],
    );

    const row = tokens?.[0] || null;
    if (!row?.user_id) {
      return Response.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    const userId = Number(row.user_id);
    const hashed = await hash(password);

    await sql.transaction((txn) => [
      // Update existing credentials account if it exists.
      txn(
        `
          UPDATE auth_accounts
          SET password = $1
          WHERE "userId" = $2
            AND provider = 'credentials'
        `,
        [hashed, userId],
      ),
      // If it didn't exist, insert it (safe even if it already exists).
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
            SELECT 1 FROM auth_accounts WHERE "userId" = $1 AND provider = 'credentials'
          )
        `,
        [userId, String(userId), hashed],
      ),
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
  } catch (e) {
    console.error("POST /api/password-reset/confirm error", e);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
=======
import argon2 from "argon2";
import sql from "@/app/api/utils/sql";

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

    const rows = await sql`
      SELECT token, user_id
      FROM password_reset_tokens
      WHERE token = ${token}
        AND used = false
        AND expires_at > now()
      LIMIT 1
    `;

    const reset = rows?.[0] || null;
    if (!reset) {
      return Response.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    const hashedPassword = await argon2.hash(password);

    await sql.transaction([
      sql`
        UPDATE auth_accounts
        SET password = ${hashedPassword}
        WHERE "userId" = ${reset.user_id}
          AND provider = 'credentials'
          AND type = 'credentials'
      `,
      sql`
        UPDATE password_reset_tokens
        SET used = true
        WHERE token = ${token}
      `,
    ]);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/password-reset/confirm error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
>>>>>>> theirs
