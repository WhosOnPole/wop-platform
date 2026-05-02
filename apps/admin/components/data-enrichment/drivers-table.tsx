'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Edit, Loader2 } from 'lucide-react'
import { DriverEditModal } from './driver-edit-modal'

interface Driver {
  id: string
  name: string
  team_id: string | null
  headshot_url: string | null
  image_url: string | null
  team_icon_url: string | null
  active: boolean
  racing_number: number | null
  age: number | null
  nationality: string | null
  overview_text: string | null
  podiums_total: number
  current_standing: number | null
  world_championships: number
  instagram_username: string | null
  teams?: { name: string } | null
}

export function DriversTable() {
  const supabase = createClientComponentClient()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)

  useEffect(() => {
    loadDrivers()
  }, [])

  async function loadDrivers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        teams:team_id (
          name
        )
      `)
      .order('name')

    if (error) {
      console.error('Error loading drivers:', error)
    } else {
      setDrivers(data || [])
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
                <th>Driver</th>
                <th>Team</th>
                <th>Number</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const portraitUrl = driver.headshot_url || driver.image_url

                return (
                  <tr key={driver.id}>
                    <td>
                      <div className="flex items-center">
                        {portraitUrl && (
                          <img
                            src={portraitUrl}
                            alt={driver.name}
                            className="mr-3 h-8 w-8 rounded-full border border-slate-200 object-cover object-top"
                          />
                        )}
                        <div>
                          <div className="text-sm font-bold text-slate-900">{driver.name}</div>
                          {driver.nationality && (
                            <div className="text-xs text-slate-500">{driver.nationality}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {driver.teams?.name || 'N/A'}
                    </td>
                    <td className="font-mono tabular-nums text-slate-900">
                      {driver.racing_number || 'N/A'}
                    </td>
                    <td>
                      <span
                        className={
                          driver.active
                            ? 'admin-status-active'
                            : 'admin-status-pending'
                        }
                      >
                        {driver.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setEditingDriver(driver)}
                        className="admin-action-link"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingDriver && (
        <DriverEditModal
          driver={editingDriver}
          onClose={() => {
            setEditingDriver(null)
            loadDrivers()
          }}
        />
      )}
    </>
  )
}

