import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes in milliseconds
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60 // 15 minutes in seconds
const MAX_REQUESTS = 5 // Max 5 login/signup attempts per window

// Cleanup expired records every 100 requests (to avoid overhead)
let requestCount = 0
const CLEANUP_INTERVAL = 100

interface RateLimitRow {
  ip_address: string
  endpoint: string
  request_count: number
  expires_at: string
  updated_at?: string | null
}

async function checkRateLimit(
  supabase: any,
  ip: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS)

  // Try to get existing record
  const { data: existing, error: fetchError } = await supabase
    .from('rate_limits')
    .select('request_count, expires_at')
    .eq('ip_address', ip)
    .eq('endpoint', endpoint)
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching rate limit:', fetchError)
  }

  // Type assertion for the existing record
  const existingRecord = existing as Pick<RateLimitRow, 'request_count' | 'expires_at'> | null

  // If record exists and hasn't expired
  if (existingRecord && new Date(existingRecord.expires_at) > now) {
    // Check if limit exceeded
    if (existingRecord.request_count >= MAX_REQUESTS) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(existingRecord.expires_at),
      }
    }

    // Increment count
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({
        request_count: existingRecord.request_count + 1,
        updated_at: now.toISOString(),
      } as any)
      .eq('ip_address', ip)
      .eq('endpoint', endpoint)

    if (updateError) {
      console.error('Error updating rate limit:', updateError)
      // Allow request on error (fail open)
      return {
        allowed: true,
        remaining: MAX_REQUESTS - existingRecord.request_count - 1,
        resetAt: new Date(existingRecord.expires_at),
      }
    }

    return {
      allowed: true,
      remaining: MAX_REQUESTS - existingRecord.request_count - 1,
      resetAt: new Date(existingRecord.expires_at),
    }
  }

  // No record or expired - create/update with new window
  const { error: upsertError } = await supabase
    .from('rate_limits')
    .upsert(
      {
        ip_address: ip,
        endpoint,
        request_count: 1,
        expires_at: expiresAt.toISOString(),
      } as any,
      {
        onConflict: 'ip_address,endpoint',
      }
    )

  if (upsertError) {
    console.error('Error upserting rate limit:', upsertError)
    // Allow request on error (fail open)
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: expiresAt,
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - 1,
    resetAt: expiresAt,
  }
}

async function cleanupExpiredRecords(
  supabase: any
): Promise<void> {
  try {
    // Call the cleanup function
    const { error } = await supabase.rpc('cleanup_expired_rate_limits')

    if (error) {
      console.error('Error cleaning up expired rate limits:', error)
    }
  } catch (error) {
    console.error('Error calling cleanup function:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      // Fail open - allow request if rate limiting is misconfigured
      return NextResponse.json({ success: true, warning: 'Rate limiting unavailable' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })

    // Extract IP address
    const ip =
      request.ip ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const { endpoint } = await request.json()

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
    }

    // Periodic cleanup of expired records
    requestCount++
    if (requestCount >= CLEANUP_INTERVAL) {
      requestCount = 0
      // Don't await - run in background
      cleanupExpiredRecords(supabase).catch(console.error)
    }

    // Check rate limit
    const result = await checkRateLimit(supabase, ip, endpoint)

    if (!result.allowed) {
      const retryAfter = Math.ceil(
        (result.resetAt.getTime() - Date.now()) / 1000
      )

      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter,
          resetAt: result.resetAt.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toISOString(),
          },
        }
      )
    }

    return NextResponse.json(
      {
        success: true,
        remaining: result.remaining,
        resetAt: result.resetAt.toISOString(),
      },
      {
        headers: {
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetAt.toISOString(),
        },
      }
    )
  } catch (error: any) {
    console.error('Error in rate limit check:', error)
    // Fail open - allow request on error
    return NextResponse.json({ success: true, warning: 'Rate limiting error' })
  }
}
