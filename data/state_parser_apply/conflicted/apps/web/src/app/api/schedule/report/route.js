import sql from "@/app/api/utils/sql";
import {
  canViewAllTradeShows,
  requireViewerEmployee,
} from "@/app/api/utils/rbac";
import { sendEmail } from "@/app/api/utils/send-email";

export const dynamic = "force-dynamic";

const toIntOrNull = (v) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const parseBool = (v) => {
  const s = String(v || "").toLowerCase();
  return s === "1" || s === "true" || s === "yes";
};

const normalizeText = (v) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};

const normalizeLower = (v) => {
  const s = String(v ?? "").trim();
  return s ? s.toLowerCase() : "";
};

const computeTravelTitle = (row) => {
  const subtype = normalizeLower(row?.travel_type);
  const employeeName = normalizeText(row?.employee_name);

  // For flights we always want a predictable label (avoid seat number, etc.)
  if (subtype === "flight") {
    if (employeeName) return `${employeeName} Flight`;
    return "Flight";
  }

  // Otherwise: prefer an explicit title if present.
  const explicit = normalizeText(row?.title);
  if (explicit) return explicit;

  if (employeeName) {
    if (subtype === "hotel") return `${employeeName} Hotel`;
    if (subtype === "car") return `${employeeName} Car`;
    if (subtype === "train") return `${employeeName} Train`;
    if (subtype)
      return `${employeeName} ${subtype.charAt(0).toUpperCase() + subtype.slice(1)}`;
  }

  // Finally fall back (but do NOT use details as title since it might be seat/room/etc)
  if (subtype === "hotel") return "Hotel";
  if (subtype === "car") return "Car";
  if (subtype === "train") return "Train";
  if (subtype) return subtype.charAt(0).toUpperCase() + subtype.slice(1);
  return "Travel";
};

const inferTravelWhen = (row) => {
  if (row?.departure_scheduled) return row.departure_scheduled;
  if (row?.arrival_scheduled) return row.arrival_scheduled;
  if (row?.travel_date) {
    return `${String(row.travel_date).slice(0, 10)}T12:00:00`;
  }
  return row?.created_at || null;
};

const inferTravelEndsAt = (row) => {
  if (row?.arrival_scheduled) return row.arrival_scheduled;
  return null;
};

const computeReservationStatus = (row) => {
  if (row?.is_cancelled) return "cancelled";
  const explicit = String(row?.status || "").toLowerCase();
  if (explicit) return explicit;

  const endsAt = row?.ends_at || row?.starts_at;
  const ts = endsAt ? new Date(endsAt).getTime() : null;
  if (ts && ts < Date.now() - 60 * 1000) {
    return "completed";
  }

  return "scheduled";
};

const computeTravelStatus = (row) => {
  if (row?.is_cancelled) return "cancelled";
  const s = String(row?.confirmation_status || "").toLowerCase();
  if (s === "confirmed") return "booked";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "tentative" || s === "pending" || !s) return "pending";
  return s;
};

const computeTaskDeadlineStatus = (row) => {
  const s = String(row?.status || "").toLowerCase();
  if (s === "done") return "completed";
  return "open";
};

<<<<<<< ours
async function buildScheduleReport({
  viewerEmployee,
  tradeShowIdRaw,
  employeeIdRaw,
  includeCancelled,
  typeFilter,
  statusFilter,
}) {
  const viewAll = canViewAllTradeShows(viewerEmployee);
=======
function formatWhenForEmail(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return String(isoString);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(isoString);
  }
}
>>>>>>> theirs

<<<<<<< ours
  const tradeShowId = toIntOrNull(tradeShowIdRaw);
  const employeeId = toIntOrNull(employeeIdRaw);
