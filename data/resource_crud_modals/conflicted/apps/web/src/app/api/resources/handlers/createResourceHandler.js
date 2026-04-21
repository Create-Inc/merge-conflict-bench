import sql from "@/app/api/utils/sql";
import { validateCategorySizes } from "../utils/validationHelpers";

export async function createResourceHandler(body) {
  const {
    clubId,
    categoryId,
    resourceType,
    name,
<<<<<<< ours
    resourceName, // NEW: optional "resource_name" (ex: boat name)
=======
    resourceName,
>>>>>>> theirs
    description,
    monthlyFee,
    stripeProductId,
    length,
    depth,
    beam,
  } = body;

  const safeClubId = clubId || 1;
  const trimmedName = String(name || "").trim();
<<<<<<< ours
  const trimmedResourceNameRaw =
    resourceName === undefined || resourceName === null
      ? null
      : String(resourceName).trim();
  const trimmedResourceName = trimmedResourceNameRaw
    ? trimmedResourceNameRaw
    : null;
=======
  const trimmedResourceName = String(resourceName || "").trim();
>>>>>>> theirs

  if (!trimmedName) {
    return {
      error: "Resource name is required",
      status: 400,
    };
  }

  // NEW: enforce unique resource names within a club (case-insensitive)
  const existing = await sql(
    "SELECT id FROM resources WHERE club_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1",
    [Number(safeClubId), trimmedName],
  );

  if (existing?.length) {
    return {
      error: `A resource named "${trimmedName}" already exists. Resource names must be unique (ex: only one A20).`,
      status: 409,
    };
  }

  // If the category has explicit size options, require length to be one of them.
  const validation = await validateCategorySizes({
    clubId: safeClubId,
    categoryId,
    length,
  });

  if (!validation.valid) {
    return {
      error: validation.error,
      status: 400,
    };
  }

  const result = await sql`
    INSERT INTO resources (
      club_id, 
      category_id, 
      resource_type, 
      name,
      resource_name,
      description, 
      monthly_fee,
      stripe_product_id,
      length,
      depth,
      beam
    )
    VALUES (
      ${safeClubId}, 
      ${categoryId || null}, 
      ${resourceType || null}, 
<<<<<<< ours
      ${trimmedName},
      ${trimmedResourceName},
=======
      ${trimmedName},
      ${trimmedResourceName || null},
>>>>>>> theirs
      ${description || null}, 
      ${monthlyFee || null},
      ${stripeProductId || null},
      ${length || null},
      ${depth || null},
      ${beam || null}
    )
    RETURNING *
  `;

  return { resource: result[0] };
}
