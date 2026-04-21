import sql from "@/app/api/utils/sql";
import { logUserActivity } from "@/app/api/utils/activityLog";
import { runWorkflowsForTrigger } from "@/app/api/utils/workflowEngine";
import {
  validateCategorySizes,
  validateMembershipTypeRestriction,
} from "../utils/validationHelpers";
import {
  assignResourceCategoryTag,
  removeResourceCategoryTag,
} from "../utils/tagHelpers";
import { sendAgreementEsign } from "../utils/agreementHelpers";
import { sendCategoryAssignmentNotification } from "../utils/notificationHelpers";
import { parseUserIdFromToken, getActorForClub } from "../utils/authHelpers";
import { getBearerTokenFromRequest } from "@/app/api/utils/activityLog";

export async function updateResourceHandler(body, request) {
  const {
    id,
    name,
    resourceName,
    description,
    assignedToMemberId,
    assignedDate,
    status,
    monthlyFee,
    mapPositionX,
    mapPositionY,
    mapRotationDeg,
    categoryId,
    stripeProductId,
    length,
    depth,
    beam,
    allowCheckInOut,
    requiresInsurance,
    requiresUserAgreement,
    checkInStatus,
    assignmentType,
    originalOwnerMemberId,
    temporaryStartDate,
    temporaryEndDate,
    temporaryPrice,
    assignmentEndDate,
    linkedRegisteredItemId,
  } = body;

  if (!id) {
    return {
      error: "Resource ID is required",
      status: 400,
    };
  }

  const currentResource = await sql`
    SELECT r.club_id,
           r.category_id,
           r.assignment_type,
           r.assigned_to_member_id,
           r.linked_registered_item_id,
           r.length,
           r.beam,
           r.name as resource_name,
           rc.name as category_name,
           rc.billing_settings as category_billing_settings,
           rc.agreement_url,
           COALESCE(rc.agreement_requires_esign, false) as agreement_requires_esign,
           COALESCE(rc.allowed_membership_types, '[]'::jsonb) as allowed_membership_types
    FROM resources r
    LEFT JOIN resource_categories rc ON r.category_id = rc.id
    WHERE r.id = ${id}
  `;

  if (currentResource.length === 0) {
    return { error: "Resource not found", status: 404 };
  }

  const {
    club_id: clubId,
    category_name: categoryName,
    assigned_to_member_id: oldAssignedMemberId,
    agreement_url: agreementUrl,
    agreement_requires_esign: agreementRequiresEsign,
    resource_name: currentResourceName,
    linked_registered_item_id: currentLinkedRegisteredItemId,
  } = currentResource[0];

  const normalizedNextResourceNameRaw =
    resourceName === undefined || resourceName === null
      ? undefined
      : String(resourceName).trim();
  const normalizedNextResourceName = normalizedNextResourceNameRaw
    ? normalizedNextResourceNameRaw
    : resourceName === undefined
      ? undefined
      : null;

  // Enforce unique resource names within a club (case-insensitive)
  let normalizedNextName = name;
  if (name !== undefined) {
    const trimmed = String(name || "").trim();
    if (!trimmed) {
      return { error: "Resource name is required", status: 400 };
    }

    const dup = await sql(
      "SELECT id FROM resources WHERE club_id = $1 AND LOWER(name) = LOWER($2) AND id <> $3 LIMIT 1",
      [Number(clubId), trimmed, Number(id)],
    );

    if (dup?.length) {
      return {
        error: `A resource named "${trimmed}" already exists. Resource names must be unique (ex: only one A20).`,
        status: 409,
      };
    }

    normalizedNextName = trimmed;
  }

  const effectiveCategoryId =
    categoryId !== undefined ? categoryId : currentResource[0].category_id;

  const effectiveAssignmentType =
    assignmentType !== undefined
      ? assignmentType
      : currentResource?.[0]?.assignment_type || "normal";

  if (assignedToMemberId !== undefined && assignedToMemberId) {
    const [cat] = await sql(
      "SELECT COALESCE(allow_sublease, false) as allow_sublease, COALESCE(allow_temporary_assignment, true) as allow_temporary, COALESCE(limit_one_assignment_per_member, false) as limit_one, COALESCE(limit_one_assignment_applies_to_sublease, true) as limit_sublease, COALESCE(limit_one_assignment_applies_to_temporary, true) as limit_temporary FROM resource_categories WHERE id = $1 LIMIT 1",
      [Number(effectiveCategoryId)],
    );

    if (effectiveAssignmentType === "sublease" && !cat?.allow_sublease) {
      return {
        error: "Subleasing is disabled for this category.",
        status: 400,
      };
    }

    if (effectiveAssignmentType === "temporary" && !cat?.allow_temporary) {
      return {
        error: "Temporary assignments are disabled for this category.",
        status: 400,
      };
    }

    const shouldApplyLimit = Boolean(
      cat?.limit_one &&
        !(effectiveAssignmentType === "sublease" && !cat?.limit_sublease) &&
        !(effectiveAssignmentType === "temporary" && !cat?.limit_temporary),
    );

    if (shouldApplyLimit) {
      const existing = await sql(
        `SELECT id, name
         FROM resources
         WHERE club_id = $1
           AND category_id = $2
           AND assigned_to_member_id = $3
           AND id <> $4
         LIMIT 1`,
        [
          Number(clubId),
          Number(effectiveCategoryId),
          Number(assignedToMemberId),
          Number(id),
        ],
      );

      if (existing?.length) {
        const otherName = existing?.[0]?.name;
        const suffix = otherName ? ` (already assigned to ${otherName})` : "";
        return {
          error: `This category only allows 1 active spot per member${suffix}.`,
          status: 400,
        };
      }
    }
  }

  const membershipValidation = await validateMembershipTypeRestriction({
    clubId,
    categoryId: effectiveCategoryId,
    assignedToMemberId,
    oldAssignedMemberId,
    categoryIdChanged: categoryId !== undefined,
  });

  if (!membershipValidation.valid) {
    return {
      error: membershipValidation.error,
      status: 400,
    };
  }

  const effectiveLinkedRegisteredItemId =
    linkedRegisteredItemId !== undefined
      ? linkedRegisteredItemId || null
      : currentLinkedRegisteredItemId || null;

  if (linkedRegisteredItemId !== undefined && linkedRegisteredItemId) {
    const nextItemId = Number(linkedRegisteredItemId);
    if (Number.isFinite(nextItemId) && nextItemId > 0) {
      const existing = await sql(
        `SELECT id, name
         FROM resources
         WHERE club_id = $1
           AND linked_registered_item_id = $2
           AND id <> $3
         LIMIT 1`,
        [Number(clubId), Number(nextItemId), Number(id)],
      );

      if (existing?.length) {
        const otherName = existing?.[0]?.name ? String(existing[0].name) : null;
        const suffix = otherName ? ` (already linked to ${otherName})` : "";
        return {
          error: `That registered item is already linked to another resource${suffix}. A registered item can only be linked to one resource.`,
          status: 409,
        };
      }
    }
  }

  if (length !== undefined) {
    const sizeValidation = await validateCategorySizes({
      clubId,
      categoryId: effectiveCategoryId,
      length,
    });

    if (!sizeValidation.valid) {
      return {
        error: sizeValidation.error,
        status: 400,
      };
    }
  }

  let resourceLength = currentResource[0].length;
  if (length !== undefined) {
    resourceLength = length;
  }

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(normalizedNextName);
  }

  if (resourceName !== undefined) {
    updates.push(`resource_name = $${paramCount++}`);
    values.push(normalizedNextResourceName);
  }

  if (description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(description);
  }

  if (categoryId !== undefined) {
    updates.push(`category_id = $${paramCount++}`);
    values.push(categoryId);
  }

  if (assignedDate !== undefined) {
    updates.push(`assigned_date = $${paramCount++}`);
    values.push(assignedDate);
  }

  if (checkInStatus !== undefined) {
    updates.push(`check_in_status = $${paramCount++}`);
    values.push(checkInStatus);
  }

  if (assignmentType !== undefined) {
    updates.push(`assignment_type = $${paramCount++}`);
    values.push(assignmentType);
  }

  if (originalOwnerMemberId !== undefined) {
    updates.push(`original_owner_member_id = $${paramCount++}`);
    values.push(originalOwnerMemberId);
  }

  if (temporaryStartDate !== undefined) {
    updates.push(`temporary_start_date = $${paramCount++}`);
    values.push(temporaryStartDate);
  }

  if (temporaryEndDate !== undefined) {
    updates.push(`temporary_end_date = $${paramCount++}`);
    values.push(temporaryEndDate);
  }

  if (temporaryPrice !== undefined) {
    updates.push(`temporary_price = $${paramCount++}`);
    values.push(temporaryPrice);
  }

  if (assignmentEndDate !== undefined) {
    updates.push(`assignment_end_date = $${paramCount++}`);
    values.push(assignmentEndDate);
  }

  const normalizedStatus =
    status !== undefined && status !== null
      ? String(status).trim().toLowerCase()
      : null;

  const forceUnassignByStatus =
    normalizedStatus === "available" &&
    assignedToMemberId === undefined &&
    Number(oldAssignedMemberId || 0) !== 0;

  const treatAssignmentUpdate =
    assignedToMemberId !== undefined || forceUnassignByStatus;

  const effectiveAssignedToMemberId = forceUnassignByStatus
    ? null
    : assignedToMemberId;

  if (treatAssignmentUpdate) {
    updates.push(`assigned_to_member_id = $${paramCount++}`);
    values.push(effectiveAssignedToMemberId);

    if (effectiveAssignedToMemberId) {
      if (assignedDate === undefined) {
        updates.push(`assigned_date = CURRENT_DATE`);
      }
      updates.push(`status = 'occupied'`);
    } else {
      updates.push(`assigned_date = NULL`);
      updates.push(`status = 'available'`);

      if (forceUnassignByStatus) {
        if (assignmentType === undefined) updates.push(`assignment_type = 'normal'`);
        if (originalOwnerMemberId === undefined) updates.push(`original_owner_member_id = NULL`);
        if (temporaryStartDate === undefined) updates.push(`temporary_start_date = NULL`);
        if (temporaryEndDate === undefined) updates.push(`temporary_end_date = NULL`);
        if (temporaryPrice === undefined) updates.push(`temporary_price = NULL`);
        if (assignmentEndDate === undefined) updates.push(`assignment_end_date = NULL`);
      }

      if (linkedRegisteredItemId === undefined) {
        updates.push(`linked_registered_item_id = NULL`);
      }
    }
  }

  if (
    status !== undefined &&
    assignedToMemberId === undefined &&
    !forceUnassignByStatus
  ) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);
  }

  if (monthlyFee !== undefined) {
    updates.push(`monthly_fee = $${paramCount++}`);
    values.push(monthlyFee);
  }

  if (mapPositionX !== undefined) {
    updates.push(`map_position_x = $${paramCount++}`);
    values.push(mapPositionX);
  }

  if (mapPositionY !== undefined) {
    updates.push(`map_position_y = $${paramCount++}`);
    values.push(mapPositionY);
  }

  if (mapRotationDeg !== undefined) {
    updates.push(`map_rotation_deg = $${paramCount++}`);
    values.push(mapRotationDeg);
  }

  if (stripeProductId !== undefined) {
    updates.push(`stripe_product_id = $${paramCount++}`);
    values.push(stripeProductId);
  }

  if (length !== undefined) {
    updates.push(`length = $${paramCount++}`);
    values.push(length);
  }

  if (depth !== undefined) {
    updates.push(`depth = $${paramCount++}`);
    values.push(depth);
  }

  if (beam !== undefined) {
    updates.push(`beam = $${paramCount++}`);
    values.push(beam);
  }

  if (allowCheckInOut !== undefined) {
    updates.push(`allow_check_in_out = $${paramCount++}`);
    values.push(allowCheckInOut);
  }

  if (requiresInsurance !== undefined) {
    updates.push(`requires_insurance = $${paramCount++}`);
    values.push(requiresInsurance);
  }

  if (requiresUserAgreement !== undefined) {
    updates.push(`requires_user_agreement = $${paramCount++}`);
    values.push(requiresUserAgreement);
  }

  if (linkedRegisteredItemId !== undefined) {
    updates.push(`linked_registered_item_id = $${paramCount++}`);
    values.push(linkedRegisteredItemId || null);
  }

  if (updates.length === 0) {
    return { error: "No fields to update", status: 400 };
  }

  values.push(id);
  const query = `UPDATE resources SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;

  const result = await sql(query, values);
  const responseObj = result[0];

  try {
    const assignmentChanged =
      assignedToMemberId !== undefined &&
      Number(assignedToMemberId || 0) !== Number(oldAssignedMemberId || 0);

    const becameAvailable =
      assignedToMemberId !== undefined &&
      !assignedToMemberId &&
      Number(oldAssignedMemberId || 0) !== 0;

    if (assignmentChanged || becameAvailable) {
      await sendCategoryAssignmentNotification({
        clubId,
        categoryId: effectiveCategoryId,
        resourceId: id,
        resourceName: responseObj?.name || currentResourceName || null,
        newAssignedMemberId: assignedToMemberId || null,
        oldAssignedMemberId: oldAssignedMemberId || null,
        assignmentType: assignmentType || responseObj?.assignment_type || null,
      });
    }
  } catch (e) {
    console.error("Failed to send internal ops email:", e);
  }

  try {
    const bearer = getBearerTokenFromRequest(request);
    const userId = parseUserIdFromToken(bearer);

    if (userId) {
      let actorMemberId = null;
      try {
        const rows = await sql(
          "SELECT id FROM members WHERE club_id = $1 AND user_account_id = $2 LIMIT 1",
          [Number(clubId), Number(userId)],
        );
        actorMemberId = rows?.[0]?.id || null;
      } catch (_e) {
        actorMemberId = null;
      }

      const assignmentChanged =
        assignedToMemberId !== undefined &&
        Number(assignedToMemberId || 0) !== Number(oldAssignedMemberId || 0);

      await logUserActivity({
        clubId,
        userId,
        memberId: actorMemberId,
        action: assignmentChanged
          ? "resource.assignment_changed"
          : "resource.updated",
        entityType: "resource",
        entityId: String(id),
        details: {
          assignmentType:
            assignmentType !== undefined ? String(assignmentType) : undefined,
          assignedToMemberId:
            assignedToMemberId !== undefined ? assignedToMemberId : undefined,
          oldAssignedMemberId: oldAssignedMemberId || null,
          categoryId: effectiveCategoryId,
        },
      });
    }
  } catch (e) {
    console.error("Failed to log resource activity:", e);
  }

  if (
    assignedToMemberId &&
    assignedToMemberId !== oldAssignedMemberId &&
    categoryName
  ) {
    await assignResourceCategoryTag({
      clubId,
      assignedToMemberId,
      oldAssignedMemberId,
      categoryId: currentResource[0].category_id,
      categoryName,
      resourceLength,
    });
  }

  if (
    assignedToMemberId !== oldAssignedMemberId &&
    oldAssignedMemberId &&
    categoryName
  ) {
    await removeResourceCategoryTag({
      clubId,
      oldAssignedMemberId,
      categoryId: currentResource[0].category_id,
      categoryName,
      resourceId: id,
    });
  }

  let agreementEsign = null;
  try {
    agreementEsign = await sendAgreementEsign({
      clubId,
      assignedToMemberId,
      oldAssignedMemberId,
      agreementRequiresEsign,
      agreementUrl,
      categoryName,
      categoryId: currentResource[0].category_id,
      resourceId: id,
      resourceName: normalizedNextName !== undefined ? normalizedNextName : name,
      currentResourceName,
      linkedRegisteredItemId: effectiveLinkedRegisteredItemId,
    });
  } catch (e) {
    console.error("Auto e-sign agreement failed:", e);
    agreementEsign = {
      status: "failed",
      error: e?.message || String(e),
    };
  }

  const responseObjWithAgreement = { ...responseObj };
  if (agreementEsign) {
    responseObjWithAgreement.agreement_esign = agreementEsign;
  }

  try {
    const newAssignedMemberId =
      assignedToMemberId !== undefined
        ? assignedToMemberId
        : oldAssignedMemberId;

    const assignmentChanged =
      assignedToMemberId !== undefined &&
      Number(assignedToMemberId || 0) !== Number(oldAssignedMemberId || 0);

    if (assignmentChanged) {
      await runWorkflowsForTrigger({
        clubId,
        triggerType: "resource_assigned",
        payload: {
          resourceId: id,
          categoryId: effectiveCategoryId,
          memberId: assignedToMemberId || null,
          oldMemberId: oldAssignedMemberId || null,
        },
      });
    } else if (newAssignedMemberId) {
      await runWorkflowsForTrigger({
        clubId,
        triggerType: "resource_changed",
        payload: {
          resourceId: id,
          categoryId: effectiveCategoryId,
          memberId: newAssignedMemberId,
        },
      });
    }
  } catch (e) {
    console.error("Failed to run resource workflows:", e);
  }

  try {
    const { userId, memberId } = await getActorForClub({ request, clubId });

    const action =
      assignedToMemberId !== undefined
        ? assignedToMemberId
          ? "resource_assigned"
          : "resource_unassigned"
        : checkInStatus !== undefined
          ? "resource_check_status_updated"
          : "resource_updated";

    await logUserActivity({
      clubId,
      userId,
      memberId,
      action,
      entityType: "resource",
      entityId: String(id),
      details: {
        resourceName: responseObj?.name || null,
        categoryId: responseObj?.category_id || null,
        assignedToMemberId: responseObj?.assigned_to_member_id || null,
        assignmentType: responseObj?.assignment_type || null,
        checkInStatus: responseObj?.check_in_status || null,
      },
    });
  } catch (e) {
    console.error("Failed to write resource activity log:", e);
  }

  return responseObjWithAgreement;
}
