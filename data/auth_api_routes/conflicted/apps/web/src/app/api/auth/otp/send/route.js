import sql from "@/app/api/utils/sql";
import crypto from "crypto";

// POST /api/auth/otp/send - Send OTP to phone number
export async function POST(request) {
  try {
    const body = await request.json();
    const { phone_e164 } = body;

    if (!phone_e164) {
      return Response.json(
        { error: "phone_e164 is required" },
        { status: 400 },
      );
    }

    // Validate E.164 format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone_e164)) {
      return Response.json(
        {
          error:
            "Invalid phone number format. Use E.164 format (e.g., +12125551234)",
        },
        { status: 400 },
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in sessions table temporarily
    const sessionId = crypto.randomUUID();
    await sql`
      INSERT INTO sessions (session_id, refresh_token_hash, expires_at, ip_metadata)
      VALUES (
        ${sessionId},
        ${otp},
        ${expiresAt.toISOString()},
        ${JSON.stringify({ type: "otp_pending", phone_e164 })}
      )
    `;

<<<<<<< ours
    if (process.env.NODE_ENV !== "production") {
      console.log(`[OTP][DEV] Send to ${phone_e164}: ${otp}`);
    }
=======
    // In production, send SMS via Twilio/SNS
    // TODO: Integrate with Twilio SMS API
    console.log(`[OTP] Sent to phone ending in ***${phone_e164.slice(-4)}`);
>>>>>>> theirs

<<<<<<< ours
    const responseBody = {
=======
    // ✅ SECURITY: Never expose OTP in production responses
    const response = {
      success: true,
>>>>>>> theirs
      session_id: sessionId,
      expires_at: expiresAt.toISOString(),
<<<<<<< ours
    };

    // DEV ONLY: returning OTP makes local testing easier, but must never ship to prod.
    if (process.env.NODE_ENV !== "production") {
      responseBody.debug_otp = otp;
    }

    return Response.json(responseBody);
=======
      message: "OTP sent successfully",
    };

    // Only include debug OTP in development (NEVER in production)
    if (process.env.NODE_ENV !== "production") {
      response.debug_otp = otp;
      response.warning = "DEBUG ONLY - OTP exposed for testing";
    }

    return Response.json(response);
>>>>>>> theirs
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    return Response.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
