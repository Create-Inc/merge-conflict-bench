import sql from "@/app/api/utils/sql";
import { partnerIdForUser } from "@/app/api/partner/helpers/partnerAuth";

function normalizeRole(role) {
  const raw = String(role || "")
    .trim()
    .toLowerCase();
  if (!raw) return "";
  // Backwards-compatible aliases (some older rows used plurals)
  if (raw === "companies") return "company";
  if (raw === "partners") return "partner";
  if (raw === "sellers") return "seller";
  if (raw === "admins") return "admin";
  return raw;
}

export async function getCompanyIdForUser(userId) {
  const owner = await sql(
    "SELECT id FROM company_profiles WHERE user_id = $1 LIMIT 1",
    [userId],
  );
  if (owner[0]?.id) return owner[0].id;
  const mgr = await sql(
    "SELECT company_profile_id AS id FROM company_managers WHERE manager_user_id = $1 LIMIT 1",
    [userId],
  );
  return mgr[0]?.id || null;
}

export async function getUserRoleSet(userId) {
  // Read explicit roles first
  const rows = await sql(`SELECT role FROM user_roles WHERE user_id = $1`, [
    userId,
  ]);
<<<<<<< ours
  const normalized = (rows || [])
    .map((r) => normalizeRole(r?.role))
    .filter(Boolean);
  return new Set(normalized);
=======

  const roleSet = new Set(
    (rows || [])
      .map((r) =>
        String(r.role || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean),
  );

  // Back-compat: some older users have profiles but no user_roles entries.
  // Treat existing profiles/manager links as roles.
  try {
    const [
      companyOwned,
      companyManaged,
      partnerOwned,
      partnerManaged,
      seller,
      consultant,
    ] = await sql.transaction((txn) => [
      txn("SELECT 1 FROM company_profiles WHERE user_id = $1 LIMIT 1", [
        userId,
      ]),
      txn("SELECT 1 FROM company_managers WHERE manager_user_id = $1 LIMIT 1", [
        userId,
      ]),
      txn("SELECT 1 FROM partner_company_profiles WHERE user_id = $1 LIMIT 1", [
        userId,
      ]),
      txn("SELECT 1 FROM partner_managers WHERE manager_user_id = $1 LIMIT 1", [
        userId,
      ]),
      txn("SELECT 1 FROM seller_profiles WHERE user_id = $1 LIMIT 1", [userId]),
      txn("SELECT 1 FROM consultant_profiles WHERE user_id = $1 LIMIT 1", [
        userId,
      ]),
    ]);

    if (companyOwned?.[0] || companyManaged?.[0]) roleSet.add("company");
    if (partnerOwned?.[0] || partnerManaged?.[0]) roleSet.add("partner");
    if (seller?.[0]) roleSet.add("seller");
    if (consultant?.[0]) roleSet.add("consultant");
  } catch (e) {
    // Non-fatal: role lookups should never block the request.
    console.error("getUserRoleSet: derived role lookup failed", e);
  }

  return roleSet;
>>>>>>> theirs
}

export async function isSellerConnectedToAssignment(userId, assignment) {
  if (!assignment) return false;
  if (Number(assignment.originating_seller_user_id) === Number(userId))
    return true;
  if (Number(assignment.contact_user_id) === Number(userId)) return true;

  // active deal ownership
  const deal = await sql(
    `SELECT 1
     FROM deal_ownership
     WHERE assignment_id = $1 AND seller_user_id = $2 AND active = true
     LIMIT 1`,
    [assignment.id, userId],
  );
  if (deal?.[0]) return true;

  // external source ownership
  if (assignment.source) {
    const src = await sql(
      `SELECT 1
       FROM external_sources
       WHERE contact_seller_user_id = $1 AND name = $2
       LIMIT 1`,
      [userId, assignment.source],
    );
    if (src?.[0]) return true;
  }

  return false;
}

export async function isConsultantConnectedToAssignment(userId, assignmentId) {
  const rows = await sql(
    `SELECT 1
     WHERE EXISTS (
       SELECT 1 FROM consultant_assignment_votes cav
       WHERE cav.consultant_user_id = $1 AND cav.assignment_id = $2
     )
     OR EXISTS (
       SELECT 1 FROM customer_consultant_votes ccv
       WHERE ccv.consultant_user_id = $1 AND ccv.assignment_id = $2
     )
     OR EXISTS (
       SELECT 1 FROM partner_assignment_consultants pac
       WHERE pac.consultant_user_id = $1 AND pac.assignment_id = $2
     )
     OR EXISTS (
       SELECT 1 FROM partner_applications pa
       WHERE pa.consultant_user_id = $1 AND pa.assignment_id = $2
     )
     OR EXISTS (
       SELECT 1 FROM interview_requests ir
       WHERE ir.consultant_user_id = $1 AND ir.assignment_id = $2
     )
     LIMIT 1`,
    [userId, assignmentId],
  );
  return !!rows?.[0];
}

export async function isPartnerConnectedToAssignment(
  partnerCompanyProfileId,
  assignmentId,
) {
  if (!partnerCompanyProfileId || !assignmentId) return false;

  // Any explicit partner activity on the assignment should count as "connected".
  const rows = await sql(
    `SELECT 1
     WHERE EXISTS (
       SELECT 1
       FROM partner_assignment_consultants pac
       WHERE pac.partner_company_profile_id = $1 AND pac.assignment_id = $2
     )
     OR EXISTS (
       SELECT 1
       FROM partner_favorites pf
       WHERE pf.partner_company_profile_id = $1 AND pf.assignment_id = $2
     )
     OR EXISTS (
       SELECT 1
       FROM partner_applications pa
       WHERE pa.partner_company_profile_id = $1 AND pa.assignment_id = $2
     )
     OR EXISTS (
       SELECT 1
       FROM partner_public_interest_status ppis
       WHERE ppis.partner_company_profile_id = $1 AND ppis.assignment_id = $2
     )
     LIMIT 1`,
    [partnerCompanyProfileId, assignmentId],
  );

  return !!rows?.[0];
}

export async function canUserSeeExpiredAssignment(userId, roleSet, assignment) {
  if (!assignment) return false;
  if (roleSet.has("admin")) return true;

  // Partner access
  if (roleSet.has("partner")) {
    const pid = await partnerIdForUser(userId);

    // Direct ownership OR any partner activity on the assignment.
    if (pid) {
      if (Number(assignment.partner_company_profile_id) === Number(pid)) {
        return true;
      }

      const connected = await isPartnerConnectedToAssignment(
        pid,
        assignment.id,
      );
      if (connected) return true;
    }
  }

  // Seller access
  if (roleSet.has("seller")) {
    const directlyConnected = await isSellerConnectedToAssignment(
      userId,
      assignment,
    );
    if (directlyConnected) return true;

    // Some sellers are connected via a partner account (seller_profiles.assigned_partner_company_profile_id).
    // If that partner has activity on the assignment, allow viewing expired/archived details as well.
    const pid = await partnerIdForUser(userId);
    if (pid) {
      const viaPartner = await isPartnerConnectedToAssignment(
        pid,
        assignment.id,
      );
      if (viaPartner) return true;
    }

    return false;
  }

  // Company access
  if (roleSet.has("company")) {
    const companyId = await getCompanyIdForUser(userId);
    if (
      companyId &&
      Number(assignment.company_profile_id) === Number(companyId)
    ) {
      return true;
    }
  }

  // Consultant access (only if already connected)
  if (roleSet.has("consultant")) {
    return isConsultantConnectedToAssignment(userId, assignment.id);
  }

  return false;
}
