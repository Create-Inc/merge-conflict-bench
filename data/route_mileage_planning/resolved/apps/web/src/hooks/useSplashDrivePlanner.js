import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";

function issueKey(issue) {
  if (typeof issue === "string") {
    return issue;
  }
  try {
    return JSON.stringify(issue);
  } catch {
    return String(issue);
  }
}

function mergeIssues(a, b) {
  const map = new Map();
  (Array.isArray(a) ? a : []).forEach((i) => map.set(issueKey(i), i));
  (Array.isArray(b) ? b : []).forEach((i) => map.set(issueKey(i), i));
  return Array.from(map.values());
}

export function useSplashDrivePlanner() {
  const [weekStart, setWeekStart] = useState("");
  const [estimateMiles, setEstimateMiles] = useState(false);
  const [approveConfirm, setApproveConfirm] = useState(false);
  const [planData, setPlanData] = useState(null);

  const [mileageEstimateState, setMileageEstimateState] = useState({
    isRunning: false,
    error: null,
    totalRoutes: null,
    remainingRoutes: null,
  });

  const estimatePlanMilesMutation = useMutation({
    mutationFn: async ({ planId, maxRoutes }) => {
      const response = await fetch("/api/splash-drive/estimate-plan-miles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          max_routes: maxRoutes,
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const details = json?.error || response.statusText;
        throw new Error(
          `When calling /api/splash-drive/estimate-plan-miles, the response was [${response.status}] ${details}`,
        );
      }

      return json;
    },
    retry: 0,
  });

  const computeClientRemaining = (routes) => {
    const list = Array.isArray(routes) ? routes : [];
    return list
      .filter((r) => (r.stop_count ?? r.stops_count ?? 0) > 0)
      .filter((r) => String(r.mileage_status || "pending").toLowerCase() !== "skipped")
      .filter((r) => {
        const milesValue = Number(r.miles);
        return !Number.isFinite(milesValue);
      }).length;
  };

  const runMilesLoop = async (planId) => {
    setMileageEstimateState((prev) => ({
      ...prev,
      isRunning: true,
      error: null,
    }));

    try {
      let remaining = Number.POSITIVE_INFINITY;
      let totalRoutesWithStops = null;
      let loopCount = 0;
      let lastRemaining = null;

      while (loopCount < 60) {
        loopCount += 1;

        const data = await estimatePlanMilesMutation.mutateAsync({
          planId,
          maxRoutes: 2,
        });

        const meta = data?.meta || {};
        const nextTotal = meta?.total_routes_with_stops;
        const nextRemaining = meta?.remaining_routes;

        if (nextTotal !== undefined && nextTotal !== null) {
          totalRoutesWithStops = Number(nextTotal);
        }

        if (nextRemaining !== undefined && nextRemaining !== null) {
          remaining = Number(nextRemaining);
        } else {
          remaining = computeClientRemaining(data?.proposed_routes);
        }

        setPlanData((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            proposed_routes: data?.proposed_routes || prev.proposed_routes,
            issues: mergeIssues(prev?.issues || [], data?.issues || []),
            meta: {
              ...(prev?.meta || {}),
              ...(data?.meta || {}),
            },
          };
        });

        setMileageEstimateState((prev) => ({
          ...prev,
          isRunning: true,
          totalRoutes:
            totalRoutesWithStops !== null && Number.isFinite(totalRoutesWithStops)
              ? totalRoutesWithStops
              : prev.totalRoutes,
          remainingRoutes: Number.isFinite(remaining) ? remaining : prev.remainingRoutes,
        }));

        if (!Number.isFinite(remaining) || remaining <= 0) {
          break;
        }

        if (lastRemaining !== null && remaining >= lastRemaining) {
          throw new Error(
            "Miles could not be estimated for some routes. Check Issues for details (missing addresses, too many stops, or routing gaps).",
          );
        }
        lastRemaining = remaining;

        await new Promise((r) => setTimeout(r, 150));
      }
    } catch (e) {
      console.error(e);
      setMileageEstimateState((prev) => ({
        ...prev,
        error: e?.message || String(e),
      }));
    } finally {
      setMileageEstimateState((prev) => ({
        ...prev,
        isRunning: false,
      }));
    }
  };

  const planWeekMutation = useMutation({
    mutationFn: async ({ startDate, estimateMiles: estimateMilesArg }) => {
      const response = await fetch("/api/splash-drive/plan-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: startDate,
          estimate_miles: Boolean(estimateMilesArg),
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 524) {
          throw new Error(
            "Planning timed out (524). Try again with ‘Estimate travel miles’ turned off, then estimate miles after the draft is created.",
          );
        }

        const details = json?.error || response.statusText;
        throw new Error(
          `When calling /api/splash-drive/plan-week, the response was [${response.status}] ${details}`,
        );
      }

      return json;
    },
    onSuccess: (data, vars) => {
      setPlanData(data);
      setApproveConfirm(false);

      setMileageEstimateState({
        isRunning: false,
        error: null,
        totalRoutes: null,
        remainingRoutes: null,
      });

      const shouldAutoEstimate = Boolean(vars?.estimateMiles);
      const planId = data?.plan?.id;

      if (shouldAutoEstimate && planId) {
        runMilesLoop(planId);
      }
    },
  });

  const approvePlanMutation = useMutation({
    mutationFn: async ({ planId }) => {
      const response = await fetch("/api/splash-drive/approve-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId, confirm: "APPLY" }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const details = json?.error || response.statusText;
        throw new Error(
          `When calling /api/splash-drive/approve-plan, the response was [${response.status}] ${details}`,
        );
      }
      return json;
    },
    onSuccess: () => {
      setApproveConfirm(false);
      setPlanData(null);
      window.location.reload();
    },
  });

  const plannerError = planWeekMutation.error?.message || null;
  const approveError = approvePlanMutation.error?.message || null;

  const onPlanWeek = () => {
    if (!weekStart) {
      return;
    }
    planWeekMutation.mutate({ startDate: weekStart, estimateMiles });
  };

  const onEstimateMilesNow = async () => {
    const planId = planData?.plan?.id;
    if (!planId) {
      return;
    }
    await runMilesLoop(planId);
  };

  const onApprovePlan = () => {
    if (!approveConfirm) {
      return;
    }

    const planId = planData?.plan?.id;
    if (!planId) {
      return;
    }

    approvePlanMutation.mutate({ planId });
  };

  const proposedScheduleByDay = useMemo(() => {
    if (!planData?.proposed_routes) {
      return [];
    }

    const dayKeyByDow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const dayMap = new Map();

    planData.proposed_routes.forEach((route) => {
      const dow = Number(route.day_of_week);
      const dayKey = Number.isFinite(dow) ? dayKeyByDow[dow] : null;
      const dayName = dayKey || "Unknown";

      if (!dayMap.has(dayName)) {
        dayMap.set(dayName, []);
      }

      const normalized = {
        ...route,
        stop_count: route.stop_count ?? route.stops_count ?? 0,
        service_minutes: route.service_minutes ?? route.total_service_minutes ?? 0,
        miles: Number.isFinite(Number(route.miles)) ? Number(route.miles) : null,
        travel_minutes: Number.isFinite(Number(route.travel_minutes))
          ? Number(route.travel_minutes)
          : null,
        mileage_status: route.mileage_status || null,
        mileage_error: route.mileage_error || null,
      };

      dayMap.get(dayName).push(normalized);
    });

    const result = [];
    dayOrder.forEach((dayName) => {
      if (dayMap.has(dayName)) {
        const routes = dayMap.get(dayName);
        routes.sort((a, b) => {
          const nameA = a.tech_name || "";
          const nameB = b.tech_name || "";
          return nameA.localeCompare(nameB);
        });
        result.push({ dayName, routes });
      }
    });

    if (dayMap.has("Unknown")) {
      const routes = dayMap.get("Unknown");
      routes.sort((a, b) => {
        const nameA = a.tech_name || "";
        const nameB = b.tech_name || "";
        return nameA.localeCompare(nameB);
      });
      result.push({ dayName: "Unknown", routes });
    }

    return result;
  }, [planData]);

  const proposedWeekSummary = useMemo(() => {
    if (!planData?.proposed_routes) {
      return {
        totalRoutes: 0,
        totalStops: 0,
        totalServiceMinutes: 0,
        totalMiles: null,
        partialMilesTotal: null,
        milesEstimatedRoutes: 0,
        milesTotalRoutes: 0,
        milesSkippedRoutes: 0,
      };
    }

    let totalRoutes = 0;
    let totalStops = 0;
    let totalServiceMinutes = 0;

    let partialMilesTotal = 0;
    let milesEstimatedRoutes = 0;
    let milesTotalRoutes = 0;
    let milesSkippedRoutes = 0;

    planData.proposed_routes.forEach((route) => {
      const stopCount = route.stop_count ?? route.stops_count ?? 0;
      const serviceMinutes = route.service_minutes ?? route.total_service_minutes ?? 0;

      totalRoutes += 1;
      totalStops += stopCount;
      totalServiceMinutes += serviceMinutes;

      const status = String(route.mileage_status || "pending").toLowerCase();
      if (stopCount > 0) {
        if (status === "skipped") {
          milesSkippedRoutes += 1;
        } else {
          milesTotalRoutes += 1;
        }
      }

      const milesValue = Number(route.miles);
      if (Number.isFinite(milesValue)) {
        partialMilesTotal += milesValue;
        milesEstimatedRoutes += 1;
      }
    });

    const allMilesEstimated =
      milesTotalRoutes > 0 && milesEstimatedRoutes === milesTotalRoutes;

    return {
      totalRoutes,
      totalStops,
      totalServiceMinutes,
      totalMiles: allMilesEstimated ? partialMilesTotal : null,
      partialMilesTotal: milesEstimatedRoutes > 0 ? partialMilesTotal : null,
      milesEstimatedRoutes,
      milesTotalRoutes,
      milesSkippedRoutes,
    };
  }, [planData]);

  const proposedTotalsByTech = useMemo(() => {
    if (!planData?.proposed_routes) {
      return [];
    }

    const techMap = new Map();

    planData.proposed_routes.forEach((route) => {
      const techName = route.tech_name || "Unknown";
      if (!techMap.has(techName)) {
        techMap.set(techName, {
          techName,
          routes: 0,
          stops: 0,
          serviceMinutes: 0,
          miles: null,
          milesEstimatedRoutes: 0,
          milesTotalRoutes: 0,
          milesSkippedRoutes: 0,
          partialMilesTotal: 0,
        });
      }

      const tech = techMap.get(techName);
      tech.routes += 1;

      const stopCount = route.stop_count ?? route.stops_count ?? 0;
      const serviceMinutes = route.service_minutes ?? route.total_service_minutes ?? 0;

      tech.stops += stopCount;
      tech.serviceMinutes += serviceMinutes;

      if (stopCount > 0) {
        const status = String(route.mileage_status || "pending").toLowerCase();
        if (status === "skipped") {
          tech.milesSkippedRoutes += 1;
        } else {
          tech.milesTotalRoutes += 1;
        }
      }

      const milesValue = Number(route.miles);
      if (Number.isFinite(milesValue)) {
        tech.partialMilesTotal += milesValue;
        tech.milesEstimatedRoutes += 1;
      }
    });

    const result = Array.from(techMap.values()).map((t) => {
      const allMilesEstimated =
        t.milesTotalRoutes > 0 && t.milesEstimatedRoutes === t.milesTotalRoutes;
      return {
        ...t,
        miles: allMilesEstimated ? t.partialMilesTotal : null,
      };
    });

    result.sort((a, b) => a.techName.localeCompare(b.techName));
    return result;
  }, [planData]);

  const changes = useMemo(() => {
    return planData?.changes || [];
  }, [planData]);

  const issues = useMemo(() => {
    return planData?.issues || [];
  }, [planData]);

  const planCanBeApproved = useMemo(() => {
    return Boolean(planData?.proposed_routes?.length);
  }, [planData]);

  const approveDisabled =
    !approveConfirm || approvePlanMutation.isPending || !planCanBeApproved;

  return {
    plannerError,
    weekStart,
    setWeekStart,
    estimateMiles,
    setEstimateMiles,
    mileageEstimateState,
    onEstimateMilesNow,
    approveConfirm,
    setApproveConfirm,
    approveError,
    planWeekMutation,
    approvePlanMutation,
    estimatePlanMilesMutation,
    onPlanWeek,
    onApprovePlan,
    planData,
    proposedWeekSummary,
    proposedScheduleByDay,
    proposedTotalsByTech,
    changes,
    issues,
    approveDisabled,
    planCanBeApproved,
  };
}
