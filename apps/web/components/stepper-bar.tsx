'use client'

import { useRef, useState } from 'react'

export interface StepperBarProps {
  currentIndex: number
  total: number
  onSelectIndex: (index: number, options?: { isDragging?: boolean }) => void
  ariaLabel?: string
}

export function StepperBar({
  currentIndex,
  total,
  onSelectIndex,
  ariaLabel = 'Position',
}: StepperBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState(0)
  const didDragRef = useRef(false)

  if (total <= 0) return null

  const segmentWidth = 100 / total
  const leftPercent = currentIndex * segmentWidth

  function positionToIndex(clientX: number): number {
    const el = trackRef.current
    if (!el) return currentIndex
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = (x / rect.width) * 100
    return Math.min(total - 1, Math.max(0, Math.floor((percent / 100) * total)))
  }

  function positionToBarLeft(clientX: number): number {
    const el = trackRef.current
    if (!el) return leftPercent
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = (x / rect.width) * 100
    const centered = percent - segmentWidth / 2
    return Math.min(100 - segmentWidth, Math.max(0, centered))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onSelectIndex(Math.max(0, currentIndex - 1))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onSelectIndex(Math.min(total - 1, currentIndex + 1))
    }
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const index = Math.min(total - 1, Math.max(0, Math.floor((x / rect.width) * total)))
    onSelectIndex(index)
  }

  function handleTouchStart(e: React.TouchEvent) {
    setIsDragging(true)
    didDragRef.current = false
    const rect = trackRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.touches[0].clientX - rect.left
      const percent = (x / rect.width) * 100
      setDragPosition(Math.min(100 - segmentWidth, Math.max(0, percent - segmentWidth / 2)))
    }
    e.stopPropagation()
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging) return
    didDragRef.current = true
    // Rely on touchAction: 'none' on the container to prevent scroll; preventDefault() is ignored in React's passive touch listeners
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = e.touches[0].clientX
    const index = positionToIndex(clientX)
    const barLeft = positionToBarLeft(clientX)
    setDragPosition(barLeft)
    onSelectIndex(index, { isDragging: true })
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!isDragging) return
    const clientX = e.changedTouches[0].clientX
    const index = positionToIndex(clientX)
    setIsDragging(false)
    onSelectIndex(index)
    e.stopPropagation()
  }

  function handleTouchCancel() {
    if (isDragging) {
      setIsDragging(false)
      onSelectIndex(currentIndex)
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    setIsDragging(true)
    didDragRef.current = false
    const rect = trackRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const percent = (x / rect.width) * 100
      setDragPosition(Math.min(100 - segmentWidth, Math.max(0, percent - segmentWidth / 2)))
    }

    function onMouseMove(ev: MouseEvent) {
      didDragRef.current = true
      const index = positionToIndex(ev.clientX)
      const barLeft = positionToBarLeft(ev.clientX)
      setDragPosition(barLeft)
      onSelectIndex(index, { isDragging: true })
    }

    function onMouseUp(ev: MouseEvent) {
      if (ev.button !== 0) return
      const index = positionToIndex(ev.clientX)
      setIsDragging(false)
      onSelectIndex(index)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const barLeft = isDragging ? dragPosition : leftPercent
  const barTransition = isDragging ? 'none' : 'left 200ms ease-out'

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={total - 1}
      aria-valuenow={currentIndex}
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className="relative flex h-2 w-full cursor-pointer select-none items-center"
      style={{ touchAction: 'none' }}
    >
      <div className="pointer-events-none h-0.5 w-full rounded-full bg-white/30" aria-hidden />
      <div
        className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-sm bg-white/80"
        style={{
          width: `${segmentWidth}%`,
          left: `${barLeft}%`,
          transition: barTransition,
        }}
        aria-hidden
      />
    </div>
  )
}
