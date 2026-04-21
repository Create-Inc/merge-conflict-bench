import sql from "@/app/api/utils/sql";
import {
  requireFleetRoles,
  resolveFleetBranchScope,
} from "@/app/api/fleet/utils/fleetAuth";
import { issueWithCost } from "@/app/api/fleet/parts/utils/inventoryCosting";

export async function POST(request, { params: { id } }) {
  const authz = await requireFleetRoles(["workshop_manager"]);
  if (!authz.ok) return authz.response;

  try {
    const transferId = Number(id);
    if (!transferId || Number.isNaN(transferId)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

<<<<<<< ours
    // IMPORTANT: Anything's sql.transaction does NOT support async callbacks.
    // Run sequentially without sql.transaction(async ...).
=======
    // IMPORTANT: Anything's sql.transaction does NOT support async callbacks.
    // Run sequentially.
    const transferRows = await sql`
      SELECT id, from_branch_id, to_branch_id, status
      FROM fleet_parts_stock_transfers
      WHERE id = ${transferId}
      LIMIT 1
    `;
>>>>>>> theirs

<<<<<<< ours
    const [t] = await sql`
      SELECT id, from_branch_id, to_branch_id, status
      FROM fleet_parts_stock_transfers
      WHERE id = ${transferId}
      LIMIT 1
    `;
=======
    const t = transferRows?.[0] || null;
    if (!t)
      return Response.json({ error: "Transfer not found" }, { status: 404 });
>>>>>>> theirs

<<<<<<< ours
    if (!t)
      return Response.json({ error: "Transfer not found" }, { status: 404 });
=======
    const scopeFrom = await resolveFleetBranchScope({
      userId: authz.user.id,
      role: authz.user.role,
      branchId: t.from_branch_id,
    });
    if (!scopeFrom.ok) return scopeFrom.response;
>>>>>>> theirs

<<<<<<< ours
    const scopeFrom = await resolveFleetBranchScope({
      userId: authz.user.id,
      role: authz.user.role,
      branchId: t.from_branch_id,
    });
    if (!scopeFrom.ok) return scopeFrom.response;
=======
    if (String(t.status) !== "draft") {
      return Response.json(
        { error: "Only draft transfers can be dispatched." },
        { status: 409 },
      );
    }
>>>>>>> theirs

<<<<<<< ours
    if (t.status !== "draft") {
      return Response.json(
        { error: "Only draft transfers can be dispatched." },
        { status: 409 },
      );
    }
=======
    const lines = await sql`
      SELECT tl.id, tl.part_id, tl.quantity
      FROM fleet_parts_stock_transfer_lines tl
      WHERE tl.transfer_id = ${transferId}
      ORDER BY tl.id ASC
    `;
>>>>>>> theirs

<<<<<<< ours
    const lines = await sql`
      SELECT tl.id, tl.part_id, tl.quantity
      FROM fleet_parts_stock_transfer_lines tl
      WHERE tl.transfer_id = ${transferId}
      ORDER BY tl.id ASC
    `;
=======
    if (!lines.length) {
      return Response.json(
        { error: "No transfer lines found." },
        { status: 409 },
      );
    }
>>>>>>> theirs

<<<<<<< ours
    if (!lines.length) {
      return Response.json(
        { error: "No transfer lines found." },
        { status: 409 },
      );
    }
=======
    for (const l of lines) {
      const partId = Number(l.part_id);
      const qty = Number(l.quantity || 0);
      if (!partId || qty <= 0) continue;
>>>>>>> theirs

<<<<<<< ours
    for (const l of lines) {
      const partId = Number(l.part_id);
      const qty = Number(l.quantity || 0);
      if (!partId || qty <= 0) continue;
=======
      const partRows = await sql`
        SELECT id, branch_id, quantity_on_hand, reserved_quantity, cost_method
        FROM fleet_parts_inventory
        WHERE id = ${partId}
        LIMIT 1
      `;
>>>>>>> theirs

<<<<<<< ours
      const [p] = await sql`
        SELECT id, branch_id, quantity_on_hand, reserved_quantity
        FROM fleet_parts_inventory
        WHERE id = ${partId}
        LIMIT 1
      `;
=======
      const p = partRows?.[0] || null;
      if (!p)
        return Response.json({ error: "Part not found" }, { status: 404 });
      if (Number(p.branch_id) !== Number(t.from_branch_id)) {
        return Response.json(
          { error: "Part branch mismatch" },
          { status: 409 },
        );
      }
>>>>>>> theirs

<<<<<<< ours
      if (!p)
        return Response.json({ error: "Part not found" }, { status: 404 });
      if (Number(p.branch_id) !== Number(t.from_branch_id)) {
        return Response.json(
          { error: "Part branch mismatch" },
          { status: 409 },
        );
      }
=======
      const nextQty = Number(p.quantity_on_hand || 0) - qty;
      const reserved = Number(p.reserved_quantity || 0);
      if (nextQty < reserved) {
        return Response.json(
          { error: "Cannot transfer reserved stock." },
          { status: 409 },
        );
      }
>>>>>>> theirs

<<<<<<< ours
      const nextQty = Number(p.quantity_on_hand || 0) - qty;
      const reserved = Number(p.reserved_quantity || 0);
      if (nextQty < reserved) {
        return Response.json(
          { error: "Cannot transfer reserved stock." },
          { status: 409 },
        );
      }
=======
      const updated = await sql`
        UPDATE fleet_parts_inventory
        SET quantity_on_hand = quantity_on_hand - ${qty}
        WHERE id = ${partId}
          AND (quantity_on_hand - ${qty}) >= 0
        RETURNING cost_method
      `;
>>>>>>> theirs

<<<<<<< ours
      const updated = await sql`
        UPDATE fleet_parts_inventory
        SET quantity_on_hand = quantity_on_hand - ${qty}
        WHERE id = ${partId}
          AND (quantity_on_hand - ${qty}) >= 0
        RETURNING cost_method
      `;
=======
      if (!updated?.[0]) {
        return Response.json(
          { error: "Insufficient stock to dispatch transfer." },
          { status: 409 },
        );
      }
>>>>>>> theirs

<<<<<<< ours
      if (!updated?.[0]) {
        return Response.json(
          { error: "Insufficient stock to dispatch transfer." },
          { status: 409 },
        );
      }
=======
      const costMethod = String(
        updated[0].cost_method || "average",
      ).toLowerCase();

      const { unitCost } = await issueWithCost({
        txn: sql,
        branchId: Number(t.from_branch_id),
        partId,
        quantityOut: qty,
        costMethod,
        refType: "stock_transfer",
        refId: transferId,
        createdBy: Number(authz.user.id),
        notes: "Dispatch stock transfer",
      });
>>>>>>> theirs

<<<<<<< ours
      const costMethod = String(
        updated[0].cost_method || "average",
      ).toLowerCase();

      const { unitCost } = await issueWithCost({
        txn: sql,
        branchId: Number(t.from_branch_id),
        partId,
        quantityOut: qty,
        costMethod,
        refType: "stock_transfer",
        refId: transferId,
        createdBy: Number(authz.user.id),
        notes: "Dispatch stock transfer",
      });

      await sql`
        UPDATE fleet_parts_stock_transfer_lines
        SET unit_cost = ${unitCost}
        WHERE id = ${Number(l.id)}
=======
      // Store the effective cost for receiving side.
      await sql`
        UPDATE fleet_parts_stock_transfer_lines
        SET unit_cost = ${unitCost}
        WHERE id = ${Number(l.id)}
>>>>>>> theirs
      `;
    }

<<<<<<< ours
    const [dispatched] = await sql`
      UPDATE fleet_parts_stock_transfers
      SET status = 'in_transit',
          dispatched_at = now()
      WHERE id = ${transferId}
      RETURNING *
    `;
=======
    const dispatchedRows = await sql`
      UPDATE fleet_parts_stock_transfers
      SET status = 'in_transit',
          dispatched_at = now()
      WHERE id = ${transferId}
      RETURNING *
    `;
>>>>>>> theirs

<<<<<<< ours
    return Response.json({ transfer: dispatched });
=======
    const dispatched = dispatchedRows?.[0] || null;
    return Response.json({ transfer: dispatched });
>>>>>>> theirs
  } catch (e) {
    console.error("Error dispatching transfer:", e);

    const code = e?.code;
    const detailsParts = [];
    if (code) detailsParts.push(`code=${String(code)}`);
    if (e?.message) detailsParts.push(String(e.message));
    const details = detailsParts.length ? detailsParts.join(" | ") : String(e);

    return Response.json(
<<<<<<< ours
      {
        error: "Failed to dispatch transfer",
        details: e?.message ? String(e.message) : String(e),
      },
=======
      { error: "Failed to dispatch transfer", details },
>>>>>>> theirs
      { status: 500 },
    );
  }
}
