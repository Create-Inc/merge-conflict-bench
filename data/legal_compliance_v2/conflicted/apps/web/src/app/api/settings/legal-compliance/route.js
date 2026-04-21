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
// NEW: store document URLs (EULA + SMS) as company settings
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

const LEGAL_EULA_DOC_URL_KEY = "legal_eula_document_url";
const LEGAL_SMS_DOC_URL_KEY = "legal_sms_document_url";

function normalizeUrlOrNull(raw) {
  if (raw === undefined) {
    return undefined; // means "not provided"
  }
  const v = String(raw || "").trim();
  if (!v) {
    return null; // means "clear"
  }
  if (!/^https?:\/\//i.test(v)) {
    throw new Error("Document URL must start with http:// or https://");
  }
  return v;
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

export async function GET() {
  const gate = await requireCompanyUser();
  if (!gate.ok) {
    return gate.response;
  }

  try {
    await ensureCompanySettingsTable();

    const companyId = Number(gate?.ctx?.company?.id);

    // NEW: document URLs for the agreements (optional)
    await ensureCompanySettingsTable();
    const settingsRows = await sql`
      SELECT key, value
      FROM company_settings
      WHERE company_id = ${companyId}
        AND key IN (${LEGAL_EULA_DOC_URL_KEY}, ${LEGAL_SMS_DOC_URL_KEY})
    `;
    const settingsMap = new Map(
      (settingsRows || []).map((r) => [String(r.key), String(r.value)]),
    );

    const rows = await sql`
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

    const record = rows?.[0] || null;

    const settingsRows = await sql`
      SELECT key, value
      FROM company_settings
      WHERE company_id = ${companyId}
        AND key IN ('legal_sites_eula_url', 'legal_sms_opt_in_url')
    `;
    const settings = new Map((settingsRows || []).map((r) => [r.key, r.value]));

    return Response.json({
      eula_accepted: Boolean(record?.eula_accepted),
      eula_accepted_at: record?.eula_accepted_at || null,
      eula_accepted_by_user_id: record?.eula_accepted_by_user_id || null,

      sms_consent_accepted: Boolean(record?.sms_consent_accepted),
      sms_consent_accepted_at: record?.sms_consent_accepted_at || null,
      sms_consent_accepted_by_user_id:
        record?.sms_consent_accepted_by_user_id || null,
<<<<<<< ours

      // Optional: admin-provided documents (PDF/Doc links)
      legal_sites_eula_url: settings.get("legal_sites_eula_url") || "",
      legal_sms_opt_in_url: settings.get("legal_sms_opt_in_url") || "",
=======

      // NEW
      documents: {
        eula_document_url: settingsMap.get(LEGAL_EULA_DOC_URL_KEY) || "",
        sms_document_url: settingsMap.get(LEGAL_SMS_DOC_URL_KEY) || "",
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
      typeof body?.legal_sites_eula_url === "string"
        ? body.legal_sites_eula_url
        : null;
    const smsOptInUrlRaw =
      typeof body?.legal_sms_opt_in_url === "string"
        ? body.legal_sms_opt_in_url
        : null;

    const staffUserId = guard?.staffUser?.id
      ? Number(guard.staffUser.id)
      : null;
=======
    // NEW: optional document URL updates
    let eulaDocumentUrl;
    let smsDocumentUrl;
    try {
      eulaDocumentUrl = normalizeUrlOrNull(body?.eula_document_url);
      smsDocumentUrl = normalizeUrlOrNull(body?.sms_document_url);
    } catch (e) {
      return Response.json({ error: e.message }, { status: 400 });
    }
>>>>>>> theirs

<<<<<<< ours
    if (
      !eulaAccepted &&
      !smsAccepted &&
      sitesEulaUrlRaw === null &&
      smsOptInUrlRaw === null
    ) {
=======
    const hasDocUpdate =
      eulaDocumentUrl !== undefined || smsDocumentUrl !== undefined;

    if (!eulaAccepted && !smsAccepted && !hasDocUpdate) {
>>>>>>> theirs
      return Response.json(
        {
          error:
            "Nothing to update. Send { eula_accepted: true } and/or { sms_consent_accepted: true } and/or document URLs.",
        },
        { status: 400 },
      );
    }

<<<<<<< ours
    // Update optional document URLs (allow blank to clear)
    const saveUrlSetting = async (key, raw) => {
      if (raw === null) {
        return;
      }
      const trimmed = String(raw || "").trim();
      if (trimmed && !/^https?:\/\//i.test(trimmed)) {
        throw new Error(`${key} must start with http:// or https://`);
      }
      if (!trimmed) {
        await sql`
          DELETE FROM company_settings
          WHERE company_id = ${companyId}
            AND key = ${key}
        `;
        return;
      }
      await sql`
        INSERT INTO company_settings (company_id, key, value, updated_at)
        VALUES (${companyId}, ${key}, ${trimmed}, CURRENT_TIMESTAMP)
        ON CONFLICT (company_id, key)
        DO UPDATE SET value = ${trimmed}, updated_at = CURRENT_TIMESTAMP
      `;
    };

    await saveUrlSetting("legal_sites_eula_url", sitesEulaUrlRaw);
    await saveUrlSetting("legal_sms_opt_in_url", smsOptInUrlRaw);

=======
    // NEW: doc settings storage
    if (hasDocUpdate) {
      await ensureCompanySettingsTable();

      if (eulaDocumentUrl !== undefined) {
        if (eulaDocumentUrl === null) {
          await sql`
            DELETE FROM company_settings
            WHERE company_id = ${companyId}
              AND key = ${LEGAL_EULA_DOC_URL_KEY}
          `;
        } else {
          await sql`
            INSERT INTO company_settings (company_id, key, value, updated_at)
            VALUES (${companyId}, ${LEGAL_EULA_DOC_URL_KEY}, ${eulaDocumentUrl}, CURRENT_TIMESTAMP)
            ON CONFLICT (company_id, key)
            DO UPDATE SET value = ${eulaDocumentUrl}, updated_at = CURRENT_TIMESTAMP
          `;
        }
      }

      if (smsDocumentUrl !== undefined) {
        if (smsDocumentUrl === null) {
          await sql`
            DELETE FROM company_settings
            WHERE company_id = ${companyId}
              AND key = ${LEGAL_SMS_DOC_URL_KEY}
          `;
        } else {
          await sql`
            INSERT INTO company_settings (company_id, key, value, updated_at)
            VALUES (${companyId}, ${LEGAL_SMS_DOC_URL_KEY}, ${smsDocumentUrl}, CURRENT_TIMESTAMP)
            ON CONFLICT (company_id, key)
            DO UPDATE SET value = ${smsDocumentUrl}, updated_at = CURRENT_TIMESTAMP
          `;
        }
      }
    }

    const staffUserId = guard?.staffUser?.id
      ? Number(guard.staffUser.id)
      : null;

>>>>>>> theirs
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

    // Return updated state (consents + doc URLs)
    await ensureCompanySettingsTable();
    const settingsRows = await sql`
      SELECT key, value
      FROM company_settings
      WHERE company_id = ${companyId}
        AND key IN (${LEGAL_EULA_DOC_URL_KEY}, ${LEGAL_SMS_DOC_URL_KEY})
    `;
    const settingsMap = new Map(
      (settingsRows || []).map((r) => [String(r.key), String(r.value)]),
    );

    const rows = await sql`
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

    const record = rows?.[0] || null;

    const settingsRows = await sql`
      SELECT key, value
      FROM company_settings
      WHERE company_id = ${companyId}
        AND key IN ('legal_sites_eula_url', 'legal_sms_opt_in_url')
    `;
    const settings = new Map((settingsRows || []).map((r) => [r.key, r.value]));

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
      settings: {
        legal_sites_eula_url: settings.get("legal_sites_eula_url") || "",
        legal_sms_opt_in_url: settings.get("legal_sms_opt_in_url") || "",
      },
=======
      documents: {
        eula_document_url: settingsMap.get(LEGAL_EULA_DOC_URL_KEY) || "",
        sms_document_url: settingsMap.get(LEGAL_SMS_DOC_URL_KEY) || "",
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
