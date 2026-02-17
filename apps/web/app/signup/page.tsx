'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
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

  async function handleOAuth(provider: 'google' | 'apple' | 'facebook') {
    if (!redirectUrl) return
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
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
        <p className="text-center text-xs text-white/50">
          If you see &quot;too many requests&quot;, wait a minute and try again.
        </p>
        <button
          type="button"
          onClick={() => (window.location.href = '/api/auth/tiktok')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          aria-label="Sign up with TikTok"
        >
          <img src="/icons/tiktok.svg" alt="TikTok" className="h-5 w-5" />
          <span>Sign up with TikTok</span>
        </button>
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
          onClick={() => alert('Coming Soon!')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/50 transition-colors opacity-60 cursor-not-allowed"
          aria-label="Sign up with Apple (coming soon)"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          <span>Sign up with Apple</span>
        </button>
        <button
          type="button"
          onClick={() => alert('Coming Soon!')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/50 transition-colors opacity-60 cursor-not-allowed"
          aria-label="Sign up with Instagram (coming soon)"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          <span>Sign up with Instagram</span>
        </button>
        <p className="text-center text-sm text-white/70">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#25B4B1] hover:text-[#25B4B1]/90">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
