'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { LikeButton } from '@/components/discussion/like-button'
import { getAvatarUrl } from '@/utils/avatar'

interface CommentUser {
  id: string
  username: string
  profile_image_url: string | null
}

interface GridSlotComment {
  id: string
  content: string
  created_at: string
  grid_id: string
  rank_index: number
  parent_comment_id: string | null
  like_count: number
  user: CommentUser | null
}

interface GridSlotCommentSectionProps {
  gridId: string
  rankIndex: number
}

export function GridSlotCommentSection({ gridId, rankIndex }: GridSlotCommentSectionProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [comments, setComments] = useState<GridSlotComment[]>([])
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({})

  const loadComments = useCallback(async () => {
    setIsLoading(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { data, error } = await supabase
      .from('grid_slot_comments')
      .select(
        `
        *,
        user:profiles!user_id (
          id,
          username,
          profile_image_url
        )
      `
      )
      .eq('grid_id', gridId)
      .eq('rank_index', rankIndex)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading grid slot comments:', error)
      setIsLoading(false)
      return
    }

    setComments((data || []) as GridSlotComment[])

    if (session && data && data.length > 0) {
      const commentIds = data.map((c) => c.id)
      const { data: likeRows } = await supabase
        .from('votes')
        .select('target_id')
        .eq('user_id', session.user.id)
        .eq('target_type', 'grid_slot_comment')
        .in('target_id', commentIds)
      const likesMap: Record<string, boolean> = {}
      likeRows?.forEach((row: { target_id: string }) => {
        likesMap[row.target_id] = true
      })
      setUserLikes(likesMap)
    }
    setIsLoading(false)
  }, [gridId, rankIndex])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    const { data, error } = await supabase
      .from('grid_slot_comments')
      .insert({
        content: content.trim(),
        user_id: session.user.id,
        grid_id: gridId,
        rank_index: rankIndex,
        parent_comment_id: null,
      })
      .select(
        `
        *,
        user:profiles!user_id (
          id,
          username,
          profile_image_url
        )
      `
      )
      .single()

    if (error) {
      console.error('Error adding comment:', error)
      setIsSubmitting(false)
      return
    }

    setComments((prev) => [...prev, data as GridSlotComment])
    setContent('')
    setIsSubmitting(false)
  }

  const topLevel = comments.filter((c) => !c.parent_comment_id)
  const repliesByParent: Record<string, GridSlotComment[]> = {}
  comments.forEach((c) => {
    if (c.parent_comment_id) {
      if (!repliesByParent[c.parent_comment_id]) repliesByParent[c.parent_comment_id] = []
      repliesByParent[c.parent_comment_id].push(c)
    }
  })

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-sm font-medium text-white/90">Comments</h3>

      <form onSubmit={handleAddComment} className="flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
        />
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="inline-flex items-center gap-1.5 self-end rounded-md border border-white/30 bg-transparent px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Post
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-white/70">Loading comments...</p>
      ) : (
        <div className="space-y-3 border-l-2 border-white/10 pl-3">
          {topLevel.map((comment) => {
            const commentReplies = repliesByParent[comment.id] || []
            return (
              <div key={comment.id} className="py-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <img
                    src={getAvatarUrl(comment.user?.profile_image_url)}
                    alt={comment.user?.username ?? ''}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  <Link
                    href={`/u/${comment.user?.username ?? 'unknown'}`}
                    className="text-sm font-medium text-white/90 hover:text-white"
                  >
                    {comment.user?.username ?? 'Unknown'}
                  </Link>
                  <span className="text-xs text-white/70">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-white/90">{comment.content}</p>
                <div className="mt-1">
                  <LikeButton
                    targetId={comment.id}
                    targetType="grid_slot_comment"
                    initialLikeCount={comment.like_count ?? 0}
                    initialIsLiked={userLikes[comment.id] ?? false}
                    onLikeChange={(targetId, isLiked) => {
                      setUserLikes((prev) => ({ ...prev, [targetId]: isLiked }))
                    }}
                    variant="dark"
                  />
                </div>
                {commentReplies.length > 0 && (
                  <div className="mt-2 ml-4 space-y-2 border-l border-white/10 pl-3">
                    {commentReplies.map((reply) => (
                      <div key={reply.id}>
                        <div className="mb-0.5 flex items-center gap-2">
                          <img
                            src={getAvatarUrl(reply.user?.profile_image_url)}
                            alt={reply.user?.username ?? ''}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                          <Link
                            href={`/u/${reply.user?.username ?? 'unknown'}`}
                            className="text-xs font-medium text-white/90 hover:text-white"
                          >
                            {reply.user?.username ?? 'Unknown'}
                          </Link>
                          <span className="text-xs text-white/70">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-white/90">{reply.content}</p>
                        <LikeButton
                          targetId={reply.id}
                          targetType="grid_slot_comment"
                          initialLikeCount={reply.like_count ?? 0}
                          initialIsLiked={userLikes[reply.id] ?? false}
                          onLikeChange={(targetId, isLiked) => {
                            setUserLikes((prev) => ({ ...prev, [targetId]: isLiked }))
                          }}
                          variant="dark"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && topLevel.length === 0 && (
        <p className="text-sm text-white/60">No comments yet. Be the first to comment.</p>
      )}
    </div>
  )
}
