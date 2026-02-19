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
    'inline-flex items-center rounded-full text-md font-sans opacity-65 transition-colors  [font-variant:all-small-caps;] tracking-wide'
  const styles =
    variant === 'dark'
      ? 'hover:text-[#25B4B1] text-white hover:opacity-full transition-opacity'
      : 'text-gray-900 bg-white/90 hover:text-[#25B4B1]'

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`${base} ${styles} ${className}`}
      aria-label={label}
    >
      <ChevronLeft className="h-4 w-5 shrink-1 pt-0.5" aria-hidden />
      {label ? <span>{label}</span> : null}
    </button>
  )
}
