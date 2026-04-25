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
  instagram_username: string | null
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
      <div className="admin-table-card flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <>
      <div className="admin-table-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td>
                    <div className="flex items-center">
                      {team.image_url && (
                        <img
                          src={team.image_url}
                          alt={team.name}
                          className="mr-3 h-8 w-8 rounded-full border border-slate-200 object-cover"
                        />
                      )}
                      <div className="text-md font-bold text-slate-900">{team.name}</div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={
                        team.active
                          ? 'admin-status-active'
                          : 'admin-status-pending'
                      }
                    >
                      {team.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setEditingTeam(team)}
                      className="admin-action-link"
                    >
                      <Edit className="h-4 w-4" />
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

