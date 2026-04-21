import sql from "@/app/api/utils/sql";
import {
  requireFleetRoles,
  resolveFleetBranchScope,
} from "@/app/api/fleet/utils/fleetAuth";
import { receiptWithCost } from "@/app/api/fleet/parts/utils/inventoryCosting";

export async function POST(request, { params: { id } }) {
  const authz = await requireFleetRoles(["workshop_manager"]);
  if (!authz.ok) return authz.response;

  try {
    const transferId = Number(id);
    if (!transferId || Number.isNaN(transferId)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    // NOTE: Anything's sql.transaction does NOT support an async callback.
    // This endpoint used to wrap the workflow in `sql.transaction(async (txn) => ...)`,
    // which can cause the DB update to succeed but still throw an error.
    // We run the workflow sequentially instead.

    const [t] = await sql`
      SELECT id, from_branch_id, to_branch_id, status
      FROM fleet_parts_stock_transfers
      WHERE id = ${transferId}
      LIMIT 1
    `;

    if (!t) {
      return Response.json({ error: "Transfer not found" }, { status: 404 });
    }

    const scopeTo = await resolveFleetBranchScope({
      userId: authz.user.id,
      role: authz.user.role,
      branchId: t.to_branch_id,
    });
    if (!scopeTo.ok) return scopeTo.response;

    if (String(t.status || "") !== "in_transit") {
      return Response.json(
        { error: "Only in-transit transfers can be received." },
        { status: 409 },
      );
    }

    const lines = await sql`
      SELECT tl.id, tl.part_id, tl.quantity, tl.unit_cost
      FROM fleet_parts_stock_transfer_lines tl
      WHERE tl.transfer_id = ${transferId}
      ORDER BY tl.id ASC
    `;

    if (!lines.length) {
      return Response.json({ error: "No transfer lines found." }, { status: 409 });
    }

    for (const l of lines) {
      const fromPartId = Number(l.part_id);
      const qty = Number(l.quantity || 0);
      const unitCost = Number(l.unit_cost || 0);
      if (!fromPartId || qty <= 0) continue;

      const [fromPart] = await sql`
        SELECT *
        FROM fleet_parts_inventory
        WHERE id = ${fromPartId}
        LIMIT 1
      `;

      if (!fromPart) {
        return Response.json({ error: "Source part not found" }, { status: 404 });
      }

      // Find or create a matching part record in the TO branch using part_number.
      const [toPartExisting] = await sql`
        SELECT id
        FROM fleet_parts_inventory
        WHERE branch_id = ${Number(t.to_branch_id)}
          AND part_number = ${String(fromPart.part_number)}
        LIMIT 1
      `;

      let toPartId = toPartExisting?.id ? Number(toPartExisting.id) : null;

      if (!toPartId) {
        const [created] = await sql`
          INSERT INTO fleet_parts_inventory (
            part_number,
            part_name,
            description,
            category,
            unit_of_measure,
            unit_cost,
            quantity_on_hand,
            reserved_quantity,
            minimum_stock_level,
            reorder_point,
            storage_location,
            preferred_vendor_id,
            cost_method,
            is_active,
            is_critical,
            branch_id
          )
          VALUES (
            ${String(fromPart.part_number)},
            ${String(fromPart.part_name)},
            ${fromPart.description ?? null},
            ${fromPart.category ?? null},
            ${String(fromPart.unit_of_measure || "pcs")},
            ${unitCost},
            0,
            0,
            ${Number(fromPart.minimum_stock_level || 0)},
            ${Number(fromPart.reorder_point || 0)},
            ${fromPart.storage_location ?? null},
            ${fromPart.preferred_vendor_id ?? null},
            ${fromPart.cost_method ?? null},
            ${fromPart.is_active === false ? false : true},
            ${fromPart.is_critical === true},
            ${Number(t.to_branch_id)}
          )
          RETURNING id
        `;

        toPartId = created?.id ? Number(created.id) : null;
      }

      if (!toPartId) {
        return Response.json(
          { error: "Failed to create target part" },
          { status: 500 },
        );
      }

      await sql`
        UPDATE fleet_parts_inventory
        SET quantity_on_hand = quantity_on_hand + ${qty}
        WHERE id = ${toPartId}
          AND branch_id = ${Number(t.to_branch_id)}
      `;

      await receiptWithCost({
        txn: sql,
        branchId: Number(t.to_branch_id),
        partId: toPartId,
        quantityIn: qty,
        unitCost,
        refType: "stock_transfer",
        refId: transferId,
        createdBy: Number(authz.user.id),
        notes: "Receive stock transfer",
        receivedAt: new Date(),
      });
    }

    // Mark transfer as received (guard against double-receive).
    const [received] = await sql`
      UPDATE fleet_parts_stock_transfers
      SET status = 'received',
          received_at = now(),
          received_by = ${Number(authz.user.id)}
      WHERE id = ${transferId}
        AND status = 'in_transit'
      RETURNING *
    `;

    if (!received) {
      return Response.json(
        { error: "Only in-transit transfers can be received." },
        { status: 409 },
      );
    }

    return Response.json({ transfer: received });
  } catch (e) {
    console.error("Error receiving transfer:", e);
    return Response.json(
      {
        error: "Failed to receive transfer",
        details: e?.message ? String(e.message) : String(e),
      },
      { status: 500 },
    );
  }
}
