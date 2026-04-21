import { useEffect, useMemo, useState, useCallback } from "react";

export function useCustomersSearch(initialValue, setSearch) {
  const initial = typeof initialValue === "string" ? initialValue : "";
  const [searchInput, setSearchInput] = useState(initial);
  const [debouncedSearch, setDebouncedSearch] = useState(initial);

  // Keep input in sync if store value changes externally.
  useEffect(() => {
    const next = typeof initialValue === "string" ? initialValue : "";
    setSearchInput(next);
    setDebouncedSearch(next);
  }, [initialValue]);

  // Debounce changes from the text input.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setSearch?.(searchInput);
    }, 280);
    return () => clearTimeout(handle);
  }, [searchInput, setSearch]);

  const apiSearch = useMemo(() => {
    const q = typeof debouncedSearch === "string" ? debouncedSearch.trim() : "";
    return q;
  }, [debouncedSearch]);

  const setDebounced = useCallback((v) => {
    const next = typeof v === "string" ? v : "";
    setDebouncedSearch(next);
  }, []);

  return {
    searchInput,
    setSearchInput,
    debouncedSearch: apiSearch,
    setDebouncedSearch: setDebounced,
  };
}
