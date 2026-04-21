<<<<<<< ours
import sql from "@/app/api/utils/sql";

function addMonths(date, months) {
  const d = new Date(date.getTime());
  const m = d.getMonth();
  d.setMonth(m + months);
  return d;
}

function toIsoDateOnly(d) {
  try {
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function computeNextOccurrence({ startAt, cadenceMonths, now }) {
  const base = startAt instanceof Date ? startAt : new Date(startAt);
  if (Number.isNaN(base.getTime())) {
    return new Date(now.getTime());
  }

  let next = new Date(base.getTime());
  // Move forward in cadence-sized jumps until it is in the future.
  // Guard against infinite loops.
  for (let i = 0; i < 36; i += 1) {
    if (next.getTime() > now.getTime()) {
      return next;
    }
    next = addMonths(next, cadenceMonths);
  }

  // Fallback
  return new Date(now.getTime());
}

export async function ensureRecurringJobsForAccount({ accountId, companyId }) {
  const acct = Number(accountId);
  const comp = Number(companyId);

  if (!Number.isFinite(acct) || !Number.isFinite(comp)) {
    return { ok: false, ensuredPlans: 0, insertedJobs: 0 };
  }

  const now = new Date();

  // Best-effort throttle: only ensure a plan every 6 hours.
  const plans = await sql(
    `
    SELECT
      p.id,
      p.customer_id,
      p.cadence_months,
      p.start_at,
      p.duration_mins,
      p.preferred_slot,
      p.preferred_day_of_week,
      p.assigned_tech_id,
      p.status,
      p.last_ensured_at,
      p.next_run_at,
      p.created_by,
      COALESCE(c.full_name, c.name) AS customer_name,
      COALESCE(NULLIF(c.primary_address, ''), c.address, '') AS customer_address,
      c.lat AS customer_lat,
      c.lng AS customer_lng
    FROM customer_recurring_plans p
    LEFT JOIN customers c
      ON c.id = p.customer_id
     AND c.account_id = p.account_id
     AND c.company_id = p.company_id
    WHERE p.account_id = $1
      AND p.company_id = $2
      AND p.status = 'active'
      AND (p.last_ensured_at IS NULL OR p.last_ensured_at < now() - interval '6 hours')
    ORDER BY COALESCE(p.last_ensured_at, '1970-01-01'::timestamptz) ASC
    LIMIT 25
    `,
    [acct, comp],
  );

  let insertedJobs = 0;
  let ensuredPlans = 0;

  for (const p of plans || []) {
    const cadenceMonths = Number(p?.cadence_months);
    if (![3, 6, 12].includes(cadenceMonths)) {
      continue;
    }

    const durationMinsRaw = Number(p?.duration_mins);
    const durationMins = Number.isFinite(durationMinsRaw)
      ? Math.min(Math.max(Math.trunc(durationMinsRaw), 15), 8 * 60)
      : 60;

    let nextStart = null;
    if (p?.next_run_at) {
      const d = new Date(p.next_run_at);
      if (
        !Number.isNaN(d.getTime()) &&
        d.getTime() > now.getTime() - 60 * 1000
      ) {
        nextStart = d;
      }
    }

    if (!nextStart) {
      nextStart = computeNextOccurrence({
        startAt: p?.start_at || now,
        cadenceMonths,
        now,
      });
    }

    const start2 = addMonths(nextStart, cadenceMonths);

    const starts = [nextStart, start2];

    for (const startAt of starts) {
      const endAt = new Date(startAt.getTime() + durationMins * 60 * 1000);

      const assignedTechId =
        p?.assigned_tech_id != null ? Number(p.assigned_tech_id) : null;

      const status = assignedTechId ? "assigned" : "unassigned";

      const titleBase = p?.customer_name ? String(p.customer_name) : "Customer";
      const title = `Recurring - ${titleBase}`;

      const address = p?.customer_address ? String(p.customer_address) : null;
      const lat =
        p?.customer_lat != null && Number.isFinite(Number(p.customer_lat))
          ? Number(p.customer_lat)
          : null;
      const lng =
        p?.customer_lng != null && Number.isFinite(Number(p.customer_lng))
          ? Number(p.customer_lng)
          : null;

      const inserted = await sql(
        `
        INSERT INTO jobs (
          account_id,
          company_id,
          customer_id,
          title,
          start_at,
          end_at,
          scheduled_start,
          scheduled_end,
          status,
          assigned_tech_id,
          recurring_plan_id,
          source,
          address,
          lat,
          lng,
          created_by,
          created_at
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $5,
          $6,
          $7,
          $8,
          $9,
          'recurring',
          $10,
          $11,
          $12,
          $13,
          now()
        )
        ON CONFLICT (recurring_plan_id, scheduled_start)
        DO NOTHING
        RETURNING id
        `,
        [
          acct,
          comp,
          Number(p.customer_id),
          title,
          startAt.toISOString(),
          endAt.toISOString(),
          status,
          assignedTechId,
          Number(p.id),
          address,
          lat,
          lng,
          p?.created_by ? String(p.created_by) : null,
        ],
      );

      if (inserted?.[0]?.id != null) {
        insertedJobs += 1;
      }
    }

    // Update next_run_at to the 2nd job's start. This is good enough for now
    // and keeps the plan moving forward.
    try {
      await sql(
        `
        UPDATE customer_recurring_plans
        SET next_run_at = $3,
            last_ensured_at = now()
        WHERE id = $1 AND account_id = $2
        `,
        [Number(p.id), acct, start2.toISOString()],
      );
    } catch (e) {
      console.warn("could not update recurring plan timestamps", e);
    }

    ensuredPlans += 1;
  }

  return {
    ok: true,
    ensuredPlans,
    insertedJobs,
    ensuredAt: now.toISOString(),
    date: toIsoDateOnly(now),
  };
}
=======
import sql from "@/app/api/utils/sql";

function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function addMonths(date, months) {
  const d = new Date(date.getTime());
  const day = d.getDate();

  d.setMonth(d.getMonth() + months);

  // JS will overflow month lengths (e.g. Jan 31 -> Mar 2). Pull back to last
  // day of previous month if needed.
  if (d.getDate() !== day) {
    d.setDate(0);
  }

  return d;
}

function computeNextOccurrence({ startAt, cadenceMonths, now }) {
  const start = safeDate(startAt);
  if (!start) return null;

  const cadence = Number(cadenceMonths);
  if (![3, 6, 12].includes(cadence)) return start;

  let t = start;
  while (t.getTime() <= now.getTime()) {
    t = addMonths(t, cadence);
  }
  return t;
}

async function ensureJobsForPlan({ plan, companyId, horizonCount = 3, now }) {
  const planId = Number(plan?.id);
  const accountId = Number(plan?.account_id);
  const customerId = Number(plan?.customer_id);

  if (!Number.isFinite(planId)) return;
  if (!Number.isFinite(accountId)) return;
  if (!Number.isFinite(customerId)) return;

  const cadence = Number(plan?.cadence_months);
  if (![3, 6, 12].includes(cadence)) return;

  const durationMins = Number(plan?.duration_mins || 60);
  const safeDuration = Number.isFinite(durationMins) ? durationMins : 60;

  const existingRows = await sql(
    `
    SELECT id, scheduled_start
    FROM jobs
    WHERE account_id = $1
      AND recurring_plan_id = $2
      AND COALESCE(status,'') <> 'cancelled'
      AND COALESCE(scheduled_start, start_at, created_at) >= $3
    ORDER BY COALESCE(scheduled_start, start_at, created_at) ASC
    LIMIT 20
    `,
    [accountId, planId, now.toISOString()],
  );

  const existingStarts = new Set(
    (existingRows || [])
      .map((r) => (r?.scheduled_start ? new Date(r.scheduled_start) : null))
      .filter((d) => d && !Number.isNaN(d.getTime()))
      .map((d) => d.toISOString()),
  );

  const next = computeNextOccurrence({
    startAt: plan?.start_at,
    cadenceMonths: cadence,
    now,
  });

  if (!next) return;

  let cursor = next;
  let inserted = 0;

  // Insert up to horizonCount upcoming jobs (best-effort)
  for (let i = 0; i < 24 && inserted < horizonCount; i += 1) {
    const startIso = cursor.toISOString();

    if (!existingStarts.has(startIso)) {
      const end = new Date(cursor.getTime() + safeDuration * 60_000);

      // title is best-effort; customer name is joined for display elsewhere
      const title = "Recurring service";

      const status = plan?.assigned_tech_id ? "scheduled" : "unassigned";

      try {
        await sql(
          `
          INSERT INTO jobs (
            account_id,
            company_id,
            customer_id,
            title,
            start_at,
            end_at,
            scheduled_start,
            scheduled_end,
            status,
            assigned_tech_id,
            recurring_plan_id,
            source,
            created_at
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$5,$6,$7,$8,$9,'recurring', now()
          )
          ON CONFLICT DO NOTHING
          `,
          [
            accountId,
            companyId,
            customerId,
            title,
            startIso,
            end.toISOString(),
            status,
            plan?.assigned_tech_id ? Number(plan.assigned_tech_id) : null,
            planId,
          ],
        );
        inserted += 1;
      } catch (e) {
        // ignore insert errors (unique index / bad data). We'll still advance.
        console.warn("[recurring] job insert failed", e);
      }
    }

    cursor = addMonths(cursor, cadence);
  }

  // Update next_run_at and last_ensured_at (best-effort)
  try {
    const computedNext = computeNextOccurrence({
      startAt: plan?.start_at,
      cadenceMonths: cadence,
      now,
    });

    await sql(
      `
      UPDATE customer_recurring_plans
      SET next_run_at = $1,
          last_ensured_at = now(),
          updated_at = now()
      WHERE id = $2
      `,
      [computedNext ? computedNext.toISOString() : null, planId],
    );
  } catch (e) {
    console.warn("[recurring] plan touch failed", e);
  }
}

export async function ensureRecurringJobsForAccount({ accountId, companyId }) {
  const acct = Number(accountId);
  const company = Number(companyId);

  if (!Number.isFinite(acct) || !Number.isFinite(company)) {
    return;
  }

  const now = new Date();

  const plans = await sql(
    `
    SELECT
      id,
      account_id,
      customer_id,
      cadence_months,
      start_at,
      duration_mins,
      assigned_tech_id,
      status,
      last_ensured_at
    FROM customer_recurring_plans
    WHERE account_id = $1
      AND company_id = $2
      AND status = 'active'
      AND (
        last_ensured_at IS NULL
        OR last_ensured_at < (now() - INTERVAL '6 hours')
      )
    ORDER BY updated_at DESC
    LIMIT 60
    `,
    [acct, company],
  );

  if (!Array.isArray(plans) || plans.length === 0) return;

  // Best-effort: ensure each plan has upcoming jobs.
  for (const plan of plans) {
    try {
      await ensureJobsForPlan({ plan, companyId: company, now });
    } catch (e) {
      console.warn("[recurring] ensureJobsForPlan failed", e);
    }
  }
}
>>>>>>> theirs
