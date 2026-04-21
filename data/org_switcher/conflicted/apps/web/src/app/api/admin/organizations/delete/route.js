import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";
import { isPlatformAdmin } from "@/app/api/utils/organization";
import { logAudit } from "@/app/api/utils/audit";

<<<<<<< ours
function normalizeOrgName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFKC");
}

=======
function normalizeOrgName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

>>>>>>> theirs
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Platform Admins can delete organizations
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
<<<<<<< ours
    const confirmNameRaw = String(body?.confirmName || "");
    const confirmPhrase = String(body?.confirmPhrase || "").trim();
=======
    const confirmNameRaw = String(body?.confirmName || "");
    const confirmPhraseRaw = String(body?.confirmPhrase || "");
>>>>>>> theirs

    if (!orgId || Number.isNaN(orgId)) {
      return Response.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

<<<<<<< ours
    if (!confirmNameRaw || !confirmPhrase) {
=======
    const confirmName = normalizeOrgName(confirmNameRaw);
    const confirmPhrase = confirmPhraseRaw.trim().toUpperCase();

    if (!confirmName || !confirmPhrase) {
>>>>>>> theirs
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

<<<<<<< ours
    // Require confirmation phrase and name match (whitespace-tolerant)
    const normalizedConfirm = normalizeOrgName(confirmNameRaw);
    const normalizedOrg = normalizeOrgName(org.name);

    if (confirmPhrase.toUpperCase() !== "DELETE") {
=======
    // Require name confirmation (normalized) + DELETE phrase
    const expectedName = normalizeOrgName(org.name);
    if (confirmName !== expectedName || confirmPhrase !== "DELETE") {
>>>>>>> theirs
      return Response.json(
<<<<<<< ours
        { error: "Confirmation failed. Phrase must be DELETE." },
=======
        {
          error: "Confirmation failed. Name or phrase did not match.",
          // Helpful for debugging typos without leaking anything sensitive.
          details: {
            expectedName: org.name,
            expectedPhrase: "DELETE",
          },
        },
>>>>>>> theirs
        { status: 400 },
      );
    }

    if (!normalizedConfirm || normalizedConfirm !== normalizedOrg) {
      return Response.json(
        { error: "Confirmation failed. Organization name did not match." },
        { status: 400 },
      );
    }

    // Log audit before deletion
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

    // Delete organization (will cascade to dependent rows via FK)
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
