import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import crypto from 'crypto'

export const runtime = 'nodejs'

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/'
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
const TIKTOK_USERINFO_URL = 'https://open.tiktokapis.com/v2/user/info/'

// Required env (sandbox): TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')

  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  const redirectUri =
    process.env.TIKTOK_REDIRECT_URI || `${requestUrl.origin}/api/auth/tiktok/callback`

  if (!clientKey || !clientSecret) {
    return NextResponse.redirect(
      new URL('/login?error=tiktok_config_missing', requestUrl.origin).toString()
    )
  }

  // Step 1: start OAuth
  if (!code) {
    const oauthState = crypto.randomUUID()
    const authorizeUrl = new URL(TIKTOK_AUTH_URL)
    authorizeUrl.searchParams.set('client_key', clientKey)
    authorizeUrl.searchParams.set('response_type', 'code')
    authorizeUrl.searchParams.set('scope', 'user.info.basic')
    authorizeUrl.searchParams.set('redirect_uri', redirectUri)
    authorizeUrl.searchParams.set('state', oauthState)

    const response = NextResponse.redirect(authorizeUrl.toString())
    response.cookies.set('tiktok_oauth_state', oauthState, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/auth/tiktok',
      maxAge: 60 * 5,
    })
    return response
  }

  // Step 2: handle callback
  const cookieStore = await cookies()
  const storedState = cookieStore.get('tiktok_oauth_state')?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      new URL('/login?error=tiktok_state_mismatch', requestUrl.origin).toString()
    )
  }

  // Exchange code for access token
  const tokenParams = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  })

  const tokenResponse = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
  })

  const tokenJson = await tokenResponse.json()

  if (!tokenResponse.ok || !tokenJson?.data?.access_token || !tokenJson?.data?.open_id) {
    return NextResponse.redirect(
      new URL('/login?error=tiktok_token', requestUrl.origin).toString()
    )
  }

  const accessToken: string = tokenJson.data.access_token
  const openId: string = tokenJson.data.open_id

  // Fetch basic profile
  let displayName: string | null = null
  let avatarUrl: string | null = null
  try {
    const profileResponse = await fetch(TIKTOK_USERINFO_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: openId,
        fields: ['open_id', 'display_name', 'avatar_url'],
      }),
    })
    const profileJson = await profileResponse.json()
    displayName = profileJson?.data?.user?.display_name || null
    avatarUrl = profileJson?.data?.user?.avatar_url || null
  } catch (error) {
    console.error('TikTok profile fetch failed:', error)
  }

  // Create or sign in Supabase user
  const cookieAdapter = await cookies()
  const supabase = createRouteHandlerClient(
    { cookies: () => cookieAdapter as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SECRET_KEY,
    }
  )

  const email = `tiktok_${openId}@tiktok.local`
  const password = `tiktok-${openId}-${clientSecret}`

  // Upsert auth user
  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      provider: 'tiktok',
      tiktok_open_id: openId,
      tiktok_display_name: displayName,
      tiktok_avatar_url: avatarUrl,
    },
  })

  if (createError && createError.status !== 422) {
    console.error('TikTok createUser error:', createError)
    return NextResponse.redirect(
      new URL('/login?error=tiktok_create_user', requestUrl.origin).toString()
    )
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !signInData.session) {
    console.error('TikTok sign-in error:', signInError)
    return NextResponse.redirect(
      new URL('/login?error=tiktok_signin', requestUrl.origin).toString()
    )
  }

  const userId = signInData.user?.id
  let hasUsername = false
  if (userId) {
    // Ensure profile row exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle()

    hasUsername = Boolean(existingProfile?.username)

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: userId,
        email,
        username: null,
        profile_image_url: avatarUrl,
      })
    } else if (!existingProfile.username && avatarUrl) {
      await supabase
        .from('profiles')
        .update({ profile_image_url: avatarUrl })
        .eq('id', userId)
    }
  }

  // Clear state cookie
  const response = NextResponse.redirect(
    new URL(hasUsername ? '/feed' : '/onboarding', requestUrl.origin)
  )
  response.cookies.delete('tiktok_oauth_state')
  return response
}
