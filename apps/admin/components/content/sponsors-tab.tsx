'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { SponsorModal } from './sponsor-modal'
import { Sponsor } from './content.types'

export function SponsorsTab() {
  const supabase = createClientComponentClient()
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadSponsors()
  }, [])

  async function loadSponsors() {
    setLoading(true)
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error loading sponsors:', error)
    } else {
      setSponsors(data || [])
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this endorsement?')) return

    const { error } = await supabase.from('sponsors').delete().eq('id', id)

    if (error) {
      console.error('Error deleting sponsor:', error)
      toast.error('Failed to delete endorsement')
    } else {
      loadSponsors()
    }
  }

  if (loading) {
    return (
      <div className="admin-table-card flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="admin-button-primary"
        >
          <Plus className="h-4 w-4" />
          <span>Create Endorsement</span>
        </button>
      </div>

      <div className="admin-table-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Logo</th>
                <th>Website</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((sponsor) => (
                <tr key={sponsor.id}>
                  <td>
                    <div className="text-sm font-bold text-slate-900">{sponsor.name}</div>
                  </td>
                  <td>
                    {sponsor.logo_url && (
                      <img
                        src={sponsor.logo_url}
                        alt={sponsor.name}
                        className="h-10 w-10 rounded-lg border border-slate-200 object-contain"
                      />
                    )}
                  </td>
                  <td>
                    {sponsor.website_url && (
                      <a
                        href={sponsor.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-teal-600 hover:text-teal-800"
                      >
                        {sponsor.website_url}
                      </a>
                    )}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingSponsor(sponsor)}
                        className="rounded-lg p-1.5 text-teal-600 transition hover:bg-teal-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sponsor.id)}
                        className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(isCreating || editingSponsor) && (
        <SponsorModal
          sponsor={editingSponsor}
          onClose={() => {
            setIsCreating(false)
            setEditingSponsor(null)
            loadSponsors()
          }}
        />
      )}
    </>
  )
}

