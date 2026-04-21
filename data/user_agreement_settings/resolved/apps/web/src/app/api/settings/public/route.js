import sql from "@/app/api/utils/sql";

const keys = [
  "show_artists",
  "show_conventions",
  "show_suppliers",
  // website-on-card toggles
  "show_website_artists",
  "show_website_suppliers",
  "show_website_conventions",
  // user agreement fields
  "user_agreement_text",
  "user_agreement_version",
  // public collector plus payment link
  "payment_link_collector_plus",
];

function toBool(v, def = true) {
  if (v == null) return def;
  const s = String(v).toLowerCase().trim();
  if (["true", "1", "yes", "on"].includes(s)) return true;
  if (["false", "0", "no", "off"].includes(s)) return false;
  return def;
}

export async function GET() {
  try {
    const rows = await sql`
      SELECT key, value FROM public.system_settings WHERE key = ANY(${keys})
    `;
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    // User agreement is explicit + versioned.
    // Spec: treat the agreement as configured based on VERSION being set.
    const userAgreementText =
      map.user_agreement_text == null ? "" : String(map.user_agreement_text);

    const agreementVersionRaw =
      map.user_agreement_version == null
        ? null
        : String(map.user_agreement_version).trim();

    const userAgreementVersion =
      agreementVersionRaw && agreementVersionRaw.length > 0
        ? agreementVersionRaw
        : null;

    return Response.json({
      show_artists: toBool(map.show_artists, true),
      show_conventions: toBool(map.show_conventions, true),
      show_suppliers: toBool(map.show_suppliers, true),
      show_website_artists: toBool(map.show_website_artists, true),
      show_website_suppliers: toBool(map.show_website_suppliers, true),
      show_website_conventions: toBool(map.show_website_conventions, true),
      user_agreement_text: userAgreementText,
      user_agreement_version: userAgreementVersion,
      payment_link_collector_plus: map.payment_link_collector_plus || null,
    });
  } catch (error) {
    console.error("GET /api/settings/public error:", error);
    // Fail-open (all visible) + fail-open agreement (no gate)
    return Response.json({
      show_artists: true,
      show_conventions: true,
      show_suppliers: true,
      show_website_artists: true,
      show_website_suppliers: true,
      show_website_conventions: true,
      user_agreement_text: "",
      user_agreement_version: null,
      payment_link_collector_plus: null,
    });
  }
}
