'use client'

import { useEffect, useMemo, useState } from 'react'
import { ShieldX, RotateCcw, PlusCircle, Eye, Ban, Check } from 'lucide-react'
import UserReportsDrawer from './user-reports-drawer'

interface AdminUser {
  id: string
  username: string
  email?: string | null
  points: number
  strikes: number
  banned_until: string | null
  profile_image_url?: string | null
  recent_reports?: number
}

type FilterMode = 'threshold' | 'all'

export default function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<FilterMode>('threshold')
  const [minStrikes, setMinStrikes] = useState(1)
  const [maxPoints, setMaxPoints] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerUser, setDrawerUser] = useState<AdminUser | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filterMode === 'all') params.set('showAll', 'true')
    else {
      params.set('minStrikes', String(minStrikes))
      params.set('maxPoints', String(maxPoints))
    }
    return params.toString()
  }, [filterMode, minStrikes, maxPoints])

  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/points?${queryString}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load users')
      }
      const data = await res.json()
      setUsers(data.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  function updateUserInState(userId: string, patch: Partial<AdminUser>) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)))
  }

  async function performAction(
    user: AdminUser,
    action: 'ban' | 'unban' | 'reset_strikes' | 'adjust_points',
    deltaPoints?: number
  ) {
    try {
      const res = await fetch('/api/admin/users/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: user.id, deltaPoints }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Action failed')
      }
      const data = await res.json()
      if (data.profile) updateUserInState(user.id, data.profile)
    } catch (err: any) {
      alert(err.message || 'Action failed')
    }
  }

  function renderStatus(user: AdminUser) {
    if (user.banned_until) return <span className="text-red-600 text-sm">Banned</span>
    return <span className="text-green-600 text-sm">Active</span>
  }

  function askAdjustPoints(user: AdminUser) {
    const input = prompt('Enter point adjustment (e.g., -5 or 10):', '0')
    if (input === null) return
    const delta = Number(input)
    if (Number.isNaN(delta) || delta === 0) return alert('Enter a non-zero number')
    performAction(user, 'adjust_points', delta)
  }

  function openReports(user: AdminUser) {
    setDrawerUser(user)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Filter:</label>
          <select
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as FilterMode)}
          >
            <option value="threshold">Strikes ≥ min or Points ≤ max</option>
            <option value="all">Show all</option>
          </select>
        </div>
        {filterMode === 'threshold' && (
          <>
            <label className="text-sm text-gray-700">
              Min strikes:
              <input
                type="number"
                className="ml-2 w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                value={minStrikes}
                min={0}
                onChange={(e) => setMinStrikes(Number(e.target.value))}
              />
            </label>
            <label className="text-sm text-gray-700">
              Max points:
              <input
                type="number"
                className="ml-2 w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                value={maxPoints}
                onChange={(e) => setMaxPoints(Number(e.target.value))}
              />
            </label>
          </>
        )}
        <button
          onClick={loadUsers}
          className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading users…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">User</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Points</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Strikes</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                  Recent reports
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      {user.profile_image_url ? (
                        <img
                          src={user.profile_image_url}
                          alt={user.username}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                          {user.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{user.username}</div>
                        <div className="text-xs text-gray-500">{user.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{user.points}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{user.strikes}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{renderStatus(user)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{user.recent_reports || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        onClick={() => performAction(user, user.banned_until ? 'unban' : 'ban')}
                        className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200"
                      >
                        {user.banned_until ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        {user.banned_until ? 'Unban' : 'Ban'}
                      </button>
                      <button
                        onClick={() => performAction(user, 'reset_strikes')}
                        className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-gray-700 hover:bg-gray-200"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset strikes
                      </button>
                      <button
                        onClick={() => askAdjustPoints(user)}
                        className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-blue-700 hover:bg-blue-200"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Adjust points
                      </button>
                      <button
                        onClick={() => openReports(user)}
                        className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-gray-700 hover:bg-gray-200"
                      >
                        <Eye className="h-4 w-4" />
                        View reports
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No users match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <UserReportsDrawer
        userId={drawerUser?.id || null}
        username={drawerUser?.username || null}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

