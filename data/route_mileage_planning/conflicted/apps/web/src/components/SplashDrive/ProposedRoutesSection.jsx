export function ProposedRoutesSection({
  proposedWeekSummary,
  proposedScheduleByDay,
  proposedTotalsByTech,
  canEdit,
  onEstimateMilesNow,
  mileageEstimateState,
}) {
  if (!proposedScheduleByDay || proposedScheduleByDay.length === 0) {
    return null;
  }

  const formatMinutes = (mins) => {
    if (!mins) return "0h";
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const formatMiles = (miles) => {
    if (miles == null) return "—";
    return `${miles.toFixed(1)} mi`;
  };

  const onPrint = () => {
    window.print();
  };

  const totalRoutes = proposedWeekSummary?.milesTotalRoutes || 0;
  const milesEstimatedRoutes = proposedWeekSummary?.milesEstimatedRoutes || 0;
<<<<<<< ours
  const milesFailedRoutes = proposedWeekSummary?.milesFailedRoutes || 0;
=======
  const milesSkippedRoutes = proposedWeekSummary?.milesSkippedRoutes || 0;
>>>>>>> theirs

  const hasAllMiles =
    totalRoutes > 0 &&
    milesEstimatedRoutes > 0 &&
    milesEstimatedRoutes === totalRoutes;

  const canRunMiles =
    Boolean(onEstimateMilesNow) &&
    Boolean(canEdit) &&
    totalRoutes > 0 &&
    milesEstimatedRoutes < totalRoutes;

  const isEstimating = Boolean(mileageEstimateState?.isRunning);
  const estimateError = mileageEstimateState?.error || null;

  const progressTotal =
    mileageEstimateState?.totalRoutes != null
      ? mileageEstimateState.totalRoutes
      : totalRoutes;

  const progressRemaining = mileageEstimateState?.remainingRoutes;
  const progressDone =
    typeof progressTotal === "number" &&
    typeof progressRemaining === "number" &&
    progressTotal >= progressRemaining
      ? progressTotal - progressRemaining
      : milesEstimatedRoutes;

  const hasSomeMiles = proposedWeekSummary?.partialMilesTotal != null;

  const milesDisplayValue = hasAllMiles
    ? proposedWeekSummary.totalMiles
    : proposedWeekSummary.partialMilesTotal;

<<<<<<< ours
  const milesLabel = hasAllMiles
    ? "Travel miles (est.)"
    : hasSomeMiles
      ? "Travel miles (est. so far)"
      : "Travel miles (est.)";

  const milesNote = hasAllMiles
=======
  const milesNoteBase = hasAllMiles
>>>>>>> theirs
    ? null
    : milesFailedRoutes > 0
      ? `Estimated for ${milesEstimatedRoutes}/${totalRoutes} routes. ${milesFailedRoutes} route(s) could not be estimated.`
      : milesEstimatedRoutes > 0
        ? `Estimated for ${milesEstimatedRoutes}/${totalRoutes} routes`
        : "Not estimated yet";

  const milesNote = milesNoteBase
    ? milesSkippedRoutes > 0
      ? `${milesNoteBase} · Skipped ${milesSkippedRoutes} routes`
      : milesNoteBase
    : null;

  const statusLine =
    totalRoutes > 0
      ? hasAllMiles
        ? "Miles estimated for all eligible routes."
        : milesEstimatedRoutes > 0
          ? `Miles estimated for ${milesEstimatedRoutes}/${totalRoutes} eligible routes so far.`
          : "Miles not estimated yet."
      : null;

  // Week view columns
  const weekDayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekDayLabelByKey = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
  };

  const routesByDayName = new Map(
    proposedScheduleByDay.map((d) => [d.dayName, d.routes || []]),
  );

  const dayColumns = weekDayKeys.map((dayKey) => {
    const routes = routesByDayName.get(dayKey) || [];

    const sortedRoutes = [...routes].sort((a, b) => {
      return String(a.tech_name || "").localeCompare(String(b.tech_name || ""));
    });

    const dayStops = sortedRoutes.reduce(
      (sum, r) => sum + (r.stop_count || 0),
      0,
    );

    const dayMinutes = sortedRoutes.reduce(
      (sum, r) => sum + (r.service_minutes || 0),
      0,
    );

    let dayMiles = null;
    let hasMiles = false;

    for (const r of sortedRoutes) {
      if (r.miles != null) {
        if (!hasMiles) {
          dayMiles = 0;
          hasMiles = true;
        }
        dayMiles += r.miles;
      }
    }

    const totalsRight = `${dayStops} stops · ${formatMinutes(dayMinutes)}`;
    const milesRight = hasMiles ? ` · ${formatMiles(dayMiles)}` : "";

    return {
      dayKey,
      dayLabel: weekDayLabelByKey[dayKey] || dayKey,
      routes: sortedRoutes,
      totalsLine: totalsRight + milesRight,
    };
  });

  const showOfficeHint = !hasSomeMiles;

  return (
    <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#101828]">
            Proposed Master Route
          </h2>
          <p className="mt-1 text-sm text-[#667085]">
            Draft week view. Review, then approve to apply.
          </p>
          {statusLine ? (
            <p className="mt-1 text-xs text-[#667085]">{statusLine}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {canRunMiles ? (
            <button
              type="button"
              onClick={onEstimateMilesNow}
              disabled={isEstimating}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#344054] hover:bg-gray-50 disabled:opacity-50"
            >
              {isEstimating ? "Estimating…" : "Estimate miles"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onPrint}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#344054] hover:bg-gray-50"
          >
            Print
          </button>
        </div>
      </div>

      {estimateError ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-900 font-medium">
            Mileage estimation failed
          </p>
          <p className="mt-1 text-xs text-red-800">{estimateError}</p>
        </div>
      ) : null}

      {isEstimating ? (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-900 font-medium">Estimating miles…</p>
          <p className="mt-1 text-xs text-blue-800">
            {progressDone}/{progressTotal} routes completed. Keep this tab open.
          </p>
        </div>
      ) : null}

      {showOfficeHint ? (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            Mileage estimates are optional.
          </p>
          <p className="mt-1 text-xs text-blue-800">
            If you want miles, set your Office Address in Settings → Office
            location, then click “Estimate miles”.
          </p>
        </div>
      ) : null}

      {!hasAllMiles && hasSomeMiles ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-900">
            Miles are only estimated for part of the week so far.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Current total reflects {milesEstimatedRoutes}/{totalRoutes} eligible
            routes.
            {milesSkippedRoutes > 0
              ? ` ${milesSkippedRoutes} routes were skipped (missing addresses or too many stops).`
              : ""}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-[#667085]">Total routes</p>
          <p className="mt-1 text-lg font-semibold text-[#101828]">
            {proposedWeekSummary.totalRoutes}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#667085]">Total stops</p>
          <p className="mt-1 text-lg font-semibold text-[#101828]">
            {proposedWeekSummary.totalStops}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#667085]">Service time</p>
          <p className="mt-1 text-lg font-semibold text-[#101828]">
            {formatMinutes(proposedWeekSummary.totalServiceMinutes)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#667085]">{milesLabel}</p>
          <p className="mt-1 text-lg font-semibold text-[#101828]">
            {milesDisplayValue == null ? "—" : formatMiles(milesDisplayValue)}
          </p>
          {milesNote ? (
            <p className="mt-1 text-[11px] text-[#98A2B3]">{milesNote}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-[1600px]">
            {dayColumns.map((col) => {
              const routes = col.routes;
              const emptyState = routes.length === 0;

              return (
                <div
                  key={col.dayKey}
                  className="min-w-[220px] flex-1 rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex items-baseline justify-between border-b border-gray-200 pb-2">
                    <h3 className="text-sm font-semibold text-[#101828]">
                      {col.dayLabel}
                    </h3>
                    <p className="text-[11px] text-[#667085]">
                      {col.totalsLine}
                    </p>
                  </div>

                  {emptyState ? (
                    <p className="mt-3 text-xs text-[#98A2B3]">No routes</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {routes.map((route, idx) => {
                        const lineLeft = route.tech_name || "Unknown";
                        const stops = route.stop_count || 0;
                        const service = formatMinutes(route.service_minutes);
                        const miles =
                          route.miles != null
                            ? ` · ${formatMiles(route.miles)}`
                            : "";
                        const travelMinutes =
                          route.travel_minutes != null
                            ? ` · ${formatMinutes(route.travel_minutes)} drive`
                            : "";
                        const lineRight = `${stops} stops · ${service}${miles}${travelMinutes}`;

<<<<<<< ours
                        const milesStatus = String(
                          route.miles_status || "pending",
                        );
                        const showMilesStatus = route.miles == null;
                        const milesStatusText =
                          milesStatus === "failed"
                            ? "Miles unavailable"
                            : "Miles pending";
                        const milesStatusClass =
                          milesStatus === "failed"
                            ? "text-[11px] text-red-700"
                            : "text-[11px] text-amber-700";

=======
                        const mileageStatus = String(
                          route.mileage_status || "pending",
                        ).toLowerCase();
                        const showStatusPill =
                          route.miles == null && mileageStatus !== "estimated";

                        const statusPillText =
                          mileageStatus === "skipped"
                            ? "Miles skipped"
                            : "Miles pending";

                        const statusPillClasses =
                          mileageStatus === "skipped"
                            ? "bg-red-50 border-red-200 text-red-800"
                            : "bg-gray-50 border-gray-200 text-[#667085]";

>>>>>>> theirs
                        return (
                          <div
                            key={`${col.dayKey}-${idx}`}
                            className="rounded-lg bg-white border border-gray-200 px-3 py-2"
                          >
<<<<<<< ours
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-[#344054]">
                                {lineLeft}
                              </p>
                              {showMilesStatus ? (
                                <span className={milesStatusClass}>
                                  {milesStatusText}
                                </span>
                              ) : null}
                            </div>
=======
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-[#344054]">
                                {lineLeft}
                              </p>
                              {showStatusPill ? (
                                <span
                                  title={
                                    mileageStatus === "skipped"
                                      ? route.mileage_error || ""
                                      : ""
                                  }
                                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${statusPillClasses}`}
                                >
                                  {statusPillText}
                                </span>
                              ) : null}
                            </div>

>>>>>>> theirs
                            <p className="mt-0.5 text-xs text-[#667085]">
                              {lineRight}
                            </p>

                            {mileageStatus === "skipped" &&
                            route.mileage_error ? (
                              <p className="mt-1 text-[11px] text-red-700">
                                {route.mileage_error}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {proposedTotalsByTech.length > 0 ? (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="text-base font-semibold text-[#101828]">
            Week totals by tech
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-left font-medium text-[#667085]">
                    Tech
                  </th>
                  <th className="pb-2 text-right font-medium text-[#667085]">
                    Routes
                  </th>
                  <th className="pb-2 text-right font-medium text-[#667085]">
                    Stops
                  </th>
                  <th className="pb-2 text-right font-medium text-[#667085]">
                    Service time
                  </th>
                  <th className="pb-2 text-right font-medium text-[#667085]">
                    Miles
                  </th>
                </tr>
              </thead>
              <tbody>
                {proposedTotalsByTech.map((tech, idx) => {
                  const milesLine =
                    tech.miles != null
                      ? formatMiles(tech.miles)
                      : tech.milesFailedRoutes > 0
                        ? `— (${tech.milesEstimatedRoutes}/${tech.milesTotalRoutes}, ${tech.milesFailedRoutes} failed)`
                        : tech.milesEstimatedRoutes > 0
                          ? `— (${tech.milesEstimatedRoutes}/${tech.milesTotalRoutes})`
                          : "—";

                  return (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 text-[#344054]">{tech.techName}</td>
                      <td className="py-2 text-right text-[#344054]">
                        {tech.routes}
                      </td>
                      <td className="py-2 text-right text-[#344054]">
                        {tech.stops}
                      </td>
                      <td className="py-2 text-right text-[#344054]">
                        {formatMinutes(tech.serviceMinutes)}
                      </td>
                      <td className="py-2 text-right text-[#344054]">
                        {milesLine}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
