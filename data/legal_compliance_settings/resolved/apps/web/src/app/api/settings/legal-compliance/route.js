import sql from "@/app/api/utils/sql";
import {
  requireCompanyUser,
  getStaffUser,
} from "@/app/api/utils/company-context";

// Company-scoped settings live in public.company_settings.
async function ensureCompanySettingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS company_settings (
      company_id bigint NOT NULL,
      key text NOT NULL,
      value text NOT NULL,
      updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (company_id, key)
    )
  `;
}

const KEY_SITES_EULA_URL = "legal_sites_eula_url";
const KEY_SMS_OPT_IN_URL = "legal_sms_opt_in_url";

function normalizeOptionalUrl(raw, keyLabel) {
  // undefined => not provided
  if (raw === undefined) {
    return undefined;
  }

  const trimmed = String(raw || "").trim();

  // empty string => clear
  if (!trimmed) {
    return null;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`${keyLabel} must start with http:// or https://`);
  }

  return trimmed;
}

async function requireCompanyAdmin(ctx) {
  // Allow super admins (including support impersonation) to manage this.
  if (ctx?.isSuperAdmin) {
    const companyId = Number(ctx?.company?.id);
    if (!companyId) {
      return { ok: false, status: 403, error: "No company access" };
    }

    const staffUser = await getStaffUser(ctx);
    return { ok: true, companyId, staffUser: staffUser || null };
  }

  const companyId = Number(ctx?.company?.id);

  if (!companyId) {
    return { ok: false, status: 403, error: "No company access" };
  }

  const staffUser = await getStaffUser(ctx);

  if (!staffUser) {
    return {
      ok: false,
      status: 403,
      error: "No staff user record found for this login",
    };
  }

  const adminCountRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM users
    WHERE company_id = ${companyId}
      AND permission_level = 'Admin'
  `;
  const adminCount = adminCountRows?.[0]?.count || 0;

  // Bootstrap: first signed-in staff user in this company becomes Admin when no admins exist yet.
  if (adminCount === 0 && staffUser.permission_level !== "Admin") {
    await sql`
      UPDATE users
      SET permission_level = 'Admin', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${staffUser.id}
    `;
    staffUser.permission_level = "Admin";
  }

  if (staffUser.permission_level !== "Admin") {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, companyId, staffUser };
}

async function getCompanyDocSettings(companyId) {
  await ensureCompanySettingsTable();

  const rows = await sql`
    SELECT key, value
    FROM company_settings
    WHERE company_id = ${companyId}
      AND key IN (${KEY_SITES_EULA_URL}, ${KEY_SMS_OPT_IN_URL})
  `;

  const map = new Map((rows || []).map((r) => [String(r.key), String(r.value)]));

  return {
    legal_sites_eula_url: map.get(KEY_SITES_EULA_URL) || "",
    legal_sms_opt_in_url: map.get(KEY_SMS_OPT_IN_URL) || "",
  };
}

async function saveCompanyDocSetting(companyId, key, normalizedValue) {
  await ensureCompanySettingsTable();

  // normalizedValue: undefined => skip, null => clear, string => save
  if (normalizedValue === undefined) {
    return;
  }

  if (normalizedValue === null) {
    await sql`
      DELETE FROM company_settings
      WHERE company_id = ${companyId}
        AND key = ${key}
    `;
    return;
  }

  await sql`
    INSERT INTO company_settings (company_id, key, value, updated_at)
    VALUES (${companyId}, ${key}, ${normalizedValue}, CURRENT_TIMESTAMP)
    ON CONFLICT (company_id, key)
    DO UPDATE SET value = ${normalizedValue}, updated_at = CURRENT_TIMESTAMP
  `;
}

export async function GET() {
  const gate = await requireCompanyUser();
  if (!gate.ok) {
    return gate.response;
  }

  try {
    const companyId = Number(gate?.ctx?.company?.id);

    const consentRows = await sql`
      SELECT
        eula_accepted,
        eula_accepted_at,
        eula_accepted_by_user_id,
        sms_consent_accepted,
        sms_consent_accepted_at,
        sms_consent_accepted_by_user_id
      FROM legal_consents
      WHERE company_id = ${companyId}
      LIMIT 1
    `;

    const record = consentRows?.[0] || null;
    const docs = await getCompanyDocSettings(companyId);

    return Response.json({
      eula_accepted: Boolean(record?.eula_accepted),
      eula_accepted_at: record?.eula_accepted_at || null,
      eula_accepted_by_user_id: record?.eula_accepted_by_user_id || null,

      sms_consent_accepted: Boolean(record?.sms_consent_accepted),
      sms_consent_accepted_at: record?.sms_consent_accepted_at || null,
      sms_consent_accepted_by_user_id:
        record?.sms_consent_accepted_by_user_id || null,

      // flat fields (back-compat)
      legal_sites_eula_url: docs.legal_sites_eula_url,
      legal_sms_opt_in_url: docs.legal_sms_opt_in_url,
      sites_eula_url: docs.legal_sites_eula_url,
      sms_opt_in_url: docs.legal_sms_opt_in_url,

      // preferred shape
      documents: {
        eula_document_url: docs.legal_sites_eula_url,
        sms_document_url: docs.legal_sms_opt_in_url,
      },
    });
  } catch (error) {
    console.error("GET /api/settings/legal-compliance error", error);
    return Response.json(
      { error: "Failed to fetch legal compliance settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  const gate = await requireCompanyUser();
  if (!gate.ok) {
    return gate.response;
  }

  try {
    const guard = await requireCompanyAdmin(gate.ctx);
    if (!guard.ok) {
      return Response.json({ error: guard.error }, { status: guard.status });
    }

    const companyId = Number(guard.companyId);

    const body = await request.json().catch(() => ({}));

    const eulaAccepted = body?.eula_accepted === true;
    const smsAccepted = body?.sms_consent_accepted === true;

    // Accept multiple naming conventions from the frontend.
    const rawEulaUrl =
      body?.legal_sites_eula_url !== undefined
        ? body.legal_sites_eula_url
        : body?.sites_eula_url !== undefined
          ? body.sites_eula_url
          : body?.eula_document_url;

    const rawSmsUrl =
      body?.legal_sms_opt_in_url !== undefined
        ? body.legal_sms_opt_in_url
        : body?.sms_opt_in_url !== undefined
          ? body.sms_opt_in_url
          : body?.sms_document_url;

    let normalizedEulaUrl;
    let normalizedSmsUrl;
    try {
      normalizedEulaUrl = normalizeOptionalUrl(rawEulaUrl, "EULA document URL");
      normalizedSmsUrl = normalizeOptionalUrl(
        rawSmsUrl,
        "SMS agreement document URL",
      );
    } catch (e) {
      return Response.json(
        { error: e?.message || "Invalid URL" },
        { status: 400 },
      );
    }

    const hasDocUpdate =
      normalizedEulaUrl !== undefined || normalizedSmsUrl !== undefined;

    if (!eulaAccepted && !smsAccepted && !hasDocUpdate) {
      return Response.json(
        {
          error:
            "Nothing to update. Send eula_accepted, sms_consent_accepted, and/or document URLs.",
        },
        { status: 400 },
      );
    }

    // Save doc settings if provided.
    await saveCompanyDocSetting(companyId, KEY_SITES_EULA_URL, normalizedEulaUrl);
    await saveCompanyDocSetting(companyId, KEY_SMS_OPT_IN_URL, normalizedSmsUrl);

    const staffUserId = guard?.staffUser?.id ? Number(guard.staffUser.id) : null;

    // Ensure a row exists for this company (idempotent).
    await sql`
      INSERT INTO legal_consents (company_id)
      VALUES (${companyId})
      ON CONFLICT (company_id) DO NOTHING
    `;

    // Only set accepted_at/by_user_id the first time.
    if (eulaAccepted) {
      await sql`
        UPDATE legal_consents
        SET
          eula_accepted = true,
          eula_accepted_at = CASE
            WHEN eula_accepted IS TRUE THEN eula_accepted_at
            ELSE CURRENT_TIMESTAMP
          END,
          eula_accepted_by_user_id = CASE
            WHEN eula_accepted IS TRUE THEN eula_accepted_by_user_id
            ELSE ${staffUserId}
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE company_id = ${companyId}
      `;
    }

    if (smsAccepted) {
      await sql`
        UPDATE legal_consents
        SET
          sms_consent_accepted = true,
          sms_consent_accepted_at = CASE
            WHEN sms_consent_accepted IS TRUE THEN sms_consent_accepted_at
            ELSE CURRENT_TIMESTAMP
          END,
          sms_consent_accepted_by_user_id = CASE
            WHEN sms_consent_accepted IS TRUE THEN sms_consent_accepted_by_user_id
            ELSE ${staffUserId}
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE company_id = ${companyId}
      `;
    }

    const consentRows = await sql`
      SELECT
        eula_accepted,
        eula_accepted_at,
        eula_accepted_by_user_id,
        sms_consent_accepted,
        sms_consent_accepted_at,
        sms_consent_accepted_by_user_id
      FROM legal_consents
      WHERE company_id = ${companyId}
      LIMIT 1
    `;

    const record = consentRows?.[0] || null;
    const docs = await getCompanyDocSettings(companyId);

    return Response.json({
      success: true,
      consents: {
        eula_accepted: Boolean(record?.eula_accepted),
        eula_accepted_at: record?.eula_accepted_at || null,
        eula_accepted_by_user_id: record?.eula_accepted_by_user_id || null,
        sms_consent_accepted: Boolean(record?.sms_consent_accepted),
        sms_consent_accepted_at: record?.sms_consent_accepted_at || null,
        sms_consent_accepted_by_user_id:
          record?.sms_consent_accepted_by_user_id || null,
      },
      legal_sites_eula_url: docs.legal_sites_eula_url,
      legal_sms_opt_in_url: docs.legal_sms_opt_in_url,
      documents: {
        eula_document_url: docs.legal_sites_eula_url,
        sms_document_url: docs.legal_sms_opt_in_url,
      },
    });
  } catch (error) {
    console.error("PUT /api/settings/legal-compliance error", error);
    return Response.json(
      { error: error?.message || "Failed to update legal compliance settings" },
      { status: 500 },
    );
  }
}
