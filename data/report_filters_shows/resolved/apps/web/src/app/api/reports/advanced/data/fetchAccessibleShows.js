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

  const hasExplicitShows = Boolean(showIds && showIds.length > 0);

  // If the caller explicitly selected events, treat that as the source of truth.
  // Date/type filters should not accidentally exclude those selected events.
  if (hasExplicitShows) {
    values.push(showIds);
    where.push(`ts.id = ANY($${idx}::int[])`);
    idx += 1;
  } else {
    const start = cleanText(dateStart);
    const end = cleanText(dateEnd);

    // Interpret date filters as event date overlap.
    // A show is in-range if it overlaps the [start, end] window.
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

    const type = cleanText(eventType);
    if (type && type !== "all") {
      values.push(type);
      where.push(`COALESCE(ts.exhibit_type,'') = $${idx}`);
      idx += 1;
    }
  }

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
