import sql from "@/app/api/utils/sql";
import { verify } from "argon2";
import crypto from "crypto";
import {
  signToken,
  generateRefreshToken,
  hashRefreshToken,
} from "@/app/api/utils/jwt";
import { rateLimitMiddleware } from "@/app/api/utils/rate-limiter";
import { AUTH } from "@/app/api/utils/constants";

/**
 * POST /api/auth/login
 *
 * ✅ SECURE: Authenticated user with email/password
 * - HMAC-signed JWT tokens (not plain base64)
 * - Rate limiting
 * - Account lockout
 * - Timing attack protection
 * - Generic error messages (no enumeration)
 * - PII-safe logging (no emails in logs)
 */
export async function POST(request) {
  try {
    const rateLimitResult = rateLimitMiddleware(request, "auth");
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [lockout] = await sql`
      SELECT failed_attempts, locked_until
      FROM login_attempts
      WHERE identifier = ${normalizedEmail}
        AND ip_address = ${getClientIP(request)}
    `;

    if (lockout?.locked_until && new Date(lockout.locked_until) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(lockout.locked_until) - new Date()) / 60000,
      );
      return Response.json(
        {
          error: `Too many failed attempts. Try again in ${minutesLeft} minutes.`,
        },
        { status: 429 },
      );
    }

    const [user] = await sql`
      SELECT 
        user_id, 
        email, 
        hashed_auth_credential, 
        roles, 
        status
      FROM users 
      WHERE email = ${normalizedEmail}
    `;

    // Timing attack protection
    const dummyHash =
      "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$ZHVtbXloYXNo";
    const passwordHash = user?.hashed_auth_credential || dummyHash;

    let isValid = false;
    try {
      isValid = await verify(passwordHash, password);
    } catch {
      isValid = false;
    }

    if (!user || !user.hashed_auth_credential || !isValid || user.status !== "active") {
      await sql`
        INSERT INTO login_attempts (identifier, ip_address, failed_attempts, last_attempt_at)
        VALUES (${normalizedEmail}, ${getClientIP(request)}, 1, NOW())
        ON CONFLICT (identifier, ip_address) 
        DO UPDATE SET
          failed_attempts = login_attempts.failed_attempts + 1,
          last_attempt_at = NOW(),
          locked_until = CASE 
            WHEN login_attempts.failed_attempts + 1 >= ${AUTH.MAX_LOGIN_ATTEMPTS}
            THEN NOW() + INTERVAL '15 minutes'
            ELSE login_attempts.locked_until
          END
      `;

      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // ✅ PII-SAFE: Log with user_id only, never email
    console.log(`✅ [Login] User authenticated: ${user.user_id}`);

    await sql`
      UPDATE users 
      SET last_login_at = NOW() 
      WHERE user_id = ${user.user_id}
    `;

    await sql`
      DELETE FROM login_attempts 
      WHERE identifier = ${normalizedEmail}
    `;

    const sessionId = crypto.randomUUID();
    const accessToken = signToken(
      {
        userId: user.user_id,
        sessionId,
        email: user.email,
        roles: user.roles,
      },
      {
        expiresIn: AUTH.ACCESS_TOKEN_EXPIRY_SECONDS,
      },
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    const expiresAt = new Date(Date.now() + AUTH.ACCESS_TOKEN_EXPIRY_MS);

    const [session] = await sql`
      INSERT INTO sessions (
        session_id,
        user_id, 
        refresh_token_hash, 
        expires_at, 
        ip_metadata
      )
      VALUES (
        ${sessionId},
        ${user.user_id},
        ${refreshTokenHash},
        ${expiresAt.toISOString()},
        ${JSON.stringify({
          method: "email_login",
          ip: getClientIP(request),
          userAgent: request.headers.get("user-agent"),
          created_at: new Date().toISOString(),
        })}
      )
      RETURNING session_id
    `;

    if (!session?.session_id) {
      console.error("❌ [Login] Session creation failed for user:", user.user_id);
      return Response.json(
        { error: "Login failed. Please try again." },
        { status: 500 },
      );
    }

    console.log(`✅ [Login] Session created for user: ${user.user_id}`);

    return Response.json({
      success: true,
      token: accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      expiresIn: AUTH.ACCESS_TOKEN_EXPIRY_SECONDS,
      user: {
        user_id: user.user_id,
        email: user.email,
        roles: user.roles,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("❌ [Login] Error:", error?.message || error);
    return Response.json(
      { error: "An error occurred. Please try again." },
      { status: 500 },
    );
  }
}

function getClientIP(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}
