import React, { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Activity,
  Zap,
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Database,
  Globe,
  ShieldCheck,
  Star,
} from "lucide-react";
import { motion } from "motion/react";

const StatCard = ({ title, value, subtitle, icon: Icon, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8] mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white">
          {value}
        </h3>
        {subtitle ? (
          <p className="text-xs text-[#94A3B8] mt-1 truncate">{subtitle}</p>
        ) : null}
      </div>
      <div
        className="p-2.5 rounded-xl"
        style={{
          backgroundColor: `${accent}1A`,
          color: accent,
        }}
      >
        <Icon size={22} />
      </div>
    </div>
  </motion.div>
);

const ChartCard = ({
  title,
  children,
  icon: Icon,
  contentHeight = 300,
  scroll = false,
  linkHref = null,
  linkLabel = "Open",
}) => {
  let contentStyle;
  if (scroll) {
    const height = typeof contentHeight === "number" ? contentHeight : 300;
    contentStyle = { height, overflow: "auto" };
  } else if (typeof contentHeight === "number") {
    contentStyle = { height: contentHeight };
  }

  const contentClassName = scroll ? "w-full custom-scrollbar" : "w-full";

  let headerAction = null;
  if (linkHref) {
    headerAction = (
      <a
        href={linkHref}
        className="text-xs font-bold text-[#3B82F6] hover:underline uppercase tracking-widest flex items-center gap-1"
      >
        {linkLabel} <ExternalLink size={12} />
      </a>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 min-w-0">
          {Icon ? <Icon size={18} className="text-[#3B82F6]" /> : null}
          <h3 className="font-bold text-[#0F172A] dark:text-white truncate">
            {title}
          </h3>
        </div>
        {headerAction}
      </div>
      <div className={contentClassName} style={contentStyle}>
        {children}
      </div>
    </motion.div>
  );
};

const StatusPill = ({ status }) => {
  const normalized = String(status || "success").toLowerCase();
  const ok = normalized === "success";
  const label = ok ? "Success" : "Fail";
  const cls = ok
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
    : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300";
  const Icon = ok ? CheckCircle2 : XCircle;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${cls}`}
    >
      <Icon size={12} />
      {label}
    </span>
  );
};

export default function DashboardPage() {
  const TIME_RANGE_OPTIONS = useMemo(
    () => [
      { value: "7d", label: "Last 7 days" },
      { value: "30d", label: "Last 30 days" },
      { value: "90d", label: "Last 90 days" },
      { value: "12m", label: "Last 12 months" },
    ],
    [],
  );

  const [timeRange, setTimeRange] = useState("7d");

  const selectedRangeLabel = useMemo(() => {
    const match = TIME_RANGE_OPTIONS.find((o) => o.value === timeRange);
    return match ? match.label : "Last 7 days";
  }, [TIME_RANGE_OPTIONS, timeRange]);

  const {
    data: stats,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["dashboard-stats", timeRange],
    queryFn: async () => {
      const qs = new URLSearchParams({ timeRange });
      const res = await fetch(`/api/stats?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const bucketUnit = String(stats?.bucketUnit || "day");
  const summary = stats?.summary || {};
  const sources = stats?.sources || {};

  const totalRequestsPeriod = Number(summary.total_requests || 0);
  const avgLatencyMs = Math.round(Number(summary.avg_latency || 0));
  const totalTokensPeriod = Number(summary.total_tokens || 0);
  const successCount = Number(summary.success_count || 0);
  const failCount = Number(summary.fail_count || 0);

  const successRate =
    totalRequestsPeriod > 0
      ? Math.round((successCount / totalRequestsPeriod) * 100)
      : 0;

  const kbUsedCount = Number(sources.kb_only || 0) + Number(sources.both || 0);
  const webUsedCount =
    Number(sources.web_only || 0) + Number(sources.both || 0);
  const sourcesTotal = Number(sources.total || 0);
  const kbRate =
    sourcesTotal > 0 ? Math.round((kbUsedCount / sourcesTotal) * 100) : 0;
  const webRate =
    sourcesTotal > 0 ? Math.round((webUsedCount / sourcesTotal) * 100) : 0;

  const xTickFormatter = useCallback(
    (val) => {
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) {
        return String(val);
      }

      if (bucketUnit === "month") {
        return d.toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        });
      }

      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    },
    [bucketUnit],
  );

  const timeseries = useMemo(() => {
    const byDate = new Map();
    const requests = Array.isArray(stats?.requestsOverTime)
      ? stats.requestsOverTime
      : [];
    const tokens = Array.isArray(stats?.tokensOverTime)
      ? stats.tokensOverTime
      : [];
    const latency = Array.isArray(stats?.latencyOverTime)
      ? stats.latencyOverTime
      : [];

    for (const r of requests) {
      const key = String(r.date);
      byDate.set(key, {
        date: r.date,
        requests: Number(r.count || 0),
        tokens: 0,
        avgLatencyMs: null,
      });
    }

    for (const t of tokens) {
      const key = String(t.date);
      const existing = byDate.get(key) || {
        date: t.date,
        requests: 0,
        tokens: 0,
        avgLatencyMs: null,
      };
      existing.tokens = Number(t.total_tokens || 0);
      byDate.set(key, existing);
    }

    for (const l of latency) {
      const key = String(l.date);
      const existing = byDate.get(key) || {
        date: l.date,
        requests: 0,
        tokens: 0,
        avgLatencyMs: null,
      };
      existing.avgLatencyMs = Math.round(Number(l.avg_latency || 0));
      byDate.set(key, existing);
    }

    const arr = Array.from(byDate.values());
    arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    return arr;
  }, [stats]);

  const sourcesPieData = useMemo(() => {
    const total = Number(sources.total || 0);

    const data = [
      {
        name: "Internal knowledge base",
        value: Number(sources.kb_only || 0),
        color: "#3B82F6",
      },
      {
        name: "Web search",
        value: Number(sources.web_only || 0),
        color: "#10B981",
      },
      { name: "Both", value: Number(sources.both || 0), color: "#8B5CF6" },
      {
        name: "No sources",
        value: Number(sources.none || 0),
        color: "#94A3B8",
      },
    ];

    const filtered = data.filter((d) => d.value > 0);
    if (filtered.length > 0) return filtered;

    if (total === 0) {
      return [{ name: "No data yet", value: 1, color: "#CBD5E1" }];
    }

    return data;
  }, [sources]);

  const statusPieData = useMemo(() => {
    const data = [
      { name: "Success", value: successCount, color: "#10B981" },
      { name: "Fail", value: failCount, color: "#EF4444" },
    ];

    const filtered = data.filter((d) => d.value > 0);
    if (filtered.length > 0) return filtered;
    return [{ name: "No data yet", value: 1, color: "#CBD5E1" }];
  }, [successCount, failCount]);

  const ratingData = useMemo(() => {
    const rows = Array.isArray(stats?.feedback) ? stats.feedback : [];
    const map = new Map();
    for (const r of rows) {
      const key = Number(r.rating || 0);
      map.set(key, Number(r.count || 0));
    }

    const out = [];
    for (let i = 1; i <= 5; i++) {
      out.push({ rating: i, count: map.get(i) || 0 });
    }
    return out;
  }, [stats]);

  const recentActivity = Array.isArray(stats?.recentActivity)
    ? stats.recentActivity
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin" />
          <p className="text-[#64748B] font-medium animate-pulse">
            Preparing your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6">
          <h1 className="text-lg font-black text-[#0F172A] dark:text-white">
            Could not load dashboard
          </h1>
          <p className="text-sm text-[#64748B] mt-2">
            Please refresh. If it keeps happening, check your Audit Log
            permissions.
          </p>
        </div>
      </div>
    );
  }

  const chatVolumeTitle = `Chat volume (${selectedRangeLabel})`;
  const outcomesTitle = `Outcomes (${selectedRangeLabel})`;
  const sourceMixTitle = `Source mix (${selectedRangeLabel})`;
  const ratingsTitle = `Ratings (${selectedRangeLabel})`;

  const requestsSubtitle = `Total requests in ${selectedRangeLabel.toLowerCase()}`;
  const successSubtitle = `${successCount.toLocaleString()} success / ${totalRequestsPeriod.toLocaleString()} total`;
  const latencySubtitle = `Average response time in ${selectedRangeLabel.toLowerCase()}`;
  const tokensSubtitle = `Total tokens in ${selectedRangeLabel.toLowerCase()}`;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Removed the top-of-page search bar header per request */}

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Dashboard
            </h1>
            {/* Removed subtitle per request */}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="dashboard-time-range"
                className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8]"
              >
                Period
              </label>
              <select
                id="dashboard-time-range"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                title="Dashboard period"
              >
                {TIME_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {isFetching ? (
                <span className="text-xs font-semibold text-[#94A3B8]">
                  Updating…
                </span>
              ) : null}
            </div>

            <a
              href="/query-history"
              className="px-5 py-2.5 bg-[#3B82F6] text-white rounded-xl text-sm font-bold hover:bg-[#2563EB] transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 justify-center"
            >
              <ShieldCheck size={16} />
              Open Audit Log
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Requests"
            value={totalRequestsPeriod.toLocaleString()}
            subtitle={requestsSubtitle}
            icon={Activity}
            accent="#3B82F6"
          />
          <StatCard
            title="Success rate"
            value={`${successRate}%`}
            subtitle={successSubtitle}
            icon={CheckCircle2}
            accent="#10B981"
          />
          <StatCard
            title="Avg latency"
            value={`${avgLatencyMs}ms`}
            subtitle={latencySubtitle}
            icon={Zap}
            accent="#F59E0B"
          />
          <StatCard
            title="Token volume"
            value={totalTokensPeriod.toLocaleString()}
            subtitle={tokensSubtitle}
            icon={Coins}
            accent="#8B5CF6"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title={chatVolumeTitle}
            icon={Activity}
            linkHref="/query-history"
            linkLabel="Audit Log"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeseries}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  tickFormatter={xTickFormatter}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRequests)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={outcomesTitle} icon={ShieldCheck} contentHeight={null}>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={24} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                  Internal KB usage
                </p>
                <p className="text-lg font-black text-[#0F172A] dark:text-white mt-1">
                  {kbRate}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                  Web search usage
                </p>
                <p className="text-lg font-black text-[#0F172A] dark:text-white mt-1">
                  {webRate}%
                </p>
              </div>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title={sourceMixTitle} icon={Database} contentHeight={280}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourcesPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {sourcesPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={24} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={ratingsTitle} icon={Star} contentHeight={280}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ratingData}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="rating"
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between">
            <h3 className="font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-[#3B82F6]" />
              Recent chat activity
            </h3>
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">
              {selectedRangeLabel}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-[#0F172A]">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                    Conversation
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                    Sources
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                    Latency
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                    Tokens
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#334155]">
                {recentActivity.map((log) => {
                  const title = log.conversation_title || "Untitled";
                  const status = log.status || "success";

                  const kb =
                    String(log.use_knowledge_base || "false") === "true";
                  const web = String(log.use_web_search || "false") === "true";

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-[#0F172A] dark:text-white">
                          {title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {kb ? (
                            <span
                              title="Internal knowledge base"
                              className="p-1 bg-blue-50 text-blue-600 rounded"
                            >
                              <Database size={12} />
                            </span>
                          ) : null}
                          {web ? (
                            <span
                              title="Web search"
                              className="p-1 bg-emerald-50 text-emerald-600 rounded"
                            >
                              <Globe size={12} />
                            </span>
                          ) : null}
                          {!kb && !web ? (
                            <span className="text-xs text-[#94A3B8]">-</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[#64748B]">
                          {Number(log.response_time_ms || 0)}ms
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[#64748B]">
                          {Number(log.total_tokens || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#94A3B8] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-sm text-[#64748B]">
                        No recent activity found.
                      </p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <style jsx global>{`
          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #E2E8F0;
            border-radius: 10px;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #334155;
          }
        `}</style>
      </div>
    </div>
  );
}
