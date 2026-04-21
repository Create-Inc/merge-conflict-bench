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
    // If PO is provided, verify it and derive vendor if missing.
    let resolvedVendorId = vendorId;
    if (poId) {
      const poRows = await sql`
        SELECT id, branch_id, vendor_id
        FROM fleet_parts_purchase_orders
        WHERE id = ${Number(poId)}
        LIMIT 1
      `;
      const po = poRows?.[0] || null;
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
      if (!resolvedVendorId && po.vendor_id) {
        resolvedVendorId = Number(po.vendor_id);
      }
    }

<<<<<<< ours
    // Normalize and validate lines
    const normalizedLines = [];
    for (const l of lines) {
      const poLineId = toInt(l?.po_line_id);
      const partId = toInt(l?.part_id);
      const qty = toNum(l?.quantity_received);
      const unitCost = toNum(l?.unit_cost);

      if (!qty || qty <= 0) continue;

      if (!partId) {
        return Response.json(
          { error: "Each receipt line must include part_id" },
          { status: 400 },
        );
      }

      normalizedLines.push({
        po_line_id: poLineId,
        part_id: partId,
        quantity_received: qty,
        unit_cost: unitCost ?? 0,
      });
    }

    if (normalizedLines.length === 0) {
      return Response.json(
        { error: "Receipt must include at least one line with quantity" },
        { status: 400 },
      );
    }

    // Validate part ids are in this branch to avoid confusing FK/branch issues.
    const partIds = Array.from(
      new Set(normalizedLines.map((l) => Number(l.part_id)).filter(Boolean)),
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

    // IMPORTANT: Do not use sql.transaction(async () => ...).
    // Use a single CTE statement to insert receipt + lines.
    const insertSql = `
      WITH inserted_receipt AS (
=======
      if (Number(po.branch_id) !== Number(scope.branchId)) {
        return Response.json(
          { error: "PO is not in selected branch" },
          { status: 409 },
        );
      }

      if (!resolvedVendorId && po.vendor_id) {
        resolvedVendorId = Number(po.vendor_id);
      }

      if (String(po.status || "") === "cancelled") {
        return Response.json(
          { error: "Cannot receive against a cancelled purchase order" },
          { status: 409 },
        );
      }
    }

    // NOTE: Anything's sql.transaction does NOT support an async callback.
    // We do a single atomic INSERT statement (with CTE) for receipt + lines.

    const linesPayload = rawLines
      .map((l) => ({
        po_line_id: toInt(l.po_line_id),
        part_id: toInt(l.part_id),
        quantity_received: toNum(l.quantity_received) ?? 0,
        unit_cost: toNum(l.unit_cost) ?? 0,
      }))
      .filter((l) => Number(l.quantity_received || 0) > 0);

    const query = `
      WITH new_receipt AS (
>>>>>>> theirs
        INSERT INTO fleet_parts_receipts (
          branch_id,
          vendor_id,
          po_id,
          status,
          notes
        )
<<<<<<< ours
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
=======
        VALUES ($1, $2, $3, 'draft', $4)
        RETURNING *
      ),
      inserted_lines AS (
        INSERT INTO fleet_parts_receipt_lines (
          receipt_id,
          po_line_id,
          part_id,
          quantity_received,
          unit_cost
>>>>>>> theirs
        )
<<<<<<< ours
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
          r.id,
          li.po_line_id,
          li.part_id,
          li.quantity_received,
          COALESCE(li.unit_cost, 0)
        FROM inserted_receipt r
        JOIN line_input li ON true
        WHERE li.quantity_received > 0
      )
      SELECT * FROM inserted_receipt
    `;
=======
        SELECT
          nr.id,
          NULLIF(x->>'po_line_id', '')::int,
          NULLIF(x->>'part_id', '')::int,
          COALESCE(NULLIF(x->>'quantity_received', '')::numeric, 0),
          COALESCE(NULLIF(x->>'unit_cost', '')::numeric, 0)
        FROM new_receipt nr
        JOIN LATERAL jsonb_array_elements($5::jsonb) AS x ON true
        WHERE COALESCE(NULLIF(x->>'quantity_received', '')::numeric, 0) > 0
        RETURNING 1
      )
      SELECT * FROM new_receipt;
    `;
>>>>>>> theirs

<<<<<<< ours
    const receiptRows = await sql(insertSql, [
      Number(scope.branchId),
      resolvedVendorId,
      poId,
      notes,
      JSON.stringify(normalizedLines),
    ]);
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
    const receipt = receiptRows?.[0] || null;
    return Response.json({ receipt });
  } catch (e) {
    console.error("Error creating receipt:", e);
=======
    const receipt = rows?.[0] || null;
>>>>>>> theirs

<<<<<<< ours
    const code = e?.code;
    const detailsParts = [];
    if (code) detailsParts.push(`code=${String(code)}`);
    if (e?.message) detailsParts.push(String(e.message));
    const details = detailsParts.length ? detailsParts.join(" | ") : String(e);

=======
    if (!receipt) {
      return Response.json(
        { error: "Failed to create receipt" },
        { status: 500 },
      );
    }

    return Response.json({ receipt });
  } catch (e) {
    console.error("Error creating receipt:", e);
>>>>>>> theirs
    return Response.json(
<<<<<<< ours
      { error: "Failed to create receipt", details },
=======
      {
        error: "Failed to create receipt",
        details: e?.message ? String(e.message) : String(e),
      },
>>>>>>> theirs
      { status: 500 },
    );
  }
}
