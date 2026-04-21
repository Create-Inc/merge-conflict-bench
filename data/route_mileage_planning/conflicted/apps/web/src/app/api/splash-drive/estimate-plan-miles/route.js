import sql from "@/app/api/utils/sql";
import {
  requireCompanyUser,
  getStaffUser,
} from "@/app/api/utils/company-context";
import {
  ensureSettingsTable,
  getAppSetting,
} from "@/app/api/utils/app-settings";

function metersToMiles(meters) {
  const n = Number(meters);
  if (!Number.isFinite(n)) {
    return null;
  }
  return n * 0.000621371;
}

function fetchWithTimeout(url, options, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id),
  );
}

async function geocodeWithOrs({ orsApiKey, address }) {
  // tighten geocoding to reduce "wrong city/state" matches
  const url = `https://api.openrouteservice.org/geocode/search?text=${encodeURIComponent(address)}&size=1&boundary.country=US&layers=address`;

  const resp = await fetchWithTimeout(
    url,
    {
      headers: {
        Authorization: orsApiKey,
      },
    },
    8000,
  );

  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `ORS geocode returned invalid JSON for address: ${address}. Response: ${text.substring(0, 200)}`,
    );
  }

  if (!resp.ok) {
    const msg = data?.error?.message || data?.message || resp.statusText;
    throw new Error(
      `ORS geocode failed (${resp.status}) for address: ${address}. ${msg}`,
    );
  }

  const coords = data?.features?.[0]?.geometry?.coordinates;
  if (!coords || coords.length !== 2) {
    throw new Error(`Could not geocode address: ${address}`);
  }

  return coords; // [lon, lat]
}

async function getOrsMatrix({ orsApiKey, coordinates }) {
  const matrixUrl = "https://api.openrouteservice.org/v2/matrix/driving-car";
  const matrixResp = await fetchWithTimeout(
    matrixUrl,
    {
      method: "POST",
      headers: {
        Authorization: orsApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locations: coordinates,
        metrics: ["duration", "distance"],
      }),
    },
    12000,
  );

  const matrixText = await matrixResp.text();
  let matrixData;
  try {
    matrixData = JSON.parse(matrixText);
  } catch {
    throw new Error(
      `Invalid response from OpenRouteService Matrix API: ${matrixText.substring(0, 500)}`,
    );
  }

  if (!matrixResp.ok) {
    const msg =
      matrixData?.error?.message || matrixData?.message || "ORS Matrix error";
    throw new Error(`OpenRouteService Matrix API error: ${msg}`);
  }

  return matrixData;
}

function buildMatrices({ matrixData, n }) {
  const durations = matrixData?.durations;
  const distances = matrixData?.distances;

  if (!Array.isArray(durations) || durations.length !== n) {
    throw new Error("Unexpected matrix format from OpenRouteService");
  }

  const durationMatrix = Array(n)
    .fill(null)
    .map(() => Array(n).fill(Infinity));
  const distanceMatrix = Array(n)
    .fill(null)
    .map(() => Array(n).fill(Infinity));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const sec = durations?.[i]?.[j];
      const meters = distances?.[i]?.[j];
      if (typeof sec === "number") {
        durationMatrix[i][j] = Math.ceil(sec / 60);
      }
      if (typeof meters === "number") {
        distanceMatrix[i][j] = meters;
      }
    }
  }

  return { durationMatrix, distanceMatrix };
}

