/**
 * Get session from request
 *
 * NOTE: Auth.js can store sessions as encrypted JWTs (not just DB session tokens).
 * Instead of trying to parse cookies ourselves, we delegate to the platform's
 * auth() helper and then hydrate the user from our auth_users table.
 */

import sql from "./sql.js";
import { auth } from "@/auth";

<<<<<<< ours
// NOTE: Anything uses Auth.js (CreateAuth) sessions. In our project, the cookie
// value may be an encrypted token (not a raw DB sessionToken), so we rely on
// `auth()` to validate it.
export async function getSessionFromRequest(_request) {
=======
export async function getSessionFromRequest(_request) {
>>>>>>> theirs
  try {
<<<<<<< ours
    const session = await auth();

    const sessionUser = session?.user ?? null;
    if (!sessionUser?.id && !sessionUser?.email) {
=======
    const session = await auth();
    const rawId = session?.user?.id;

    if (!session || rawId === undefined || rawId === null) {
>>>>>>> theirs
      return null;
    }

<<<<<<< ours
    // Hydrate the full user row (role, 2FA flags, etc.) from the database.
    let userId = sessionUser.id;
    if (typeof userId === "string") {
      const parsed = Number.parseInt(userId, 10);
      if (Number.isFinite(parsed)) {
        userId = parsed;
      }
=======
    const userId =
      typeof rawId === "string" ? parseInt(rawId, 10) : Number(rawId);

    if (!Number.isFinite(userId)) {
      return null;
>>>>>>> theirs
    }

<<<<<<< ours
    let dbUser = null;
=======
    const rows = await sql`
      SELECT
        id,
        email,
        name,
        role,
        two_factor_enabled,
        locked_until,
        failed_login_attempts
      FROM auth_users
      WHERE id = ${userId}
      LIMIT 1
    `;
>>>>>>> theirs

<<<<<<< ours
    if (typeof userId === "number" && Number.isFinite(userId)) {
      const rows = await sql`
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
      dbUser = rows?.[0] ?? null;
    } else if (typeof sessionUser.email === "string") {
      const rows = await sql`
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
      dbUser = rows?.[0] ?? null;
=======
    if (!rows || rows.length === 0) {
      return null;
>>>>>>> theirs
    }

<<<<<<< ours
    // If the account is temporarily locked, treat it as no session.
    if (dbUser?.locked_until && new Date(dbUser.locked_until) > new Date()) {
=======
    const userRow = rows[0];

    if (userRow.locked_until && new Date(userRow.locked_until) > new Date()) {
>>>>>>> theirs
      return null;
    }

    const mergedUser = {
      ...sessionUser,
      ...(dbUser ?? {}),
    };

    return {
<<<<<<< ours
      ...session,
      user: mergedUser,
=======
      user: {
        id: userRow.id,
        email: userRow.email ?? session.user?.email,
        name: userRow.name ?? session.user?.name,
        role: userRow.role,
        two_factor_enabled: userRow.two_factor_enabled,
      },
      expires: session.expires,
>>>>>>> theirs
    };
  } catch (err) {
    console.error("Get session error:", err);
    return null;
  }
}
