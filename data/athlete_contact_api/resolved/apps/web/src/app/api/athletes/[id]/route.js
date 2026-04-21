export const runtime = "nodejs";

import sql from "@/app/api/utils/sql";
import { requireStaff } from "@/app/api/utils/authz";

function parseId(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function safeText(v, max = 320) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

async function safeJson(res) {
  return res.json().catch(() => ({}));
}

export async function PATCH(request, { params: { id } }) {
  try {
    const gate = await requireStaff();
    if (!gate.ok) {
      return Response.json({ error: gate.error }, { status: gate.status });
    }

    const athleteContactId = parseId(id);
    if (!athleteContactId) {
      return Response.json({ error: "Invalid athlete id" }, { status: 400 });
    }

    const body = await request.json();

    const firstName = safeText(body?.firstName, 80);
    const lastName = safeText(body?.lastName, 80);
    const email = safeText(body?.email, 320);
    const phone = safeText(body?.phone, 64);

    // CHANGED: allow athletes to share emails with parents.
    // Still block:
    // - staff contact emails (role ambiguity / safety)
    // - other athlete contacts (keeps athlete identity stable for the athlete portal)
    if (body?.email !== undefined && email) {
      const staffConflictRows = await sql(
        `
          SELECT id, first_name, last_name, email
          FROM public.contacts
          WHERE contact_type = 'staff'
            AND email IS NOT NULL
            AND LOWER(email) = LOWER($1)
          LIMIT 1
        `,
        [email],
      );

      const staffConflict = staffConflictRows?.[0] || null;
      if (staffConflict) {
        return Response.json(
          {
            error:
              "That email is used by a staff account. Please use a different email.",
            code: "EMAIL_IN_USE_BY_STAFF",
            existingContact: {
              id: String(staffConflict.id || ""),
              contactType: "staff",
              firstName: staffConflict.first_name || "",
              lastName: staffConflict.last_name || "",
              email: staffConflict.email || "",
            },
          },
          { status: 409 },
        );
      }

      const athleteConflictRows = await sql(
        `
          SELECT id, first_name, last_name, email
          FROM public.contacts
          WHERE contact_type = 'athlete'
            AND email IS NOT NULL
            AND LOWER(email) = LOWER($1)
            AND id <> $2
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [email, athleteContactId],
      );

      const athleteConflict = athleteConflictRows?.[0] || null;
      if (athleteConflict) {
        return Response.json(
          {
            error: "That email is already used by another athlete.",
            code: "EMAIL_IN_USE_BY_OTHER_ATHLETE",
            existingContact: {
              id: String(athleteConflict.id || ""),
              contactType: "athlete",
              firstName: athleteConflict.first_name || "",
              lastName: athleteConflict.last_name || "",
              email: athleteConflict.email || "",
            },
          },
          { status: 409 },
        );
      }

      // NOTE: if a parent contact already has this email, that's allowed.
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (body?.firstName !== undefined) {
      updates.push(`first_name = $${idx++}`);
      values.push(firstName);
    }

    if (body?.lastName !== undefined) {
      updates.push(`last_name = $${idx++}`);
      values.push(lastName);
    }

    if (body?.email !== undefined) {
      updates.push(`email = $${idx++}`);
      values.push(email);
    }

    if (body?.phone !== undefined) {
      updates.push(`phone = $${idx++}`);
      values.push(phone);
    }

    if (!updates.length) {
      return Response.json({ ok: true, updated: false });
    }

    const res = await sql(
      `
      UPDATE public.contacts
      SET ${updates.join(", ")}
      WHERE id = $${idx} AND contact_type = 'athlete'
      RETURNING id
    `,
      [...values, athleteContactId],
    );

    const row = res?.[0] || null;
    if (!row) {
      return Response.json({ error: "Athlete not found" }, { status: 404 });
    }

    return Response.json({ ok: true, updated: true });
  } catch (error) {
    console.error("PATCH /api/athletes/[id]", error);

    // helpful error message for common uniqueness constraints
    const msg = String(error?.message || "");
    const lower = msg.toLowerCase();

    if (lower.includes("contacts_phone_unique")) {
      return Response.json(
        { error: "That phone number is already used by another contact." },
        { status: 409 },
      );
    }

    return Response.json(
      { error: error?.message || "Could not update athlete" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params: { id } }) {
  try {
    // Deleting contacts is destructive; lock it to super admin.
    const gate = await requireStaff({ requireSuperAdmin: true });
    if (!gate.ok) {
      return Response.json({ error: gate.error }, { status: gate.status });
    }

    const athleteContactId = parseId(id);
    if (!athleteContactId) {
      return Response.json({ error: "Invalid athlete id" }, { status: 400 });
    }

    const existing = await sql(
      `
      SELECT id
      FROM public.contacts
      WHERE id = $1 AND contact_type = 'athlete'
      LIMIT 1
    `,
      [athleteContactId],
    );

    if (!existing?.[0]) {
      return Response.json({ error: "Athlete not found" }, { status: 404 });
    }

    await sql(
      `
      DELETE FROM public.contacts
      WHERE id = $1 AND contact_type = 'athlete'
    `,
      [athleteContactId],
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/athletes/[id]", error);
    return Response.json(
      { error: error?.message || "Could not delete athlete" },
      { status: 500 },
    );
  }
}

// Basic OPTIONS for CORS / preflight friendliness
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "PATCH, DELETE, OPTIONS",
    },
  });
}
