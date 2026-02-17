'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { GridTileContent, type GridTileItem } from './grid-tile-content'

export type GridType = 'driver' | 'team' | 'track'

export interface GridEditCanvasRankItem extends GridTileItem {
  is_placeholder?: boolean
}

const PLACEHOLDER_ITEM = (index: number): GridEditCanvasRankItem => ({
  id: `__placeholder__${index}`,
  name: '',
  is_placeholder: true,
})

function padToTen(items: GridEditCanvasRankItem[]): GridEditCanvasRankItem[] {
  const filled: GridEditCanvasRankItem[] = []
  for (let i = 0; i < 10; i++) {
    filled.push(items[i] ?? PLACEHOLDER_ITEM(i))
  }
  return filled
}

interface GridEditCanvasProps {
  type: GridType
  rankedList: GridEditCanvasRankItem[]
  onRankedListChange: (items: GridEditCanvasRankItem[]) => void
  availableItems: GridEditCanvasRankItem[]
  supabaseUrl?: string
  /** When set, the slot at this index (0-9) shows an active sunset-gradient border animation */
  activeSlotIndex?: number
  /** Called when a slot is clicked (without drag); press+drag activates drag-and-drop */
  onActiveSlotChange?: (index: number) => void
}

function SlotDroppable({
  id,
  slotIndex,
  activeSlotIndex,
  children,
  className,
  size,
}: {
  id: string
  slotIndex: number
  activeSlotIndex?: number
  children: React.ReactNode
  className?: string
  /** When 'large', slot keeps aspect-square so it doesn't collapse when active (absolute content) */
  size?: 'large' | 'small'
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const isActive = activeSlotIndex === slotIndex
  const containerRef = useRef<HTMLDivElement | null>(null)
  const refCb = useCallback(
    (el: HTMLDivElement | null) => {
      setNodeRef(el)
      ;(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    },
    [setNodeRef]
  )
  // #region agent log
  useEffect(() => {
    if (slotIndex !== 0) return
    const el = containerRef.current
    if (!el) return
    const w = el.offsetWidth
    const h = el.offsetHeight
    fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'grid-edit-canvas.tsx:SlotDroppable',
        message: 'slot-0 dimensions',
        data: { slotIndex: 0, isActive, activeSlotIndex, offsetWidth: w, offsetHeight: h },
        timestamp: Date.now(),
        hypothesisId: isActive ? 'H1' : 'H2',
      }),
    }).catch(() => {})
  }, [slotIndex, isActive, activeSlotIndex])
  // #endregion
  const sizeClass = size === 'large' ? 'aspect-square w-full' : ''
  return (
    <div
      ref={refCb}
      className={`${className ?? ''} ${sizeClass} rounded-lg ${isOver ? 'ring-2 ring-[#25B4B1] ring-offset-2 ring-offset-black' : ''} ${isActive ? 'relative overflow-hidden' : ''}`}
      aria-label={`Slot ${id.replace('slot-', '')}`}
    >
      {isActive && (
        <div
          className="absolute left-1/2 top-1/2 z-0 h-[200%] w-[170%] min-h-[170%] min-w-[170%] -translate-x-1/2 -translate-y-1/2 animate-slot-border-rotate"
          style={{
            background: 'linear-gradient(90deg, #EC6D00 0%, #FF006F 60%, #25B4B1 70%, #FF006F 80%, #EC6D00 100%)',
          }}
        />
      )}
      {isActive ? (
        <div className="absolute inset-[1.3px] z-10 min-h-0 rounded-[12px] overflow-hidden bg-black">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

function SlotDraggable({
  id,
  slotIndex,
  item,
  type,
  size,
  supabaseUrl,
  onSlotClick,
}: {
  id: string
  slotIndex: number
  item: GridEditCanvasRankItem
  type: GridType
  size: 'large' | 'small'
  supabaseUrl?: string
  onSlotClick?: (index: number) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { source: 'slot' as const, slotIndex, itemId: item.id },
    disabled: Boolean(item.is_placeholder),
  })
  const rank = slotIndex + 1
  function handleClick(e: React.MouseEvent) {
    if (onSlotClick && !isDragging) onSlotClick(slotIndex)
  }
  return (
    <div
      ref={setNodeRef}
      {...(item.is_placeholder ? {} : { ...listeners, ...attributes })}
      onClick={onSlotClick ? handleClick : undefined}
      className={`${item.is_placeholder ? '' : 'cursor-grab active:cursor-grabbing touch-none'} ${isDragging ? 'opacity-50' : ''}`}
      aria-label={`Slot ${rank}${item.is_placeholder ? ', empty' : `, ${item.name}`}`}
    >
      <GridTileContent
        type={type}
        item={item}
        supabaseUrl={supabaseUrl}
        rank={rank}
        size={size}
        isEmpty={Boolean(item.is_placeholder)}
      />
    </div>
  )
}

function PaletteDraggable({
  item,
  type,
  supabaseUrl,
}: {
  item: GridEditCanvasRankItem
  type: GridType
  supabaseUrl?: string
}) {
  const id = `palette-${item.id}`
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { source: 'palette' as const, itemId: item.id },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 cursor-grab active:cursor-grabbing touch-pan-x ${isDragging ? 'opacity-50' : ''}`}
      aria-label={`Drag ${item.name} to a grid slot`}
    >
      <GridTileContent
        type={type}
        item={item}
        supabaseUrl={supabaseUrl}
        size="small"
      />
    </div>
  )
}

export function GridEditCanvas({
  type,
  rankedList,
  onRankedListChange,
  availableItems,
  supabaseUrl,
  activeSlotIndex,
  onActiveSlotChange,
}: GridEditCanvasProps) {
  const ranked = padToTen(rankedList)
  const rankedIds = new Set(ranked.filter((i) => !i.is_placeholder).map((i) => i.id))
  const paletteItems = availableItems.filter((i) => !rankedIds.has(i.id))
  const [activeId, setActiveId] = useState<string | null>(null)
  const didDragRef = useRef(false)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    didDragRef.current = true
    setActiveId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      setTimeout(() => { didDragRef.current = false }, 0)
      const { active, over } = event
      if (!over) return

      const activeId = String(active.id)
      const overId = String(over.id)
      const data = active.data.current as
        | { source: 'slot'; slotIndex: number; itemId: string }
        | { source: 'palette'; itemId: string }
        | undefined

      if (!data) return

      let draggedItem: GridEditCanvasRankItem
      let fromSlot: number | null = null

      if (data.source === 'slot') {
        fromSlot = data.slotIndex
        const current = ranked[fromSlot]
        if (current?.is_placeholder) return
        draggedItem = current
      } else {
        const found = availableItems.find((i) => i.id === data.itemId)
        if (!found) return
        draggedItem = found
      }

      const next = [...ranked]

      if (overId === 'palette') {
        if (fromSlot == null) return
        next[fromSlot] = PLACEHOLDER_ITEM(fromSlot)
        onRankedListChange(next)
        return
      }

      const slotMatch = overId.match(/^slot-(\d+)$/)
      if (slotMatch) {
        const toIndex = parseInt(slotMatch[1], 10)
        if (toIndex < 0 || toIndex > 9) return

        if (fromSlot !== null) {
          const existing = next[toIndex]
          next[toIndex] = draggedItem
          next[fromSlot] = existing ?? PLACEHOLDER_ITEM(fromSlot)
        } else {
          next[toIndex] = draggedItem
        }
        onRankedListChange(next)
      }
    },
    [ranked, availableItems, onRankedListChange]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setTimeout(() => { didDragRef.current = false }, 0)
  }, [])

  const handleSlotClick = useCallback(
    (index: number) => {
      if (didDragRef.current) return
      onActiveSlotChange?.(index)
    },
    [onActiveSlotChange]
  )

  const overlayItem: GridEditCanvasRankItem | null = activeId
    ? (() => {
        const slotMatch = activeId.match(/^slot-(\d+)$/)
        if (slotMatch) {
          const i = parseInt(slotMatch[1], 10)
          const item = ranked[i]
          return item?.is_placeholder ? null : item ?? null
        }
        const paletteMatch = activeId.match(/^palette-(.+)$/)
        if (paletteMatch) {
          return availableItems.find((it) => it.id === paletteMatch[1]) ?? null
        }
        return null
      })()
    : null
  const overlaySize: 'large' | 'small' = activeId === 'slot-0' ? 'large' : 'small'
  const overlayRank = activeId?.startsWith('slot-')
    ? parseInt(activeId.replace('slot-', ''), 10) + 1
    : 1

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Top: grid layout — slot 1 large left, slots 2–10 in 3x3 right */}
      <div className="flex gap-2 items-start mb-6">
        <div className="w-1/2 min-w-0 flex-shrink-0">
          <SlotDroppable id="slot-0" slotIndex={0} activeSlotIndex={activeSlotIndex} className="block" size="large">
            <SlotDraggable
              id="slot-0"
              slotIndex={0}
              item={ranked[0]}
              type={type}
              size="large"
              supabaseUrl={supabaseUrl}
              onSlotClick={handleSlotClick}
            />
          </SlotDroppable>
        </div>
        <div className="w-1/2 min-w-0 grid grid-cols-3 gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <SlotDroppable key={i} id={`slot-${i}`} slotIndex={i} activeSlotIndex={activeSlotIndex}>
              <SlotDraggable
                id={`slot-${i}`}
                slotIndex={i}
                item={ranked[i]}
                type={type}
                size="small"
                supabaseUrl={supabaseUrl}
                onSlotClick={handleSlotClick}
              />
            </SlotDroppable>
          ))}
        </div>
      </div>

      {/* Bottom: horizontal scrolling palette — always-visible thick scrollbar for touch */}
      <div className="mt-4 min-w-0">
        <p className="text-xs text-center text-white/80 mb-0">Drag cards to grid slots or back here to remove</p>
        <PaletteDroppable id="palette">
          <div className="palette-horizontal-scroll flex w-full min-w-0 gap-2 flex-nowrap pt-0.5">
            {paletteItems.map((item) => (
              <PaletteDraggable
                key={item.id}
                item={item}
                type={type}
                supabaseUrl={supabaseUrl}
              />
            ))}
          </div>
        </PaletteDroppable>
      </div>

      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeId && overlayItem ? (
          <div
            className={`cursor-grabbing touch-none rounded-xl overflow-hidden bg-black shadow-lg ${
              overlaySize === 'large' ? 'w-36 h-36 min-w-36 min-h-36' : 'w-20 h-20 min-w-20 min-h-20 md:w-24 md:h-24 md:min-w-24 md:min-h-24'
            }`}
          >
            <GridTileContent
              type={type}
              item={overlayItem}
              supabaseUrl={supabaseUrl}
              rank={overlayRank}
              size={overlaySize}
              isEmpty={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function PaletteDroppable({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[6rem] min-w-0 rounded-lg border border-dashed border-white/20 bg-white/5 p-2 pb-0 ${isOver ? 'ring-2 ring-[#25B4B1] ring-offset-2 ring-offset-black' : ''}`}
      aria-label="Available items - drop here to remove from grid"
    >
      {children}
    </div>
  )
}
