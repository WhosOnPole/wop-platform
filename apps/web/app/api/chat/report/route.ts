import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient(
      { cookies: () => cookieStore as any },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      }
    )

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messageId, reason } = body

    if (!messageId || !reason) {
      return NextResponse.json(
        { error: 'Message ID and reason are required' },
        { status: 400 }
      )
    }

    // Get message details for context
    const { data: message, error: messageError } = await supabase
      .from('live_chat_messages')
      .select('id, track_id, user_id, message')
      .eq('id', messageId)
      .single()

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Create report
    const { error: reportError } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      target_id: messageId.toString(), // Convert to string for consistency
      target_type: 'chat_message',
      reason,
    })

    if (reportError) {
      // Check if it's a duplicate report
      if (reportError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already reported this message' },
          { status: 409 }
        )
      }

      console.error('Error creating report:', reportError)
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in chat report route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
