/**
 * Get session from request
 *
 * NOTE: Auth.js can store sessions as encrypted JWTs (not just DB session tokens).
 * Instead of trying to parse cookies ourselves, we delegate to the platform's
 * auth() helper and then hydrate the user from our auth_users table.
 */

import sql from "./sql.js";
import { auth } from "@/auth";

export async function getSessionFromRequest(_request) {
  try {
    const session = await auth();
    const sessionUser = session?.user ?? null;

    if (!sessionUser?.id && !sessionUser?.email) {
      return null;
    }

    let userId = sessionUser.id;
    if (typeof userId === "string") {
      const parsed = Number.parseInt(userId, 10);
      if (Number.isFinite(parsed)) {
        userId = parsed;
      }
    }

    let rows = [];

    if (typeof userId === "number" && Number.isFinite(userId)) {
      rows = await sql`
        SELECT
          id,
          email,
          name,
          role,
          approved,
          approved_at,
          terms_accepted_at,
          two_factor_enabled,
          two_factor_verified_at,
          locked_until,
          failed_login_attempts
        FROM auth_users
        WHERE id = ${userId}
        LIMIT 1
      `;
    } else if (typeof sessionUser.email === "string") {
      rows = await sql`
        SELECT
          id,
          email,
          name,
          role,
          approved,
          approved_at,
          terms_accepted_at,
          two_factor_enabled,
          two_factor_verified_at,
          locked_until,
          failed_login_attempts
        FROM auth_users
        WHERE email = ${sessionUser.email}
        LIMIT 1
      `;
    }

    const userRow = rows?.[0] ?? null;

    // If we can't find a DB row, still return the Auth.js session.
    if (!userRow) {
      return session;
    }

    // If the account is temporarily locked, treat it as no session.
    if (userRow.locked_until && new Date(userRow.locked_until) > new Date()) {
      return null;
    }

    return {
      ...session,
      user: {
        ...sessionUser,
        ...userRow,
      },
    };
  } catch (err) {
    console.error("Get session error:", err);
    return null;
  }
}
