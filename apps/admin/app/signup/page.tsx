'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminSignupPage() {
  const router = useRouter()
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })
  const [redirectUrl, setRedirectUrl] = useState<string>('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL
    const baseUrl = envUrl && envUrl.trim().length > 0 ? envUrl : window.location.origin
    setRedirectUrl(`${baseUrl.replace(/\/$/, '')}/auth/callback`)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase
          .from('profiles')
          .select('role, email')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
            const isAdminRole = profile?.role === 'admin'
            if (isAdminEmail || isAdminRole) {
              router.push('/dashboard')
            }
          })
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('id', session.user.id)
          .maybeSingle()

        const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
        const isAdminRole = profile?.role === 'admin'

        if (isAdminEmail || isAdminRole) {
          router.push('/dashboard')
        } else {
          const mainSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
            (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://www.whosonpole.org')
          window.location.href = mainSiteUrl
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-[#0B0B0B] p-8 shadow-xl">
        <div>
          <div className="flex justify-center">
            <Image
              src="/images/logo_white.svg"
              alt="Who's on Pole?"
              width={160}
              height={64}
              priority
              className="h-8 w-auto"
            />
          </div>
          <h2 className="mt-6 text-center text-2xl font-semibold tracking-tight text-white">
            Admin Sign Up
          </h2>
          <p className="mt-2 text-center text-sm text-white/70">
            Create an admin account to access the dashboard
          </p>
        </div>
        {redirectUrl && (
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#25B4B1',
                    brandAccent: '#1e9e9b',
                    inputBackground: '#0B0B0B',
                    inputBorder: '#1f1f1f',
                    inputBorderFocus: '#25B4B1',
                    inputText: '#ffffff',
                    inputPlaceholder: '#6b7280',
                    anchorTextColor: '#e5e7eb',
                    messageText: '#d1d5db',
                    messageTextDanger: '#fca5a5',
                  },
                },
              },
            }}
            providers={['google', 'apple']}
            redirectTo={redirectUrl}
            view="sign_up"
            onlyThirdPartyProviders={false}
          />
        )}
        <p className="text-center text-sm text-white/70">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#25B4B1] hover:text-[#3BEFEB]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
