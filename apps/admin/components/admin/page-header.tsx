import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}

/**
 * Consistent page intro surface for operational admin subpages.
 */
export function AdminPageHeader({ eyebrow, title, description, action }: AdminPageHeaderProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  )
}
