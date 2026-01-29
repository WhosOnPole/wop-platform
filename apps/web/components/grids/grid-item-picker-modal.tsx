'use client'

import { useState, useMemo } from 'react'
import type { GridType } from './grid-rank-pills'

interface GridItemPickerModalProps {
  open: boolean
  onClose: () => void
  type: GridType
  items: Array<{ id: string; name: string }>
  selectedRankIndex: number
  onSelect: (item: { id: string; name: string }) => void
  title?: string
}

export function GridItemPickerModal({
  open,
  onClose,
  type,
  items,
  selectedRankIndex,
  onSelect,
  title,
}: GridItemPickerModalProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.trim().toLowerCase()
    return items.filter((item) => item.name.toLowerCase().includes(q))
  }, [items, query])

  if (!open) return null

  function handleSelect(item: { id: string; name: string }) {
    onSelect(item)
    setQuery('')
    onClose()
  }

  const typeLabel = type === 'driver' ? 'Driver' : type === 'team' ? 'Team' : 'Track'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="picker-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-black border border-white/20 rounded-xl max-w-md w-full max-h-[80vh] flex flex-col shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
          <h2 id="picker-modal-title" className="text-lg font-semibold text-white">
            {title ?? `Replace rank ${selectedRankIndex + 1} with a ${typeLabel}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded"
            aria-label="Close"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        <div className="p-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${typeLabel}s...`}
            className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none"
            autoFocus
          />
        </div>
        <ul className="overflow-y-auto flex-1 min-h-0 p-2 space-y-1" role="listbox">
          {filtered.slice(0, 100).map((item) => (
            <li key={item.id} role="option">
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left rounded-lg px-3 py-2.5 text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none"
              >
                {item.name}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-white/60 text-sm">No matches</li>
          )}
        </ul>
      </div>
    </div>
  )
}
