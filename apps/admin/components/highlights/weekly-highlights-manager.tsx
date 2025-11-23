'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, Search, User, Building2 } from 'lucide-react'

interface WeeklyHighlightsManagerProps {
  currentWeekStart: string
  existingHighlights: any
}

export function WeeklyHighlightsManager({
  currentWeekStart,
  existingHighlights,
}: WeeklyHighlightsManagerProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fan selection
  const [fanSearch, setFanSearch] = useState('')
  const [fanResults, setFanResults] = useState<any[]>([])
  const [selectedFan, setSelectedFan] = useState<any>(
    existingHighlights?.highlighted_fan || null
  )
  const [searchingFans, setSearchingFans] = useState(false)

  // Sponsor selection
  const [sponsorSearch, setSponsorSearch] = useState('')
  const [sponsorResults, setSponsorResults] = useState<any[]>([])
  const [selectedSponsor, setSelectedSponsor] = useState<any>(
    existingHighlights?.highlighted_sponsor || null
  )
  const [searchingSponsors, setSearchingSponsors] = useState(false)

  useEffect(() => {
    if (fanSearch.length >= 2) {
      searchFans()
    } else {
      setFanResults([])
    }
  }, [fanSearch])

  useEffect(() => {
    if (sponsorSearch.length >= 2) {
      searchSponsors()
    } else {
      setSponsorResults([])
    }
  }, [sponsorSearch])

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

  async function searchSponsors() {
    setSearchingSponsors(true)
    const { data, error } = await supabase
      .from('sponsors')
      .select('id, name, logo_url')
      .ilike('name', `%${sponsorSearch}%`)
      .limit(10)

    if (!error && data) {
      setSponsorResults(data)
    }
    setSearchingSponsors(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      if (!selectedFan || !selectedSponsor) {
        throw new Error('Please select both a fan and a sponsor')
      }

      const payload = {
        week_start_date: currentWeekStart,
        highlighted_fan_id: selectedFan.id,
        highlighted_sponsor_id: selectedSponsor.id,
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
      setError(err.message || 'Failed to save weekly highlights')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            Weekly highlights saved successfully!
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Highlighted Fan *
          </label>
          {selectedFan ? (
            <div className="mb-2 flex items-center space-x-3 rounded-md border border-gray-300 bg-gray-50 p-3">
              {selectedFan.profile_image_url && (
                <img
                  src={selectedFan.profile_image_url}
                  alt={selectedFan.username}
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div>
                <div className="font-medium text-gray-900">{selectedFan.username}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFan(null)
                  setFanSearch('')
                }}
                className="ml-auto text-sm text-red-600 hover:text-red-900"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={fanSearch}
                  onChange={(e) => setFanSearch(e.target.value)}
                  placeholder="Search for a user by username..."
                  className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              {searchingFans && (
                <div className="mt-2 flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
              {fanResults.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                  {fanResults.map((fan) => (
                    <button
                      key={fan.id}
                      type="button"
                      onClick={() => {
                        setSelectedFan(fan)
                        setFanSearch('')
                        setFanResults([])
                      }}
                      className="flex w-full items-center space-x-3 px-4 py-2 hover:bg-gray-50"
                    >
                      {fan.profile_image_url && (
                        <img
                          src={fan.profile_image_url}
                          alt={fan.username}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{fan.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Highlighted Sponsor *
          </label>
          {selectedSponsor ? (
            <div className="mb-2 flex items-center space-x-3 rounded-md border border-gray-300 bg-gray-50 p-3">
              {selectedSponsor.logo_url && (
                <img
                  src={selectedSponsor.logo_url}
                  alt={selectedSponsor.name}
                  className="h-10 w-10 rounded object-contain"
                />
              )}
              <div>
                <div className="font-medium text-gray-900">{selectedSponsor.name}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSponsor(null)
                  setSponsorSearch('')
                }}
                className="ml-auto text-sm text-red-600 hover:text-red-900"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={sponsorSearch}
                  onChange={(e) => setSponsorSearch(e.target.value)}
                  placeholder="Search for a sponsor by name..."
                  className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              {searchingSponsors && (
                <div className="mt-2 flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
              {sponsorResults.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                  {sponsorResults.map((sponsor) => (
                    <button
                      key={sponsor.id}
                      type="button"
                      onClick={() => {
                        setSelectedSponsor(sponsor)
                        setSponsorSearch('')
                        setSponsorResults([])
                      }}
                      className="flex w-full items-center space-x-3 px-4 py-2 hover:bg-gray-50"
                    >
                      {sponsor.logo_url && (
                        <img
                          src={sponsor.logo_url}
                          alt={sponsor.name}
                          className="h-8 w-8 rounded object-contain"
                        />
                      )}
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{sponsor.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Week Start Date:</strong> {new Date(currentWeekStart).toLocaleDateString()}
          </p>
          <p className="mt-1 text-xs text-blue-700">
            This will update or create the highlights for the week starting on this Monday.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !selectedFan || !selectedSponsor}
            className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Weekly Highlights'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

