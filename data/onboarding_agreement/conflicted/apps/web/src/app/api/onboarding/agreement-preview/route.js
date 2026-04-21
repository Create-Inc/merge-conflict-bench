import sql from "@/app/api/utils/sql";
import { buildServiceAgreementHtml } from "@/app/api/utils/service-agreement";

function filenameSafe(value) {
  try {
    return String(value || "")
      .trim()
      .replaceAll(/[^a-zA-Z0-9-_]+/g, "_")
      .slice(0, 60);
  } catch {
    return "lotly-service-agreement";
  }
}

<<<<<<< ours
function safeNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildDealershipAddressFromInvitation(invitation) {
  const parts = [];
  if (invitation?.state) parts.push(String(invitation.state));
  if (invitation?.phone) parts.push(`Phone: ${String(invitation.phone)}`);
  return parts.join(" • ");
}

// GET /api/onboarding/agreement-preview?token=...&format=html|pdf
// Defaults to HTML so it works reliably in all browsers.
=======
// GET /api/onboarding/agreement-preview?token=...&format=pdf|html
// Generates either an HTML preview (default) or PDF preview of the Lotly Service Agreement (unsigned) so the dealer can review it.
>>>>>>> theirs
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const formatRaw = url.searchParams.get("format");
    const format = String(formatRaw || "html").toLowerCase();

    if (!token) {
      return Response.json({ error: "Missing token" }, { status: 400 });
    }

    const [invitation] = await sql`
      SELECT *
      FROM onboarding_invitations
      WHERE token = ${token}
        AND expires_at > NOW()
      LIMIT 1
    `;

    if (!invitation) {
      return Response.json(
        { error: "Invalid or expired invitation" },
        { status: 404 },
      );
    }

    // If they accepted a pricing proposal already, prefer that monthly price.
    const [acceptedQuote] = await sql`
      SELECT id, total_monthly
      FROM pricing_quotes
      WHERE lead_email = ${invitation.email}
        AND accepted_at IS NOT NULL
      ORDER BY accepted_at DESC
      LIMIT 1
    `;

    const monthlyFeeFromDb =
      acceptedQuote?.total_monthly !== undefined &&
      acceptedQuote?.total_monthly !== null
        ? Number(acceptedQuote.total_monthly)
        : invitation?.monthly_price !== undefined &&
            invitation?.monthly_price !== null
          ? Number(invitation.monthly_price)
          : null;

    const todayIso = (() => {
      try {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      } catch {
        return "";
      }
    })();

    // Allow the onboarding page to pass in updated draft values for preview.
    const dealershipName =
      url.searchParams.get("dealershipName") || invitation.company_name || "";
    const dealershipAddress =
      url.searchParams.get("dealershipAddress") ||
      buildDealershipAddressFromInvitation(invitation);
    const primaryContact =
      url.searchParams.get("primaryContact") ||
      `${invitation.first_name || ""} ${invitation.last_name || ""}`.trim() ||
      invitation.company_name ||
      "";

    const dealershipEmail =
      url.searchParams.get("dealershipEmail") || invitation.email || "";

    const monthlyFeeParam = safeNum(
      url.searchParams.get("monthlySubscriptionFee"),
    );
    const monthlySubscriptionFee =
      monthlyFeeParam !== null ? monthlyFeeParam : monthlyFeeFromDb;

    const effectiveDate = url.searchParams.get("effectiveDate") || todayIso;

    const dealerPrintedName = url.searchParams.get("dealerPrintedName") || "";
    const dealerSignedDate = url.searchParams.get("dealerSignedDate") || "";

    const ONE_TIME_SETUP_FEE = 25;

    const html = buildServiceAgreementHtml({
      dealershipName,
      dealershipAddress,
      primaryContact,
<<<<<<< ours
      dealershipEmail,
      monthlySubscriptionFee: monthlySubscriptionFee,
      oneTimeSetupFee: ONE_TIME_SETUP_FEE,
      effectiveDate,
      dealerPrintedName,
      dealerSignedDate,
=======
      dealershipEmail: invitation.email || "",
      monthlySubscriptionFee: monthlyFee,
      // Keep field in the preview but default it blank
      oneTimeSetupFee: null,
      effectiveDate: todayIso,
      dealerPrintedName: "",
      dealerTitle: "",
      dealerSignedDate: "",
      lotlyPrintedName,
      lotlyTitle,
      lotlySignedDate: "",
>>>>>>> theirs
    });

<<<<<<< ours
    if (format === "pdf") {
      const pdfRes = await fetch("/integrations/pdf-generation/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: { html },
        }),
      });
=======
    // NEW: HTML preview (works in every browser/email client)
    if (format === "html") {
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    // Default: PDF preview
    const pdfRes = await fetch("/integrations/pdf-generation/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: { html },
      }),
    });
>>>>>>> theirs

      if (!pdfRes.ok) {
        const text = await pdfRes.text().catch(() => "");
        throw new Error(
          `Failed to generate agreement PDF preview: [${pdfRes.status}] ${text}`,
        );
      }

      const buf = Buffer.from(await pdfRes.arrayBuffer());
      const fileName = filenameSafe(invitation.company_name || "dealer");

      return new Response(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename=\"${fileName}_Lotly_Service_Agreement.pdf\"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return new Response(html, {
      status: 200,
      headers: {
<<<<<<< ours
        "Content-Type": "text/html; charset=utf-8",
=======
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=\"${fileName}_Lotly_Service_Agreement.pdf\"`,
>>>>>>> theirs
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Agreement preview error:", error);
    return Response.json(
      { error: "Could not generate agreement preview" },
      { status: 500 },
    );
  }
}
