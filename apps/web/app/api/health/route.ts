import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      supabase: 'unknown',
    },
  }

  // Check Supabase connection
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      checks.services.supabase = 'misconfigured'
      checks.status = 'unhealthy'
      return NextResponse.json(checks, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    // Simple query to verify database connectivity
    const { error } = await supabase.from('profiles').select('id').limit(1)

    if (error) {
      checks.services.database = 'unhealthy'
      checks.services.supabase = 'unhealthy'
      checks.status = 'unhealthy'
      return NextResponse.json(checks, { status: 503 })
    }

    checks.services.database = 'healthy'
    checks.services.supabase = 'healthy'
  } catch (error) {
    checks.services.database = 'error'
    checks.services.supabase = 'error'
    checks.status = 'unhealthy'
    return NextResponse.json(checks, { status: 503 })
  }

  return NextResponse.json(checks, { status: 200 })
}

