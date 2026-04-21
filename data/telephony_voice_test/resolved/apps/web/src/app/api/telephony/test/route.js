import { getTelephonyStatus } from "@/app/api/utils/telephony";

export async function GET() {
  try {
    console.log("=== Testing Telephony Configuration (Flagman) ===");

    const status = getTelephonyStatus();

    // For Flagman, we don't have a documented "ping" endpoint available here.
    // So we validate configuration and return what the app will use.
    if (!status.provider) {
      return Response.json(
        {
          success: false,
          error: "Flagman Telecom is not configured",
          status,
          instructions:
            "Set Flagman secrets (FLAGMAN_SMS_URL, FLAGMAN_FROM_NUMBER, FLAGMAN_API_TOKEN_ID, FLAGMAN_API_GENERATE_TOKEN).",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      message: "✓ Telephony is configured (Flagman)",
      status,
    });
  } catch (error) {
    console.error("Error testing telephony configuration:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to test telephony configuration",
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}
