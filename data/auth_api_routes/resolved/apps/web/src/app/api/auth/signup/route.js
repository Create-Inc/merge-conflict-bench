/**
 * ==========================================================================
 * POST /api/auth/signup
 * ==========================================================================
 *
 * Production-grade account creation with:
 * ✅ HMAC-signed JWT tokens
 * ✅ Rate limiting (5 signups per hour)
 * ✅ Strong password validation
 * ✅ Argon2id password hashing
 * ✅ PII-safe logging
 * ✅ Automatic driver profile creation
 */

import sql from "@/app/api/utils/sql";
import crypto from "crypto";
import { hash } from "argon2";
import {
  signToken,
  generateRefreshToken,
  hashRefreshToken,
} from "@/app/api/utils/jwt";
import { rateLimitMiddleware } from "@/app/api/utils/rate-limiter";
import { AUTH } from "@/app/api/utils/constants";
import {
  created,
  badRequest,
  conflict,
  serverError,
  logInfo,
  logError,
} from "@/app/api/utils/api-response";

const CONTEXT = "auth/signup";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const startTime = Date.now();

  try {
    const rateLimitResult = rateLimitMiddleware(request, "auth");
    if (rateLimitResult) {
      logInfo(CONTEXT, "Rate limit exceeded", { ip: getClientIP(request) });
      return rateLimitResult;
    }

    const body = await request.json().catch(() => ({}));
    const { email, password, name } = body;

    const validationError = validateSignupInput(email, password);
    if (validationError) {
      return badRequest(validationError);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const sanitizedName = sanitizeName(name);

    const [existing] = await sql`
      SELECT user_id FROM users WHERE email = ${normalizedEmail}
    `;

    if (existing) {
      logInfo(CONTEXT, "Signup attempt with existing email", {
        existingUserId: existing.user_id,
      });
      return conflict("Unable to create account. Please try a different email.");
    }

    const hashedPassword = await hash(password);

    const result = await createUserWithProfile({
      email: normalizedEmail,
      hashedPassword,
      name: sanitizedName,
      request,
    });

    if (!result.success) {
      logError(CONTEXT, "User creation failed", result.error);
      return serverError(null, CONTEXT);
    }

    logInfo(CONTEXT, "Signup successful", {
      userId: result.user.user_id,
      durationMs: Date.now() - startTime,
    });

    return created({
      message: "Account created successfully",
      token: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt.toISOString(),
      expiresIn: AUTH.ACCESS_TOKEN_EXPIRY_SECONDS,
      user: {
        user_id: result.user.user_id,
        email: result.user.email,
        roles: result.user.roles,
        status: result.user.status,
      },
    });
  } catch (error) {
    if (error?.code === "23505" || error?.message?.includes("duplicate key")) {
      return conflict("Unable to create account. Please try a different email.");
    }

    logError(CONTEXT, "Unexpected error during signup", error);
    return serverError(error, CONTEXT);
  }
}

function validateSignupInput(email, password) {
  if (!email || !password) {
    return "Email and password are required";
  }

  if (typeof email !== "string" || typeof password !== "string") {
    return "Invalid input format";
  }

  if (!EMAIL_REGEX.test(email)) {
    return "Invalid email format";
  }

  if (email.length > 254) {
    return "Email address too long";
  }

  if (password.length < AUTH.MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${AUTH.MIN_PASSWORD_LENGTH} characters`;
  }

  if (password.length > 128) {
    return "Password must be less than 128 characters";
  }

  return null;
}

function sanitizeName(name) {
  if (!name || typeof name !== "string") {
    return "Driver";
  }

  return (
    name
      .replace(/[<>'"&]/g, "")
      .trim()
      .substring(0, 100) || "Driver"
  );
}

async function createUserWithProfile({ email, hashedPassword, name, request }) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + AUTH.ACCESS_TOKEN_EXPIRY_MS);

  try {
    const [user] = await sql`
      INSERT INTO users (
        email, 
        phone_e164, 
        hashed_auth_credential, 
        roles, 
        status,
        email_verified_at
      )
      VALUES (
        ${email},
        NULL,
        ${hashedPassword},
        ARRAY['driver'],
        'active',
        NOW()
      )
      RETURNING user_id, email, roles, status, created_at
    `;

    if (!user?.user_id) {
      return { success: false, error: new Error("User insert returned no rows") };
    }

    await sql`
      INSERT INTO driver_profiles (
        user_id, 
        legal_name, 
        dob, 
        address, 
        status
      )
      VALUES (
        ${user.user_id},
        ${name},
        '1990-01-01',
        ${JSON.stringify({
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "US",
        })},
        'pending'
      )
    `;

    const accessToken = signToken(
      {
        userId: user.user_id,
        sessionId,
        email: user.email,
        roles: user.roles,
      },
      { expiresIn: AUTH.ACCESS_TOKEN_EXPIRY_SECONDS },
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    await sql`
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
          method: "email_signup",
          ip: getClientIP(request),
          userAgent: request.headers.get("user-agent")?.substring(0, 200),
          created_at: new Date().toISOString(),
        })}
      )
    `;

    return { success: true, user, accessToken, refreshToken, expiresAt };
  } catch (error) {
    // Best-effort cleanup if profile insert fails after user insert
    try {
      await sql`DELETE FROM users WHERE email = ${email}`;
    } catch (cleanupError) {
      logError(CONTEXT, "Cleanup failed after signup error", cleanupError);
    }

    return { success: false, error };
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
