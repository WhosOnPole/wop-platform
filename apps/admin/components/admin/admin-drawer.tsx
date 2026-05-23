'use client'

import { useEffect, type ReactNode } from 'react'

interface AdminDrawerProps {
  open?: boolean
  onClose: () => void
  children: ReactNode
  panelClassName?: string
  overlayClassName?: string
  'aria-label'?: string
}

export function AdminDrawer({
  open = true,
  onClose,
  children,
  panelClassName = '',
  overlayClassName = '',
  'aria-label': ariaLabel = 'Panel',
}: AdminDrawerProps) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <div
      className={`admin-drawer-overlay ${overlayClassName}`.trim()}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-hidden={!open}
    >
      <div
        className={`admin-drawer-panel ${panelClassName}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