function optimizeNearestNeighbor({ stops, durationMatrix, distanceMatrix }) {
  const unvisited = stops.map((_, idx) => idx + 1); // stop locations start at index 1 (0 is start)
  const optimizedOrder = [];

  let currentLocationIdx = 0;
  let totalTravelMinutes = 0;
  let totalTravelMiles = 0;

  while (unvisited.length > 0) {
    let nearestIdx = -1;
    let nearestDuration = Infinity;

    for (const stopIdx of unvisited) {
      const duration = durationMatrix[currentLocationIdx][stopIdx];
      if (duration < nearestDuration) {
        nearestDuration = duration;
        nearestIdx = stopIdx;
      }
    }

    if (nearestIdx === -1 || !Number.isFinite(nearestDuration)) {
      throw new Error(
        "Could not compute travel times for all stops. This usually means at least one address could not be routed.",
      );
    }

    const distanceMeters = distanceMatrix?.[currentLocationIdx]?.[nearestIdx];
    if (
      typeof distanceMeters !== "number" ||
      !Number.isFinite(distanceMeters)
    ) {
      throw new Error(
        "Could not compute distances for all stops (distance matrix missing values).",
      );
    }

    const distanceMilesRaw = metersToMiles(distanceMeters);
    const distanceMiles =
      typeof distanceMilesRaw === "number" && Number.isFinite(distanceMilesRaw)
        ? Math.round(distanceMilesRaw * 100) / 100
        : null;

    const stopData = stops[nearestIdx - 1];
    optimizedOrder.push({
      ...stopData,
      estimated_travel_minutes: Math.ceil(nearestDuration),
      estimated_travel_miles: distanceMiles,
    });

    totalTravelMinutes += nearestDuration;
    if (typeof distanceMiles === "number") {
      totalTravelMiles += distanceMiles;
    }

    const unvisitedIdx = unvisited.indexOf(nearestIdx);
    unvisited.splice(unvisitedIdx, 1);
    currentLocationIdx = nearestIdx;
  }

  // Add return-to-office leg.
  const returnDuration = durationMatrix?.[currentLocationIdx]?.[0];
  const returnMeters = distanceMatrix?.[currentLocationIdx]?.[0];
  if (Number.isFinite(returnDuration)) {
    totalTravelMinutes += returnDuration;
  }
  if (returnMeters !== undefined && returnMeters !== null) {
    if (typeof returnMeters !== "number" || !Number.isFinite(returnMeters)) {
      throw new Error(
        "Could not compute return-to-office distance (distance matrix missing values).",
      );
    }
  }

  const returnMilesRaw = metersToMiles(returnMeters);
  const returnMiles =
    typeof returnMilesRaw === "number" && Number.isFinite(returnMilesRaw)
      ? Math.round(returnMilesRaw * 100) / 100
      : null;
  if (typeof returnMiles === "number") {
    totalTravelMiles += returnMiles;
  }

  return {
    optimizedOrder,
    totalTravelMinutes: Math.ceil(totalTravelMinutes),
    totalTravelMiles: Math.round(totalTravelMiles * 100) / 100,
  };
}

async function estimateRouteStopsWithOrs({
  orsApiKey,
  startAddress,
  stops,
  geocodeCache,
}) {
  if (!orsApiKey || !String(orsApiKey).trim()) {
    throw new Error("HEIGIT_API not configured");
  }

  if (!startAddress) {
    throw new Error("Office address not set");
  }

  const addresses = [startAddress, ...stops.map((s) => s.address)];

  if (addresses.length > 50) {
    throw new Error(
      `Too many stops for ORS matrix (${addresses.length} locations). Split the route or reduce stops.`,
    );
  }

  const coordinates = [];
  for (const addr of addresses) {
    const cached = geocodeCache.get(addr);
    if (cached) {
      coordinates.push(cached);
      continue;
    }
    const coords = await geocodeWithOrs({ orsApiKey, address: addr });
    geocodeCache.set(addr, coords);
    coordinates.push(coords);
  }

  const matrixData = await getOrsMatrix({ orsApiKey, coordinates });
  const n = coordinates.length;
  const { durationMatrix, distanceMatrix } = buildMatrices({ matrixData, n });

  const { optimizedOrder, totalTravelMinutes, totalTravelMiles } =
    optimizeNearestNeighbor({ stops, durationMatrix, distanceMatrix });

  return {
    optimizedStops: optimizedOrder,
    totalTravelMinutes,
    totalTravelMiles,
  };
}

function canEditRoutes(ctx) {
  if (ctx?.isSuperAdmin) {
    return true;
  }
  return ["Company Owner", "Admin", "Office"].includes(ctx?.role);
}

function safeInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

