import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Scissors,
  RefreshCw,
  Users,
  Crosshair,
  History,
} from "lucide-react";
import Button from "@/components/ui/Button";

function formatPoints(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return "0.0";
  }
  return n.toFixed(1);
}

function formatTiebreakerLabel(tiebreaker) {
  const tb = String(tiebreaker || "").toLowerCase();
  if (tb === "season_points") {
    return "Tiebreaker: season points";
  }
  if (tb === "season_points_then_draft_position") {
    return "Tiebreaker: season points, then draft position";
  }
  if (!tb) {
    return null;
  }
  return `Tiebreaker: ${tb.replaceAll("_", " ")}`;
}

export function ChopTab({ leagueId, isCommissionerView }) {
  const queryClient = useQueryClient();

  const scoreboardQuery = useQuery({
    queryKey: ["chopped-scoreboard", leagueId],
    queryFn: async () => {
      const response = await fetch(`/api/leagues/${leagueId}/chopped/scoreboard`);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error ||
            `When fetching /api/leagues/${leagueId}/chopped/scoreboard, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
    enabled: Boolean(leagueId),
  });

  // Chop History (eliminations by week)
  const historyQuery = useQuery({
    queryKey: ["chopped-history", leagueId],
    queryFn: async () => {
      const response = await fetch(`/api/leagues/${leagueId}/chopped/history`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error ||
            `When fetching /api/leagues/${leagueId}/chopped/history, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
    enabled: Boolean(leagueId),
  });

  const data = scoreboardQuery.data;
  const currentWeek = data?.current_week;
  const teams = Array.isArray(data?.teams) ? data.teams : [];
  const chopZoneTeamId = data?.chop_zone_team_id;

  const activeTeams = useMemo(
    () => teams.filter((t) => t?.eliminated_week == null),
    [teams],
  );
  const eliminatedTeams = useMemo(
    () => teams.filter((t) => t?.eliminated_week != null),
    [teams],
  );

  const chopZoneTeam = activeTeams.find(
    (t) => Number(t.team_id) === Number(chopZoneTeamId),
  );

  const teamsRemainingLabel = `${activeTeams.length} team${activeTeams.length === 1 ? "" : "s"} remaining`;

  const chopTargetLabel = chopZoneTeam
    ? `${chopZoneTeam.team_name} (${formatPoints(chopZoneTeam.projected_points)} proj)`
    : "TBD";

  const historyRows = Array.isArray(historyQuery.data?.history)
    ? historyQuery.data.history
    : [];

  const chopMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/leagues/${leagueId}/chopped/chop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week: currentWeek }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || "Failed to chop team");
      }
      return body;
    },
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({
        queryKey: ["chopped-scoreboard", leagueId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["chopped-history", leagueId],
      });
      alert(
        `Chopped team ${res?.eliminated_team_id} for Week ${res?.week}. Released ${res?.released_player_count || 0} players to waivers.`,
      );
    },
    onError: (error) => {
      console.error(error);
      alert(error.message || "Could not chop team");
    },
  });

  if (scoreboardQuery.isLoading) {
    return (
      <div className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <div className="text-gray-700 dark:text-gray-200 font-inter">
          Loading chopping block...
        </div>
      </div>
    );
  }

  if (scoreboardQuery.error) {
    return (
      <div className="bg-white dark:bg-[#262626] border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <div className="text-red-700 dark:text-red-200 font-inter font-semibold">
          Could not load chopped standings
        </div>
        <div className="text-sm text-red-700/90 dark:text-red-200/90 font-inter mt-2">
          {scoreboardQuery.error?.message || "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-orange-900 dark:text-orange-100 font-barlow font-bold text-xl">
              <AlertTriangle size={20} />
              Chop Zone
            </div>
            <div className="text-sm text-orange-800 dark:text-orange-200 font-inter mt-1">
              Week {currentWeek}: lowest score gets chopped.
            </div>

            {/* Sleeper-like summary */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-white/10 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100 text-xs font-inter">
                <Users size={14} />
                {teamsRemainingLabel}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-white/10 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100 text-xs font-inter">
                <Crosshair size={14} />
                Chop target: {chopTargetLabel}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                scoreboardQuery.refetch();
                historyQuery.refetch();
              }}
              className="px-3 py-2 rounded-full bg-white/70 dark:bg-white/10 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100 font-inter text-sm hover:bg-white"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw size={16} />
                Refresh
              </span>
            </button>

            {isCommissionerView && (
              <button
                onClick={() => {
                  const ok = confirm(
                    `Finalize Week ${currentWeek} and chop the lowest scoring team? This will release their entire roster to waivers.`,
                  );
                  if (ok) {
                    chopMutation.mutate();
                  }
                }}
                disabled={chopMutation.isPending || !currentWeek}
                className="px-4 py-2 rounded-full bg-orange-600 text-white font-inter text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-2">
                  <Scissors size={16} />
                  {chopMutation.isPending ? "Chopping..." : "Chop week"}
                </span>
              </button>
            )}
          </div>
        </div>

        {chopZoneTeam && (
          <div className="mt-4 bg-white/70 dark:bg-white/5 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-inter font-semibold text-gray-900 dark:text-gray-100">
                  {chopZoneTeam.team_name}
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300 font-inter mt-1">
                  {chopZoneTeam.owner_name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-orange-900 dark:text-orange-100 font-barlow font-bold text-2xl tabular-nums">
                  {formatPoints(chopZoneTeam.projected_points)}
                </div>
                <div className="text-xs text-orange-800 dark:text-orange-200 font-inter">
                  projected
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chopping Block */}
      <div className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-2xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-barlow font-bold text-gray-900 dark:text-gray-100 text-lg">
                Chopping Block
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-inter mt-1">
                Sorted by projected points (lowest first).
              </div>
            </div>

            <Button href={`/league/${leagueId}/waivers`} variant="secondary">
              Waiver Wire
            </Button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {activeTeams.map((t, idx) => {
            const isChopZone = Number(t.team_id) === Number(chopZoneTeamId);
            const rowBg = isChopZone
              ? "bg-orange-50 dark:bg-orange-900/10"
              : "bg-white dark:bg-[#262626]";

            return (
              <div
                key={t.team_id}
                className={`${rowBg} px-4 py-3 flex items-center justify-between gap-3 flex-wrap`}
              >
                <div>
                  <div className="font-inter font-semibold text-gray-900 dark:text-gray-100">
                    <span className="text-gray-500 dark:text-gray-400 tabular-nums mr-2">
                      #{idx + 1}
                    </span>
                    {t.team_name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-inter mt-1">
                    {t.owner_name}
                  </div>
                </div>

                <div className="flex items-end gap-5">
                  <div className="text-right">
                    <div className="text-gray-900 dark:text-gray-100 font-barlow font-bold text-xl tabular-nums">
                      {formatPoints(t.projected_points)}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-inter">
                      projected
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-gray-900 dark:text-gray-100 font-inter font-semibold text-sm tabular-nums">
                      {formatPoints(t.actual_points)}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-inter">
                      actual
                    </div>
                  </div>
                </div>

                {isChopZone && (
                  <div className="w-full">
                    <div className="inline-flex items-center gap-2 text-orange-800 dark:text-orange-200 text-xs font-inter mt-1">
                      <AlertTriangle size={14} />
                      In the Chop Zone
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {activeTeams.length === 0 && (
            <div className="p-6 text-sm text-gray-600 dark:text-gray-400 font-inter">
              No active teams.
            </div>
          )}
        </div>
      </div>

      {/* Chop History */}
      <div className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-2xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 font-barlow font-bold text-gray-900 dark:text-gray-100 text-lg">
                <History size={18} />
                Chop History
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-inter mt-1">
                Weekly eliminations and the exact points that got a team chopped.
              </div>
            </div>

            <button
              onClick={() => historyQuery.refetch()}
              className="px-3 py-2 rounded-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-inter text-sm hover:bg-gray-100 dark:hover:bg-white/15"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw size={16} />
                Refresh
              </span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {historyQuery.isLoading && (
            <div className="p-4 text-sm text-gray-600 dark:text-gray-400 font-inter">
              Loading chop history...
            </div>
          )}

          {!historyQuery.isLoading && historyQuery.error && (
            <div className="p-4 text-sm text-red-700 dark:text-red-200 font-inter">
              {historyQuery.error?.message || "Could not load chop history"}
            </div>
          )}

          {!historyQuery.isLoading &&
            !historyQuery.error &&
            historyRows.length === 0 && (
              <div className="p-4 text-sm text-gray-600 dark:text-gray-400 font-inter">
                No teams have been chopped yet.
              </div>
            )}

          {!historyQuery.isLoading &&
            !historyQuery.error &&
            historyRows.map((row) => {
              const week = Number(row?.week);
              const teamName =
                row?.team_name || `Team ${row?.eliminated_team_id}`;
              const ownerName = row?.owner_name || "";
              const points = formatPoints(row?.eliminated_points);
              const tiebreakerLabel = formatTiebreakerLabel(row?.tiebreaker);

              let choppedAt = null;
              if (row?.created_at) {
                const d = new Date(row.created_at);
                choppedAt = Number.isNaN(d.getTime()) ? null : d.toLocaleString();
              }

              return (
                <div
                  key={`${row?.week}-${row?.eliminated_team_id}`}
                  className="px-4 py-3 flex items-start justify-between gap-4 flex-wrap"
                >
                  <div>
                    <div className="font-inter font-semibold text-gray-900 dark:text-gray-100">
                      Week {week}: {teamName}
                    </div>
                    {ownerName && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-inter mt-1">
                        {ownerName}
                      </div>
                    )}
                    {tiebreakerLabel && (
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 font-inter mt-1">
                        {tiebreakerLabel}
                      </div>
                    )}
                    {choppedAt && (
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 font-inter mt-1">
                        Chopped at {choppedAt}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-gray-900 dark:text-gray-100 font-barlow font-bold text-2xl tabular-nums">
                      {points}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-inter">
                      points
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Chopped Teams */}
      {eliminatedTeams.length > 0 && (
        <div className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 font-barlow font-bold text-gray-900 dark:text-gray-100 text-lg">
            <Scissors size={18} />
            Chopped Teams
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {eliminatedTeams
              .slice()
              .sort(
                (a, b) => Number(b.eliminated_week) - Number(a.eliminated_week),
              )
              .map((t) => (
                <div
                  key={t.team_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-3"
                >
                  <div className="font-inter font-semibold text-gray-900 dark:text-gray-100">
                    {t.team_name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-inter mt-1">
                    Chopped Week {t.eliminated_week}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
        <div className="flex items-center gap-2 font-barlow font-bold text-gray-900 dark:text-gray-100 text-lg">
          <Scissors size={18} />
          How Chopped works
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 font-inter mt-2">
          Every week, all teams compete against the entire league. The lowest
          scoring team gets eliminated, and their entire roster goes to the
          waiver wire.
        </div>
      </div>
    </div>
  );
}
