import { Database } from "lucide-react";
import { SourceRow } from "./SourceRow";

export function SourcesTable({
  filteredSources,
  sources,
  setSources,
  savingId,
  saveSourceRow,
  loading,
}) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
      {/*
        This table is wider than many screens. We intentionally allow horizontal scrolling
        so columns after "Parser eligible" (Pattern/Priority/Save/etc.) are accessible.
      */}
      <table className="w-full min-w-[1200px]">
        <thead className="bg-gray-50 dark:bg-[#262626] border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono">
              Jurisdiction
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono">
              Court Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono">
              Rule Set
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono">
              Authority
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono">
              Source URL
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono">
              Source Class
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono">
              Authoritative
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono">
              Parser Eligible
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono">
              Preferred Pattern
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono w-[110px] min-w-[110px]">
              Priority
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono">
              Family / Root / Discovery
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 font-jetbrains-mono">
              Save
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredSources.map((source) => (
            <SourceRow
              key={source.id}
              source={source}
              sources={sources}
              setSources={setSources}
              savingId={savingId}
              saveSourceRow={saveSourceRow}
            />
          ))}
        </tbody>
      </table>

      {filteredSources.length === 0 && !loading && (
        <div className="text-center py-12">
          <Database className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-jetbrains-mono mb-2">
            No Rule Sources Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 font-jetbrains-mono mb-6">
            Adjust filters or seed sources.
          </p>
        </div>
      )}
    </div>
  );
}
