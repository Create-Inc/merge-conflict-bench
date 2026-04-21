import sql from "@/app/api/utils/sql";
import {
  requireAuth2User,
  ensureAuth2UserIdColumnsText,
} from "@/app/api/utils/auth2";
import { ensureDbReady } from "@/app/api/utils/dbBootstrap";

async function ensureAgreementSchema() {
  // Best-effort schema bootstrap (safe + idempotent). The tables already exist in production.
  try {
    await sql`CREATE TABLE IF NOT EXISTS public.system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT now()
    )`;
  } catch (_) {}

  try {
    await sql`CREATE TABLE IF NOT EXISTS public.user_agreements (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      agreement_key TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, agreement_key)
    )`;
  } catch (_) {}

  try {
    await sql`ALTER TABLE public.user_agreements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()`;
  } catch (_) {}
}

export async function POST(request) {
  try {
    try {
      await ensureDbReady();
    } catch (_) {
      // ignore
    }
    try {
      await ensureAuth2UserIdColumnsText();
    } catch (_) {
      // ignore
    }

    await ensureAgreementSchema();

    const { user, response } = await requireAuth2User(request);
    if (response) return response;

    const userId = user?.id ? String(user.id) : null;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read the CURRENT agreement settings from system_settings.
    // IMPORTANT: the client does not tell us which version is current.
    const rows = await sql`
      SELECT key, value
      FROM public.system_settings
      WHERE key IN ('user_agreement_text', 'user_agreement_version')
    `;

    const map = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));
    const agreementVersion =
      map.user_agreement_version == null
        ? null
        : String(map.user_agreement_version).trim();

    const hasCurrentVersion = String(agreementVersion || "").trim().length > 0;

    if (!hasCurrentVersion) {
      // Gate should not show, but fail safely if called anyway.
      return Response.json(
        { error: "No agreement configured" },
        { status: 400 },
      );
    }

    // Per requirements: agreement_key stores the version itself (e.g. "v1").
    await sql(
      "INSERT INTO public.user_agreements (user_id, agreement_key) VALUES ($1, $2) ON CONFLICT (user_id, agreement_key) DO NOTHING",
      [String(userId), String(agreementVersion)],
    );

    return Response.json({ success: true, version: String(agreementVersion) });
  } catch (e) {
    console.error("user-agreements/accept error", e);
    return Response.json(
      {
        error: "Failed to record acceptance",
        detail:
          typeof e?.message === "string" ? e.message.slice(0, 240) : undefined,
      },
      { status: 500 },
    );
  }
}
