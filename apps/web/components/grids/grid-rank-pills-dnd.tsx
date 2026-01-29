'use client'

import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Menu } from 'lucide-react'
import type { GridType } from './grid-rank-pills'

interface RankItem {
  id: string
  name: string
  team_name?: string | null
  country?: string | null
  [key: string]: unknown
}

const GRID_SLOTS = 10

interface GridRankPillsDndProps {
  /** Array of up to 10 items; empty slots can be null. Will be padded to 10 for display. */
  rankedItems: (RankItem | null)[]
  type: GridType
  selectedIndex: number
  onSelectIndex: (index: number) => void
  onRankedListChange: (items: (RankItem | null)[]) => void
  supabaseUrl?: string
}

function shortName(item: RankItem, type: GridType): string {
  if (type === 'driver') {
    const parts = item.name.split(' ')
    const lastName = parts[parts.length - 1] || item.name
    return lastName.substring(0, 3).toUpperCase()
  }
  if (type === 'track') return (item.country || '').toUpperCase().slice(0, 3) || item.name.slice(0, 3)
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
  const slots = (() => {
    const next = [...rankedItems].slice(0, GRID_SLOTS)
    while (next.length < GRID_SLOTS) next.push(null)
    return next.slice(0, GRID_SLOTS)
  })()

  function onDragEnd(result: DropResult) {
    const { source, destination } = result
    if (!destination || source.index === destination.index) return
    const next = Array.from(slots)
    const [removed] = next.splice(source.index, 1)
    next.splice(destination.index, 0, removed)
    onRankedListChange(next)
  }

  function getDraggableId(index: number): string {
    const item = slots[index]
    return item ? item.id : `slot-empty-${index}`
  }

  function renderPill(item: RankItem | null, index: number) {
    const rank = index + 1
    const isSelected = selectedIndex === index
    const isEmpty = item == null

    return (
      <Draggable key={getDraggableId(index)} draggableId={getDraggableId(index)} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-white transition-colors ${
              snapshot.isDragging ? 'bg-[#d9d9d9]/50 shadow-lg' : isSelected ? 'bg-[#d9d9d9]/40' : 'bg-[#d9d9d9]/25 hover:bg-[#d9d9d9]/35'
            }`}
            style={provided.draggableProps.style}
            onClick={() => onSelectIndex(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectIndex(index)
              }
            }}
            aria-label={isEmpty ? `Rank ${rank}, add pick` : `Rank ${rank}, ${item.name}`}
          >
            <span className="flex-shrink-0 w-6 text-sm font-semibold">{rank}</span>
            {isEmpty ? (
              <span className="flex-1 text-sm text-white/60">Add</span>
            ) : (
              <>
                {type === 'driver' && (item.team_name ?? '') ? (
                  <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                    <span className="flex-shrink-0 font-medium">{shortName(item, type)}</span>
                    <span className="flex flex-shrink-0 items-center justify-center text-white/60 text-[10px] leading-none" aria-hidden>•</span>
                    <span className="min-w-0 truncate text-white/90">{secondaryLabel(item, type)}</span>
                  </span>
                ) : (
                  <>
                    <span className="flex-shrink-0 text-sm font-medium">{shortName(item, type)}</span>
                    {secondaryLabel(item, type) && (
                      <span className="min-w-0 truncate flex-1 text-sm text-white/90">{secondaryLabel(item, type)}</span>
                    )}
                  </>
                )}
              </>
            )}
            <span
              {...provided.dragHandleProps}
              className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-white/70 hover:text-white"
              aria-label="Drag to reorder"
              onClick={(e) => e.stopPropagation()}
            >
              <Menu className="h-4 w-4" />
            </span>
          </div>
        )}
      </Draggable>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="grid-ranked-pills" direction="vertical">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto"
          >
            {slots.map((item, index) => renderPill(item, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
