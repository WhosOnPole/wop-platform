'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Edit, Loader2 } from 'lucide-react'
import { DriverEditModal } from './driver-edit-modal'

interface Driver {
  id: string
  name: string
  team_id: string | null
  image_url: string | null
  team_icon_url: string | null
  racing_number: number | null
  age: number | null
  nationality: string | null
  podiums_total: number
  current_standing: number | null
  world_championships: number
  instagram_url: string | null
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
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      {(driver.headshot_url || driver.image_url) && (
                        <img
                          src={driver.headshot_url || driver.image_url}
                          alt={driver.name}
                          className="mr-3 h-10 w-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                        {driver.nationality && (
                          <div className="text-sm text-gray-500">{driver.nationality}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {driver.teams?.name || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {driver.racing_number || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => setEditingDriver(driver)}
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

