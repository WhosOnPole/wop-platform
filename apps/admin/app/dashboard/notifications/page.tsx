import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { AdminPageHeader } from '@/components/admin/page-header'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  // Fetch notification statistics
  const [
    { count: totalNotifications },
    { count: unreadCount },
    { count: deliveredCount },
    { data: recentNotifications },
  ] = await Promise.all([
    supabase.from('notifications').select('*', { count: 'exact', head: true }),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .is('read_at', null),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .not('delivered_at', 'is', null),
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Delivery Monitor"
        title="Notifications"
        description="Monitor notification delivery and statistics."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-blue-500 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Total Notifications</p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-slate-900">{totalNotifications || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-amber-400 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Unread</p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-slate-900">{unreadCount || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-teal-500 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Delivered</p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-slate-900">{deliveredCount || 0}</p>
        </div>
      </div>

      <div className="admin-table-card">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Notifications</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>User</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentNotifications?.map((notification) => (
                <tr key={notification.id}>
                  <td className="font-bold text-slate-900">
                    {notification.type}
                  </td>
                  <td className="font-mono text-xs text-slate-600">
                    {notification.user_id}
                  </td>
                  <td>
                    <span
                      className={
                        notification.delivered_at
                          ? 'admin-status-active'
                          : 'admin-status-review'
                      }
                    >
                      {notification.delivered_at ? 'Delivered' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {new Date(notification.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