=======
async function fetchScheduleReportItems({
  viewerEmployee,
  tradeShowId,
  employeeId,
  includeCancelled,
  typeFilter,
  statusFilter,
}) {
  const viewAll = canViewAllTradeShows(viewerEmployee);
>>>>>>> theirs

<<<<<<< ours
  if (tradeShowIdRaw && tradeShowId == null) {
    return {
      error: { message: "Invalid trade_show_id", status: 400 },
    };
  }
  if (employeeIdRaw && employeeId == null) {
    return {
      error: { message: "Invalid employee_id", status: 400 },
    };
  }
=======
  // ---- Reservations ----
  const reservationWhere = [];
  const reservationValues = [];
>>>>>>> theirs

<<<<<<< ours
  // --- reservations ---
  const reservationWhere = [];
  const reservationValues = [];
=======
  if (!viewAll) {
    reservationValues.push(Number(viewerEmployee.id));
    reservationWhere.push(
      `r.trade_show_id IN (SELECT trade_show_id FROM trade_show_assignments WHERE employee_id = $${reservationValues.length})`,
    );
  }
>>>>>>> theirs

<<<<<<< ours
  if (!viewAll) {
    reservationValues.push(Number(viewerEmployee.id));
    reservationWhere.push(
      `r.trade_show_id IN (SELECT trade_show_id FROM trade_show_assignments WHERE employee_id = $${reservationValues.length})`,
    );
  }
=======
  if (tradeShowId != null) {
    reservationValues.push(tradeShowId);
    reservationWhere.push(`r.trade_show_id = $${reservationValues.length}`);
  }
>>>>>>> theirs

<<<<<<< ours
  if (tradeShowId != null) {
    reservationValues.push(tradeShowId);
    reservationWhere.push(`r.trade_show_id = $${reservationValues.length}`);
  }
=======
  if (!includeCancelled) {
    reservationWhere.push(`COALESCE(r.is_cancelled, false) = false`);
  }
>>>>>>> theirs

<<<<<<< ours
  if (!includeCancelled) {
    reservationWhere.push(`COALESCE(r.is_cancelled, false) = false`);
  }
=======
  if (employeeId != null) {
    reservationValues.push(employeeId);
    const idx = reservationValues.length;
    reservationWhere.push(
      `(r.owner_employee_id = $${idx} OR $${idx} = ANY(COALESCE(r.attendee_employee_ids, '{}'::integer[])))`,
    );
  }
>>>>>>> theirs

<<<<<<< ours
  if (employeeId != null) {
    reservationValues.push(employeeId);
    const idx = reservationValues.length;
    reservationWhere.push(
      `(r.owner_employee_id = $${idx} OR $${idx} = ANY(COALESCE(r.attendee_employee_ids, '{}'::integer[])))`,
    );
  }
=======
  if (typeFilter) {
    reservationValues.push(typeFilter);
    reservationWhere.push(
      `LOWER(COALESCE(r.reservation_type, '')) = LOWER($${reservationValues.length})`,
    );
  }
>>>>>>> theirs

<<<<<<< ours
  // If the user filtered to a non-reservation type, skip reservation entirely.
  const wantedTypeLower = String(typeFilter || "").toLowerCase();
  const shouldIncludeReservations =
    !typeFilter ||
    (wantedTypeLower !== "travel" && wantedTypeLower !== "deadline");
=======
  const reservationWhereSql = reservationWhere.length
    ? `WHERE ${reservationWhere.join(" AND ")}`
    : "";
>>>>>>> theirs

<<<<<<< ours
  if (typeFilter && shouldIncludeReservations) {
    reservationValues.push(typeFilter);
    reservationWhere.push(
      `LOWER(COALESCE(r.reservation_type, '')) = LOWER($${reservationValues.length})`,
    );
  }
=======
  const reservationRows = await sql(
    `
      SELECT
        r.*,
        ts.name as trade_show_name,
        e.name as owner_employee_name,
        e.avatar_url as owner_employee_avatar_url
      FROM reservations r
      LEFT JOIN trade_shows ts ON ts.id = r.trade_show_id
      LEFT JOIN employees e ON e.id = r.owner_employee_id
      ${reservationWhereSql}
      ORDER BY r.starts_at ASC, r.id ASC
    `,
    reservationValues,
  );
>>>>>>> theirs

<<<<<<< ours
  const reservationWhereSql = reservationWhere.length
    ? `WHERE ${reservationWhere.join(" AND ")}`
    : "";
=======
  // ---- Travel ----
  const travelWhere = [];
  const travelValues = [];
>>>>>>> theirs

<<<<<<< ours
  const reservationRows = shouldIncludeReservations
    ? await sql(
        `
        SELECT
          r.*,
          ts.name as trade_show_name,
          e.name as owner_employee_name,
          e.avatar_url as owner_employee_avatar_url
        FROM reservations r
        LEFT JOIN trade_shows ts ON ts.id = r.trade_show_id
        LEFT JOIN employees e ON e.id = r.owner_employee_id
        ${reservationWhereSql}
        ORDER BY r.starts_at ASC, r.id ASC
      `,
        reservationValues,
      )
    : [];

  // --- travel ---
  const travelWhere = [];
  const travelValues = [];

  if (!viewAll) {
    travelValues.push(Number(viewerEmployee.id));
    travelWhere.push(
      `t.trade_show_id IN (SELECT trade_show_id FROM trade_show_assignments WHERE employee_id = $${travelValues.length})`,
=======
  if (!viewAll) {
    travelValues.push(Number(viewerEmployee.id));
    travelWhere.push(
      `t.trade_show_id IN (SELECT trade_show_id FROM trade_show_assignments WHERE employee_id = $${travelValues.length})`,
    );
  }

  if (tradeShowId != null) {
    travelValues.push(tradeShowId);
    travelWhere.push(`t.trade_show_id = $${travelValues.length}`);
  }

  if (!includeCancelled) {
    travelWhere.push(
      `COALESCE(t.is_cancelled, false) = false AND LOWER(COALESCE(t.confirmation_status, '')) NOT IN ('cancelled','canceled')`,
>>>>>>> theirs
    );
  }

<<<<<<< ours
  if (tradeShowId != null) {
    travelValues.push(tradeShowId);
    travelWhere.push(`t.trade_show_id = $${travelValues.length}`);
  }
=======
  if (employeeId != null) {
    travelValues.push(employeeId);
    travelWhere.push(`t.employee_id = $${travelValues.length}`);
  }
>>>>>>> theirs

<<<<<<< ours
  if (!includeCancelled) {
    travelWhere.push(
      `COALESCE(t.is_cancelled, false) = false AND LOWER(COALESCE(t.confirmation_status, '')) NOT IN ('cancelled','canceled')`,
    );
  }
=======
  const shouldIncludeTravel =
    !typeFilter || String(typeFilter).toLowerCase() === "travel";
>>>>>>> theirs

<<<<<<< ours
  if (employeeId != null) {
    travelValues.push(employeeId);
    travelWhere.push(`t.employee_id = $${travelValues.length}`);
  }
=======
  const travelRows = shouldIncludeTravel
    ? await sql(
        `
          SELECT
            t.*,
            ts.name as trade_show_name,
            e.name as employee_name,
            e.avatar_url as employee_avatar_url
          FROM travel_records t
          LEFT JOIN trade_shows ts ON ts.id = t.trade_show_id
          LEFT JOIN employees e ON e.id = t.employee_id
          ${travelWhere.length ? `WHERE ${travelWhere.join(" AND ")}` : ""}
          ORDER BY COALESCE(t.departure_scheduled, t.arrival_scheduled, (t.travel_date::timestamp), t.created_at) ASC, t.id ASC
        `,
        travelValues,
      )
    : [];
>>>>>>> theirs

<<<<<<< ours
  const shouldIncludeTravel = !typeFilter || wantedTypeLower === "travel";
=======
  // ---- Task deadlines ----
  const taskWhere = [];
  const taskValues = [];
>>>>>>> theirs

<<<<<<< ours
  const travelRows = shouldIncludeTravel
    ? await sql(
        `
          SELECT
            t.*,
            ts.name as trade_show_name,
            e.name as employee_name,
            e.avatar_url as employee_avatar_url
          FROM travel_records t
          LEFT JOIN trade_shows ts ON ts.id = t.trade_show_id
          LEFT JOIN employees e ON e.id = t.employee_id
          ${travelWhere.length ? `WHERE ${travelWhere.join(" AND ")}` : ""}
          ORDER BY COALESCE(t.departure_scheduled, t.arrival_scheduled, (t.travel_date::timestamp), t.created_at) ASC, t.id ASC
        `,
        travelValues,
      )
    : [];
=======
  if (!viewAll) {
    taskValues.push(Number(viewerEmployee.id));
    taskWhere.push(
      `task.trade_show_id IN (SELECT trade_show_id FROM trade_show_assignments WHERE employee_id = $${taskValues.length})`,
    );
  }
>>>>>>> theirs

<<<<<<< ours
  // --- tasks (deadlines) ---
  const taskWhere = [];
  const taskValues = [];
=======
  if (tradeShowId != null) {
    taskValues.push(tradeShowId);
    taskWhere.push(`task.trade_show_id = $${taskValues.length}`);
  }
>>>>>>> theirs

<<<<<<< ours
  if (!viewAll) {
    taskValues.push(Number(viewerEmployee.id));
    taskWhere.push(
      `task.trade_show_id IN (SELECT trade_show_id FROM trade_show_assignments WHERE employee_id = $${taskValues.length})`,
    );
  }
=======
  taskWhere.push(`task.due_date IS NOT NULL`);
>>>>>>> theirs

<<<<<<< ours
  if (tradeShowId != null) {
    taskValues.push(tradeShowId);
    taskWhere.push(`task.trade_show_id = $${taskValues.length}`);
  }
=======
  if (employeeId != null) {
    taskValues.push(employeeId);
    taskWhere.push(`task.assigned_to = $${taskValues.length}`);
  }
>>>>>>> theirs

<<<<<<< ours
  taskWhere.push(`task.due_date IS NOT NULL`);
=======
  const shouldIncludeDeadlines =
    !typeFilter || String(typeFilter).toLowerCase() === "deadline";
>>>>>>> theirs

<<<<<<< ours
  if (employeeId != null) {
    taskValues.push(employeeId);
    taskWhere.push(`task.assigned_to = $${taskValues.length}`);
  }
=======
  const taskRows = shouldIncludeDeadlines
    ? await sql(
        `
          SELECT
            task.id,
            task.trade_show_id,
            ts.name as trade_show_name,
            task.title,
            task.status,
            task.priority,
            task.due_date,
            task.assigned_to,
            e.name as assigned_to_name,
            e.avatar_url as assigned_to_avatar_url
          FROM tasks task
          LEFT JOIN trade_shows ts ON ts.id = task.trade_show_id
          LEFT JOIN employees e ON e.id = task.assigned_to
          ${taskWhere.length ? `WHERE ${taskWhere.join(" AND ")}` : ""}
          ORDER BY task.due_date ASC, task.id ASC
        `,
        taskValues,
      )
    : [];
>>>>>>> theirs

<<<<<<< ours
  const shouldIncludeDeadlines = !typeFilter || wantedTypeLower === "deadline";
=======
  const items = [];
>>>>>>> theirs

<<<<<<< ours
  const taskRows = shouldIncludeDeadlines
    ? await sql(
        `
          SELECT
            task.id,
            task.trade_show_id,
            ts.name as trade_show_name,
            task.title,
            task.status,
            task.priority,
            task.due_date,
            task.assigned_to,
            e.name as assigned_to_name,
            e.avatar_url as assigned_to_avatar_url
          FROM tasks task
          LEFT JOIN trade_shows ts ON ts.id = task.trade_show_id
          LEFT JOIN employees e ON e.id = task.assigned_to
          ${taskWhere.length ? `WHERE ${taskWhere.join(" AND ")}` : ""}
          ORDER BY task.due_date ASC, task.id ASC
        `,
        taskValues,
      )
    : [];
=======
  for (const r of reservationRows || []) {
    const computedStatus = computeReservationStatus(r);
    const when = r.starts_at;
    const endsAt = r.ends_at || null;
>>>>>>> theirs

<<<<<<< ours
  const items = [];
=======
    const requiresAction =
      computedStatus === "scheduled" &&
      when &&
      new Date(when).getTime() > Date.now() &&
      new Date(when).getTime() - Date.now() < 24 * 60 * 60 * 1000;
>>>>>>> theirs

<<<<<<< ours
  for (const r of reservationRows || []) {
    const computedStatus = computeReservationStatus(r);
    const when = r.starts_at;
    const endsAt = r.ends_at || null;
=======
    const ownerId =
      r.owner_employee_id != null ? Number(r.owner_employee_id) : null;
>>>>>>> theirs

<<<<<<< ours
    const requiresAction =
      computedStatus === "scheduled" &&
      when &&
      new Date(when).getTime() > Date.now() &&
      new Date(when).getTime() - Date.now() < 24 * 60 * 60 * 1000;
=======
    const canEdit = Boolean(
      ownerId != null && ownerId === Number(viewerEmployee.id),
    );
>>>>>>> theirs

<<<<<<< ours
    const ownerId =
      r.owner_employee_id != null ? Number(r.owner_employee_id) : null;
=======
    items.push({
      id: `res-${r.id}`,
      source_table: "reservations",
      source_id: r.id,
      trade_show_id: r.trade_show_id,
      trade_show_name: r.trade_show_name || null,
      item_type: String(r.reservation_type || "meeting"),
      subtype: r.meeting_kind ? String(r.meeting_kind) : null,
      title: String(r.title || "(Untitled)"),
      when,
      starts_at: when,
      ends_at: endsAt,
      due_at: null,
      location: normalizeText(r.location),
      status: computedStatus,
      confirmed: computedStatus !== "pending",
      requires_action: requiresAction,
      is_external: String(r.source || "internal").toLowerCase() === "external",
      owner_employee_id: ownerId,
      owner_employee_name: r.owner_employee_name || null,
      owner_employee_avatar_url: r.owner_employee_avatar_url || null,
      attendee_employee_ids: Array.isArray(r.attendee_employee_ids)
        ? r.attendee_employee_ids
        : [],
      external_attendees: Array.isArray(r.external_attendees)
        ? r.external_attendees
        : [],
      related_lead_id: r.related_lead_id ?? null,
      related_task_id: r.related_task_id ?? null,
      can_edit: canEdit,
      raw: r,
    });
  }
>>>>>>> theirs

<<<<<<< ours
    const canEdit = Boolean(
      ownerId != null && ownerId === Number(viewerEmployee.id),
    );
=======
  for (const t of travelRows || []) {
    const when = inferTravelWhen(t);
    const endsAt = inferTravelEndsAt(t);
    const computedStatus = computeTravelStatus(t);
    const requiresAction = computedStatus === "pending";
>>>>>>> theirs

<<<<<<< ours
    items.push({
      id: `res-${r.id}`,
      source_table: "reservations",
      source_id: r.id,
      trade_show_id: r.trade_show_id,
      trade_show_name: r.trade_show_name || null,
      item_type: String(r.reservation_type || "meeting"),
      subtype: r.meeting_kind ? String(r.meeting_kind) : null,
      title: String(r.title || "(Untitled)"),
      when,
      starts_at: when,
      ends_at: endsAt,
      due_at: null,
      location: normalizeText(r.location),
      status: computedStatus,
      confirmed: computedStatus !== "pending",
      requires_action: requiresAction,
      is_external: String(r.source || "internal").toLowerCase() === "external",
      owner_employee_id: ownerId,
      owner_employee_name: r.owner_employee_name || null,
      owner_employee_avatar_url: r.owner_employee_avatar_url || null,
      attendee_employee_ids: Array.isArray(r.attendee_employee_ids)
        ? r.attendee_employee_ids
        : [],
      external_attendees: Array.isArray(r.external_attendees)
        ? r.external_attendees
        : [],
      related_lead_id: r.related_lead_id ?? null,
      related_task_id: r.related_task_id ?? null,
      can_edit: canEdit,
      raw: r,
    });
  }
=======
    const empId = t.employee_id != null ? Number(t.employee_id) : null;
    const canEdit = Boolean(
      empId != null && empId === Number(viewerEmployee.id),
    );
>>>>>>> theirs

<<<<<<< ours
  for (const t of travelRows || []) {
    const when = inferTravelWhen(t);
    const endsAt = inferTravelEndsAt(t);
    const computedStatus = computeTravelStatus(t);
=======
    items.push({
      id: `travel-${t.id}`,
      source_table: "travel_records",
      source_id: t.id,
      trade_show_id: t.trade_show_id,
      trade_show_name: t.trade_show_name || null,
      item_type: "travel",
      subtype: normalizeText(t.travel_type) || null,
      title: computeTravelTitle(t),
      when,
      starts_at: when,
      ends_at: endsAt,
      due_at: null,
      location:
        normalizeText(t.departure_airport) ||
        normalizeText(t.arrival_airport) ||
        normalizeText(t.source_url) ||
        null,
      status: computedStatus,
      confirmed: computedStatus === "booked" || computedStatus === "confirmed",
      requires_action: requiresAction,
      is_external: false,
      owner_employee_id: empId,
      owner_employee_name: t.employee_name || null,
      owner_employee_avatar_url: t.employee_avatar_url || null,
      attendee_employee_ids: [],
      external_attendees: [],
      related_lead_id: null,
      related_task_id: null,
      can_edit: canEdit,
      raw: t,
    });
  }
>>>>>>> theirs

<<<<<<< ours
    const requiresAction = computedStatus === "pending";
=======
  for (const task of taskRows || []) {
    const dueDate = task?.due_date ? String(task.due_date).slice(0, 10) : null;
    const dueAt = dueDate ? `${dueDate}T17:00:00` : null;
    const computedStatus = computeTaskDeadlineStatus(task);
>>>>>>> theirs

<<<<<<< ours
    const empId = t.employee_id != null ? Number(t.employee_id) : null;
    const canEdit = Boolean(
      empId != null && empId === Number(viewerEmployee.id),
    );
=======
    const requiresAction =
      computedStatus === "open" &&
      dueAt &&
      new Date(dueAt).getTime() < Date.now() + 48 * 60 * 60 * 1000;
>>>>>>> theirs

<<<<<<< ours
    items.push({
      id: `travel-${t.id}`,
      source_table: "travel_records",
      source_id: t.id,
      trade_show_id: t.trade_show_id,
      trade_show_name: t.trade_show_name || null,
      item_type: "travel",
      subtype: normalizeText(t.travel_type) || null,
      title: computeTravelTitle(t),
      when,
      starts_at: when,
      ends_at: endsAt,
      due_at: null,
      location:
        normalizeText(t.departure_airport) ||
        normalizeText(t.arrival_airport) ||
        normalizeText(t.source_url) ||
        null,
      status: computedStatus,
      confirmed: computedStatus === "booked" || computedStatus === "confirmed",
      requires_action: requiresAction,
      is_external: false,
      owner_employee_id: empId,
      owner_employee_name: t.employee_name || null,
      owner_employee_avatar_url: t.employee_avatar_url || null,
      attendee_employee_ids: [],
      external_attendees: [],
      related_lead_id: null,
      related_task_id: null,
      can_edit: canEdit,
      raw: t,
    });
  }
=======
    const assignedTo =
      task.assigned_to != null ? Number(task.assigned_to) : null;
    const canEdit = Boolean(
      assignedTo != null && assignedTo === Number(viewerEmployee.id),
    );
>>>>>>> theirs

<<<<<<< ours
  for (const task of taskRows || []) {
    const dueDate = task?.due_date ? String(task.due_date).slice(0, 10) : null;
    const dueAt = dueDate ? `${dueDate}T17:00:00` : null;
    const computedStatus = computeTaskDeadlineStatus(task);
=======
    items.push({
      id: `task-${task.id}`,
      source_table: "tasks",
      source_id: task.id,
      trade_show_id: task.trade_show_id,
      trade_show_name: task.trade_show_name || null,
      item_type: "deadline",
      subtype: "task",
      title: String(task.title || "Task"),
      when: dueAt,
      starts_at: null,
      ends_at: null,
      due_at: dueAt,
      location: null,
      status: computedStatus,
      confirmed: true,
      requires_action: requiresAction,
      is_external: false,
      owner_employee_id: assignedTo,
      owner_employee_name: task.assigned_to_name || null,
      owner_employee_avatar_url: task.assigned_to_avatar_url || null,
      attendee_employee_ids: [],
      external_attendees: [],
      related_lead_id: null,
      related_task_id: task.id,
      can_edit: canEdit,
      raw: task,
    });
  }
>>>>>>> theirs

<<<<<<< ours
    const requiresAction =
      computedStatus === "open" &&
      dueAt &&
      new Date(dueAt).getTime() < Date.now() + 48 * 60 * 60 * 1000;
=======
  let filtered = items;
  if (statusFilter) {
    const wanted = statusFilter.toLowerCase();
    filtered = filtered.filter(
      (it) => String(it.status || "").toLowerCase() === wanted,
    );
  }
>>>>>>> theirs

<<<<<<< ours
    const assignedTo =
      task.assigned_to != null ? Number(task.assigned_to) : null;
    const canEdit = Boolean(
      assignedTo != null && assignedTo === Number(viewerEmployee.id),
    );
=======
  if (typeFilter) {
    const wantedType = typeFilter.toLowerCase();
    filtered = filtered.filter(
      (it) => String(it.item_type || "").toLowerCase() === wantedType,
    );
  }
>>>>>>> theirs

<<<<<<< ours
    items.push({
      id: `task-${task.id}`,
      source_table: "tasks",
      source_id: task.id,
      trade_show_id: task.trade_show_id,
      trade_show_name: task.trade_show_name || null,
      item_type: "deadline",
      subtype: "task",
      title: String(task.title || "Task"),
      when: dueAt,
      starts_at: null,
      ends_at: null,
      due_at: dueAt,
      location: null,
      status: computedStatus,
      confirmed: true,
      requires_action: requiresAction,
      is_external: false,
      owner_employee_id: assignedTo,
      owner_employee_name: task.assigned_to_name || null,
      owner_employee_avatar_url: task.assigned_to_avatar_url || null,
      attendee_employee_ids: [],
      external_attendees: [],
      related_lead_id: null,
      related_task_id: task.id,
      can_edit: canEdit,
      raw: task,
    });
  }
=======
  filtered.sort((a, b) => {
    const at = a.when ? new Date(a.when).getTime() : Infinity;
    const bt = b.when ? new Date(b.when).getTime() : Infinity;
    return at - bt;
  });
>>>>>>> theirs

<<<<<<< ours
  let filtered = items;
=======
  return { filtered, viewAll };
}
>>>>>>> theirs

<<<<<<< ours
  if (statusFilter) {
    const wanted = statusFilter.toLowerCase();
    filtered = filtered.filter(
      (it) => String(it.status || "").toLowerCase() === wanted,
    );
  }
=======
export async function GET(request) {
  try {
    const { employee, response } = await requireViewerEmployee();
    if (response) return response;
>>>>>>> theirs

<<<<<<< ours
  if (typeFilter) {
    const wantedType = typeFilter.toLowerCase();
    filtered = filtered.filter(
      (it) => String(it.item_type || "").toLowerCase() === wantedType,
    );
  }
=======
    const { searchParams } = new URL(request.url);
>>>>>>> theirs

<<<<<<< ours
  filtered.sort((a, b) => {
    const at = a.when ? new Date(a.when).getTime() : Infinity;
    const bt = b.when ? new Date(b.when).getTime() : Infinity;
    return at - bt;
  });
=======
    const tradeShowIdRaw = searchParams.get("trade_show_id");
    const employeeIdRaw = searchParams.get("employee_id");
    const includeCancelled = parseBool(searchParams.get("include_cancelled"));
    const typeFilter = String(searchParams.get("type") || "").trim();
    const statusFilter = String(searchParams.get("status") || "").trim();
>>>>>>> theirs

<<<<<<< ours
  let tradeShowName = null;
  if (tradeShowId != null) {
    const [row] = await sql(
      `SELECT name FROM trade_shows WHERE id = $1 LIMIT 1`,
      [tradeShowId],
    );
    tradeShowName = row?.name ? String(row.name) : null;
  }
=======
    const tradeShowId = toIntOrNull(tradeShowIdRaw);
    const employeeId = toIntOrNull(employeeIdRaw);

    if (tradeShowIdRaw && tradeShowId == null) {
      return Response.json({ error: "Invalid trade_show_id" }, { status: 400 });
    }
    if (employeeIdRaw && employeeId == null) {
      return Response.json({ error: "Invalid employee_id" }, { status: 400 });
    }
>>>>>>> theirs

<<<<<<< ours
  return {
    report: {
=======
    const { filtered } = await fetchScheduleReportItems({
      viewerEmployee: employee,
      tradeShowId,
      employeeId,
      includeCancelled,
      typeFilter,
      statusFilter,
    });

    return Response.json({
>>>>>>> theirs
      meta: {
        trade_show_id: tradeShowId,
        trade_show_name: tradeShowName,
        employee_id: employeeId,
        // Keep this for backwards compatibility, but the UI is free to ignore it.
        warning_external_sync:
          "External calendar changes do not sync back automatically.",
      },
      items: filtered,
    },
  };
}

export async function GET(request) {
  try {
    const { employee, response } = await requireViewerEmployee();
    if (response) return response;

    const { searchParams } = new URL(request.url);

    const includeCancelled = parseBool(searchParams.get("include_cancelled"));
    const typeFilter = String(searchParams.get("type") || "").trim();
    const statusFilter = String(searchParams.get("status") || "").trim();

    const result = await buildScheduleReport({
      viewerEmployee: employee,
      tradeShowIdRaw: searchParams.get("trade_show_id"),
      employeeIdRaw: searchParams.get("employee_id"),
      includeCancelled,
      typeFilter,
      statusFilter,
    });

    if (result.error) {
      return Response.json(
        { error: result.error.message },
        { status: result.error.status },
      );
    }

    return Response.json(result.report);
  } catch (error) {
    console.error("GET /api/schedule/report error", error);
    return Response.json({ error: "Failed to load schedule" }, { status: 500 });
  }
}
<<<<<<< ours

export async function POST(request) {
  try {
    const { employee, response } = await requireViewerEmployee();
    if (response) return response;

    const body = await request.json().catch(() => ({}));

    const to = normalizeText(body?.email || body?.to);
    if (!to) {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    const includeCancelled = Boolean(body?.include_cancelled);
    const typeFilter = String(body?.type || "").trim();
    const statusFilter = String(body?.status || "").trim();

    const tradeShowIdRaw = body?.trade_show_id ?? null;
    const employeeIdRaw = body?.employee_id ?? null;

    const result = await buildScheduleReport({
      viewerEmployee: employee,
      tradeShowIdRaw,
      employeeIdRaw,
      includeCancelled,
      typeFilter,
      statusFilter,
    });

    if (result.error) {
      return Response.json(
        { error: result.error.message },
        { status: result.error.status },
      );
    }

    const report = result.report;

    const subject =
      normalizeText(body?.subject) ||
      (report?.meta?.trade_show_name
        ? `Schedule Report — ${report.meta.trade_show_name}`
        : "Schedule Report");

    const appUrl = process.env.APP_URL || "";
    const scheduleUrl = appUrl ? `${appUrl}/schedule` : null;

    const safe = (v) =>
      String(v ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

    const fmtWhen = (iso) => {
      if (!iso) return "";
      try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return String(iso);
        return d.toISOString().replace("T", " ").slice(0, 16);
      } catch {
        return String(iso);
      }
    };

    const rows = (report.items || []).slice(0, 400).map((it) => {
      const when = fmtWhen(it.when);
      const type = it.item_type ? String(it.item_type) : "";
      const title = it.title ? String(it.title) : "";
      const show = it.trade_show_name ? String(it.trade_show_name) : "";
      const person = it.owner_employee_name
        ? String(it.owner_employee_name)
        : "";
      const status = it.status ? String(it.status) : "";
      const location = it.location ? String(it.location) : "";

      return `
        <tr>
          <td style="padding:8px 10px;border-top:1px solid #E5E7EB;white-space:nowrap;">${safe(
            when,
          )}</td>
          <td style="padding:8px 10px;border-top:1px solid #E5E7EB;">${safe(
            type,
          )}</td>
          <td style="padding:8px 10px;border-top:1px solid #E5E7EB;">${safe(
            title,
          )}</td>
          <td style="padding:8px 10px;border-top:1px solid #E5E7EB;">${safe(
            show,
          )}</td>
          <td style="padding:8px 10px;border-top:1px solid #E5E7EB;">${safe(
            person,
          )}</td>
          <td style="padding:8px 10px;border-top:1px solid #E5E7EB;">${safe(
            status,
          )}</td>
          <td style="padding:8px 10px;border-top:1px solid #E5E7EB;">${safe(
            location,
          )}</td>
        </tr>
      `;
    });

    const itemsCount = Array.isArray(report.items) ? report.items.length : 0;
    const headLine = report?.meta?.trade_show_name
      ? `Schedule for <b>${safe(report.meta.trade_show_name)}</b>`
      : "Schedule";

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#111827;">
        <h2 style="margin:0 0 8px;">${headLine}</h2>
        <div style="color:#6B7280; font-size:13px; margin-bottom:14px;">${itemsCount} item${
          itemsCount === 1 ? "" : "s"
        }</div>
        ${
          scheduleUrl
            ? `<div style="margin-bottom:14px;"><a href="${safe(
                scheduleUrl,
              )}" style="color:#4F46E5;">Open in Tradeshow 360</a></div>`
            : ""
        }
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr>
              <th align="left" style="padding:8px 10px; border-bottom:1px solid #E5E7EB;">When</th>
              <th align="left" style="padding:8px 10px; border-bottom:1px solid #E5E7EB;">Type</th>
              <th align="left" style="padding:8px 10px; border-bottom:1px solid #E5E7EB;">Title</th>
              <th align="left" style="padding:8px 10px; border-bottom:1px solid #E5E7EB;">Show</th>
              <th align="left" style="padding:8px 10px; border-bottom:1px solid #E5E7EB;">Person</th>
              <th align="left" style="padding:8px 10px; border-bottom:1px solid #E5E7EB;">Status</th>
              <th align="left" style="padding:8px 10px; border-bottom:1px solid #E5E7EB;">Location</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join("\n")}
          </tbody>
        </table>
        <div style="color:#9CA3AF; font-size:12px; margin-top:14px;">Sent from Tradeshow 360</div>
      </div>
    `;

    const textLines = (report.items || []).slice(0, 400).map((it) => {
      const when = fmtWhen(it.when);
      const type = it.item_type ? String(it.item_type) : "";
      const title = it.title ? String(it.title) : "";
      const show = it.trade_show_name ? String(it.trade_show_name) : "";
      const person = it.owner_employee_name
        ? String(it.owner_employee_name)
        : "";
      const status = it.status ? String(it.status) : "";
      return `${when} | ${type} | ${title} | ${show} | ${person} | ${status}`;
    });

    const text = `${
      report?.meta?.trade_show_name
        ? `Schedule Report — ${report.meta.trade_show_name}`
        : "Schedule Report"
    }\n\n${textLines.join("\n")}\n`;

    await sendEmail({
      to,
      subject,
      html,
      text,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/schedule/report error", error);
    return Response.json(
      { error: "Failed to email schedule report" },
      { status: 500 },
    );
  }
}
=======

export async function POST(request) {
  try {
    const { employee, response } = await requireViewerEmployee();
    if (response) return response;

    const body = await request.json().catch(() => ({}));

    const to = String(body?.to || body?.email || "").trim();
    if (!to) {
      return Response.json(
        { error: "Recipient email is required" },
        { status: 400 },
      );
    }

    const tradeShowId = toIntOrNull(body?.trade_show_id);
    const employeeId = toIntOrNull(body?.employee_id);
    const includeCancelled = Boolean(body?.include_cancelled);
    const typeFilter = String(body?.type || "").trim();
    const statusFilter = String(body?.status || "").trim();

    const { filtered } = await fetchScheduleReportItems({
      viewerEmployee: employee,
      tradeShowId,
      employeeId,
      includeCancelled,
      typeFilter,
      statusFilter,
    });

    const count = filtered.length;
    const subject =
      String(body?.subject || "").trim() ||
      `Schedule report (${count.toLocaleString()} items)`;

    const rowsHtml = filtered
      .slice(0, 250)
      .map((it) => {
        const whenText = formatWhenForEmail(it.when);
        const showText = it.trade_show_name ? String(it.trade_show_name) : "";
        const typeText = it.item_type ? String(it.item_type) : "";
        const titleText = it.title ? String(it.title) : "";
        const locText = it.location ? String(it.location) : "";
        const statusText = it.status ? String(it.status) : "";

        return `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;white-space:nowrap;">${escapeHtml(
              whenText,
            )}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;">${escapeHtml(
              showText,
            )}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;white-space:nowrap;">${escapeHtml(
              typeText,
            )}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;">${escapeHtml(
              titleText,
            )}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;">${escapeHtml(
              locText,
            )}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;white-space:nowrap;">${escapeHtml(
              statusText,
            )}</td>
          </tr>
        `;
      })
      .join("");

    const truncated = count > 250;

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
        <h2 style="margin:0 0 12px 0;">Schedule report</h2>
        <div style="color:#6B7280;font-size:13px;margin-bottom:14px;">
          Generated from Tradeshow 360.
        </div>
        <div style="margin-bottom:10px;font-size:13px;">
          <strong>Total:</strong> ${count.toLocaleString()} item(s)
          ${truncated ? "(showing first 250)" : ""}
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#F9FAFB;">
              <th align="left" style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#6B7280;">When</th>
              <th align="left" style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#6B7280;">Show</th>
              <th align="left" style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#6B7280;">Type</th>
              <th align="left" style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#6B7280;">Title</th>
              <th align="left" style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#6B7280;">Location</th>
              <th align="left" style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#6B7280;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="padding:12px;color:#6B7280;">No items found for the selected filters.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    await sendEmail({
      to,
      subject,
      html,
      text: `Schedule report (${count} item(s))`,
    });

    return Response.json({ ok: true, sent: true, count });
  } catch (e) {
    console.error("POST /api/schedule/report error", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to send email" },
      { status: 500 },
    );
  }
}

function escapeHtml(value) {
  const s = value == null ? "" : String(value);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
>>>>>>> theirs
