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
