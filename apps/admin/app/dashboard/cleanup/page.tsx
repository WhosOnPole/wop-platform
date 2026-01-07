import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { CleanupDashboard } from '@/components/cleanup/cleanup-dashboard'

export default async function CleanupPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  // Fetch cleanup configurations
  const { data: configs } = await supabase
    .from('cleanup_config')
    .select('*')
    .order('cleanup_type')

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Data Cleanup</h1>
      <p className="mb-8 text-gray-600">
        Configure and monitor automated data cleanup tasks
      </p>

      <CleanupDashboard initialConfigs={configs || []} />
    </div>
  )
}

