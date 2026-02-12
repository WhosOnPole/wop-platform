'use client'

import { useState, useRef, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { MoreVertical, Pencil, Trash2, Flag } from 'lucide-react'

const REPORT_REASONS = [
  'Spam',
  'Hate Speech',
  'Harassment',
  'Misinformation',
  'Inappropriate Content',
  'Other',
]

export type CommentTargetType = 'comment' | 'grid_slot_comment'

interface CommentActionsMenuProps {
  commentId: string
  commentAuthorId: string | null
  currentUserId: string | null
  targetType: CommentTargetType
  variant?: 'light' | 'dark'
  /** Used when edit is shown (post comments or grid slot comments) */
  initialContent?: string
  onDeleted?: (commentId: string) => void
  onEdited?: (commentId: string, newContent: string) => void
}

export function CommentActionsMenu({
  commentId,
  commentAuthorId,
  currentUserId,
  targetType,
  variant = 'light',
  initialContent = '',
  onDeleted,
  onEdited,
}: CommentActionsMenuProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editContent, setEditContent] = useState(initialContent)
  const [selectedReason, setSelectedReason] = useState('')
  const [reportOtherText, setReportOtherText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  const isOwner = !!currentUserId && !!commentAuthorId && currentUserId === commentAuthorId
  const showEdit =
    isOwner && typeof onEdited === 'function' && (targetType === 'comment' || targetType === 'grid_slot_comment')

  useEffect(() => {
    setEditContent(initialContent)
  }, [initialContent, editOpen])

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const table = targetType === 'comment' ? 'comments' : 'grid_slot_comments'
  const isDark = variant === 'dark'

  async function handleDelete() {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    setIsDeleting(true)
    const { error } = await supabase.from(table).delete().eq('id', commentId)
    setIsDeleting(false)
    setMenuOpen(false)
    if (error) {
      console.error('Error deleting comment:', error)
      return
    }
    onDeleted?.(commentId)
  }

  async function handleSaveEdit() {
    if (!editContent.trim()) return
    setIsSavingEdit(true)
    const { error } = await supabase
      .from(table)
      .update({ content: editContent.trim() })
      .eq('id', commentId)
    setIsSavingEdit(false)
    setEditOpen(false)
    setMenuOpen(false)
    if (error) {
      console.error('Error updating comment:', error)
      return
    }
    onEdited?.(commentId, editContent.trim())
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
    const reportTargetType = targetType === 'comment' ? 'comment' : 'grid_slot_comment'
    const { error } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      target_id: commentId,
      target_type: reportTargetType,
      reason: reason,
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

  const buttonClass = isDark
    ? 'text-white/70 hover:text-white p-0.5 rounded'
    : 'text-gray-500 hover:text-gray-800 p-0.5 rounded'
  const menuClass = isDark
    ? 'bg-[#1D1D1D] border border-white/10 shadow-xl rounded-lg py-1 min-w-[140px]'
    : 'bg-white border border-gray-200 shadow-lg rounded-lg py-1 min-w-[140px]'
  const itemClass = isDark
    ? 'flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-white/90 hover:bg-white/10'
    : 'flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50'

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className={buttonClass}
        aria-label="Comment actions"
        aria-expanded={menuOpen}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {menuOpen && (
        <div
          className={`absolute right-full top-0 z-50 mr-1 ${menuClass}`}
          role="menu"
        >
          {isOwner && (
            <>
              {showEdit && (
                <button
                  type="button"
                  role="menuitem"
                  className={itemClass}
                  onClick={() => {
                    setMenuOpen(false)
                    setEditOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4 shrink-0" />
                  Edit
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                className={itemClass}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
          {!isOwner && (
            <button
              type="button"
              role="menuitem"
              className={itemClass}
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

      {/* Edit inline */}
      {editOpen && (
        <div className="mt-2 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={2}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              isDark
                ? 'border-white/20 bg-white/10 text-white placeholder:text-white/50'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
            placeholder="Edit comment..."
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className={isDark ? 'text-sm text-white/80 hover:text-white' : 'text-sm text-gray-600 hover:text-gray-900'}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !editContent.trim()}
              className={isDark ? 'text-sm text-[#25B4B1] hover:underline disabled:opacity-50' : 'text-sm text-blue-600 hover:underline disabled:opacity-50'}
            >
              {isSavingEdit ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Report modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md rounded-lg p-6 shadow-xl ${isDark ? 'bg-[#1D1D1D]' : 'bg-white'}`}>
            <h3 className={`mb-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Report Content
            </h3>
            <p className={`mb-4 text-sm ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
              Please select a reason for reporting this content.
            </p>
            <div className="mb-4 space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 ${
                    isDark ? 'border-white/20 hover:bg-white/10' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className={isDark ? 'text-sm text-white/90' : 'text-sm text-gray-700'}>{r}</span>
                </label>
              ))}
            </div>
            {selectedReason === 'Other' && (
              <textarea
                value={reportOtherText}
                onChange={(e) => setReportOtherText(e.target.value)}
                placeholder="Please provide details..."
                rows={3}
                className={`mb-4 w-full rounded-md border px-3 py-2 text-sm ${
                  isDark ? 'border-white/20 bg-white/10 text-white' : 'border-gray-300 text-gray-900'
                }`}
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
                className={isDark ? 'rounded-md px-4 py-2 text-sm text-white/90 hover:bg-white/10' : 'rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'}
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
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
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
