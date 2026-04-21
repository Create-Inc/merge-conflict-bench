import sql from "@/app/api/utils/sql";
import {
  requireSessionUser,
  ensureTeamMemberLink,
  getCompanyMembership,
  isAllowedRole,
  isLiftStaffUser,
  isPlatformAdmin,
} from "@/app/api/utils/authz.js";

function safeString(v) {
  return typeof v === "string" ? v : "";
}

<<<<<<< ours
function looksLikeEngagementSurveyType({ typeName, category }) {
  const cat = safeString(category).toLowerCase();
  if (cat === "engagement") return true;

=======
function looksLikeEngagementSurveyType({ typeName, assessmentName }) {
>>>>>>> theirs
  const name = safeString(typeName).toLowerCase();
  const aName = safeString(assessmentName).toLowerCase();

  // Strong hint: admin named it as an engagement survey.
  if (aName.includes("engagement") && !aName.includes("business")) {
    return true;
  }

  if (!name) return false;

  // Back-compat: if category is missing, fall back to name heuristics.
  // We purposely do NOT exclude the word "business" here because some mis-created
  // engagement surveys can carry the wrong label yet still need conversion.
  return name.includes("engagement");
}

export async function POST(request, { params }) {
  try {
    const assessmentId = parseInt(String(params?.id || ""), 10);
    if (!Number.isFinite(assessmentId)) {
      return Response.json({ error: "Invalid assessment id" }, { status: 400 });
    }

    const { user, errorResponse } = await requireSessionUser();
    if (errorResponse) return errorResponse;

    const rows = await sql(
      `SELECT a.id, a.company_id, a.template_key, a.template_version,
              at.name as type_name, at.category
         FROM assessments a
         LEFT JOIN assessment_types at ON at.id = a.assessment_type_id
        WHERE a.id = $1
        LIMIT 1`,
      [assessmentId],
    );

    const assessment = rows?.[0] || null;
    if (!assessment?.id) {
      return Response.json({ error: "Assessment not found" }, { status: 404 });
    }

    const companyId = assessment.company_id;
    if (!companyId) {
      return Response.json(
        { error: "Assessment is missing company_id" },
        { status: 400 },
      );
    }

    const liftStaff = await isLiftStaffUser({ userId: user.id });
    const platformAdmin = await isPlatformAdmin({ userId: user.id });

    if (!liftStaff && !platformAdmin) {
      await ensureTeamMemberLink({
        userId: user.id,
        email: user.email,
        companyId,
      });
      const membership = await getCompanyMembership({
        userId: user.id,
        companyId,
      });
      const canEdit = isAllowedRole(membership?.org_role, [
        "company_admin",
        "assessment_admin",
        "super_admin",
        "manager",
      ]);

      if (!canEdit) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const typeName = assessment.type_name;
<<<<<<< ours
    const okType = looksLikeEngagementSurveyType({
      typeName,
      category: assessment.category,
    });
=======
    const okType = looksLikeEngagementSurveyType({
      typeName,
      assessmentName: assessment?.name,
    });
>>>>>>> theirs
    if (!okType) {
      return Response.json(
        {
          error:
            "This assessment does not look like an Employee Engagement Survey, so we will not auto-convert it.",
        },
        { status: 400 },
      );
    }

    // Idempotent: if already converted, just return it.
    if (assessment.template_key === "employee_engagement_survey") {
      return Response.json({ ok: true, assessment });
    }

    const updated = await sql(
      `UPDATE assessments
          SET template_key = 'employee_engagement_survey',
              template_version = 1
        WHERE id = $1
        RETURNING *`,
      [assessmentId],
    );

    return Response.json({ ok: true, assessment: updated?.[0] || null });
  } catch (error) {
    console.error(
      "POST /api/assessments/[id]/convert-to-engagement-survey error",
      error,
    );
    return Response.json(
      { error: "Failed to convert assessment" },
      { status: 500 },
    );
  }
}
