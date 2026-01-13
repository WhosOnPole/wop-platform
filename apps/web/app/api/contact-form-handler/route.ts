import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TABLE_NAME = 'waitlist_signups' // ensure this table exists in Supabase

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const email = (formData.get('email') ?? '').toString().trim()
    const honeypot = (formData.get('website') ?? '').toString().trim()

    if (!email) return NextResponse.json({ ok: false, error: 'Email is required' }, { status: 400 })

    // Honeypot: silently accept to avoid leaking signals to bots
    if (honeypot) return NextResponse.json({ ok: true })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const secretKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !secretKey) {
      console.error('Supabase env missing')
      return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error } = await supabase.from(TABLE_NAME).insert({ email })

    if (error) {
      // Treat duplicate emails as success to keep UX smooth
      if ((error as { code?: string }).code === '23505') {
        return NextResponse.json({ ok: true })
      }

      console.error('Supabase insert error', error)
      return NextResponse.json({ ok: false, error: 'Could not save' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