async function getPlan(companyId, planId) {
  const rows = await sql(
    "SELECT id, company_id, week_start, status FROM splash_drive_plans WHERE id = $1",
    [planId],
  );
  const plan = Array.isArray(rows) ? rows[0] : null;
  if (!plan || Number(plan.company_id) !== Number(companyId)) {
    return null;
  }
  return plan;
}

<<<<<<< ours
async function ensureMilesStatusColumns() {
  await sql`
    ALTER TABLE splash_drive_plan_routes
      ADD COLUMN IF NOT EXISTS miles_estimate_status TEXT
  `;
  await sql`
    ALTER TABLE splash_drive_plan_routes
      ADD COLUMN IF NOT EXISTS miles_estimate_error TEXT
  `;
  await sql`
    ALTER TABLE splash_drive_plan_routes
      ADD COLUMN IF NOT EXISTS miles_estimated_at TIMESTAMPTZ
  `;
}

=======
async function ensureMileageColumns() {
  await sql`
    ALTER TABLE splash_drive_plan_routes
      ADD COLUMN IF NOT EXISTS mileage_status TEXT
  `;
  await sql`
    ALTER TABLE splash_drive_plan_routes
      ADD COLUMN IF NOT EXISTS mileage_error TEXT
  `;
  await sql(
    "UPDATE splash_drive_plan_routes SET mileage_status = 'pending' WHERE mileage_status IS NULL",
    [],
  );
}

>>>>>>> theirs
async function getRouteAggregates(companyId, planId) {
  const rows = await sql(
    `
    SELECT
      r.id AS plan_route_id,
      r.day_of_week,
      r.assigned_tech_id AS tech_id,
      r.route_name,
      r.mileage_status,
      r.mileage_error,
      r.estimated_total_travel_miles AS estimated_total_travel_miles,
      r.estimated_total_travel_minutes AS estimated_total_travel_minutes,
      r.miles_estimate_status AS miles_estimate_status,
      r.miles_estimate_error AS miles_estimate_error,
      COUNT(s.id) AS stops_count,
      COALESCE(SUM(COALESCE(s.minutes_at_stop, 0)), 0) AS total_service_minutes,
      COALESCE(SUM(s.estimated_travel_miles), 0) AS total_miles,
      COALESCE(SUM(s.estimated_travel_minutes), 0) AS travel_minutes,
      SUM(CASE WHEN s.estimated_travel_miles IS NULL THEN 1 ELSE 0 END) AS missing_miles_stops
    FROM splash_drive_plan_routes r
    LEFT JOIN splash_drive_plan_stops s
      ON s.plan_route_id = r.id
    WHERE r.company_id = $1
      AND r.plan_id = $2
    GROUP BY r.id
    ORDER BY r.day_of_week ASC, r.id ASC
  `,
    [companyId, planId],
  );

  return Array.isArray(rows) ? rows : [];
}

function normalizeMilesValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function normalizeMinutesValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function normalizeMileageStatus(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (raw === "estimated" || raw === "skipped" || raw === "pending") {
    return raw;
  }
  return "pending";
}

function truncateError(value) {
  const s = String(value || "").trim();
  if (!s) {
    return null;
  }
  return s.length > 220 ? `${s.slice(0, 217)}…` : s;
}

