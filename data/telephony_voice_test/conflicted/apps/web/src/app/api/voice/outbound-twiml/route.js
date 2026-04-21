export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const message =
      searchParams.get("message") || "Hello, this is Praz Pure Water calling.";

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${message}</Say>
  <Pause length="60"/>
</Response>`;

    return new Response(twiml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
<<<<<<< ours
    console.error("[Voice] Error generating outbound XML:", error);
=======
    console.error("Error generating outbound voice XML:", error);
>>>>>>> theirs
    return new Response("<Response><Hangup/></Response>", {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }
}
