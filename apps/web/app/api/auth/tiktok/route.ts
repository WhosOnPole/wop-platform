import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import crypto from 'crypto'

export const runtime = 'nodejs'

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/'
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
const TIKTOK_USERINFO_URL = 'https://open.tiktokapis.com/v2/user/info/'

// Required env (sandbox): TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI

interface TikTokStatePayload {
  codeVerifier: string
  createdAt: number
  nonce: string
}

function encryptTikTokState(payload: TikTokStatePayload, clientSecret: string) {
  const key = crypto.createHash('sha256').update(clientSecret).digest() // 32 bytes
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(Buffer.from('tiktok_oauth_state_v1'))
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8')
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ciphertext]).toString('base64url')
}

function decryptTikTokState(state: string, clientSecret: string): TikTokStatePayload | null {
  try {
    const key = crypto.createHash('sha256').update(clientSecret).digest()
    const raw = Buffer.from(state, 'base64url')
    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const ciphertext = raw.subarray(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAAD(Buffer.from('tiktok_oauth_state_v1'))
    decipher.setAuthTag(tag)
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
    const parsed = JSON.parse(plaintext) as TikTokStatePayload
    if (
      !parsed ||
      typeof parsed.codeVerifier !== 'string' ||
      typeof parsed.createdAt !== 'number' ||
      typeof parsed.nonce !== 'string'
    )
      return null
    return parsed
  } catch {
    return null
  }
}

function normalizeUsername(input: string) {
  const normalized = input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50)

  return normalized
}

async function findAvailableUsername(args: {
  supabase: ReturnType<typeof createRouteHandlerClient>
  base: string
}) {
  const base = args.base.slice(0, 42) || 'user'

  // Try base then a few suffixes
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = attempt === 0 ? '' : `_${Math.floor(Math.random() * 9000) + 1000}`
    const candidate = `${base}${suffix}`.slice(0, 50)

    const { data: existing } = await args.supabase
      .from('profiles')
      .select('id')
      .eq('username', candidate)
      .maybeSingle()

    if (!existing) return candidate
  }

  // last resort
  return `user_${crypto.randomBytes(4).toString('hex')}`.slice(0, 50)
}

function getSupabaseKeyKind(key: string) {
  if (key.startsWith('sb_publishable_')) return 'publishable'
  if (key.startsWith('sb_secret_')) return 'secret'
  if (key.split('.').length === 3) return 'jwt'
  return 'unknown'
}

