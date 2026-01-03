'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Edit, Loader2 } from 'lucide-react'
import { TeamEditModal } from './team-edit-modal'

interface Team {
  id: string
  name: string
  image_url: string | null
  overview_text: string | null
  instagram_url: string | null
  active: boolean
}

export function TeamsTable() {
  const supabase = createClientComponentClient()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  useEffect(() => {
    loadTeams()
  }, [])

  async function loadTeams() {
    setLoading(true)
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error loading teams:', error)
    } else {
      setTeams(data || [])
    }
    setLoading(false)
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
      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {teams.map((team) => (
                <tr key={team.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      {team.image_url && (
                        <img
                          src={team.image_url}
                          alt={team.name}
                          className="mr-3 h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900">{team.name}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        team.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {team.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => setEditingTeam(team)}
                      className="flex items-center text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingTeam && (
        <TeamEditModal
          team={editingTeam}
          onClose={() => {
            setEditingTeam(null)
            loadTeams()
          }}
        />
      )}
    </>
  )
}

