'use client'

import { useState, FormEvent } from 'react'
import { X } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1D1D1D] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create a poll</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-white/90">Question</label>
            <input
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
              placeholder="What do you want to ask?"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/90">Options (2-4)</label>
              <button
                type="button"
                onClick={addOption}
                disabled={options.length >= 4}
                className="text-sm font-semibold text-[#25B4B1] disabled:opacity-50"
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
                    className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
                    placeholder={`Option ${idx + 1}`}
                  />
                  {options.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="text-xs font-semibold text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90">Expiration (optional)</label>
            <input
              type="datetime-local"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
            />
            <p className="mt-1 text-xs text-white/60">
              Poll appears immediately under Community Podiums.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#25B4B1] px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-[#25B4B1]/90 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Create poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
