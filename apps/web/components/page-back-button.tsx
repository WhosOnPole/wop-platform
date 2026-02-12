'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface PageBackButtonProps {
  /** Optional label (e.g. "Back"). Omit for icon-only. */
  label?: string
  /** Extra class names for the button container. */
  className?: string
  /** Variant: dark = light text on dark hero (default); light = dark text on light bg. */
  variant?: 'dark' | 'light'
}

export function PageBackButton({
  label = 'Back',
  className = '',
  variant = 'dark',
}: PageBackButtonProps) {
  const router = useRouter()

  const base =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50'
  const styles =
    variant === 'dark'
      ? 'text-white hover:bg-white/20 backdrop-blur-sm'
      : 'text-gray-900 bg-white/90 hover:bg-white border border-gray-200'

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`${base} ${styles} ${className}`}
      aria-label={label}
    >
      <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
      {label ? <span>{label}</span> : null}
    </button>
  )
}
