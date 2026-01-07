import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
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

    const { email } = await request.json()

    // Validate email format
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Sanitize input to prevent injection attacks
    const sanitizedEmail = String(email).trim().toLowerCase()
    
    // Check for common injection patterns
    const injectionPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /['";]/,
    ]

    for (const pattern of injectionPatterns) {
      if (pattern.test(sanitizedEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Limit email length
    if (sanitizedEmail.length > 254) {
      return NextResponse.json(
        { error: 'Email is too long' },
        { status: 400 }
      )
    }

    // TODO: Implement email subscription storage
    // For now, just return success
    console.log('Email subscription:', sanitizedEmail)

    return NextResponse.json({ success: true, message: 'Thank you for subscribing!' })
  } catch (error: any) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

