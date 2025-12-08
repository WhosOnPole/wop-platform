'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)

  const code = searchParams.get('code')

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true)
      }
    })

    const setupPasswordRecovery = async () => {
      // Check if we have a code in URL
      if (code) {
        // Exchange code for session
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setError('Invalid or expired reset token. Please request a new password reset link.')
            return
          }
          setIsRecoveryMode(true)
        } catch (err) {
          setError('An error occurred. Please request a new password reset link.')
        }
      } else {
        // No code in URL - check if we have a recovery session already
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Check if this is a password recovery session
          // Recovery sessions typically have the user but limited permissions
          // We can detect this by checking if we can't access certain resources
          // For now, if there's a session and no code, assume it might be recovery
          // and let the user try to reset (the updateUser will fail if not recovery)
          setIsRecoveryMode(true)
        } else {
          setError('Invalid or missing reset token. Please request a new password reset link.')
        }
      }
    }

    setupPasswordRecovery()

    return () => {
      subscription.unsubscribe()
    }
  }, [code, supabase])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(pwd)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    const validationError = validatePassword(password)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || 'Failed to update password. Please try again.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!code) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-center text-sm text-red-600">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            <div className="mt-4 text-center">
              <a
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Return to login
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-green-600">
              Password Updated!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your password has been successfully updated. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Enter new password"
                disabled={loading || !isRecoveryMode}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, and a number
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Confirm new password"
                disabled={loading || !isRecoveryMode}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isRecoveryMode}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Back to login
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

