import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

function getScrollParent(el) {
  if (!el || typeof window === "undefined") return null;
  let cur = el.parentElement;
  while (cur) {
    const style = window.getComputedStyle(cur);
    const overflowY = style.overflowY;
    const isScrollable = overflowY === "auto" || overflowY === "scroll";
    if (isScrollable) {
      return cur;
    }
    cur = cur.parentElement;
  }
  return null;
}

function requestModalExpand(expanded, extraPx = 0) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("anything:modal-expand-request", {
      detail: {
        expanded: Boolean(expanded),
        extraPx: typeof extraPx === "number" ? extraPx : 0,
      },
    }),
  );
}

export default function Dropdown({
  label,
  value,
  onChange,
  options,
  children,
  placeholder = "Select...",
  required = false,
  disabled = false,
  loading = false,
  id,
  name,
  className = "",
  helpText,
  error,
  ariaLabel,
  // NEW: allow callers (like Existing Company) to request a taller menu
  menuMaxHeight = 240,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState("down"); // "down" | "up"
  const openDirectionRef = useRef("down");
  const [menuMaxHeightPx, setMenuMaxHeightPx] = useState(null);

  // NEW: search state (only used when there are many options)
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const scrollParentRef = useRef(null);
  const expandedRequestedRef = useRef(false);
  const recomputeTimerRef = useRef(null);
  const rafMeasureRef = useRef(null);
  const lastRequestedExtraPxRef = useRef(0); // track last request so we don't spam

  // NEW: search input ref for focusing
  const searchInputRef = useRef(null);

  const close = () => setIsDropdownOpen(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Ensure we drop any modal expansion request when the menu closes
  useEffect(() => {
    if (isDropdownOpen) {
      return;
    }

    if (rafMeasureRef.current && typeof window !== "undefined") {
      window.cancelAnimationFrame(rafMeasureRef.current);
      rafMeasureRef.current = null;
    }

    if (recomputeTimerRef.current) {
      clearTimeout(recomputeTimerRef.current);
      recomputeTimerRef.current = null;
    }

    // IMPORTANT: only collapse the modal when the dropdown is actually closed.
    // While the dropdown is open, we keep any expansion we requested to avoid
    // flicker/oscillation (expand -> fits -> collapse) which caused scroll bugs.
    if (expandedRequestedRef.current) {
      requestModalExpand(false, 0);
      expandedRequestedRef.current = false;
    }

    lastRequestedExtraPxRef.current = 0;

    // Reset any computed height so the next open starts clean
    setMenuMaxHeightPx(null);

    // NEW: reset search on close
    setSearchQuery("");
  }, [isDropdownOpen]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    close();
  };

  // Convert options array to normalized format
  const normalizedOptions = useMemo(() => {
    if (!options) return [];
    return options.map((opt) =>
      typeof opt === "object"
        ? opt
        : { value: opt, label: opt, disabled: false },
    );
  }, [options]);

  // NEW: enable search UI only when there are many options
  const showSearch = normalizedOptions.length > 10;

  // NEW: filtered options
  const filteredOptions = useMemo(() => {
    if (!showSearch) {
      return normalizedOptions;
    }

    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) {
      return normalizedOptions;
    }

    return normalizedOptions.filter((opt) => {
      const labelText = opt?.label == null ? "" : String(opt.label);
      const valueText = opt?.value == null ? "" : String(opt.value);
      const haystack = `${labelText} ${valueText}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [normalizedOptions, searchQuery, showSearch]);

  // Find the display label for current value
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value),
  );
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const safeValue = value == null ? "" : String(value);
  const hasValue = Boolean(safeValue);

  const describedBy = error
    ? `${id || name}-error`
    : helpText
      ? `${id || name}-help`
      : undefined;

  // Focus search input on open (when shown)
  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }
    if (!showSearch || loading) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }

    // Focus after paint so the input exists
    const t = window.setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);

    return () => window.clearTimeout(t);
  }, [isDropdownOpen, showSearch, loading]);

  // Placement calculation.
  // IMPORTANT: the dropdown menu height stays the same (menuMaxHeight).
  // We ONLY expand the modal if the (absolute-positioned) list content can't fit in the modal scroll area.
  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const btn = buttonRef.current;
    if (!btn || typeof window === "undefined") {
      return;
    }

    scrollParentRef.current = getScrollParent(btn);

    const inStickyModal = Boolean(
      btn.closest?.('[data-sticky-modal-shell="true"]'),
    );

    const computePlacement = () => {
      const buttonEl = buttonRef.current;
      if (!buttonEl || typeof window === "undefined") {
        return;
      }

      const rect = buttonEl.getBoundingClientRect();
      const desiredMax = Number(menuMaxHeight) || 240;
      const margin = 8;

      const scrollParent = scrollParentRef.current;
      const bounds = scrollParent
        ? scrollParent.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };

      const spaceBelow = bounds.bottom - rect.bottom - margin;
      const spaceAbove = rect.top - bounds.top - margin;

      // Use actual menu height when available (content-driven menus can be much smaller than desiredMax)
      const menuElNow = menuRef.current;
      const measuredMenuH = menuElNow
        ? menuElNow.getBoundingClientRect().height
        : 0;
      const effectiveMenuH = measuredMenuH > 0 ? measuredMenuH : desiredMax;

      // Required order:
      // 1) If it fits below -> open below
      // 2) else if it fits above -> open above
      // 3) else -> pick the side with more space (modal expansion is handled separately below)
      let direction = "down";
      if (spaceBelow >= effectiveMenuH) {
        direction = "down";
      } else if (spaceAbove >= effectiveMenuH) {
        direction = "up";
      } else {
        direction = spaceAbove > spaceBelow ? "up" : "down";
      }

      openDirectionRef.current = direction;
      setOpenDirection(direction);

      // Dropdown height should be relative to content, capped by menuMaxHeight.
      setMenuMaxHeightPx(desiredMax);

      if (!inStickyModal) {
        return;
      }

      // Measure the *actual* rendered menu after layout.
      // Required order:
      // 1) If it fits below -> open below
      // 2) else if it fits above -> open above
      // 3) else -> expand modal main area
      if (rafMeasureRef.current) {
        window.cancelAnimationFrame(rafMeasureRef.current);
      }

      rafMeasureRef.current = window.requestAnimationFrame(() => {
        rafMeasureRef.current = null;

        const buttonEl2 = buttonRef.current;
        const menuEl = menuRef.current;
        if (!buttonEl2 || !menuEl) {
          return;
        }

        const margin2 = 8;

        const scrollParent2 = scrollParentRef.current;
        const bounds2 = scrollParent2
          ? scrollParent2.getBoundingClientRect()
          : { top: 0, bottom: window.innerHeight };

        const buttonRect2 = buttonEl2.getBoundingClientRect();
        const menuRect = menuEl.getBoundingClientRect();
        const menuHeight = menuRect.height;

        const spaceBelow2 = bounds2.bottom - buttonRect2.bottom - margin2;
        const spaceAbove2 = buttonRect2.top - bounds2.top - margin2;

        const fitsBelow2 = spaceBelow2 >= menuHeight;
        const fitsAbove2 = spaceAbove2 >= menuHeight;

        // IMPORTANT: never auto-collapse modal expansion while the dropdown is open.
        // The "close" effect will release it.

        if (fitsBelow2 || fitsAbove2) {
          const nextDirection = fitsBelow2 ? "down" : "up";
          if (openDirectionRef.current !== nextDirection) {
            openDirectionRef.current = nextDirection;
            setOpenDirection(nextDirection);

            if (recomputeTimerRef.current) {
              clearTimeout(recomputeTimerRef.current);
            }
            recomputeTimerRef.current = setTimeout(() => {
              recomputeTimerRef.current = null;
              computePlacement();
            }, 0);
          }

          return;
        }

        // Doesn't fit below or above -> request expansion.
        const overflowBottom = Math.max(0, menuRect.bottom - bounds2.bottom);
        const overflowTop = Math.max(0, bounds2.top - menuRect.top);
        const overflowPx = Math.ceil(Math.max(overflowBottom, overflowTop));

        if (overflowPx > 0) {
          const extraPx = overflowPx + 12;

          // Only request if we haven't, or we need *more*.
          if (
            !expandedRequestedRef.current ||
            extraPx > lastRequestedExtraPxRef.current
          ) {
            requestModalExpand(true, extraPx);
            expandedRequestedRef.current = true;
            lastRequestedExtraPxRef.current = extraPx;
          }

          if (recomputeTimerRef.current) {
            clearTimeout(recomputeTimerRef.current);
          }
          recomputeTimerRef.current = setTimeout(() => {
            recomputeTimerRef.current = null;
            computePlacement();
          }, 180);
        }
      });
    };

    computePlacement();

    const scrollParent = scrollParentRef.current;

    window.addEventListener("resize", computePlacement);
    if (scrollParent) {
      scrollParent.addEventListener("scroll", computePlacement, {
        passive: true,
      });
    } else {
      window.addEventListener("scroll", computePlacement, true);
    }

    return () => {
      window.removeEventListener("resize", computePlacement);
      if (scrollParent) {
        scrollParent.removeEventListener("scroll", computePlacement);
      } else {
        window.removeEventListener("scroll", computePlacement, true);
      }

      if (rafMeasureRef.current) {
        window.cancelAnimationFrame(rafMeasureRef.current);
        rafMeasureRef.current = null;
      }

      if (recomputeTimerRef.current) {
        clearTimeout(recomputeTimerRef.current);
        recomputeTimerRef.current = null;
      }
      // Collapse is handled by the "menu closed" effect above.
    };
  }, [isDropdownOpen, menuMaxHeight, filteredOptions, loading, showSearch]);

  const menuPositionClassName =
    openDirection === "up" ? "bottom-full mb-1" : "top-full mt-1";

  // Height is content-driven, but capped.
  const desiredMenuMaxHeightPx = menuMaxHeightPx
    ? menuMaxHeightPx
    : Number(menuMaxHeight) || 240;

  const menuStyle = {
    maxHeight: `${desiredMenuMaxHeightPx}px`,
  };

  const spinnerStyle = {
    animation: "anythingDropdownSpin 0.9s linear infinite",
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Custom Dropdown Button */}
        <button
          ref={buttonRef}
          type="button"
          id={id}
          name={name}
          onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          className={`w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-10 text-left font-medium focus:outline-none shadow-sm hover:border-orange-300 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
            error ? "border-red-300 hover:border-red-400" : ""
          } ${hasValue ? "text-gray-900" : "text-gray-400"}`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <span className="truncate">{displayValue}</span>
        </button>

        {/* Right-side icon area (keep spinner fully inside + rotate reliably) */}
        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
          <div className="w-6 h-6 flex items-center justify-center">
            {loading ? (
              <Loader2 className="w-5 h-5 text-gray-500" style={spinnerStyle} />
            ) : isDropdownOpen ? (
              <ChevronUp className="w-5 h-5 text-orange-500 transition-all duration-200" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>

        {/* Custom Dropdown Menu */}
        {isDropdownOpen ? (
          <div
            ref={menuRef}
            className={`absolute left-0 right-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden flex flex-col ${menuPositionClassName}`}
            style={menuStyle}
            role="listbox"
          >
            {loading ? (
              <div className="px-3 py-3 text-sm text-gray-600 flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 shrink-0" style={spinnerStyle} />
                </span>
                <span>Loading…</span>
              </div>
            ) : (
              <div className="flex flex-col min-h-0">
                {showSearch ? (
                  <div className="shrink-0 p-2 border-b border-gray-100 bg-white">
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search…"
                      aria-label="Search options"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-orange-300 focus:outline-none"
                    />
                  </div>
                ) : null}

                {/* The menu grows with content until it hits maxHeight; then this area scrolls. */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {filteredOptions.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-gray-500">
                      No results
                    </div>
                  ) : (
                    filteredOptions.map((option) => {
                      const isSelected = String(option.value) === safeValue;
                      return (
                        <button
                          key={String(option.value)}
                          type="button"
                          onClick={() =>
                            !option.disabled && handleSelect(option.value)
                          }
                          disabled={option.disabled}
                          className={`w-full text-left px-3 py-3 transition-colors border-b border-gray-100 last:border-b-0 ${
                            isSelected
                              ? "bg-orange-50 border-orange-100 text-orange-700"
                              : option.disabled
                                ? "text-gray-400 cursor-not-allowed"
                                : "hover:bg-gray-50 text-gray-900"
                          }`}
                          style={{ fontFamily: "Poppins, sans-serif" }}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span className="font-medium text-sm whitespace-normal break-words leading-snug">
                            {option.label}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {error ? (
        <div id={`${id || name}-error`} className="text-xs text-red-600 mt-1">
          {error}
        </div>
      ) : helpText ? (
        <div id={`${id || name}-help`} className="text-xs text-gray-500 mt-1">
          {helpText}
        </div>
      ) : null}

      {/* Keep children support for compatibility */}
      {children ? <div className="hidden">{children}</div> : null}

      <style jsx global>{`
        @keyframes anythingDropdownSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
