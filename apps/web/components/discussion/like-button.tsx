'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'

interface LikeButtonProps {
  targetId: string
  targetType: 'post' | 'comment' | 'grid_slot_comment'
  initialLikeCount: number
  initialIsLiked: boolean
  onLikeChange?: (targetId: string, isLiked: boolean) => void
  variant?: 'light' | 'dark'
}

export function LikeButton({
  targetId,
  targetType,
  initialLikeCount,
  initialIsLiked,
  onLikeChange,
  variant = 'light',
}: LikeButtonProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)

  // Sync state with props when they change (e.g., on page refresh or when user changes)
  // Use targetId as key to ensure we reset when switching between different items
  useEffect(() => {
    setIsLiked(initialIsLiked)
    setLikeCount(initialLikeCount)
  }, [targetId, initialIsLiked, initialLikeCount])

  // Also sync when props change (for same targetId but different user session)
  useEffect(() => {
    if (isLiked !== initialIsLiked) {
      setIsLiked(initialIsLiked)
    }
    if (likeCount !== initialLikeCount) {
      setLikeCount(initialLikeCount)
    }
  }, [initialIsLiked, initialLikeCount])

  async function handleToggleLike() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    // Prevent double-clicks
    if (isLoading) return

    setIsLoading(true)

    // Optimistic update
    const previousLiked = isLiked
    const previousCount = likeCount

    if (isLiked) {
      // Optimistically update UI
      setIsLiked(false)
      setLikeCount((prev) => Math.max(0, prev - 1))

      // Unlike - delete the vote
      const { data: deletedVotes, error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', session.user.id)
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .select('id')

      if (error) {
        // Revert optimistic update on error
        console.error('Error unliking:', error)
        setIsLiked(previousLiked)
        setLikeCount(previousCount)
      } else {
        const deletedCount = Array.isArray(deletedVotes) ? deletedVotes.length : 0
        const wasDeleted = deletedCount > 0
        // If nothing was deleted, revert optimistic UI
        if (!wasDeleted) {
          setIsLiked(previousLiked)
          setLikeCount(previousCount)
        }
        // Refresh count from database after trigger updates it
        await refreshLikeCount({ allowDecrease: true })
        const userIsLiked = await refreshUserLikeState(session.user.id)
        onLikeChange?.(targetId, !!userIsLiked)
      }
    } else {
      // Optimistically update UI
      setIsLiked(true)
      setLikeCount((prev) => prev + 1)

      // Like - insert the vote
      const { error } = await supabase.from('votes').insert({
        user_id: session.user.id,
        target_id: targetId,
        target_type: targetType,
        value: 1,
      })

      if (error) {
        // Revert optimistic update on error
        if (error.code === '23505') {
          // Unique constraint violation - already liked (shouldn't happen, but handle it)
          console.warn('Already liked (duplicate)', error)
          // Don't revert - user already liked it
          await refreshLikeCount({ allowDecrease: false })
          const userIsLiked = await refreshUserLikeState(session.user.id)
          onLikeChange?.(targetId, !!userIsLiked)
        } else {
          console.error('Error liking:', error)
          setIsLiked(previousLiked)
          setLikeCount(previousCount)
        }
      } else {
        // Refresh count from database after trigger updates it (don't allow decrease so we don't flicker to 0 if DB is briefly stale)
        await refreshLikeCount({ allowDecrease: false })
        const userIsLiked = await refreshUserLikeState(session.user.id)
        onLikeChange?.(targetId, !!userIsLiked)
      }
    }

    setIsLoading(false)
  }

  async function refreshLikeCount(options?: { allowDecrease?: boolean }) {
    const allowDecrease = options?.allowDecrease !== false
    const tableName =
      targetType === 'post'
        ? 'posts'
        : targetType === 'comment'
          ? 'comments'
          : 'grid_slot_comments'

    // Try to read denormalized like_count
    const { data, error } = await supabase
      .from(tableName)
      .select('like_count')
      .eq('id', targetId)
      .single()

    if (!error && data && data.like_count !== null && data.like_count !== undefined) {
      const dbCount = data.like_count || 0
      setLikeCount((prev) => (allowDecrease ? dbCount : Math.max(prev, dbCount)))
      return
    }

    // Fallback: count votes directly if like_count is missing/out-of-sync
    const { count, error: countError } = await supabase
      .from('votes')
      .select('id', { head: true, count: 'exact' })
      .eq('target_id', targetId)
      .eq('target_type', targetType)

    if (!countError && typeof count === 'number') {
      setLikeCount((prev) => (allowDecrease ? count : Math.max(prev, count)))
      return
    }

    if (error) {
      console.error('Error refreshing like count (like_count):', error)
    }
    if (countError) {
      console.error('Error refreshing like count (fallback votes count):', countError)
    }
  }

  async function refreshUserLikeState(userId: string) {
    const { count, error } = await supabase
      .from('votes')
      .select('id', { head: true, count: 'exact' })
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .eq('user_id', userId)
    if (!error) {
      setIsLiked((count || 0) > 0)
    }
    return (count || 0) > 0
  }

  const isDark = variant === 'dark'
  const buttonClasses = isDark
    ? isLiked
      ? 'text-sunset-end hover:opacity-90'
      : 'text-white/90 hover:text-white'
    : isLiked
      ? 'text-sunset-end hover:opacity-90'
      : 'text-gray-600 hover:text-gray-700'

  return (
    <button
      onClick={handleToggleLike}
      disabled={isLoading}
      className={`inline-flex items-center gap-1 align-middle leading-none transition-colors disabled:opacity-50 ${buttonClasses}`}
      title={isLiked ? 'Unlike' : 'Like'}
    >
      {isLiked ? (
        <span className="heart-fill-sunset inline-block h-5 w-5 shrink-0" aria-hidden />
      ) : (
        <Heart className="h-5 w-5 shrink-0" />
      )}
      {likeCount > 0 && (
        <span className={`text-sm font-medium leading-none ${isLiked ? 'text-sunset-end' : ''}`}>{likeCount}</span>
      )}
    </button>
  )
}

