import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function ImagesPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  // Fetch image processing statistics
  const [
    { count: processingCount },
    { count: completedCount },
    { count: failedCount },
    { data: recentImages },
  ] = await Promise.all([
    supabase
      .from('image_metadata')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing'),
    supabase
      .from('image_metadata')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase
      .from('image_metadata')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed'),
    supabase
      .from('image_metadata')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Image Processing</h1>
      <p className="mb-8 text-gray-600">
        Monitor image processing queue and status
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <p className="text-sm text-gray-600">Processing</p>
          <p className="text-2xl font-bold text-gray-900">{processingCount || 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-gray-900">{completedCount || 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-gray-900">{failedCount || 0}</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Images</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Path
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentImages?.map((image) => (
                <tr key={image.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{image.original_path}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        image.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : image.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {image.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {image.original_size ? `${(image.original_size / 1024).toFixed(2)} KB` : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(image.created_at).toLocaleString()}
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

