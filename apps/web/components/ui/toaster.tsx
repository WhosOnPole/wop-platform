'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      richColors
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: 'bg-white/10 border-white/20 backdrop-blur-sm',
          success: 'border-bright-teal/50',
          error: 'border-racing-orange/50',
        },
      }}
    />
  )
}
