import sql from "@/app/api/utils/sql";
import {
  requireFleetRoles,
  resolveFleetBranchScope,
} from "@/app/api/fleet/utils/fleetAuth";

export async function POST(request, { params: { id } }) {
  const authz = await requireFleetRoles(["workshop_manager"]);
  if (!authz.ok) return authz.response;

  try {
    const receiptId = Number(id);
    if (!receiptId || Number.isNaN(receiptId)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

<<<<<<< ours
    // IMPORTANT: Anything's sql.transaction does NOT support async callbacks.
    // Run this workflow sequentially.
    const receiptRows = await sql`
      SELECT id, branch_id, status, po_id
      FROM fleet_parts_receipts
      WHERE id = ${receiptId}
      LIMIT 1
    `;
=======
    // Fetch receipt for authorization + quick validation.
    const [existingReceipt] = await sql`
      SELECT id, branch_id, status, po_id
      FROM fleet_parts_receipts
      WHERE id = ${receiptId}
      LIMIT 1
    `;
>>>>>>> theirs

<<<<<<< ours
    const receipt = receiptRows?.[0] || null;
    if (!receipt)
      return Response.json({ error: "Receipt not found" }, { status: 404 });
=======
    if (!existingReceipt) {
      return Response.json({ error: "Receipt not found" }, { status: 404 });
    }
>>>>>>> theirs

<<<<<<< ours
    const scope = await resolveFleetBranchScope({
      userId: authz.user.id,
      role: authz.user.role,
      branchId: receipt.branch_id,
    });
    if (!scope.ok) return scope.response;
=======
    const scope = await resolveFleetBranchScope({
      userId: authz.user.id,
      role: authz.user.role,
      branchId: existingReceipt.branch_id,
    });
    if (!scope.ok) return scope.response;
>>>>>>> theirs

<<<<<<< ours
    if (String(receipt.status) !== "draft") {
      return Response.json(
        { error: "Only draft receipts can be posted." },
        { status: 409 },
      );
    }
=======
    if (String(existingReceipt.status || "") !== "draft") {
      return Response.json(
        { error: "Only draft receipts can be posted." },
        { status: 409 },
      );
    }
>>>>>>> theirs

<<<<<<< ours
    const lines = await sql`
      SELECT id, po_line_id, part_id, quantity_received, unit_cost
      FROM fleet_parts_receipt_lines
      WHERE receipt_id = ${receiptId}
      ORDER BY id ASC
    `;
=======
    const linesCountRows = await sql(
      "SELECT COUNT(*)::int AS cnt FROM fleet_parts_receipt_lines WHERE receipt_id = $1",
      [receiptId],
    );
    const linesCount = Number(linesCountRows?.[0]?.cnt || 0);
>>>>>>> theirs

<<<<<<< ours
    if (!lines.length) {
      return Response.json(
        { error: "No receipt lines found." },
        { status: 409 },
      );
    }
=======
    if (linesCount <= 0) {
      return Response.json(
        { error: "No receipt lines found." },
        { status: 409 },
      );
    }
>>>>>>> theirs

<<<<<<< ours
    const branchId = Number(receipt.branch_id);
=======
    // NOTE: Anything's sql.transaction does NOT support an async callback.
    // We do the entire posting flow in ONE atomic SQL statement (CTEs).
    // If this statement errors, nothing is partially applied.
>>>>>>> theirs

<<<<<<< ours
    for (const l of lines) {
      const partId = l.part_id ? Number(l.part_id) : null;
      const qty = Number(l.quantity_received || 0);
      const unitCost = Number(l.unit_cost || 0);
      if (!partId || qty <= 0) continue;

      // Increase stock
      await sql`
        UPDATE fleet_parts_inventory
        SET quantity_on_hand = quantity_on_hand + ${qty}
        WHERE id = ${partId}
          AND branch_id = ${branchId}
      `;

      await receiptWithCost({
        txn: sql,
        branchId,
        partId,
        quantityIn: qty,
        unitCost,
        refType: "receipt",
        refId: receiptId,
        createdBy: Number(authz.user.id),
        notes: "Goods receipt",
        receivedAt: new Date(),
      });

      // Update PO line (if linked)
      if (l.po_line_id) {
        await sql`
          UPDATE fleet_parts_purchase_order_lines
          SET quantity_received = quantity_received + ${qty}
          WHERE id = ${Number(l.po_line_id)}
        `;
      }
    }

    // Update PO status
    if (receipt.po_id) {
      const poId = Number(receipt.po_id);

      const aggRows = await sql`
        SELECT
          COALESCE(SUM(quantity_ordered), 0)::numeric(12,3) AS ordered_qty,
          COALESCE(SUM(quantity_received), 0)::numeric(12,3) AS received_qty
        FROM fleet_parts_purchase_order_lines
        WHERE po_id = ${poId}
      `;

      const agg = aggRows?.[0] || null;

      const orderedQty = Number(agg?.ordered_qty || 0);
      const receivedQty = Number(agg?.received_qty || 0);

      let nextStatus = "ordered";
      if (orderedQty > 0 && receivedQty >= orderedQty) nextStatus = "received";
      else if (receivedQty > 0) nextStatus = "partially_received";

      await sql`
        UPDATE fleet_parts_purchase_orders
        SET status = ${nextStatus}
        WHERE id = ${poId}
      `;
    }
=======
    const postQuery = `
      WITH locked AS (
        UPDATE fleet_parts_receipts r
        SET status = 'posted',
            received_at = now(),
            received_by = $2
        WHERE r.id = $1
          AND r.status = 'draft'
        RETURNING r.id, r.branch_id, r.po_id
      ),
      lines AS (
        SELECT
          rl.id,
          rl.po_line_id,
          rl.part_id,
          rl.quantity_received,
          rl.unit_cost,
          l.branch_id,
          l.po_id
        FROM fleet_parts_receipt_lines rl
        JOIN locked l ON l.id = rl.receipt_id
        WHERE COALESCE(rl.quantity_received, 0) > 0
        ORDER BY rl.id ASC
      ),
      inv_update AS (
        UPDATE fleet_parts_inventory i
        SET quantity_on_hand = i.quantity_on_hand + src.qty
        FROM (
          SELECT part_id, SUM(quantity_received)::numeric(12,3) AS qty
          FROM lines
          WHERE part_id IS NOT NULL
          GROUP BY part_id
        ) src
        JOIN locked l ON true
        WHERE i.id = src.part_id
          AND i.branch_id = l.branch_id
        RETURNING i.id
      ),
      cost_layers AS (
        INSERT INTO fleet_parts_cost_layers (
          branch_id,
          part_id,
          source_type,
          source_id,
          received_at,
          quantity_in,
          quantity_remaining,
          unit_cost
        )
        SELECT
          l.branch_id,
          ln.part_id,
          'receipt',
          l.id,
          now(),
          ln.quantity_received,
          ln.quantity_received,
          COALESCE(ln.unit_cost, 0)
        FROM lines ln
        JOIN locked l ON true
        WHERE ln.part_id IS NOT NULL
        RETURNING 1
      ),
      movements AS (
        INSERT INTO fleet_parts_inventory_movements (
          branch_id,
          part_id,
          movement_type,
          quantity,
          unit_cost,
          ref_type,
          ref_id,
          notes,
          created_by
        )
        SELECT
          l.branch_id,
          ln.part_id,
          'receipt',
          ln.quantity_received,
          COALESCE(ln.unit_cost, 0),
          'receipt',
          l.id,
          'Goods receipt',
          $2
        FROM lines ln
        JOIN locked l ON true
        WHERE ln.part_id IS NOT NULL
        RETURNING 1
      ),
      avg_recompute AS (
        UPDATE fleet_parts_inventory i
        SET unit_cost = sub.avg_cost
        FROM (
          SELECT
            cl.part_id,
            CASE
              WHEN SUM(cl.quantity_remaining) > 0
                THEN (SUM(cl.quantity_remaining * cl.unit_cost) / SUM(cl.quantity_remaining))
              ELSE NULL
            END AS avg_cost
          FROM fleet_parts_cost_layers cl
          JOIN locked l ON l.branch_id = cl.branch_id
          WHERE cl.quantity_remaining > 0
            AND cl.part_id IN (SELECT DISTINCT part_id FROM lines WHERE part_id IS NOT NULL)
          GROUP BY cl.part_id
        ) sub
        JOIN locked l ON true
        WHERE i.id = sub.part_id
          AND i.branch_id = l.branch_id
          AND sub.avg_cost IS NOT NULL
        RETURNING i.id
      ),
      po_line_update AS (
        UPDATE fleet_parts_purchase_order_lines pol
        SET quantity_received = pol.quantity_received + ln.quantity_received
        FROM lines ln
        WHERE ln.po_line_id IS NOT NULL
          AND pol.id = ln.po_line_id
        RETURNING pol.id
      ),
      po_status AS (
        UPDATE fleet_parts_purchase_orders po
        SET status = CASE
          WHEN agg.ordered_qty > 0 AND agg.received_qty >= agg.ordered_qty THEN 'received'
          WHEN agg.received_qty > 0 THEN 'partially_received'
          ELSE po.status
        END
        FROM (
          SELECT
            pol.po_id,
            COALESCE(SUM(pol.quantity_ordered), 0)::numeric(12,3) AS ordered_qty,
            COALESCE(SUM(pol.quantity_received), 0)::numeric(12,3) AS received_qty
          FROM fleet_parts_purchase_order_lines pol
          JOIN locked l ON l.po_id = pol.po_id
          GROUP BY pol.po_id
        ) agg
        WHERE po.id = agg.po_id
        RETURNING po.id, po.status
      )
      SELECT r.*
      FROM fleet_parts_receipts r
      JOIN locked l ON l.id = r.id
      LIMIT 1;
    `;
>>>>>>> theirs

<<<<<<< ours
    const postedRows = await sql`
      UPDATE fleet_parts_receipts
      SET status = 'posted',
          received_at = now(),
          received_by = ${Number(authz.user.id)}
      WHERE id = ${receiptId}
      RETURNING *
    `;
=======
    const postedRows = await sql(postQuery, [receiptId, Number(authz.user.id)]);
    const posted = postedRows?.[0] || null;
>>>>>>> theirs

<<<<<<< ours
    const posted = postedRows?.[0] || null;
=======
    if (!posted) {
      // Something changed between the earlier check and the atomic update.
      return Response.json(
        { error: "Only draft receipts can be posted." },
        { status: 409 },
      );
    }
>>>>>>> theirs

    return Response.json({ receipt: posted });
  } catch (e) {
    console.error("Error posting receipt:", e);
<<<<<<< ours

    const code = e?.code;
    const detailsParts = [];
    if (code) detailsParts.push(`code=${String(code)}`);
    if (e?.message) detailsParts.push(String(e.message));
    const details = detailsParts.length ? detailsParts.join(" | ") : String(e);

    return Response.json(
      { error: "Failed to post receipt", details },
      { status: 500 },
    );
=======
    return Response.json(
      {
        error: "Failed to post receipt",
        details: e?.message ? String(e.message) : String(e),
      },
      { status: 500 },
    );
>>>>>>> theirs
  }
}
