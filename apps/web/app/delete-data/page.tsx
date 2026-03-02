'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Mail } from 'lucide-react'

export default function DeleteDataPage() {
  const supabase = createClientComponentClient()
  const [prefill, setPrefill] = useState({ name: '', username: '', email: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const meta = session.user.user_metadata as Record<string, unknown>
        const name =
          (typeof meta?.full_name === 'string' && meta.full_name) ||
          (typeof meta?.name === 'string' && meta.name) ||
          ''
        const email = session.user.email || ''

        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single()

        const username = (profile?.username as string) || ''

        setPrefill({ name, username, email })
      }
      setLoading(false)
    }

    loadUserData()
  }, [])

  const bodyLines = [
    'Name: ' + prefill.name,
    'Username: ' + prefill.username,
    'Email Address: ' + prefill.email,
  ]
  const body = bodyLines.join('\n')
  const mailto = `mailto:team@whosonpole.org?subject=${encodeURIComponent('Delete This Account')}&body=${encodeURIComponent(body)}`

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-white">Delete Your Data</h1>
      <p className="mb-8 text-white/80">
        To request deletion of your account and associated data, please email our team. We will
        process your request in accordance with our Privacy Policy.
      </p>

      <div className="rounded-xl border border-white/20 bg-white/5 p-6">
        <p className="mb-6 text-white/90">
          Click the button below to open your default email client with a pre-filled message. If you
          are logged in, your account details will be included. Otherwise, please fill in your
          information before sending.
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25B4B1] border-t-transparent" />
          </div>
        ) : (
          <a
            href={mailto}
            className="inline-flex items-center gap-2 rounded-lg bg-[#25B4B1] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#25B4B1]/90"
          >
            <Mail className="h-5 w-5" />
            Email to Request Account Deletion
          </a>
        )}
      </div>

      <p className="mt-6 text-sm text-white/60">
        Emails are sent to{' '}
        <a href="mailto:team@whosonpole.org" className="text-[#25B4B1] hover:underline">
          team@whosonpole.org
        </a>
        . We typically respond within a few business days.
      </p>
    </div>
  )
}
