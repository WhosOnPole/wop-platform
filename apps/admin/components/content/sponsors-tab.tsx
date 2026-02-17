'use client'

import { useEffect, useState } from 'react'
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
    if (!confirm('Are you sure you want to delete this sponsor?')) return

    const { error } = await supabase.from('sponsors').delete().eq('id', id)

    if (error) {
      console.error('Error deleting sponsor:', error)
      alert('Failed to delete sponsor')
    } else {
      loadSponsors()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Create Sponsor</span>
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Logo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Website
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sponsors.map((sponsor) => (
                <tr key={sponsor.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{sponsor.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    {sponsor.logo_url && (
                      <img
                        src={sponsor.logo_url}
                        alt={sponsor.name}
                        className="h-10 w-10 rounded object-contain"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {sponsor.website_url && (
                      <a
                        href={sponsor.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {sponsor.website_url}
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingSponsor(sponsor)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sponsor.id)}
                        className="text-red-600 hover:text-red-900"
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

