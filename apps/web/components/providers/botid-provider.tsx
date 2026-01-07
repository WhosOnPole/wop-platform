'use client'

import { BotIdClient } from 'botid/client'

export function BotIDProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BotIdClient
        protect={[
          { path: '/api/auth/reset-password', method: 'POST' },
          { path: '/api/coming-soon/subscribe', method: 'POST' },
        ]}
      />
      {children}
    </>
  )
}

