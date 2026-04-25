'use client'

import * as React from 'react'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

interface TabsProps {
  defaultValue: string
  className?: string
  children: React.ReactNode
}

export function Tabs({ defaultValue, className, children }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex min-h-12 flex-wrap items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm">
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const isActive = context.value === value

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={`inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-teal-50 text-teal-700 shadow-sm'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  if (context.value !== value) return null

  return <div className="mt-6">{children}</div>
}