export async function POST(request) {
  const gate = await requireCompanyUser();
  if (!gate.ok) {
    return gate.response;
  }

  const companyId = gate.ctx?.company?.id;
  if (!companyId) {
    return Response.json(
      { error: "No company context found for this user" },
      { status: 403 },
    );
  }

  if (!canEditRoutes(gate.ctx)) {
    return Response.json(
      { error: "Forbidden", details: "Insufficient role to estimate miles" },
      { status: 403 },
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const planId = safeInt(body?.plan_id, null);
  if (!planId) {
    return Response.json({ error: "plan_id is required" }, { status: 400 });
  }

  const maxRoutes = Math.max(1, Math.min(5, safeInt(body?.max_routes, 2)));

  try {
    await ensureSettingsTable();
<<<<<<< ours
    await ensureMilesStatusColumns();
=======
    await ensureMileageColumns();
>>>>>>> theirs

    const plan = await getPlan(companyId, planId);
    if (!plan) {
      return Response.json({ error: "Plan not found" }, { status: 404 });
    }

    const orsApiKey = process.env.HEIGIT_API;
    const officeAddress = await getAppSetting("office_address");

    if (!officeAddress) {
      return Response.json(
        {
          error: "Office address not set",
          details:
            "Set Settings → Office location → Office address to estimate travel.",
        },
        { status: 400 },
      );
    }

    const staffUser = await getStaffUser(gate.ctx);
    const requestedBy = staffUser?.id ? Number(staffUser.id) : null;

    const geocodeCache = new Map();

    const aggregatesBefore = await getRouteAggregates(companyId, planId);

    const remainingRoutes = aggregatesBefore
      .filter((r) => Number(r.stops_count) > 0)
<<<<<<< ours
      .filter((r) => Number(r.missing_miles_stops) > 0)
      .filter((r) => String(r.miles_estimate_status || "") !== "failed");
=======
      .filter((r) => normalizeMileageStatus(r.mileage_status) !== "skipped")
      .filter((r) => Number(r.missing_miles_stops) > 0);
>>>>>>> theirs

    const toProcess = remainingRoutes.slice(0, maxRoutes);

    const issues = [];
    let routesUpdated = 0;

    for (const routeAgg of toProcess) {
      const planRouteId = Number(routeAgg.plan_route_id);

      const markSkipped = async (reason) => {
        const errorMsg = truncateError(reason);
        await sql(
          "UPDATE splash_drive_plan_routes SET mileage_status = 'skipped', mileage_error = $1 WHERE id = $2 AND company_id = $3",
          [errorMsg, planRouteId, companyId],
        );
      };

      const markEstimated = async () => {
        await sql(
          "UPDATE splash_drive_plan_routes SET mileage_status = 'estimated', mileage_error = NULL WHERE id = $1 AND company_id = $2",
          [planRouteId, companyId],
        );
      };

      const stops = await sql(
        `
        SELECT
          s.id AS plan_stop_id,
          s.customer_id,
          s.minutes_at_stop,
          c.name,
          c.first_name,
          c.last_name,
          c.service_street_address,
          c.service_city,
          c.service_state,
          c.service_zip_code
        FROM splash_drive_plan_stops s
        JOIN customers c ON c.id = s.customer_id
        WHERE s.company_id = $1
          AND s.plan_route_id = $2
        ORDER BY s.stop_order ASC, s.id ASC
      `,
        [companyId, planRouteId],
      );

      const stopRows = Array.isArray(stops) ? stops : [];
      if (stopRows.length === 0) {
        // Nothing to estimate, but don't keep retrying.
        await markSkipped("No stops found for route");
        continue;
      }

      const stopIdByCustomerId = new Map(
        stopRows.map((s) => [Number(s.customer_id), Number(s.plan_stop_id)]),
      );

      const normalizedStops = stopRows.map((s) => {
        const customerId = Number(s.customer_id);
        const customerName =
          String(s?.first_name || "").trim() ||
          String(s?.last_name || "").trim()
            ? String(`${s?.first_name || ""} ${s?.last_name || ""}`).trim()
            : String(s?.name || `Customer ${customerId}`);

        const address =
          `${s.service_street_address || ""}, ${s.service_city || ""}, ${s.service_state || ""} ${s.service_zip_code || ""}`.trim();

        return {
          customer_id: customerId,
          customer_name: customerName,
          address,
          minutes_at_stop: Number(s.minutes_at_stop) || 0,
        };
      });

      const invalid = normalizedStops.filter((s) => {
        const addr = String(s.address || "").trim();
        return !addr || addr.startsWith(",") || addr === ",";
      });

      if (invalid.length > 0) {
        const routeLabel = String(
          routeAgg.route_name || `Route ${planRouteId}`,
        );
        const badList = invalid
          .map((s) => s.customer_name)
          .slice(0, 5)
          .join(", ");
<<<<<<< ours

        const msg = `Missing service addresses for ${badList}${invalid.length > 5 ? "…" : ""}`;

        issues.push(`Mileage skipped for ${routeLabel}: ${msg}`);

        await sql(
          "UPDATE splash_drive_plan_routes SET miles_estimate_status = 'failed', miles_estimate_error = $1, miles_estimated_at = CURRENT_TIMESTAMP WHERE id = $2 AND company_id = $3",
          [msg, planRouteId, companyId],
=======

        const message = `Missing service addresses for ${badList}${invalid.length > 5 ? "…" : ""}`;
        issues.push(`Mileage skipped for ${routeLabel}: ${message}`);
        await markSkipped(message);
        continue;
      }

      if (normalizedStops.length + 1 > 50) {
        const routeLabel = String(
          routeAgg.route_name || `Route ${planRouteId}`,
>>>>>>> theirs
        );
<<<<<<< ours

=======
        const message = `Too many stops for mileage estimation (${normalizedStops.length} stops). ORS matrix limit is 49 stops per route.`;
        issues.push(`Mileage skipped for ${routeLabel}: ${message}`);
        await markSkipped(message);
>>>>>>> theirs
        continue;
      }

      try {
        const { optimizedStops, totalTravelMinutes, totalTravelMiles } =
          await estimateRouteStopsWithOrs({
            orsApiKey,
            startAddress: officeAddress,
            stops: normalizedStops,
            geocodeCache,
          });

        const values = [];
        const tuples = [];
        let p = 1;

        for (let i = 0; i < optimizedStops.length; i++) {
          const stop = optimizedStops[i];
          const stopId = stopIdByCustomerId.get(Number(stop.customer_id));
          if (!stopId) {
            continue;
          }

          const order = i + 1;
          const minutes = normalizeMinutesValue(stop.estimated_travel_minutes);
          const miles = normalizeMilesValue(stop.estimated_travel_miles);

          tuples.push(`($${p++}, $${p++}, $${p++}, $${p++})`);
          values.push(stopId, order, minutes, miles);
        }

        if (tuples.length === 0) {
          const routeLabel = String(
            routeAgg.route_name || `Route ${planRouteId}`,
          );
          const message = "Could not update any stops for mileage.";
          issues.push(`Mileage skipped for ${routeLabel}: ${message}`);
          await markSkipped(message);
          continue;
        }

        const updateSql = `
          UPDATE splash_drive_plan_stops AS s
          SET
            stop_order = v.stop_order,
            estimated_travel_minutes = v.estimated_travel_minutes,
            estimated_travel_miles = v.estimated_travel_miles
          FROM (
            VALUES ${tuples.join(", ")}
          ) AS v(id, stop_order, estimated_travel_minutes, estimated_travel_miles)
          WHERE s.id = v.id
        `;

        await sql(updateSql, values);

        await sql(
          "UPDATE splash_drive_plan_routes SET estimated_total_travel_minutes = $1, estimated_total_travel_miles = $2, miles_estimate_status = 'done', miles_estimate_error = NULL, miles_estimated_at = CURRENT_TIMESTAMP WHERE id = $3 AND company_id = $4",
          [
            normalizeMinutesValue(totalTravelMinutes),
            normalizeMilesValue(totalTravelMiles),
            planRouteId,
            companyId,
          ],
        );

        await markEstimated();
        routesUpdated += 1;
      } catch (e) {
        const routeLabel = String(
          routeAgg.route_name || `Route ${planRouteId}`,
        );
<<<<<<< ours
        const errMsg = e?.message || String(e);
        issues.push(`Mileage skipped for ${routeLabel}: ${errMsg}`);

        await sql(
          "UPDATE splash_drive_plan_routes SET miles_estimate_status = 'failed', miles_estimate_error = $1, miles_estimated_at = CURRENT_TIMESTAMP WHERE id = $2 AND company_id = $3",
          [errMsg, planRouteId, companyId],
        );
=======
        const message = e?.message || String(e);
        issues.push(`Mileage skipped for ${routeLabel}: ${message}`);
        await markSkipped(message);
>>>>>>> theirs
      }
    }

    const aggregatesAfter = await getRouteAggregates(companyId, planId);

    const totalRoutesWithStops = aggregatesAfter
      .filter((r) => Number(r.stops_count) > 0)
      .filter(
        (r) => normalizeMileageStatus(r.mileage_status) !== "skipped",
      ).length;

    const failedRoutesCount = aggregatesAfter
      .filter((r) => Number(r.stops_count) > 0)
      .filter((r) => String(r.miles_estimate_status || "") === "failed").length;

    const remainingRoutesAfter = aggregatesAfter
      .filter((r) => Number(r.stops_count) > 0)
<<<<<<< ours
      .filter((r) => Number(r.missing_miles_stops) > 0)
      .filter((r) => String(r.miles_estimate_status || "") !== "failed").length;
=======
      .filter((r) => normalizeMileageStatus(r.mileage_status) !== "skipped")
      .filter((r) => Number(r.missing_miles_stops) > 0).length;
>>>>>>> theirs

    const techRows = await sql(
      "SELECT id, first_name, last_name FROM users WHERE company_id = $1",
      [companyId],
    );

    const techNameById = new Map(
      (Array.isArray(techRows) ? techRows : []).map((u) => [
        Number(u.id),
        String(`${u.first_name || ""} ${u.last_name || ""}`).trim() ||
          `User ${u.id}`,
      ]),
    );

    const proposedRoutes = aggregatesAfter.map((r) => {
      const stopsCount = safeInt(r.stops_count, 0);
      const serviceMinutes = safeInt(r.total_service_minutes, 0);

      const status = normalizeMileageStatus(r.mileage_status);
      const missingStops = safeInt(r.missing_miles_stops, 0);
<<<<<<< ours
      const statusRaw = String(r.miles_estimate_status || "");
=======
      const hasMiles =
        stopsCount > 0 && status === "estimated" && missingStops === 0;
>>>>>>> theirs

      const hasMiles =
        stopsCount > 0 && missingStops === 0 && statusRaw !== "failed";

      const routeMilesRaw =
        r.estimated_total_travel_miles != null
          ? r.estimated_total_travel_miles
          : r.total_miles;

      const routeMinutesRaw =
        r.estimated_total_travel_minutes != null
          ? r.estimated_total_travel_minutes
          : r.travel_minutes;

      const milesValue = hasMiles ? normalizeMilesValue(routeMilesRaw) : null;
      const travelMinutesValue = hasMiles
        ? normalizeMinutesValue(routeMinutesRaw)
        : null;

      const milesStatus = hasMiles
        ? "done"
        : statusRaw === "failed"
          ? "failed"
          : "pending";

      return {
        day_of_week: safeInt(r.day_of_week, null),
        tech_id: r.tech_id === null ? null : Number(r.tech_id),
        tech_name:
          r.tech_id === null
            ? "Unassigned"
            : techNameById.get(Number(r.tech_id)) || `User ${r.tech_id}`,
        route_name: r.route_name,
        stops_count: stopsCount,
        total_service_minutes: serviceMinutes,
        miles: milesValue,
        travel_minutes: travelMinutesValue,
<<<<<<< ours
        miles_status: milesStatus,
=======
        mileage_status: status,
        mileage_error: r.mileage_error || null,
>>>>>>> theirs
      };
    });

    const skippedRoutes = aggregatesAfter
      .filter((r) => Number(r.stops_count) > 0)
      .filter(
        (r) => normalizeMileageStatus(r.mileage_status) === "skipped",
      ).length;

    return Response.json({
      ok: true,
      plan: {
        id: planId,
        status: plan.status,
        week_start: plan.week_start,
      },
      proposed_routes: proposedRoutes,
      issues,
      meta: {
        requested_by_user_id: requestedBy,
        routes_updated: routesUpdated,
        max_routes: maxRoutes,
        total_routes_with_stops: totalRoutesWithStops,
        remaining_routes: remainingRoutesAfter,
<<<<<<< ours
        failed_routes: failedRoutesCount,
=======
        skipped_routes: skippedRoutes,
>>>>>>> theirs
      },
    });
  } catch (e) {
    console.error("POST /api/splash-drive/estimate-plan-miles error", e);
    return Response.json(
      { error: "Failed to estimate miles", details: e?.message || String(e) },
      { status: 500 },
    );
  }
}
