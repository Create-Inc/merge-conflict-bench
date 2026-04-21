import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({ children }) {
  useEffect(() => {
    // Safety net: also set the favicon client-side.
    // Chrome sometimes caches /favicon.ico very aggressively and may ignore query params,
    // so we use a versioned PATH.
    const faviconUrl = "/api/site-icon-v20260107";

    const upsertLink = (rel, extraAttrs = {}) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        document.head.appendChild(link);
      }
      link.setAttribute("href", faviconUrl);
      Object.entries(extraAttrs).forEach(([k, v]) => {
        link.setAttribute(k, v);
      });
    };

    if (typeof document !== "undefined") {
      upsertLink("icon", { type: "image/png" });
      upsertLink("shortcut icon");
      upsertLink("apple-touch-icon", { sizes: "180x180" });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
