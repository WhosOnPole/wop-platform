import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyBotId } from '@/utils/botid'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Verify BotID first
    const botIdResult = await verifyBotId(request)
    if (!botIdResult.valid) {
      return NextResponse.json(
        { error: 'Bot verification failed. Please try again.' },
        { status: 403 }
      )
    }

    const { password, confirmPassword } = await request.json()

    // Validate passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one lowercase letter' },
        { status: 400 }
      )
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      )
    }

    if (!/(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      )
    }

    // Sanitize input to prevent injection attacks
    const sanitizedPassword = String(password).trim()
    if (sanitizedPassword.length !== password.length || sanitizedPassword !== password) {
      return NextResponse.json(
        { error: 'Invalid password format' },
        { status: 400 }
      )
    }

    // Check for common injection patterns
    const injectionPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /['";]/,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
    ]

    for (const pattern of injectionPatterns) {
      if (pattern.test(sanitizedPassword)) {
        return NextResponse.json(
          { error: 'Invalid password format' },
          { status: 400 }
        )
      }
    }

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(
      { cookies: () => cookieStore as any },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SECRET_KEY,
      }
    )

    const { error: updateError } = await supabase.auth.updateUser({
      password: sanitizedPassword,
    })

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to update password. Please try again.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

