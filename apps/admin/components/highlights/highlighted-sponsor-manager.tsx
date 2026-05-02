'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, Search, Building2 } from 'lucide-react'

interface HighlightedSponsorManagerProps {
  currentWeekStart: string
  existingSponsor: any
}

export function HighlightedSponsorManager({
  currentWeekStart,
  existingSponsor,
}: HighlightedSponsorManagerProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Sponsor selection
  const [sponsorSearch, setSponsorSearch] = useState('')
  const [sponsorResults, setSponsorResults] = useState<any[]>([])
  const [selectedSponsor, setSelectedSponsor] = useState<any>(existingSponsor || null)
  const [searchingSponsors, setSearchingSponsors] = useState(false)

  useEffect(() => {
    if (sponsorSearch.length >= 2) {
      searchSponsors()
    } else {
      setSponsorResults([])
    }
  }, [sponsorSearch])

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
      if (!selectedSponsor) {
        throw new Error('Please select an endorsement')
      }

      // Get existing highlights for this week
      const { data: existing } = await supabase
        .from('weekly_highlights')
        .select('*')
        .eq('week_start_date', currentWeekStart)
        .maybeSingle()

      const payload = {
        week_start_date: currentWeekStart,
        highlighted_sponsor_id: selectedSponsor.id,
        // Preserve existing fan if it exists
        highlighted_fan_id: existing?.highlighted_fan_id || null,
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
      setError(err.message || 'Failed to save highlighted endorsement')
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
            Highlighted endorsement saved successfully!
          </div>
        )}

        <div>
          <label className="admin-form-label mb-2">
            Highlighted Endorsement
          </label>
          {selectedSponsor ? (
            <div className="mb-2 flex items-center space-x-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {selectedSponsor.logo_url && (
                <img
                  src={selectedSponsor.logo_url}
                  alt={selectedSponsor.name}
                  className="h-10 w-10 rounded-lg border border-slate-200 object-contain"
                />
              )}
              <div>
                <div className="font-bold text-slate-900">{selectedSponsor.name}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSponsor(null)
                  setSponsorSearch('')
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
                  value={sponsorSearch}
                  onChange={(e) => setSponsorSearch(e.target.value)}
                  placeholder="Search for an endorsement by name..."
                  className="admin-form-input pl-10"
                />
              </div>
              {searchingSponsors && (
                <div className="mt-2 flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              )}
              {sponsorResults.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {sponsorResults.map((sponsor) => (
                    <button
                      key={sponsor.id}
                      type="button"
                      onClick={() => {
                        setSelectedSponsor(sponsor)
                        setSponsorSearch('')
                        setSponsorResults([])
                      }}
                      className="flex w-full items-center space-x-3 px-4 py-2 hover:bg-slate-50"
                    >
                      {sponsor.logo_url && (
                        <img
                          src={sponsor.logo_url}
                          alt={sponsor.name}
                          className="h-8 w-8 rounded-lg border border-slate-200 object-contain"
                        />
                      )}
                      <div className="text-left">
                        <div className="font-bold text-slate-900">{sponsor.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-teal-50 p-4">
          <p className="text-sm text-teal-800">
            <strong>Week Start Date:</strong> {new Date(currentWeekStart).toLocaleDateString()}
          </p>
          <p className="mt-1 text-xs text-teal-700">
            This will update or create the highlighted endorsement for the week starting on this Monday.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !selectedSponsor}
            className="admin-button-primary px-6"
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Highlighted Endorsement'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

