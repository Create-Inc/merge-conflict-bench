import sql from "@/app/api/utils/sql";
import { canViewAllTradeShows } from "@/app/api/utils/rbac";
import { cleanText } from "../utils/formatters";

export async function fetchAccessibleShows({
  employee,
  showIds,
  dateStart,
  dateEnd,
  eventType,
}) {
  const viewAll = canViewAllTradeShows(employee);

  const where = [];
  const values = [];
  let idx = 1;

<<<<<<< ours
  const hasExplicitShowIds = Boolean(showIds && showIds.length > 0);

  if (hasExplicitShowIds) {
    // If the caller explicitly selects shows, never let secondary filters hide them.
=======
  const hasExplicitShows = Boolean(showIds && showIds.length > 0);

  // If the caller explicitly selected events, treat that as the source of truth.
  // (Date/type filters can still exist in the UI, but should not accidentally
  // exclude the user's selected events.)
  if (hasExplicitShows) {
>>>>>>> theirs
    values.push(showIds);
    where.push(`ts.id = ANY($${idx}::int[])`);
    idx += 1;
  } else {
    const start = cleanText(dateStart);
    const end = cleanText(dateEnd);

<<<<<<< ours
    // Interpret date filter as an overlap window (event overlaps the date range).
    if (start && end) {
      values.push(end);
      where.push(`ts.start_date <= $${idx}::date`);
      idx += 1;
=======
    // Interpret date filters as event date overlap.
    // Example: a show is in-range if it overlaps the [start, end] window.
    if (start) {
      values.push(start);
      where.push(`ts.end_date >= $${idx}::date`);
      idx += 1;
    }
    if (end) {
      values.push(end);
      where.push(`ts.start_date <= $${idx}::date`);
      idx += 1;
    }
>>>>>>> theirs

<<<<<<< ours
      values.push(start);
      where.push(`ts.end_date >= $${idx}::date`);
      idx += 1;
    } else if (start) {
      values.push(start);
      where.push(`ts.end_date >= $${idx}::date`);
      idx += 1;
    } else if (end) {
      values.push(end);
      where.push(`ts.start_date <= $${idx}::date`);
      idx += 1;
    }
=======
    const type = cleanText(eventType);
    if (type && type !== "all") {
      values.push(type);
      where.push(`COALESCE(ts.exhibit_type,'') = $${idx}`);
      idx += 1;
    }
  }
>>>>>>> theirs

<<<<<<< ours
    const type = cleanText(eventType);
    if (type && type !== "all") {
      values.push(type);
      where.push(`COALESCE(ts.exhibit_type,'') = $${idx}`);
      idx += 1;
    }
  }

=======

>>>>>>> theirs
  if (!viewAll) {
    values.push(Number(employee.id));
    where.push(
      `ts.id IN (SELECT trade_show_id FROM trade_show_assignments WHERE employee_id = $${idx})`,
    );
    idx += 1;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return sql(
    `
      SELECT ts.*
      FROM trade_shows ts
      ${whereSql}
      ORDER BY ts.start_date DESC
    `,
    values,
  );
}
