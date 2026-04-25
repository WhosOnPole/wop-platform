'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, Search, User } from 'lucide-react'

interface HighlightedFanManagerProps {
  currentWeekStart: string
  existingFan: any
}

export function HighlightedFanManager({
  currentWeekStart,
  existingFan,
}: HighlightedFanManagerProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fan selection
  const [fanSearch, setFanSearch] = useState('')
  const [fanResults, setFanResults] = useState<any[]>([])
  const [selectedFan, setSelectedFan] = useState<any>(existingFan || null)
  const [searchingFans, setSearchingFans] = useState(false)

  // Fan grids
  const [fanGrids, setFanGrids] = useState<any[]>([])
  const [gridFilter, setGridFilter] = useState<'all' | 'driver' | 'team' | 'track'>('all')
  const [selectedGrid, setSelectedGrid] = useState<any>(null)
  const [loadingGrids, setLoadingGrids] = useState(false)
  const [gridError, setGridError] = useState<string | null>(null)

  useEffect(() => {
    if (fanSearch.length >= 2) {
      searchFans()
    } else {
      setFanResults([])
    }
  }, [fanSearch])

  async function searchFans() {
    setSearchingFans(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, profile_image_url')
      .ilike('username', `%${fanSearch}%`)
      .limit(10)

    if (!error && data) {
      setFanResults(data)
    }
    setSearchingFans(false)
  }

  useEffect(() => {
    if (selectedFan) {
      loadFanGrids(selectedFan.id)
    } else {
      setFanGrids([])
      setSelectedGrid(null)
    }
  }, [selectedFan])

  useEffect(() => {
    if (!selectedFan) return
    loadFanGrids(selectedFan.id)
  }, [gridFilter])

  async function loadFanGrids(userId: string) {
    setLoadingGrids(true)
    setGridError(null)

    function buildQuery() {
      const query = supabase
        .from('grids')
        .select('id,type,ranked_items,blurb,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (gridFilter !== 'all') query.eq('type', gridFilter)

      return query
    }

    const { data, error: loadError } = await buildQuery()
    if (loadError) {
      setGridError(loadError.message || 'Failed to load grids')
      setFanGrids([])
      setSelectedGrid(null)
      setLoadingGrids(false)
      return
    }

    setFanGrids(data || [])
    // preserve selection if still present
    if (selectedGrid) {
      const stillExists = (data || []).find((g) => g.id === selectedGrid.id)
      if (!stillExists) setSelectedGrid(null)
    }
    setLoadingGrids(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      if (!selectedFan) throw new Error('Please select a fan')
      if (!selectedGrid) throw new Error('Please select a grid for this fan')

      // Get existing highlights for this week
      const { data: existing } = await supabase
        .from('weekly_highlights')
        .select('*')
        .eq('week_start_date', currentWeekStart)
        .maybeSingle()

      const payload = {
        week_start_date: currentWeekStart,
        highlighted_fan_id: selectedFan.id,
        highlighted_fan_grid_id: selectedGrid.id,
        // Preserve existing sponsor if it exists
        highlighted_sponsor_id: existing?.highlighted_sponsor_id || null,
      }

      const { error: upsertError } = await supabase
        .from('weekly_highlights')
        .upsert(payload, {
          onConflict: 'week_start_date',
        })

      if (upsertError) throw upsertError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save highlighted fan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{error}</div>
        )}

        {success && (
          <div className="rounded-lg bg-teal-50 p-3 text-sm font-medium text-teal-800">
            Highlighted fan saved successfully!
          </div>
        )}

        <div>
          <label className="admin-form-label mb-2">
            Highlighted Fan
          </label>
          {selectedFan ? (
            <div className="mb-2 flex items-center space-x-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {selectedFan.profile_image_url && (
                <img
                  src={selectedFan.profile_image_url}
                  alt={selectedFan.username}
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                />
              )}
              <div>
                <div className="font-bold text-slate-900">{selectedFan.username}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFan(null)
                  setFanSearch('')
                }}
                className="ml-auto text-sm font-bold text-red-600 hover:text-red-900"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fanSearch}
                  onChange={(e) => setFanSearch(e.target.value)}
                  placeholder="Search for a user by username..."
                  className="admin-form-input pl-10"
                />
              </div>
              {searchingFans && (
                <div className="mt-2 flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              )}
              {fanResults.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {fanResults.map((fan) => (
                    <button
                      key={fan.id}
                      type="button"
                      onClick={() => {
                        setSelectedFan(fan)
                        setFanSearch('')
                        setFanResults([])
                      }}
                      className="flex w-full items-center space-x-3 px-4 py-2 hover:bg-slate-50"
                    >
                      {fan.profile_image_url && (
                        <img
                          src={fan.profile_image_url}
                          alt={fan.username}
                          className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                        />
                      )}
                      <div className="text-left">
                        <div className="font-bold text-slate-900">{fan.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fan Grid selection */}
        <div className="space-y-2">
          <label className="admin-form-label">Select Grid (driver/team/track)</label>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Filter:</label>
            <select
              value={gridFilter}
              onChange={(e) => setGridFilter(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              disabled={!selectedFan}
            >
              <option value="all">All</option>
              <option value="driver">Driver</option>
              <option value="team">Team</option>
              <option value="track">Track</option>
            </select>
          </div>

          {!selectedFan && (
            <div className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600">
              Select a fan first to choose a grid.
            </div>
          )}

          {selectedFan && loadingGrids && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading grids…
            </div>
          )}

          {selectedFan && !loadingGrids && gridError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
              Failed to load grids: {gridError}
            </div>
          )}

          {selectedFan && !loadingGrids && !gridError && fanGrids.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600">
              No grids found for this fan.
            </div>
          )}

          {selectedFan && fanGrids.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {fanGrids.map((grid) => (
                <button
                  key={grid.id}
                  type="button"
                  onClick={() => setSelectedGrid(grid)}
                  className={`rounded-xl border p-3 text-left shadow-sm transition hover:border-teal-500 ${
                    selectedGrid?.id === grid.id ? 'border-teal-500 ring-4 ring-teal-500/10' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span className="font-medium capitalize">{grid.type} grid</span>
                    <span className="text-xs text-slate-500">
                      {new Date(grid.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    {Array.isArray(grid.ranked_items) &&
                      grid.ranked_items.slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="flex items-center space-x-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
                            {i + 1}
                          </span>
                          <span className="truncate">{item?.name || item?.title || 'Unknown'}</span>
                        </div>
                      ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-teal-50 p-4">
          <p className="text-sm text-teal-800">
            <strong>Week Start Date:</strong> {new Date(currentWeekStart).toLocaleDateString()}
          </p>
          <p className="mt-1 text-xs text-teal-700">
            This will update or create the highlighted fan for the week starting on this Monday.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !selectedFan || !selectedGrid}
            className="admin-button-primary px-6"
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Highlighted Fan'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

