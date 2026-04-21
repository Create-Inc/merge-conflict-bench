import { useState, useMemo } from "react";

export function useReportFilters() {
  const [selectedShowIds, setSelectedShowIds] = useState([]);
  const [reportType, setReportType] = useState("executive");
  const [compareMode, setCompareMode] = useState(false);

<<<<<<< ours
  // Reports are filtered primarily by explicit show selection.
  // Keep date filters optional (blank by default) to avoid accidental empty results.
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
=======
  // Default to no date filter. (The previous default of "last 180 days" + "today"
  // caused future trade shows to be filtered out and resulted in
  // "No events match the selected filters" on new accounts.)
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
>>>>>>> theirs

  const [eventType, setEventType] = useState("all");
  const [teamMemberId, setTeamMemberId] = useState("all");
  const [vendorId, setVendorId] = useState("all");
  const [costCategory, setCostCategory] = useState("");

  const selectedShowIdsNumbers = useMemo(() => {
    return (selectedShowIds || [])
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n > 0);
  }, [selectedShowIds]);

  return {
    selectedShowIds,
    setSelectedShowIds,
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
    teamMemberId,
    setTeamMemberId,
    vendorId,
    setVendorId,
    costCategory,
    setCostCategory,
    selectedShowIdsNumbers,
  };
}