function getJwtRole(jwt: string) {
  try {
    const payload = jwt.split('.')[1]
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof json?.role === 'string' ? json.role : null
  } catch {
    return null
  }
}

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
    const codeVerifier = crypto.randomBytes(64).toString('base64url')
    // TikTok docs require hex(SHA256(code_verifier)) for code_challenge
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('hex')
    const encryptedState = encryptTikTokState(
      { codeVerifier, createdAt: Date.now(), nonce: crypto.randomUUID() },
      clientSecret
    )

    const authorizeUrl = new URL(TIKTOK_AUTH_URL)
    authorizeUrl.searchParams.set('client_key', clientKey)
    authorizeUrl.searchParams.set('response_type', 'code')
    authorizeUrl.searchParams.set('scope', 'user.info.basic')
    authorizeUrl.searchParams.set('redirect_uri', redirectUri)
    authorizeUrl.searchParams.set('state', encryptedState)
    authorizeUrl.searchParams.set('code_challenge', codeChallenge)
    authorizeUrl.searchParams.set('code_challenge_method', 'S256')

    return NextResponse.redirect(authorizeUrl.toString())
  }

  // Step 2: handle callback
  if (!state) {
    console.error('TikTok OAuth state missing from callback', {
      hasCookieState: false,
    })
    const redirectUrl = new URL('/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', 'tiktok_state_mismatch')
    redirectUrl.searchParams.set('reason', 'missing_state_param')
    return NextResponse.redirect(redirectUrl.toString())
  }

  const statePayload = decryptTikTokState(state, clientSecret)
  if (!statePayload) {
    console.error('TikTok OAuth state invalid (decrypt/parse failed)')
    const redirectUrl = new URL('/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', 'tiktok_state_mismatch')
    redirectUrl.searchParams.set('reason', 'invalid_state')
    return NextResponse.redirect(redirectUrl.toString())
  }

  const maxAgeMs = 5 * 60 * 1000
  if (Date.now() - statePayload.createdAt > maxAgeMs) {
    console.error('TikTok OAuth state expired', {
      createdAt: statePayload.createdAt,
    })
    const redirectUrl = new URL('/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', 'tiktok_state_mismatch')
    redirectUrl.searchParams.set('reason', 'state_expired')
    return NextResponse.redirect(redirectUrl.toString())
  }

  // Exchange code for access token
  const tokenParams = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code_verifier: statePayload.codeVerifier,
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
  const supabaseServiceKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    console.error('Supabase service role key missing for TikTok auth', {
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      hasSupabaseSecretKey: Boolean(process.env.SUPABASE_SECRET_KEY),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    })

    const redirectUrl = new URL('/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', 'supabase_config_missing')
    return NextResponse.redirect(redirectUrl.toString())
  }

  const supabaseKeyKind = getSupabaseKeyKind(supabaseServiceKey)
  const supabaseJwtRole = supabaseKeyKind === 'jwt' ? getJwtRole(supabaseServiceKey) : null

  // The admin API requires a service-role key. If Vercel is configured with a publishable/anon key,
  // GoTrue can respond with generic "unexpected_failure" errors.
  const isServiceRole =
    supabaseKeyKind === 'secret' || (supabaseKeyKind === 'jwt' && supabaseJwtRole === 'service_role')

  if (!isServiceRole) {
    console.error('Invalid Supabase key for admin createUser in TikTok auth', {
      supabaseKeyKind,
      supabaseJwtRole,
    })
    const redirectUrl = new URL('/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', 'supabase_service_key_invalid')
    redirectUrl.searchParams.set('kind', supabaseKeyKind)
    if (supabaseJwtRole) redirectUrl.searchParams.set('role', supabaseJwtRole)
    return NextResponse.redirect(redirectUrl.toString())
  }

  const supabase = createRouteHandlerClient(
    { cookies: () => cookieAdapter as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: supabaseServiceKey,
    }
  )

  // Build a suggested username from TikTok display name (fallback to open_id prefix)
  const suggestedBaseRaw = displayName || `tiktok_${openIdFinal.slice(0, 8)}`
  const suggestedBase = normalizeUsername(suggestedBaseRaw)
  const preferredUsername = suggestedBase || `tiktok_${openIdFinal.slice(0, 8)}`

  const availableUsername = await findAvailableUsername({
    supabase,
    base: preferredUsername,
  })

  // Use a real-looking domain to avoid any edge-case email validators rejecting `.local`
  const email = `tiktok_${openIdFinal}@tiktok.whosonpole.org`
  // Stable deterministic password (no raw secrets in the string)
  const passwordHash = crypto
    .createHash('sha256')
    .update(`${openIdFinal}:${clientSecret}`)
    .digest('hex')
  const password = `tiktok-${passwordHash}`

  // Upsert auth user
  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      provider: 'tiktok',
      tiktok_open_id: openIdFinal,
      tiktok_display_name: displayName,
      tiktok_avatar_url: avatarUrl,
      preferred_username: availableUsername,
    },
  })

  if (createError && createError.status !== 422) {
    console.error('TikTok createUser error:', {
      status: createError.status,
      name: (createError as any).name,
      code: (createError as any).code,
      message: createError.message,
    })
    const redirectUrl = new URL('/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', 'tiktok_create_user')
    if (createError.status) redirectUrl.searchParams.set('status', String(createError.status))
    // Avoid leaking full message in URL; keep details in logs
    if ((createError as any).code) redirectUrl.searchParams.set('code', String((createError as any).code))
    return NextResponse.redirect(redirectUrl.toString())
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !signInData.session) {
    console.error('TikTok sign-in error:', signInError)
    const redirectUrl = new URL('/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', 'tiktok_signin')
    if (signInError?.status) redirectUrl.searchParams.set('status', String(signInError.status))
    if ((signInError as any)?.code) redirectUrl.searchParams.set('code', String((signInError as any).code))
    return NextResponse.redirect(redirectUrl.toString())
  }

  const userId = signInData.user?.id
  let hasUsername = false
  let hasDobOrAge = false
  if (userId) {
    // Ensure auth metadata has a preferred_username (useful for future providers too)
    try {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          provider: 'tiktok',
          tiktok_open_id: openIdFinal,
          tiktok_display_name: displayName,
          tiktok_avatar_url: avatarUrl,
          preferred_username: availableUsername,
        },
      })
    } catch (error) {
      console.error('TikTok updateUserById failed (non-fatal):', error)
    }

    // Ensure profile row exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, username, date_of_birth, age')
      .eq('id', userId)
      .maybeSingle()

    hasUsername = Boolean(existingProfile?.username)
    hasDobOrAge = Boolean(existingProfile?.date_of_birth || existingProfile?.age)

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: userId,
        email,
        username: availableUsername,
        profile_image_url: avatarUrl,
      })
      hasUsername = true
    } else if (!existingProfile.username) {
      await supabase
        .from('profiles')
        .update({ username: availableUsername, profile_image_url: avatarUrl })
        .eq('id', userId)
      hasUsername = true
    } else if (avatarUrl) {
      await supabase.from('profiles').update({ profile_image_url: avatarUrl }).eq('id', userId)
    }
  }

  // Onboarding is only required when required profile fields are missing.
  // A completed profile requires: username + dob/age.
  const isProfileComplete = Boolean(hasUsername && hasDobOrAge)
  return NextResponse.redirect(new URL(isProfileComplete ? '/feed' : '/onboarding', requestUrl.origin))
}
