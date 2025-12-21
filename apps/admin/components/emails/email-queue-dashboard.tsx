'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Mail, CheckCircle, XCircle, Clock, RefreshCw, Eye } from 'lucide-react'

interface EmailQueueDashboardProps {
  pendingCount: number
  sentCount: number
  failedCount: number
  recentEmails: Array<{
    id: string
    email_type: string
    recipient_email: string
    subject: string
    status: string
    attempts: number
    sent_at: string | null
    error_message: string | null
    created_at: string
  }>
}

export function EmailQueueDashboard({
  pendingCount,
  sentCount,
  failedCount,
  recentEmails,
}: EmailQueueDashboardProps) {
  const supabase = createClientComponentClient()
  const [retrying, setRetrying] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<any>(null)

  async function handleRetry(emailId: string) {
    setRetrying(emailId)
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({ status: 'pending', attempts: 0, error_message: null })
        .eq('id', emailId)

      if (error) throw error

      window.location.reload()
    } catch (error: any) {
      console.error('Failed to retry email:', error)
      alert(`Failed to retry: ${error.message}`)
    } finally {
      setRetrying(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-gray-900">{sentCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <div className="flex items-center space-x-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{failedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Emails Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Emails</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentEmails.map((email) => (
                <tr key={email.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {email.email_type}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {email.recipient_email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{email.subject}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        email.status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : email.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {email.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {email.attempts}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(email.created_at).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {email.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(email.id)}
                        disabled={retrying === email.id}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        {retrying === email.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedEmail(email)}
                      className="ml-2 text-gray-600 hover:text-gray-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Email Details</h3>
            <div className="space-y-2">
              <p>
                <strong>Type:</strong> {selectedEmail.email_type}
              </p>
              <p>
                <strong>Recipient:</strong> {selectedEmail.recipient_email}
              </p>
              <p>
                <strong>Subject:</strong> {selectedEmail.subject}
              </p>
              <p>
                <strong>Status:</strong> {selectedEmail.status}
              </p>
              <p>
                <strong>Attempts:</strong> {selectedEmail.attempts}
              </p>
              {selectedEmail.error_message && (
                <p>
                  <strong>Error:</strong> {selectedEmail.error_message}
                </p>
              )}
              {selectedEmail.sent_at && (
                <p>
                  <strong>Sent At:</strong> {new Date(selectedEmail.sent_at).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedEmail(null)}
              className="mt-4 rounded-md bg-gray-200 px-4 py-2 text-gray-900 hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

