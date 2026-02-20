'use client'

import { useState, useRef, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { MoreVertical, UserPlus, UserCheck, Flag } from 'lucide-react'

const REPORT_REASONS = [
  'Spam',
  'Hate Speech',
  'Harassment',
  'Misinformation',
  'Inappropriate Content',
  'Other',
]

interface FeedDiscoverGridActionsMenuProps {
  gridId: string
  authorId: string | null
}

export function FeedDiscoverGridActionsMenu({ gridId, authorId }: FeedDiscoverGridActionsMenuProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [reportOtherText, setReportOtherText] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowingLoading, setIsFollowingLoading] = useState(false)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null)
    })
  }, [supabase.auth])

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const isOwner = !!currentUserId && !!authorId && currentUserId === authorId
  const showFollow = !isOwner && !!authorId && !!currentUserId

  async function handleFollow() {
    if (!currentUserId || !authorId) return
    setIsFollowingLoading(true)
    const { error } = await supabase.from('follows').insert({
      follower_id: currentUserId,
      following_id: authorId,
    })
    setIsFollowingLoading(false)
    setMenuOpen(false)
    if (error) {
      console.error('Error following:', error)
      return
    }
    setIsFollowing(true)
    router.refresh()
  }

  async function handleSubmitReport() {
    const reason = selectedReason === 'Other' ? reportOtherText.trim() : selectedReason
    if (!reason) return
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setIsSubmittingReport(true)
    const { error } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      target_id: gridId,
      target_type: 'grid',
      reason,
    })
    setIsSubmittingReport(false)
    setReportModalOpen(false)
    setMenuOpen(false)
    setSelectedReason('')
    setReportOtherText('')
    if (error) {
      if (error.code === '23505') {
        alert("Thank you for reporting. We'll review this content.")
      } else {
        console.error('Error submitting report:', error)
        alert('Failed to submit report. Please try again.')
      }
      return
    }
    alert("Thank you for reporting. We'll review this content.")
  }

  if (!currentUserId) return null

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="rounded p-0.5 text-white/70 transition-colors hover:text-white"
        aria-label="Grid actions"
        aria-expanded={menuOpen}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {menuOpen && (
        <div
          className="absolute right-full top-0 z-50 mr-1 min-w-[140px] rounded-lg border border-white/10 bg-[#1D1D1D] py-1 shadow-xl"
          role="menu"
        >
          {showFollow && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
              onClick={handleFollow}
              disabled={isFollowingLoading || isFollowing}
            >
              {isFollowing ? (
                <UserCheck className="h-4 w-4 shrink-0" />
              ) : (
                <UserPlus className="h-4 w-4 shrink-0" />
              )}
              {isFollowingLoading ? 'Following...' : isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          {!isOwner && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
              onClick={() => {
                setMenuOpen(false)
                setReportModalOpen(true)
              }}
            >
              <Flag className="h-4 w-4 shrink-0" />
              Report
            </button>
          )}
        </div>
      )}

      {reportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-[#1D1D1D] p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-white">Report Content</h3>
            <p className="mb-4 text-sm text-white/80">
              Please select a reason for reporting this content.
            </p>
            <div className="mb-4 space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-white/20 p-2 transition-colors hover:bg-white/10"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-white/90">{r}</span>
                </label>
              ))}
            </div>
            {selectedReason === 'Other' && (
              <textarea
                value={reportOtherText}
                onChange={(e) => setReportOtherText(e.target.value)}
                placeholder="Please provide details..."
                rows={3}
                className="mb-4 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
              />
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setReportModalOpen(false)
                  setSelectedReason('')
                  setReportOtherText('')
                }}
                className="rounded-md px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={
                  isSubmittingReport ||
                  !selectedReason ||
                  (selectedReason === 'Other' && !reportOtherText.trim())
                }
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
