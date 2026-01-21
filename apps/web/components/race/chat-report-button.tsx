'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'

interface ChatReportButtonProps {
  messageId: number
  onClose: () => void
}

export function ChatReportButton({ messageId, onClose }: ChatReportButtonProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reportReasons = [
    'Spam',
    'Hate Speech',
    'Harassment',
    'Misinformation',
    'Inappropriate Content',
    'Other',
  ]

  async function handleSubmitReport() {
    if (!selectedReason && !reason.trim()) return

    setIsSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const finalReason = selectedReason === 'Other' ? reason.trim() : selectedReason

    // Use the API route for reporting chat messages
    const response = await fetch('/api/chat/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageId,
        reason: finalReason,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error reporting:', error)
      alert('Failed to submit report. Please try again.')
    } else {
      alert("Thank you for reporting. We'll review this content.")
      onClose()
      setReason('')
      setSelectedReason('')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Report Message</h3>
        <p className="mb-4 text-sm text-gray-600">
          Please select a reason for reporting this message.
        </p>

        <div className="mb-4 space-y-2">
          {reportReasons.map((r) => (
            <label
              key={r}
              className="flex items-center space-x-2 rounded-md border border-gray-200 p-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name="reason"
                value={r}
                checked={selectedReason === r}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">{r}</span>
            </label>
          ))}
        </div>

        {selectedReason === 'Other' && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide details..."
            rows={3}
            className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
          />
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              onClose()
              setReason('')
              setSelectedReason('')
            }}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitReport}
            disabled={isSubmitting || (!selectedReason || (selectedReason === 'Other' && !reason.trim()))}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
