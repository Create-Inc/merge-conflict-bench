import sql from "@/app/api/utils/sql";
import {
  requireCompanyUser,
  getStaffUser,
} from "@/app/api/utils/company-context";

<<<<<<< ours
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

=======
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

>>>>>>> theirs
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

  const map = new Map(
    (rows || []).map((r) => [String(r.key), String(r.value)]),
  );

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
    await ensureCompanySettingsTable();

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

<<<<<<< ours
    const settingsRows = await sql`
      SELECT key, value
      FROM company_settings
      WHERE company_id = ${companyId}
        AND key IN ('legal_sites_eula_url', 'legal_sms_opt_in_url')
    `;
=======
    const record = consentRows?.[0] || null;
    const docs = await getCompanyDocSettings(companyId);
>>>>>>> theirs

<<<<<<< ours
    const settingsMap = new Map(
      (settingsRows || []).map((r) => [String(r.key), String(r.value)]),
    );

    const record = consentRows?.[0] || null;

=======
    // Back-compat: expose both the flat fields AND a nested `documents` object.
>>>>>>> theirs
    return Response.json({
      eula_accepted: Boolean(record?.eula_accepted),
      eula_accepted_at: record?.eula_accepted_at || null,
      eula_accepted_by_user_id: record?.eula_accepted_by_user_id || null,

      sms_consent_accepted: Boolean(record?.sms_consent_accepted),
      sms_consent_accepted_at: record?.sms_consent_accepted_at || null,
      sms_consent_accepted_by_user_id:
        record?.sms_consent_accepted_by_user_id || null,
<<<<<<< ours

      // NEW: document URLs (optional)
      sites_eula_url: settingsMap.get("legal_sites_eula_url") || "",
      sms_opt_in_url: settingsMap.get("legal_sms_opt_in_url") || "",
=======

      legal_sites_eula_url: docs.legal_sites_eula_url,
      legal_sms_opt_in_url: docs.legal_sms_opt_in_url,

      documents: {
        eula_document_url: docs.legal_sites_eula_url,
        sms_document_url: docs.legal_sms_opt_in_url,
      },
>>>>>>> theirs
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
    await ensureCompanySettingsTable();

    const guard = await requireCompanyAdmin(gate.ctx);
    if (!guard.ok) {
      return Response.json({ error: guard.error }, { status: guard.status });
    }

    const companyId = Number(guard.companyId);

    const body = await request.json().catch(() => ({}));

    const eulaAccepted = body?.eula_accepted === true;
    const smsAccepted = body?.sms_consent_accepted === true;

<<<<<<< ours
    const sitesEulaUrlRaw =
      typeof body?.sites_eula_url === "string" ? body.sites_eula_url : null;
    const smsOptInUrlRaw =
      typeof body?.sms_opt_in_url === "string" ? body.sms_opt_in_url : null;

    const staffUserId = guard?.staffUser?.id
      ? Number(guard.staffUser.id)
      : null;
=======
    // Accept either naming convention from the frontend.
    const rawEulaUrl =
      body?.legal_sites_eula_url !== undefined
        ? body.legal_sites_eula_url
        : body?.eula_document_url;
>>>>>>> theirs

<<<<<<< ours
    const hasConsentUpdate = eulaAccepted || smsAccepted;
    const hasUrlUpdate = sitesEulaUrlRaw !== null || smsOptInUrlRaw !== null;

    if (!hasConsentUpdate && !hasUrlUpdate) {
=======
    const rawSmsUrl =
      body?.legal_sms_opt_in_url !== undefined
        ? body.legal_sms_opt_in_url
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
>>>>>>> theirs
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
<<<<<<< ours
            "Nothing to update. Send eula_accepted, sms_consent_accepted, sites_eula_url, and/or sms_opt_in_url.",
=======
            "Nothing to update. Send { eula_accepted: true } and/or { sms_consent_accepted: true } and/or document URLs.",
>>>>>>> theirs
        },
        { status: 400 },
      );
    }

<<<<<<< ours
    // If we're changing consents, ensure a row exists for this company (idempotent).
    if (hasConsentUpdate) {
=======
    // Save doc settings if provided.
    await saveCompanyDocSetting(
      companyId,
      KEY_SITES_EULA_URL,
      normalizedEulaUrl,
    );
    await saveCompanyDocSetting(
      companyId,
      KEY_SMS_OPT_IN_URL,
      normalizedSmsUrl,
    );

    const staffUserId = guard?.staffUser?.id
      ? Number(guard.staffUser.id)
      : null;

    // Ensure a row exists for this company (idempotent).
    await sql`
      INSERT INTO legal_consents (company_id)
      VALUES (${companyId})
      ON CONFLICT (company_id) DO NOTHING
    `;

    // Only set accepted_at/by_user_id the first time.
    if (eulaAccepted) {
>>>>>>> theirs
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
    }

    // NEW: update optional document URLs.
    // - null = not provided (leave as-is)
    // - empty string = clear
    // - non-empty = must be http(s)
    const updateUrlKey = async (key, raw) => {
      if (raw === null) {
        return;
      }

      const value = String(raw || "").trim();

      if (!value) {
        await sql`
          DELETE FROM company_settings
          WHERE company_id = ${companyId}
            AND key = ${key}
        `;
        return;
      }

      if (!/^https?:\/\//i.test(value)) {
        throw new Error("Document URL must start with http:// or https://");
      }

      await sql`
        INSERT INTO company_settings (company_id, key, value, updated_at)
        VALUES (${companyId}, ${key}, ${value}, CURRENT_TIMESTAMP)
        ON CONFLICT (company_id, key)
        DO UPDATE SET value = ${value}, updated_at = CURRENT_TIMESTAMP
      `;
    };

<<<<<<< ours
    await updateUrlKey("legal_sites_eula_url", sitesEulaUrlRaw);
    await updateUrlKey("legal_sms_opt_in_url", smsOptInUrlRaw);

    const consentRows = await sql`
=======
    const consentRows = await sql`
>>>>>>> theirs
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

<<<<<<< ours
    const settingsRows = await sql`
      SELECT key, value
      FROM company_settings
      WHERE company_id = ${companyId}
        AND key IN ('legal_sites_eula_url', 'legal_sms_opt_in_url')
    `;
=======
    const record = consentRows?.[0] || null;
    const docs = await getCompanyDocSettings(companyId);
>>>>>>> theirs

    const settingsMap = new Map(
      (settingsRows || []).map((r) => [String(r.key), String(r.value)]),
    );

    const record = consentRows?.[0] || null;

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
<<<<<<< ours
      documents: {
        sites_eula_url: settingsMap.get("legal_sites_eula_url") || "",
        sms_opt_in_url: settingsMap.get("legal_sms_opt_in_url") || "",
      },
=======
      legal_sites_eula_url: docs.legal_sites_eula_url,
      legal_sms_opt_in_url: docs.legal_sms_opt_in_url,
      documents: {
        eula_document_url: docs.legal_sites_eula_url,
        sms_document_url: docs.legal_sms_opt_in_url,
      },
>>>>>>> theirs
    });
  } catch (error) {
    console.error("PUT /api/settings/legal-compliance error", error);
    return Response.json(
      { error: error?.message || "Failed to update legal compliance settings" },
      { status: 500 },
    );
  }
}
