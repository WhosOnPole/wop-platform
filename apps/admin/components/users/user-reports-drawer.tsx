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
      className={`fixed inset-0 z-50 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md transform bg-white shadow-xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Reports for {username || 'User'}</h2>
            <p className="text-xs text-gray-500">Most recent first</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-[calc(100%-56px)] overflow-y-auto p-4">
          {loading && <p className="text-sm text-gray-500">Loading…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && reports.length === 0 && (
            <p className="text-sm text-gray-500">No reports for this user.</p>
          )}
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-md border border-gray-200 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{r.target_type}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500 break-all">Target: {r.target_id}</p>
                <p className="mt-2 text-sm text-gray-800">
                  <strong>Reason:</strong> {r.reason}
                </p>
                <p className="mt-1 text-xs text-gray-600">
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

