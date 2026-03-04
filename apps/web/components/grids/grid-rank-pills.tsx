'use client'

export type GridType = 'driver' | 'team' | 'track'

interface RankItem {
  id: string
  name: string
  team_name?: string | null
  country?: string | null
  [key: string]: unknown
}

interface GridRankPillsProps {
  rankedItems: RankItem[]
  type: GridType
  selectedIndex: number
  onSelectIndex: (index: number) => void
  supabaseUrl?: string
}

function shortName(item: RankItem, type: GridType): string {
  if (type === 'driver') {
    const parts = item.name.split(' ')
    const lastName = parts[parts.length - 1] || item.name
    return lastName.substring(0, 3).toUpperCase()
  }
  return item.name.slice(0, 3).toUpperCase()
}

function secondaryLabel(item: RankItem, type: GridType): string {
  if (type === 'driver') return item.team_name || ''
  if (type === 'track') return item.name || ''
  return ''
}

export function GridRankPills({
  rankedItems,
  type,
  selectedIndex,
  onSelectIndex,
  supabaseUrl,
}: GridRankPillsProps) {
  const items = rankedItems.slice(0, 10)
  const leftColumn = items.filter((_, i) => i % 2 === 0)
  const rightColumn = items.filter((_, i) => i % 2 === 1)

  function renderPill(item: RankItem, index: number) {
    const rank = index + 1
    const isSelected = selectedIndex === index
    const secondary = secondaryLabel(item, type)
    const short = shortName(item, type)

    if (type === 'track') {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectIndex(index)}
          className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-white transition-colors ${
            isSelected ? 'bg-[#d9d9d9]/40' : 'bg-[#d9d9d9]/25 hover:bg-[#d9d9d9]/35'
          }`}
        >
          <span className="flex-shrink-0 w-6 text-sm font-semibold">{rank}</span>
          <span className="min-w-0 truncate text-sm text-white/90">{secondary}</span>
        </button>
      )
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectIndex(index)}
        className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-white transition-colors ${
          isSelected ? 'bg-[#d9d9d9]/40' : 'bg-[#d9d9d9]/25 hover:bg-[#d9d9d9]/35'
        }`}
      >
        <span className="flex-shrink-0 w-6 text-sm font-semibold">{rank}</span>
        {type === 'driver' && secondary ? (
          <span className="flex min-w-0 items-center gap-1.5 text-sm">
            <span className="flex-shrink-0 font-medium">{short}</span>
            <span className="flex flex-shrink-0 items-center justify-center text-white/60 text-[10px] leading-none" aria-hidden>•</span>
            <span className="min-w-0 truncate text-white/90">{secondary}</span>
          </span>
        ) : (
          <>
            <span className="flex-shrink-0 text-sm font-medium">{short}</span>
            {secondary && (
              <span className="min-w-0 truncate text-sm text-white/90">{secondary}</span>
            )}
          </>
        )}
      </button>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto">
      <div className="flex flex-col gap-2">
        {leftColumn.map((item, i) => renderPill(item, i * 2))}
      </div>
      <div className="flex flex-col gap-2">
        {rightColumn.map((item, i) => renderPill(item, i * 2 + 1))}
      </div>
    </div>
  )
}
