import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function NotificationsPage() {
  const supabase = createServerComponentClient({ cookies })

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
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Notifications</h1>
      <p className="mb-8 text-gray-600">
        Monitor notification delivery and statistics
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <p className="text-sm text-gray-600">Total Notifications</p>
          <p className="text-2xl font-bold text-gray-900">{totalNotifications || 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <p className="text-sm text-gray-600">Unread</p>
          <p className="text-2xl font-bold text-gray-900">{unreadCount || 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <p className="text-sm text-gray-600">Delivered</p>
          <p className="text-2xl font-bold text-gray-900">{deliveredCount || 0}</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentNotifications?.map((notification) => (
                <tr key={notification.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {notification.type}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {notification.user_id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        notification.delivered_at
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {notification.delivered_at ? 'Delivered' : 'Pending'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
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

