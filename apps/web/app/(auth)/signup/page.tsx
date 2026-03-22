'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { toast } from 'sonner'
import Link from 'next/link'

export default function SignupPage() {
  const supabase = createClientComponentClient()
  const [redirectUrl, setRedirectUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRedirectUrl(`${window.location.origin}/auth/callback`)
    }
  }, [])

  async function handleOAuth(provider: 'google' | 'apple') {
    if (!redirectUrl) return
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-sm">
        <div>
          <h2 className="text-center font-display text-3xl font-normal tracking-tight text-white">
            Join Who&apos;s on Pole?
          </h2>
          <p className="mt-2 text-center text-sm text-white/70">
            Create your account to get started
          </p>
        </div>
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4" role="alert">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <a
          href="/api/auth/tiktok"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          aria-label="Sign up with TikTok"
        >
          <img src="/icons/tiktok.svg" alt="TikTok" className="h-5 w-5" />
          <span>Sign up with TikTok</span>
        </a>
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          aria-label="Sign up with Google"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Sign up with Google</span>
        </button>
        <button
          type="button"
          onClick={() => toast.info('Coming Soon!')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/50 transition-colors opacity-60 cursor-not-allowed"
          aria-label="Sign up with Apple (coming soon)"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          <span>Sign up with Apple</span>
        </button>
        
        <p className="text-center text-sm text-white/70">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#25B4B1] hover:text-[#25B4B1]/90">
            Sign in
          </Link>
        </p>
      </div>
      <p className="mt-6 max-w-md text-center text-xs text-white/50 leading-relaxed">
        This platform is an independent, community-supported fan site and is not affiliated with, endorsed by, sponsored by, or officially connected to Formula 1®, any Formula 1 teams, drivers, sponsors, or affiliated organizations. All trademarks and related intellectual property are the property of their respective owners.
      </p>
    </div>
  )
}
