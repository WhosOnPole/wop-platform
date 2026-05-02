import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface Report {
  id: number
  target_id: string
  target_type: string
  reason: string
  status: string
  created_at: string
}

interface UserReportsDrawerProps {
  userId: string | null
  username: string | null
  open: boolean
  onClose: () => void
}

export default function UserReportsDrawer({ userId, username, open, onClose }: UserReportsDrawerProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReports() {
      if (!userId || !open) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/users/reports?userId=${userId}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to load reports')
        }
        const data = await res.json()
        setReports(data.data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load reports')
      } finally {
        setLoading(false)
      }
    }
    loadReports()
  }, [userId, open])

  return (
    <div
      className={`admin-drawer-overlay transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!open}
    >
      <div
        className={`admin-drawer-panel max-w-[520px] transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="admin-drawer-header">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Reports for {username || 'User'}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {userId ? `ID: ${userId}` : 'Most recent first'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="admin-drawer-body">
          {loading && <p className="text-sm text-slate-500">Loading...</p>}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {!loading && !error && reports.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-3 rounded-full bg-teal-50 p-3 text-teal-600">
                <X className="h-6 w-6" />
              </div>
              <p className="font-bold text-slate-900">No reports for this user</p>
              <p className="mt-1 text-sm text-slate-500">Moderation context is clear.</p>
            </div>
          )}
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="admin-status-review capitalize">{r.target_type}</span>
                  <span className="text-xs font-medium text-slate-500">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 break-all font-mono text-xs text-slate-500">Target: {r.target_id}</p>
                <p className="mt-3 border-l-4 border-teal-500 bg-[#F8F9FB] p-3 text-sm text-slate-700">
                  <strong>Reason:</strong> {r.reason}
                </p>
                <p className="mt-3 text-xs font-medium text-slate-600">
                  Status: <span className="capitalize">{r.status}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

