'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'

interface LikeButtonProps {
  targetId: string
  targetType: 'post' | 'comment'
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H1',location:'like-button.tsx:initial-sync',message:'initial props sync',data:{targetId,targetType,initialLikeCount,initialIsLiked},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H2',location:'like-button.tsx:handleToggleLike:before',message:'before toggle',data:{targetId,targetType,isLiked,likeCount},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H10',location:'like-button.tsx:handleToggleLike:unlike-db',message:'unlike delete result',data:{targetId,targetType,userId:session.user.id,rowsDeleted:deletedCount},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        const wasDeleted = deletedCount > 0
        // If nothing was deleted, revert optimistic UI
        if (!wasDeleted) {
          setIsLiked(previousLiked)
          setLikeCount(previousCount)
        }
        // Refresh count from database after trigger updates it
        await refreshLikeCount()
        const userIsLiked = await refreshUserLikeState(session.user.id)
        // Notify parent of state change based on refreshed state
        onLikeChange?.(targetId, !!userIsLiked)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run2',hypothesisId:'H2',location:'like-button.tsx:handleToggleLike:unlike-success',message:'unlike success',data:{targetId,targetType,rowsDeleted:wasDeleted ? deletedVotes.length : 0,userIsLiked:!!userIsLiked},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
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
          await refreshLikeCount()
          const userIsLiked = await refreshUserLikeState(session.user.id)
          onLikeChange?.(targetId, !!userIsLiked)
        } else {
          console.error('Error liking:', error)
          setIsLiked(previousLiked)
          setLikeCount(previousCount)
        }
      } else {
        // Refresh count from database after trigger updates it
        await refreshLikeCount()
        const userIsLiked = await refreshUserLikeState(session.user.id)
        // Notify parent of state change based on refreshed state
        onLikeChange?.(targetId, !!userIsLiked)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run2',hypothesisId:'H2',location:'like-button.tsx:handleToggleLike:like-success',message:'like success',data:{targetId,targetType,userId:session.user.id},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        // #region agent log
        await logVoteCount('run2', 'H8-like', targetId, targetType, session.user.id)
        // #endregion
      }
    }

    setIsLoading(false)
  }

  async function refreshLikeCount() {
    const tableName = targetType === 'post' ? 'posts' : 'comments'

    // Try to read denormalized like_count
    const { data, error } = await supabase
      .from(tableName)
      .select('like_count')
      .eq('id', targetId)
      .single()

    if (!error && data && data.like_count !== null && data.like_count !== undefined) {
      setLikeCount(data.like_count || 0)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'like-button.tsx:refreshLikeCount:like_count',message:'refreshed like_count',data:{targetId,targetType,like_count:data.like_count},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      // Always also log current vote count for comparison
      await logVoteCount('run1', 'H9', targetId, targetType, 'n/a')
      return
    }

    // Fallback: count votes directly if like_count is missing/out-of-sync
    const { count, error: countError } = await supabase
      .from('votes')
      .select('id', { head: true, count: 'exact' })
      .eq('target_id', targetId)
      .eq('target_type', targetType)

    if (!countError && typeof count === 'number') {
      setLikeCount(count)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'like-button.tsx:refreshLikeCount:fallback',message:'fallback votes count used',data:{targetId,targetType,count},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      return
    }

    if (error) {
      console.error('Error refreshing like count (like_count):', error)
    }
    if (countError) {
      console.error('Error refreshing like count (fallback votes count):', countError)
    }
  }

  async function logVoteCount(runId: string, hypothesisId: string, targetId: string, targetType: 'post' | 'comment', userId: string) {
    const { count, error } = await supabase
      .from('votes')
      .select('id', { head: true, count: 'exact' })
      .eq('target_id', targetId)
      .eq('target_type', targetType)
    fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId,hypothesisId,location:'like-button.tsx:logVoteCount',message:'vote count after toggle',data:{targetId,targetType,userId,count,hasError:!!error},timestamp:Date.now()})}).catch(()=>{})
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H11',location:'like-button.tsx:refreshUserLikeState',message:'refreshed user like state',data:{targetId,targetType,userId,count:count ?? null,hasError:!!error},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    return (count || 0) > 0
  }

  const isDark = variant === 'dark'
  const buttonClasses = isDark
    ? isLiked
      ? 'text-[#25B4B1] hover:text-[#25B4B1]/90'
      : 'text-white/90 hover:text-white'
    : isLiked
      ? 'text-pink-600 hover:text-pink-700'
      : 'text-gray-600 hover:text-gray-700'

  return (
    <button
      onClick={handleToggleLike}
      disabled={isLoading}
      className={`inline-flex items-center gap-1 align-middle leading-none transition-colors disabled:opacity-50 ${buttonClasses}`}
      title={isLiked ? 'Unlike' : 'Like'}
    >
      <Heart className={`h-4 w-4 shrink-0 ${isLiked ? 'fill-current' : ''}`} />
      {likeCount > 0 && (
        <span className="text-sm font-medium leading-none">{likeCount}</span>
      )}
    </button>
  )
}

