"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function RootLayout({ children }) {
  // Create QueryClient instance inside component to avoid SSR issues
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            cacheTime: 1000 * 60 * 30, // 30 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Include required document wrapper tags (Next/app-router style)
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary name="RootLayout">{children}</ErrorBoundary>
        </QueryClientProvider>
      </body>
    </html>
  );
}
