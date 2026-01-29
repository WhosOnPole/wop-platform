'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Save, X } from 'lucide-react'
import { DriverCardMedia } from '../drivers/driver-card-media'

interface GridItem {
  id: string
  name: string
  image_url: string | null
  headshot_url?: string | null
  team_icon_url?: string | null
}

interface GridEditorProps {
  type: 'driver' | 'team' | 'track'
  availableItems: GridItem[]
}

export function GridEditor({ type, availableItems }: GridEditorProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [rankedList, setRankedList] = useState<GridItem[]>([])
  const [availableList, setAvailableList] = useState<GridItem[]>(availableItems)
  const [blurb, setBlurb] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [existingGridId, setExistingGridId] = useState<string | null>(null)

  const maxItems = 10
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? undefined

  useEffect(() => {
    setAvailableList(availableItems)
    loadExistingGrid()
  }, [availableItems, type])

  async function loadExistingGrid() {
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setLoading(false)
        return
      }

      // Load existing grid
      const { data: existingGrid } = await supabase
        .from('grids')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('type', type)
        .single()

      if (existingGrid) {
        setExistingGridId(existingGrid.id)
        setBlurb(existingGrid.blurb || '')

        // Map ranked items back to full items
        const rankedItemIds = (existingGrid.ranked_items || []) as Array<{ id: string; name: string }>
        const rankedItems: GridItem[] = []
        const available: GridItem[] = []

        availableItems.forEach((item) => {
          const rankedItem = rankedItemIds.find((ri) => ri.id === item.id)
          if (rankedItem) {
            rankedItems.push(item)
          } else {
            available.push(item)
          }
        })

        // Sort ranked items by their order in ranked_items
        rankedItems.sort((a, b) => {
          const aIndex = rankedItemIds.findIndex((ri) => ri.id === a.id)
          const bIndex = rankedItemIds.findIndex((ri) => ri.id === b.id)
          return aIndex - bIndex
        })

        setRankedList(rankedItems)
        setAvailableList(available)
      }
    } catch (error) {
      console.error('Error loading existing grid:', error)
    } finally {
      setLoading(false)
    }
  }

  function onDragEnd(result: DropResult) {
    const { source, destination } = result

    if (!destination) return

    if (source.droppableId === destination.droppableId) {
      // Reordering within same list
      if (source.droppableId === 'ranked') {
        const items = Array.from(rankedList)
        const [reorderedItem] = items.splice(source.index, 1)
        items.splice(destination.index, 0, reorderedItem)
        setRankedList(items)
      }
    } else {
      // Moving between lists
      if (source.droppableId === 'available' && destination.droppableId === 'ranked') {
        // From available to ranked
        if (rankedList.length >= maxItems) {
          alert(`Maximum ${maxItems} items allowed in ranking`)
          return
        }
        const sourceItems = Array.from(availableList)
        const destItems = Array.from(rankedList)
        const [removed] = sourceItems.splice(source.index, 1)
        destItems.splice(destination.index, 0, removed)
        setRankedList(destItems)
        setAvailableList(sourceItems)
      } else if (source.droppableId === 'ranked' && destination.droppableId === 'available') {
        // From ranked to available
        const sourceItems = Array.from(rankedList)
        const destItems = Array.from(availableList)
        const [removed] = sourceItems.splice(source.index, 1)
        destItems.splice(destination.index, 0, removed)
        setRankedList(sourceItems)
        setAvailableList(destItems)
      }
    }
  }

  function removeFromRanked(index: number) {
    const items = Array.from(rankedList)
    const [removed] = items.splice(index, 1)
    setRankedList(items)
    setAvailableList([...availableList, removed])
  }

  async function handleSave() {
    if (rankedList.length === 0) {
      alert('Please rank at least one item')
      return
    }

    setIsSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const rankedItemIds = rankedList.map((item) => ({
      id: item.id,
      name: item.name,
    }))

    // Get username for redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()

    if (existingGridId) {
      // Update existing grid - store previous state first
      // Fetch current grid to get current ranked_items
      const { data: currentGrid } = await supabase
        .from('grids')
        .select('ranked_items')
        .eq('id', existingGridId)
        .single()

      const previousState = currentGrid?.ranked_items || null

      // Update grid with new ranked_items and store previous state
      const { error: updateError } = await supabase
        .from('grids')
        .update({
          ranked_items: rankedItemIds,
          blurb: blurb.trim() || null,
          previous_state: previousState, // Store previous state
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGridId)

      if (updateError) {
        console.error('Error updating grid:', updateError)
        alert('Failed to update grid')
        setIsSubmitting(false)
        return
      }

      // Create activity post for grid update
      const gridTypeLabel = type === 'driver' ? 'Drivers' : type === 'team' ? 'Teams' : 'Tracks'
      const postContent = blurb.trim() || `Updated their Top ${gridTypeLabel} grid`

      const { error: postError } = await supabase.from('posts').insert({
        user_id: session.user.id,
        content: postContent,
        parent_page_type: 'profile',
        parent_page_id: session.user.id,
      })

      if (postError) {
        console.error('Error creating activity post:', postError)
        // Don't fail the whole operation if post creation fails
      }

      router.push(`/u/${profile?.username || session.user.id}`)
    } else {
      // Insert new grid
      const { error } = await supabase.from('grids').insert({
        user_id: session.user.id,
        type: type,
        ranked_items: rankedItemIds,
        blurb: blurb.trim() || null,
      })

      if (error) {
        console.error('Error saving grid:', error)
        alert('Failed to save grid')
      } else {
        router.push(`/u/${profile?.username || session.user.id}`)
      }
    }
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Available Items Picker */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Available {type === 'driver' ? 'Drivers' : type === 'team' ? 'Teams' : 'Tracks'}</h2>
          <Droppable droppableId="available" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex space-x-4 overflow-x-auto pb-4"
              >
                {availableList.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`flex-shrink-0 rounded-lg border-2 border-gray-200 bg-white p-3 shadow transition-shadow ${
                          snapshot.isDragging ? 'border-blue-500 shadow-lg' : 'hover:shadow-md'
                        }`}
                        style={{ ...provided.draggableProps.style }}
                      >
                        {type === 'driver' ? (
                          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded">
                            <DriverCardMedia
                              driverName={item.name}
                              supabaseUrl={supabaseUrl}
                              fallbackSrc={item.headshot_url || item.image_url}
                              sizes="96px"
                              className="rounded"
                            />
                          </div>
                        ) : (type === 'team' && item.image_url) || (type === 'track' && item.image_url) ? (
                          <img
                            src={item.image_url || ''}
                            alt={item.name}
                            className={`h-24 w-24 rounded ${type === 'team' ? 'object-contain bg-gray-100 p-2' : 'object-cover'}`}
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded bg-gray-200">
                            <span className="text-xs font-medium text-gray-600">
                              {item.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <p className="mt-2 max-w-[100px] truncate text-xs font-medium text-gray-900">
                          {item.name}
                        </p>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Ranked List */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Your Ranking ({rankedList.length}/{maxItems})
          </h2>
          <Droppable droppableId="ranked">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4"
              >
                {rankedList.length === 0 ? (
                  <p className="py-8 text-center text-gray-500">
                    Drag items here to rank them
                  </p>
                ) : (
                  rankedList.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center space-x-4 rounded-lg border-2 bg-white p-4 shadow transition-shadow ${
                            snapshot.isDragging
                              ? 'border-blue-500 shadow-lg'
                              : 'border-gray-200 hover:shadow-md'
                          }`}
                          style={{ ...provided.draggableProps.style }}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                            {index + 1}
                          </div>
                          {type === 'driver' ? (
                            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
                              <DriverCardMedia
                                driverName={item.name}
                                supabaseUrl={supabaseUrl}
                                fallbackSrc={item.headshot_url || item.image_url}
                                sizes="48px"
                                className="rounded"
                              />
                            </div>
                          ) : (type === 'team' && item.image_url) || (type === 'track' && item.image_url) ? (
                            <img
                              src={item.image_url || ''}
                              alt={item.name}
                              className={type === 'team' ? 'h-12 w-12 rounded object-contain' : 'h-12 w-12 rounded object-cover'}
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
                              <span className="text-sm font-medium text-gray-600">
                                {item.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                          </div>
                          <button
                            onClick={() => removeFromRanked(index)}
                            className="rounded-md p-2 text-gray-400 hover:text-red-600"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {/* Blurb Section */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Blurb (optional, max 140 characters)
        </label>
        <textarea
          value={blurb}
          onChange={(e) => {
            if (e.target.value.length <= 140) {
              setBlurb(e.target.value)
            }
          }}
          rows={3}
          placeholder="Add a blurb about your ranking..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          {blurb.length}/140 characters
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSubmitting || rankedList.length === 0}
          className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>Save Ranking</span>
        </button>
      </div>
    </div>
  )
}

