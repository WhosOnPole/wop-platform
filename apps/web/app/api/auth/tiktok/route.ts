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

  // Enhanced error logging for debugging
  if (!clientKey || !clientSecret) {
    console.error('TikTok OAuth config missing:', {
      hasClientKey: !!clientKey,
      hasClientSecret: !!clientSecret,
      redirectUri,
      envKeys: Object.keys(process.env).filter((k) => k.includes('TIKTOK')),
    })
    return NextResponse.redirect(
      new URL('/login?error=tiktok_config_missing', requestUrl.origin).toString()
    )
  }

  // Step 1: start OAuth
  if (!code) {
    const oauthState = crypto.randomUUID()
    const codeVerifier = crypto.randomBytes(64).toString('base64url')
    // TikTok docs require hex(SHA256(code_verifier)) for code_challenge
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('hex')

    const authorizeUrl = new URL(TIKTOK_AUTH_URL)
    authorizeUrl.searchParams.set('client_key', clientKey)
    authorizeUrl.searchParams.set('response_type', 'code')
    authorizeUrl.searchParams.set('scope', 'user.info.basic')
    authorizeUrl.searchParams.set('redirect_uri', redirectUri)
    authorizeUrl.searchParams.set('state', oauthState)
    authorizeUrl.searchParams.set('code_challenge', codeChallenge)
    authorizeUrl.searchParams.set('code_challenge_method', 'S256')

    const response = NextResponse.redirect(authorizeUrl.toString())
    response.cookies.set('tiktok_oauth_state', oauthState, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/auth/tiktok',
      maxAge: 60 * 5,
    })
    response.cookies.set('tiktok_code_verifier', codeVerifier, {
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
  const storedCodeVerifier = cookieStore.get('tiktok_code_verifier')?.value

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      new URL('/login?error=tiktok_state_mismatch', requestUrl.origin).toString()
    )
  }

  if (!storedCodeVerifier) {
    return NextResponse.redirect(
      new URL('/login?error=tiktok_pkce_missing', requestUrl.origin).toString()
    )
  }

  // Exchange code for access token
  const tokenParams = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code_verifier: storedCodeVerifier,
  })

  const tokenResponse = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
  })

  const tokenJson = await tokenResponse.json()

  const tokenData = tokenJson?.data ?? tokenJson
  const accessToken: string | undefined = tokenData?.access_token
  const openId: string | undefined = tokenData?.open_id ?? tokenData?.openId

  if (!tokenResponse.ok || !accessToken || !openId) {
    const logId =
      tokenJson?.log_id ?? tokenJson?.data?.log_id ?? tokenJson?.logId ?? tokenJson?.data?.logId
    const errorCode = tokenJson?.error_code ?? tokenJson?.data?.error_code
    const errorMessage = tokenJson?.message ?? tokenJson?.data?.message ?? tokenJson?.error

    console.error('TikTok token exchange failed', {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      redirectUri,
      hasAccessToken: Boolean(accessToken),
      hasOpenId: Boolean(openId),
      logId,
      errorCode,
      errorMessage,
    })

    const redirectUrl = new URL('/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', 'tiktok_token')
    redirectUrl.searchParams.set('status', String(tokenResponse.status))
    if (logId) redirectUrl.searchParams.set('log_id', String(logId))
    if (errorCode) redirectUrl.searchParams.set('code', String(errorCode))

    return NextResponse.redirect(redirectUrl.toString())
  }

  const accessTokenFinal = accessToken
  const openIdFinal = openId

  // Fetch basic profile
  let displayName: string | null = null
  let avatarUrl: string | null = null
  try {
    const profileResponse = await fetch(TIKTOK_USERINFO_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessTokenFinal}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: openIdFinal,
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

  // Clear state and code verifier cookies
  const response = NextResponse.redirect(
    new URL(hasUsername ? '/feed' : '/onboarding', requestUrl.origin)
  )
  response.cookies.delete('tiktok_oauth_state')
  response.cookies.delete('tiktok_code_verifier')
  return response
}
