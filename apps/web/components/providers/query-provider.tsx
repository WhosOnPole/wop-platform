'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient with 30-day cache configuration
  // Data rarely changes, so we can cache for a long time
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 24 * 60 * 60 * 1000, // 30 days - data rarely changes
            gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days (formerly cacheTime)
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

