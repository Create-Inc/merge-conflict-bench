import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";
import { isPlatformAdmin } from "@/app/api/utils/organization";
import { logAudit } from "@/app/api/utils/audit";

function normalizeOrgName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFKC")
    .toLowerCase();
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const platformAdmin = await isPlatformAdmin();
    if (!platformAdmin) {
      return Response.json(
        { error: "Forbidden: Platform admin access required" },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const qsOrgId = url.searchParams.get("organizationId");
    const body = await request.json().catch(() => ({}));

    const orgId = parseInt(body?.organizationId ?? qsOrgId ?? "", 10);
    const confirmNameRaw = String(body?.confirmName || "");
    const confirmPhraseRaw = String(body?.confirmPhrase || "");

    if (!orgId || Number.isNaN(orgId)) {
      return Response.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const confirmName = normalizeOrgName(confirmNameRaw);
    const confirmPhrase = confirmPhraseRaw.trim().toUpperCase();

    if (!confirmName || !confirmPhrase) {
      return Response.json(
        { error: "Both confirmName and confirmPhrase are required" },
        { status: 400 },
      );
    }

    const [org] = await sql`
      SELECT * FROM organizations WHERE id = ${orgId}
    `;

    if (!org) {
      return Response.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const expectedName = normalizeOrgName(org.name);
    if (confirmName !== expectedName || confirmPhrase !== "DELETE") {
      return Response.json(
        { error: "Confirmation failed. Name or phrase did not match." },
        { status: 400 },
      );
    }

    await logAudit({
      userId: session.user.id,
      performedBy: session.user.id,
      action: "delete_organization",
      entityType: "organization",
      entityId: orgId,
      oldValue: JSON.stringify({ id: org.id, name: org.name }),
      newValue: null,
      request,
    });

    await sql`DELETE FROM organizations WHERE id = ${orgId}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return Response.json(
      { error: error?.message || "Failed to delete organization" },
      { status: 500 },
    );
  }
}
