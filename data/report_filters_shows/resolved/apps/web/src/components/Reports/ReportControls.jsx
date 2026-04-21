export function ReportControls({
  colors,
  reportType,
  setReportType,
  compareMode,
  setCompareMode,
  dateStart,
  setDateStart,
  dateEnd,
  setDateEnd,
  eventType,
  setEventType,
  eventTypes,
  teamMemberId,
  setTeamMemberId,
  employeeList,
  vendorId,
  setVendorId,
  vendorList,
  costCategory,
  setCostCategory,
  filteredShowOptions,
  selectedShowIds,
  setSelectedShowIds,
  selectedShows,
}) {
  // Compare mode is supported for event-scoped reports (not executive summary or company-wide vendor reports).
  const compareSupported =
    reportType !== "executive" &&
    reportType !== "vendors" &&
    reportType !== "vendor-concentration" &&
    reportType !== "success-drivers" &&
    reportType !== "areas-for-improvement";

  const noEventsInFilter = filteredShowOptions.length === 0;

  return (
    <div
      className={`mt-3 ${colors.bg.card} border ${colors.border.primary} rounded-2xl p-4`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${colors.text.primary}`}>
            Controls
          </div>
          <div className={`text-xs mt-1 ${colors.text.secondary}`}>
            Pick your event(s) and report type. Filters never hide explicitly
            selected events.
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div>
            <div className={`text-xs ${colors.text.tertiary}`}>Report type</div>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className={`mt-1 h-10 px-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} text-sm`}
            >
              <optgroup label="Performance & ROI">
                <option value="executive">Executive Summary</option>
                <option value="roi">Event ROI Analysis</option>
                <option value="event-performance-score">
                  Event Performance Score
                </option>
              </optgroup>
              <optgroup label="Contacts & Outcomes">
                <option value="lead-funnel">Contact Progression</option>
                <option value="lead-quality">
                  Contact Quality & Intent Analysis
                </option>
                <option value="sales-attribution">
                  Outcome Attribution (optional)
                </option>
              </optgroup>
              <optgroup label="Financials">
                <option value="budgets">Budget vs Actual</option>
                <option value="cost-efficiency">Cost Efficiency Report</option>
                <option value="financial-breakdown">
                  Financial Breakdown by Category
                </option>
              </optgroup>
              <optgroup label="Operations">
                <option value="execution-readiness">
                  Execution Readiness Report
                </option>
                <option value="logistics-timeline">Logistics Timeline</option>
              </optgroup>
              <optgroup label="Vendors">
                <option value="vendors">
                  Vendor Performance Report (company)
                </option>
                <option value="vendor-concentration">
                  Vendor Spend Concentration
                </option>
              </optgroup>
              <optgroup label="Team">
                <option value="team-productivity">
                  Team Productivity Report
                </option>
                <option value="followup-effectiveness">
                  Follow-Up Effectiveness
                </option>
              </optgroup>
              <optgroup label="Strategic">
                <option value="success-drivers">
                  Success Drivers Analysis
                </option>
                <option value="areas-for-improvement">
                  Areas for Improvement Report
                </option>
              </optgroup>
            </select>
          </div>

          <div>
            <div className={`text-xs ${colors.text.tertiary}`}>Compare</div>
            <label
              className={`mt-1 h-10 px-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} text-sm inline-flex items-center gap-2 ${compareSupported ? "" : "opacity-60"}`}
              title={
                compareSupported
                  ? ""
                  : "Compare is available for event-scoped reports"
              }
            >
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                disabled={!compareSupported}
              />
              Compare mode
            </label>
          </div>

          {/* Date filtering removed from primary controls: reports are scoped by selected event(s). */}

          <div>
            <div className={`text-xs ${colors.text.tertiary}`}>Event type</div>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className={`mt-1 h-10 px-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} text-sm`}
            >
              <option value="all">All</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className={`text-xs ${colors.text.tertiary}`}>Team member</div>
            <select
              value={teamMemberId}
              onChange={(e) => setTeamMemberId(e.target.value)}
              className={`mt-1 h-10 px-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} text-sm min-w-[180px]`}
            >
              <option value="all">All</option>
              {employeeList.map((e) => (
                <option key={e.id} value={String(e.id)}>
                  {e.name || e.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className={`text-xs ${colors.text.tertiary}`}>Vendor</div>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className={`mt-1 h-10 px-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} text-sm min-w-[180px]`}
            >
              <option value="all">All</option>
              {vendorList.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className={`text-xs ${colors.text.tertiary}`}>
              Cost category
            </div>
            <input
              value={costCategory}
              onChange={(e) => setCostCategory(e.target.value)}
              placeholder="Travel, booth, swag…"
              className={`mt-1 h-10 px-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} text-sm w-[180px]`}
            />
          </div>
        </div>
      </div>

      {noEventsInFilter ? (
        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          No events match the current <strong>Event type</strong> filter. Try
          setting Event type back to <strong>All</strong>.
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EventSelector
          colors={colors}
          filteredShowOptions={filteredShowOptions}
          selectedShowIds={selectedShowIds}
          setSelectedShowIds={setSelectedShowIds}
        />
        <QuickLinks
          colors={colors}
          selectedShows={selectedShows}
          selectedShowIds={selectedShowIds}
        />
      </div>
    </div>
  );
}

function EventSelector({
  colors,
  filteredShowOptions,
  selectedShowIds,
  setSelectedShowIds,
}) {
  return (
    <div>
      <div className={`text-xs ${colors.text.tertiary}`}>
        Event selector (multi-select)
      </div>
      <select
        multiple
        value={selectedShowIds.map(String)}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map((opt) =>
            Number(opt.value),
          );
          setSelectedShowIds(
            selected.filter((n) => Number.isFinite(n) && n > 0),
          );
        }}
        className={`mt-1 w-full min-h-[160px] px-3 py-2 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} text-sm`}
      >
        {filteredShowOptions.map((s) => {
          const labelParts = [String(s.name || "(untitled)")];
          if (s.start_date) labelParts.push(String(s.start_date));
          if (s.city) labelParts.push(String(s.city));
          const label = labelParts.join(" • ");

          return (
            <option key={s.id} value={String(s.id)}>
              {label}
            </option>
          );
        })}
      </select>
      <div className={`mt-2 text-xs ${colors.text.secondary}`}>
        Tip: to filter to a single event from the event page, use the new
        "Reports" link inside the event menu.
      </div>
    </div>
  );
}

function QuickLinks({ colors, selectedShows, selectedShowIds }) {
  const ensureHttp = (url) => {
    const raw = String(url || "").trim();
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    return `https://${raw}`;
  };

  const prettyUrlLabel = (url) => {
    try {
      const u = new URL(ensureHttp(url));
      const host = u.hostname.replace(/^www\./, "");
      return host;
    } catch (e) {
      return "Link";
    }
  };

  return (
    <div>
      <div className={`text-xs ${colors.text.tertiary}`}>Quick links</div>

      <div className="mt-1 space-y-2">
        {selectedShows.slice(0, 5).map((s) => {
          const website = ensureHttp(s.website);
          const websiteLabel = prettyUrlLabel(website);
          return (
            <div
              key={s.id}
              className={`${colors.bg.tertiary} border ${colors.border.primary} rounded-lg p-3 flex items-start justify-between gap-3`}
            >
              <div className="min-w-0">
                <div
                  className={`text-sm font-semibold ${colors.text.primary} truncate`}
                >
                  {s.name}
                </div>
                <div className={`text-xs mt-1 ${colors.text.secondary}`}>
                  {s.start_date} → {s.end_date}
                  {s.city ? ` • ${s.city}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/tradeshows/${Number(s.id)}`}
                  className={`h-9 px-3 rounded-lg border ${colors.border.primary} ${colors.bg.input} ${colors.text.primary} text-sm inline-flex items-center gap-2`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Open
                </a>
                {website ? (
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className={`h-9 px-3 rounded-lg border ${colors.border.primary} ${colors.bg.input} ${colors.text.primary} text-sm`}
                  >
                    {websiteLabel}
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}

        {selectedShows.length > 5 ? (
          <div className={`text-xs ${colors.text.tertiary}`}>
            {selectedShows.length - 5} more selected…
          </div>
        ) : null}

        {selectedShowIds.length === 0 ? (
          <div className={`text-xs ${colors.text.secondary}`}>
            No event selected — reports will run across all accessible events.
          </div>
        ) : null}
      </div>
    </div>
  );
}
