'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient with long cache (capped at 24 days to avoid Node 32-bit timer overflow)
  // Data rarely changes, so we can cache for a long time
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 24 * 24 * 60 * 60 * 1000, // 24 days - under setTimeout max (2147483647 ms)
            gcTime: 24 * 24 * 60 * 60 * 1000, // 24 days (formerly cacheTime)
            refetchOnWindowFocus: false, // Data doesn't change often
            refetchOnMount: false, // Use cached data
            retry: 1, // Only retry once on failure
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

