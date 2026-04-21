import sql from "@/app/api/utils/sql";
import {
  requireFleetRoles,
  resolveFleetBranchScope,
} from "@/app/api/fleet/utils/fleetAuth";

function toInt(v) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toNum(v) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clampInt(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export async function GET(request) {
  const authz = await requireFleetRoles([
    "workshop_coordinator",
    "workshop_manager",
  ]);
  if (!authz.ok) return authz.response;

  try {
    const { searchParams } = new URL(request.url);

    const branchId = toInt(searchParams.get("branch_id"));
    const status = String(searchParams.get("status") || "").trim();
    const search = String(searchParams.get("search") || "").trim();

    const limit = clampInt(toInt(searchParams.get("limit")) || 50, 1, 200);
    const offset = clampInt(toInt(searchParams.get("offset")) || 0, 0, 1000000);

    const scope = await resolveFleetBranchScope({
      userId: authz.user.id,
      role: authz.user.role,
      branchId,
    });
    if (!scope.ok) return scope.response;

    const where = [];
    const values = [];
    let i = 1;

    if (scope.branchId) {
      where.push(`r.branch_id = $${i++}`);
      values.push(scope.branchId);
    } else {
      where.push(`r.branch_id = ANY($${i++})`);
      values.push(scope.allowedBranchIds);
    }

    if (status) {
      where.push(`r.status = $${i++}`);
      values.push(status);
    }

    if (search) {
      where.push(`(
        LOWER(r.receipt_number) LIKE LOWER($${i})
        OR LOWER(COALESCE(v.vendor_name, '')) LIKE LOWER($${i})
        OR LOWER(COALESCE(r.notes, '')) LIKE LOWER($${i})
      )`);
      values.push(`%${search}%`);
      i += 1;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*)::int AS total FROM fleet_parts_receipts r LEFT JOIN fleet_vendors v ON v.id = r.vendor_id ${whereSql}`;

    const listQuery = `
      SELECT
        r.id,
        r.receipt_number,
        r.branch_id,
        b.name AS branch_name,
        b.code AS branch_code,
        r.vendor_id,
        v.vendor_name,
        r.po_id,
        po.po_number,
        r.status,
        r.received_at,
        r.received_by,
        u.name AS received_by_name,
        r.notes,
        r.created_at,
        r.updated_at,
        (
          SELECT COUNT(*)::int FROM fleet_parts_receipt_lines rl WHERE rl.receipt_id = r.id
        ) AS lines_count
      FROM fleet_parts_receipts r
      LEFT JOIN ff_branches b ON b.id = r.branch_id
      LEFT JOIN fleet_vendors v ON v.id = r.vendor_id
      LEFT JOIN fleet_parts_purchase_orders po ON po.id = r.po_id
      LEFT JOIN auth_users u ON u.id = r.received_by
      ${whereSql}
      ORDER BY r.updated_at DESC, r.id DESC
      LIMIT $${i} OFFSET $${i + 1}
    `;

    const countRows = await sql(countQuery, values);
    const total = countRows?.[0]?.total || 0;
    const rows = await sql(listQuery, [...values, limit, offset]);

    return Response.json({
      receipts: rows || [],
      pagination: { limit, offset, total },
    });
  } catch (e) {
    console.error("Error listing receipts:", e);
    return Response.json(
      {
        error: "Failed to list receipts",
        details: e?.message ? String(e.message) : String(e),
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const authz = await requireFleetRoles(["workshop_manager"]);
  if (!authz.ok) return authz.response;

  try {
    const body = await request.json().catch(() => ({}));

    const branchId = toInt(body.branch_id);
    const vendorId = toInt(body.vendor_id);
    const poId = toInt(body.po_id);
    const notes = String(body.notes || "").trim() || null;

    const rawLines = Array.isArray(body.lines) ? body.lines : [];

    if (!branchId) {
      return Response.json({ error: "Missing branch_id" }, { status: 400 });
    }

    const scope = await resolveFleetBranchScope({
      userId: authz.user.id,
      role: authz.user.role,
      branchId,
    });
    if (!scope.ok) return scope.response;

<<<<<<< ours
    // IMPORTANT: Anything's sql.transaction does NOT support async callbacks.
    // Create the receipt and its lines without using sql.transaction(async ...).
=======
    // If PO is provided, validate it and derive vendor if missing.
    let resolvedVendorId = vendorId;
    if (poId) {
      const [po] = await sql`
        SELECT id, branch_id, vendor_id, status
        FROM fleet_parts_purchase_orders
        WHERE id = ${Number(poId)}
        LIMIT 1
      `;
>>>>>>> theirs

<<<<<<< ours
    // If PO is provided, validate it and derive vendor if missing.
    let resolvedVendorId = vendorId;
    if (poId) {
      const [po] = await sql`
        SELECT id, branch_id, vendor_id
        FROM fleet_parts_purchase_orders
        WHERE id = ${Number(poId)}
        LIMIT 1
      `;
=======
      if (!po) {
        return Response.json(
          { error: "Purchase order not found" },
          { status: 404 },
        );
      }

      if (Number(po.branch_id) !== Number(scope.branchId)) {
        return Response.json(
          { error: "PO is not in selected branch" },
          { status: 409 },
        );
      }

      if (String(po.status || "") === "cancelled") {
        return Response.json(
          { error: "Cannot receive against a cancelled purchase order" },
          { status: 409 },
        );
      }

      if (!resolvedVendorId && po.vendor_id) {
        resolvedVendorId = Number(po.vendor_id);
      }
    }

    const linesPayload = rawLines
      .map((l) => ({
        po_line_id: toInt(l?.po_line_id),
        part_id: toInt(l?.part_id),
        quantity_received: toNum(l?.quantity_received) ?? 0,
        unit_cost: toNum(l?.unit_cost) ?? 0,
      }))
      .filter((l) => Number(l.quantity_received || 0) > 0);

    if (linesPayload.length === 0) {
      return Response.json(
        { error: "Receipt must include at least one line with quantity" },
        { status: 400 },
      );
    }

    // Require part_id for each line (this app's receipt posting expects part_id)
    const missingPart = linesPayload.find((l) => !l.part_id);
    if (missingPart) {
      return Response.json(
        { error: "Each receipt line must include part_id" },
        { status: 400 },
      );
    }

    // Validate part ids belong to this branch.
    const partIds = Array.from(
      new Set(linesPayload.map((l) => Number(l.part_id)).filter(Boolean)),
    );

    if (partIds.length > 0) {
      const rows = await sql(
        "SELECT id FROM fleet_parts_inventory WHERE branch_id = $1 AND id = ANY($2)",
        [Number(scope.branchId), partIds],
      );
      const found = new Set((rows || []).map((r) => Number(r.id)));
      const missing = partIds.filter((id) => !found.has(Number(id)));
      if (missing.length > 0) {
        return Response.json(
          { error: `Invalid part_id for this branch: ${missing.join(",")}` },
          { status: 400 },
        );
      }
    }

    // NOTE: Anything's sql.transaction does NOT support an async callback.
    // We do a single atomic INSERT statement (with CTE) for receipt + lines.
    const query = `
      WITH new_receipt AS (
        INSERT INTO fleet_parts_receipts (
          branch_id,
          vendor_id,
          po_id,
          status,
          notes
        )
        VALUES ($1, $2, $3, 'draft', $4)
        RETURNING *
      ),
      line_input AS (
        SELECT *
        FROM jsonb_to_recordset($5::jsonb) AS x(
          po_line_id int,
          part_id int,
          quantity_received numeric,
          unit_cost numeric
        )
      ),
      inserted_lines AS (
        INSERT INTO fleet_parts_receipt_lines (
          receipt_id,
          po_line_id,
          part_id,
          quantity_received,
          unit_cost
        )
        SELECT
          nr.id,
          li.po_line_id,
          li.part_id,
          li.quantity_received,
          COALESCE(li.unit_cost, 0)
        FROM new_receipt nr
        JOIN line_input li ON true
        WHERE COALESCE(li.quantity_received, 0) > 0
        RETURNING 1
      )
      SELECT * FROM new_receipt;
    `;
>>>>>>> theirs

<<<<<<< ours
      if (!po) {
        return Response.json(
          { error: "Purchase order not found" },
          { status: 404 },
        );
      }
=======
    const rows = await sql(query, [
      Number(scope.branchId),
      resolvedVendorId,
      poId,
      notes,
      JSON.stringify(linesPayload),
    ]);
>>>>>>> theirs

<<<<<<< ours
      if (Number(po.branch_id) !== Number(scope.branchId)) {
        return Response.json(
          { error: "PO is not in selected branch" },
          { status: 409 },
        );
      }
=======
    const receipt = rows?.[0] || null;
>>>>>>> theirs

<<<<<<< ours
      if (!resolvedVendorId && po.vendor_id) {
        resolvedVendorId = Number(po.vendor_id);
      }
    }

    const [receipt] = await sql`
      INSERT INTO fleet_parts_receipts (
        branch_id,
        vendor_id,
        po_id,
        status,
        notes
      )
      VALUES (
        ${Number(scope.branchId)},
        ${resolvedVendorId},
        ${poId},
        'draft',
        ${notes}
      )
      RETURNING *
    `;

    const linesJson = JSON.stringify(lines || []);
=======
    if (!receipt) {
      return Response.json(
        { error: "Failed to create receipt" },
        { status: 500 },
      );
    }
>>>>>>> theirs

<<<<<<< ours
    // Insert all lines in one statement for reliability.
    await sql`
      INSERT INTO fleet_parts_receipt_lines (
        receipt_id,
        po_line_id,
        part_id,
        quantity_received,
        unit_cost
      )
      SELECT
        ${Number(receipt.id)},
        x.po_line_id,
        x.part_id,
        x.quantity_received,
        COALESCE(x.unit_cost, 0)
      FROM jsonb_to_recordset(${linesJson}::jsonb) AS x(
        po_line_id int,
        part_id int,
        quantity_received numeric,
        unit_cost numeric
      )
      WHERE COALESCE(x.quantity_received, 0) > 0
    `;

    return Response.json({ receipt });
=======
    return Response.json({ receipt });
>>>>>>> theirs
  } catch (e) {
    console.error("Error creating receipt:", e);
    return Response.json(
      {
        error: "Failed to create receipt",
        details: e?.message ? String(e.message) : String(e),
      },
      { status: 500 },
    );
  }
}
