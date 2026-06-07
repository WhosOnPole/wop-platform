'use client'

import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, PlusCircle, Eye, Ban, Check, Search } from 'lucide-react'
import { toast } from 'sonner'
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

type FilterMode = 'all' | 'threshold'

export default function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [minStrikes, setMinStrikes] = useState(1)
  const [maxPoints, setMaxPoints] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const pageSize = 50
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerUser, setDrawerUser] = useState<AdminUser | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filterMode === 'all') {
      params.set('showAll', 'true')
    } else {
      params.set('showAll', 'false')
      params.set('minStrikes', String(minStrikes))
      params.set('maxPoints', String(maxPoints))
    }
    if (search.trim()) params.set('search', search.trim())
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    return params.toString()
  }, [filterMode, minStrikes, maxPoints, search, page])

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
      setTotal(data.total ?? data.data?.length ?? 0)
      setHasMore(Boolean(data.hasMore))
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
      toast.error(err.message || 'Action failed')
    }
  }

  function renderStatus(user: AdminUser) {
    if (user.banned_until) return <span className="admin-status-disabled">Banned</span>
    return <span className="admin-status-active">Active</span>
  }

  function askAdjustPoints(user: AdminUser) {
    const input = prompt('Enter point adjustment (e.g., -5 or 10):', '0')
    if (input === null) return
    const delta = Number(input)
    if (Number.isNaN(delta) || delta === 0) return toast.error('Enter a non-zero number')
    performAction(user, 'adjust_points', delta)
  }

  function openReports(user: AdminUser) {
    setDrawerUser(user)
    setDrawerOpen(true)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function handleFilterChange(mode: FilterMode) {
    setFilterMode(mode)
    setPage(1)
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, total)

  return (
    <div className="space-y-4">
      <div className="admin-table-card space-y-3 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search username or email"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </div>
          <button type="submit" className="admin-button-secondary py-2">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="admin-form-label">Filter</label>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              value={filterMode}
              onChange={(e) => handleFilterChange(e.target.value as FilterMode)}
            >
              <option value="all">All accounts</option>
              <option value="threshold">Moderation queue (strikes or low points)</option>
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
                  onChange={(e) => {
                    setMinStrikes(Number(e.target.value))
                    setPage(1)
                  }}
                />
              </label>
              <label className="text-sm text-gray-700">
                Max points:
                <input
                  type="number"
                  className="ml-2 w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                  value={maxPoints}
                  onChange={(e) => {
                    setMaxPoints(Number(e.target.value))
                    setPage(1)
                  }}
                />
              </label>
            </>
          )}
          <button onClick={loadUsers} className="admin-button-primary py-2">
            Refresh
          </button>
        </div>

        {!loading && !error && (
          <p className="text-sm text-slate-500">
            {total === 0
              ? 'No accounts match the current filters.'
              : `Showing ${rangeStart}–${rangeEnd} of ${total} account${total === 1 ? '' : 's'}`}
          </p>
        )}
      </div>

      {loading && <div className="admin-table-card p-6 text-sm text-slate-500">Loading users...</div>}
      {error && <div className="admin-table-card p-6 text-sm font-medium text-red-600">{error}</div>}

      {!loading && !error && (
        <>
          <div className="admin-table-card overflow-x-auto">
            <table className="admin-table min-w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th className="text-right">Points</th>
                  <th className="text-right">Strikes</th>
                  <th>Status</th>
                  <th className="text-right">Recent reports</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        {user.profile_image_url ? (
                          <img
                            src={user.profile_image_url}
                            alt={user.username}
                            className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {user.username || 'No username'}
                          </div>
                          <div className="text-xs text-slate-500">{user.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right font-mono tabular-nums text-slate-900">{user.points}</td>
                    <td className="text-right font-mono tabular-nums text-slate-900">{user.strikes}</td>
                    <td>{renderStatus(user)}</td>
                    <td className="text-right font-mono tabular-nums text-slate-900">
                      {user.recent_reports || 0}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button
                          onClick={() => performAction(user, user.banned_until ? 'unban' : 'ban')}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 font-bold text-red-700 transition hover:bg-red-100"
                        >
                          {user.banned_until ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          {user.banned_until ? 'Unban' : 'Ban'}
                        </button>
                        <button
                          onClick={() => performAction(user, 'reset_strikes')}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-bold text-slate-700 transition hover:bg-slate-200"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reset strikes
                        </button>
                        <button
                          onClick={() => askAdjustPoints(user)}
                          className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1.5 font-bold text-teal-700 transition hover:bg-teal-100"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Adjust points
                        </button>
                        <button
                          onClick={() => openReports(user)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-bold text-slate-700 transition hover:bg-slate-200"
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
                    <td colSpan={6} className="py-12 text-center">
                      <p className="font-bold text-slate-900">No users match the current filter</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try &quot;All accounts&quot;, clear search, or adjust moderation thresholds.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > pageSize && (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="admin-button-secondary py-2 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <button
                type="button"
                disabled={!hasMore}
                onClick={() => setPage((current) => current + 1)}
                className="admin-button-secondary py-2 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
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
