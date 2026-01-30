'use client'

import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Menu } from 'lucide-react'
import type { GridType } from './grid-rank-pills'

interface RankItem {
  id: string
  name: string
  team_name?: string | null
  country?: string | null
  is_placeholder?: boolean
  [key: string]: unknown
}

interface GridRankPillsDndProps {
  rankedItems: RankItem[]
  type: GridType
  selectedIndex: number
  onSelectIndex: (index: number) => void
  onRankedListChange: (items: RankItem[]) => void
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

export function GridRankPillsDnd({
  rankedItems,
  type,
  selectedIndex,
  onSelectIndex,
  onRankedListChange,
  supabaseUrl,
}: GridRankPillsDndProps) {
  // react-beautiful-dnd can get upset in React 18 dev/StrictMode if it mounts/unmounts rapidly.
  // Gate enabling DnD until after the component is mounted on the client.
  const [isDndEnabled, setIsDndEnabled] = useState(false)

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setIsDndEnabled(true))
    return () => {
      window.cancelAnimationFrame(raf)
      setIsDndEnabled(false)
    }
  }, [])

  const items = Array.from({ length: 10 }, (_, i) => {
    const item = rankedItems[i]
    if (item) return item
    return { id: `__placeholder__${i}`, name: '', is_placeholder: true } as RankItem
  })

  function onDragEnd(result: DropResult) {
    const { source, destination } = result
    if (!destination || source.index === destination.index) return
    const next = Array.from(items)
    const [removed] = next.splice(source.index, 1)
    next.splice(destination.index, 0, removed)
    onRankedListChange(next)
  }

  function renderPill(item: RankItem, index: number) {
    const rank = index + 1
    const isSelected = selectedIndex === index
    const secondary = secondaryLabel(item, type)
    const short = shortName(item, type)
    const isPlaceholder = Boolean(item.is_placeholder)

    return (
      <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={isPlaceholder}>
        {(provided, snapshot) => (
          <button
            ref={provided.innerRef}
            {...provided.draggableProps}
            type="button"
            onClick={() => onSelectIndex(index)}
            className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-white transition-colors ${
              snapshot.isDragging ? 'bg-[#d9d9d9]/50 shadow-lg' : isSelected ? 'bg-[#d9d9d9]/40' : 'bg-[#d9d9d9]/25 hover:bg-[#d9d9d9]/35'
            }`}
            style={provided.draggableProps.style}
          >
            <span className="flex-shrink-0 w-6 text-sm font-semibold">{rank}</span>
            {type === 'track' ? (
              <span className="min-w-0 flex-1 truncate text-sm text-white/90">
                {isPlaceholder ? 'Empty' : secondary}
              </span>
            ) : type === 'driver' && secondary ? (
              <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                <span className="flex-shrink-0 font-medium">{short}</span>
                <span className="flex flex-shrink-0 items-center justify-center text-white/60 text-[10px] leading-none" aria-hidden>•</span>
                <span className="min-w-0 truncate text-white/90">{secondary}</span>
              </span>
            ) : (
              <>
                <span className="flex-shrink-0 text-sm font-medium">{isPlaceholder ? '—' : short}</span>
                {(secondary || isPlaceholder) && (
                  <span className="min-w-0 truncate flex-1 text-sm text-white/90">
                    {isPlaceholder ? 'Empty' : secondary}
                  </span>
                )}
              </>
            )}
            {!isPlaceholder && (
              <span
                {...provided.dragHandleProps}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-white/70 hover:text-white"
                aria-label="Drag to reorder"
              >
                <Menu className="h-4 w-4" />
              </span>
            )}
          </button>
        )}
      </Draggable>
    )
  }

  if (!isDndEnabled) {
    return (
      <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto">
        {items.map((item, index) => {
          const isSelected = selectedIndex === index
          const isPlaceholder = Boolean(item.is_placeholder)
          const secondary = secondaryLabel(item, type)
          const short = shortName(item, type)

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectIndex(index)}
              className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-white transition-colors ${
                isSelected ? 'bg-[#d9d9d9]/40' : 'bg-[#d9d9d9]/25 hover:bg-[#d9d9d9]/35'
              }`}
            >
              <span className="flex-shrink-0 w-6 text-sm font-semibold">{index + 1}</span>
              {type === 'track' ? (
                <span className="min-w-0 flex-1 truncate text-sm text-white/90">
                  {isPlaceholder ? 'Empty' : secondary}
                </span>
              ) : type === 'driver' && secondary ? (
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                  <span className="flex-shrink-0 font-medium">{short}</span>
                  <span className="flex flex-shrink-0 items-center justify-center text-white/60 text-[10px] leading-none" aria-hidden>•</span>
                  <span className="min-w-0 truncate text-white/90">{secondary}</span>
                </span>
              ) : (
                <>
                  <span className="flex-shrink-0 text-sm font-medium">{isPlaceholder ? '—' : short}</span>
                  {(secondary || isPlaceholder) && (
                    <span className="min-w-0 truncate flex-1 text-sm text-white/90">
                      {isPlaceholder ? 'Empty' : secondary}
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable
        droppableId="grid-ranked-pills"
        direction="vertical"
        isDropDisabled={false}
        isCombineEnabled={false}
      >
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto"
          >
            {items.map((item, index) => renderPill(item, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
