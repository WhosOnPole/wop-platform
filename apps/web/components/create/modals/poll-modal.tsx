'use client'

import { useState, FormEvent } from 'react'

interface PollModalProps {
  onClose: () => void
}

interface PollOption {
  id: string
  value: string
}

export function PollModal({ onClose }: PollModalProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<PollOption[]>([
    { id: 'opt-1', value: '' },
    { id: 'opt-2', value: '' },
  ])
  const [expiration, setExpiration] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateOption(id: string, value: string) {
    setOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, value } : opt)))
  }

  function addOption() {
    if (options.length >= 4) return
    setOptions((prev) => [...prev, { id: `opt-${prev.length + 1}`, value: '' }])
  }

  function removeOption(id: string) {
    if (options.length <= 2) return
    setOptions((prev) => prev.filter((opt) => opt.id !== id))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    const filledOptions = options.map((o) => o.value).filter((v) => v.trim() !== '')
    console.info('Create poll (stub):', { question, options: filledOptions, expiration })
    // TODO: call API to create poll (community podium) immediately visible; no admin approval
    setQuestion('')
    setOptions([
      { id: 'opt-1', value: '' },
      { id: 'opt-2', value: '' },
    ])
    setExpiration('')
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create a poll</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">
            Close
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Question</label>
            <input
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="What do you want to ask?"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Options (2-4)</label>
              <button
                type="button"
                onClick={addOption}
                disabled={options.length >= 4}
                className="text-sm font-semibold text-blue-600 disabled:opacity-50"
              >
                Add option
              </button>
            </div>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    required
                    value={opt.value}
                    onChange={(e) => updateOption(opt.id, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder={`Option ${idx + 1}`}
                  />
                  {options.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Expiration (optional)</label>
            <input
              type="datetime-local"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">Poll appears immediately under Community Podiums.</p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Create poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
