import { Sparkles } from "lucide-react";

<<<<<<< ours
export function TabNavigation({ activeTab, setActiveTab, actions }) {
=======
export function TabNavigation({
  activeTab,
  setActiveTab,
  padClassName,
  showBorder = true,
}) {
>>>>>>> theirs
  const tabs = [
    { key: "setup", label: "Setup" },
    { key: "overview", label: "Overview" },
    { key: "services", label: "Services" },
    { key: "related", label: "Related clients" },
    { key: "deadlines", label: "Deadlines" },
    { key: "aml", label: "AML" },
    { key: "notes", label: "Notes" },
    { key: "jafa-ai", label: "JAFA AI", isAi: true },
  ];

  const getStandardTabClass = (key, fullWidth) => {
    const isActive = activeTab === key;
    const widthClass = fullWidth ? "flex-1 text-center" : "";
    const base = `py-4 text-sm font-medium border-b-2 transition-colors ${widthClass}`;
    const active = "border-blue-600 text-blue-600";
    const inactive = "border-transparent text-gray-600 hover:text-gray-900";
    const state = isActive ? active : inactive;
    return `${base} ${state}`;
  };

  const getAiTabClass = (fullWidth) => {
    const isActive = activeTab === "jafa-ai";
    const widthClass = fullWidth ? "flex-1" : "";
    const base = `flex items-center justify-center gap-2 px-2 py-4 font-medium border-b-2 transition-all ${widthClass}`;
    const active =
      "border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50";
    const inactive =
      "border-transparent bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200";
    const state = isActive ? active : inactive;
    return `${base} ${state}`;
  };

  const aiSparkleClass =
    activeTab === "jafa-ai"
      ? "w-5 h-5 text-purple-600"
      : "w-5 h-5 text-purple-500";

  const aiTextClass =
    activeTab === "jafa-ai"
      ? "text-sm text-purple-900 font-semibold"
      : "text-sm text-purple-700";

  const pad = padClassName || "px-6";
  const wrapperClassName = showBorder ? "border-b border-gray-200" : "";

  return (
<<<<<<< ours
    <div className="border-b border-gray-200">
      {actions ? (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          {actions}
        </div>
      ) : null}

=======
    <div className={wrapperClassName}>
>>>>>>> theirs
      {/* Mobile: keep horizontal scroll */}
      <div
        className={`flex md:hidden gap-6 ${pad} overflow-x-auto whitespace-nowrap`}
      >
        {tabs.map((t) => {
          if (t.isAi) {
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={getAiTabClass(false)}
              >
                <Sparkles className={aiSparkleClass} />
                <span className={aiTextClass}>{t.label}</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">
                  AI
                </span>
              </button>
            );
          }

          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={getStandardTabClass(t.key, false)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Desktop: stretch tabs across the full width */}
      <div className={`hidden md:flex w-full ${pad}`}>
        {tabs.map((t) => {
          if (t.isAi) {
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={getAiTabClass(true)}
              >
                <Sparkles className={aiSparkleClass} />
                <span className={aiTextClass}>{t.label}</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">
                  AI
                </span>
              </button>
            );
          }

          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={getStandardTabClass(t.key, true)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
