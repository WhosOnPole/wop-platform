'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Save, X, Trophy, ChevronUp, ChevronDown } from 'lucide-react'

interface GridItem {
  id: string
  name: string
  image_url: string | null
  headshot_url?: string | null
}

interface OnboardingDriversStepProps {
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingDriversStep({ onComplete, onSkip }: OnboardingDriversStepProps) {
  const supabase = createClientComponentClient()
  const [rankedList, setRankedList] = useState<GridItem[]>([])
  const [availableList, setAvailableList] = useState<GridItem[]>([])
  const [blurb, setBlurb] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDrivers()
  }, [])

  async function loadDrivers() {
    setLoading(true)
    try {
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, name, image_url, headshot_url')
        .eq('active', true)
        .order('name')

      if (drivers) {
        setAvailableList(
          drivers.map((driver) => ({
            id: driver.id,
            name: driver.name,
            image_url: driver.image_url,
            headshot_url: driver.headshot_url || null,
          }))
        )
      }
    } catch (error) {
      console.error('Error loading drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleAddToRanked(item: GridItem) {
    if (rankedList.length >= 10) {
      alert('Maximum 10 drivers allowed')
      return
    }
    const newAvailableList = availableList.filter((i) => i.id !== item.id)
    const newRankedList = [...rankedList, item]
    setAvailableList(newAvailableList)
    setRankedList(newRankedList)
  }

  function handleRemoveFromRanked(item: GridItem) {
    const newRankedList = rankedList.filter((i) => i.id !== item.id)
    const newAvailableList = [...availableList, item]
    setRankedList(newRankedList)
    setAvailableList(newAvailableList)
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    const items = [...rankedList]
    const temp = items[index]
    items[index] = items[index - 1]
    items[index - 1] = temp
    setRankedList(items)
  }

  function handleMoveDown(index: number) {
    if (index === rankedList.length - 1) return
    const items = [...rankedList]
    const temp = items[index]
    items[index] = items[index + 1]
    items[index + 1] = temp
    setRankedList(items)
  }

  async function handleSave() {
    setIsSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    const rankedItemIds = rankedList.map((item) => ({
      id: item.id,
      name: item.name,
    }))

    // Upsert grid (update if exists, insert if not)
    const { data: existing } = await supabase
      .from('grids')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('type', 'driver')
      .maybeSingle()

    let error
    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('grids')
        .update({
          ranked_items: rankedItemIds,
          blurb: blurb.trim() || null,
        })
        .eq('id', existing.id)
      error = updateError
    } else {
      // Insert new
      const { error: insertError } = await supabase.from('grids').insert({
        user_id: session.user.id,
        type: 'driver',
        ranked_items: rankedItemIds,
        blurb: blurb.trim() || null,
      })
      error = insertError
    }

    if (error) {
      console.error('Error saving grid:', error)
      alert('Failed to save grid')
    } else {
      onComplete()
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select Your Top 10 Drivers</h2>
        <p className="mt-1 text-sm text-gray-600">
          Drag and drop to rank your favorites. Your top 3 picks are especially important!
        </p>
      </div>

      {/* Top 3 Podium */}
      {rankedList.length >= 3 && (
        <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-900">Your Top 3</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {rankedList.slice(0, 3).map((item, index) => (
              <div
                key={item.id}
                className="relative rounded-lg border-2 border-purple-300 bg-white p-4 text-center shadow-md"
              >
                <div className="mb-2 flex justify-center">
                  {item.headshot_url || item.image_url ? (
                    <img
                      src={item.headshot_url || item.image_url || ''}
                      alt={item.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                      <span className="text-xl font-medium text-gray-600">
                        {item.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mb-1 flex items-center justify-center space-x-1">
                  <span className="text-2xl font-bold text-purple-600">#{index + 1}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Drivers */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Available Drivers</h3>
        <div className="flex flex-wrap gap-4">
          {availableList.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleAddToRanked(item)}
              className="flex-shrink-0 cursor-pointer rounded-lg border-2 border-gray-200 bg-white p-3 shadow transition-shadow hover:border-blue-500 hover:shadow-md"
            >
              {item.headshot_url || item.image_url ? (
                <img
                  src={item.headshot_url || item.image_url || ''}
                  alt={item.name}
                  className="h-24 w-24 rounded object-cover"
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
            </button>
          ))}
        </div>
      </div>

      {/* Ranked List */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Your Ranking ({rankedList.length}/10)
        </h3>
        <div className="space-y-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4">
          {rankedList.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              Click drivers above to add them to your ranking (top 3 will be highlighted)
            </p>
          ) : (
            rankedList.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center space-x-4 rounded-lg border-2 bg-white p-4 shadow transition-shadow ${
                  index < 3 ? 'border-purple-200 bg-purple-50' : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col space-y-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="rounded-md p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === rankedList.length - 1}
                    className="rounded-md p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white ${
                    index < 3 ? 'bg-purple-600' : 'bg-blue-600'
                  }`}
                >
                  {index + 1}
                </div>
                {item.headshot_url || item.image_url ? (
                  <img
                    src={item.headshot_url || item.image_url || ''}
                    alt={item.name}
                    className="h-12 w-12 rounded object-cover"
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
                  type="button"
                  onClick={() => handleRemoveFromRanked(item)}
                  className="rounded-md p-2 text-gray-400 hover:text-red-600"
                  title="Remove"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Blurb */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Blurb (optional, max 140 characters)
        </label>
        <textarea
          id="driver-blurb"
          name="driver-blurb"
          value={blurb}
          onChange={(e) => {
            if (e.target.value.length <= 140) {
              setBlurb(e.target.value)
            }
          }}
          rows={2}
          placeholder="Say something about your driver picks..."
          autoComplete="off"
          data-form-type="other"
          className="w-full rounded-md text-black border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">{blurb.length}/140 characters</p>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting || rankedList.length === 0}
          className="flex items-center space-x-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>Continue</span>
        </button>
      </div>
    </div>
  )
}

