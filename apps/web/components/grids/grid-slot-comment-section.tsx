'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { LikeButton } from '@/components/discussion/like-button'
import { CommentActionsMenu } from '@/components/discussion/comment-actions-menu'
import { getAvatarUrl, isDefaultAvatar } from '@/utils/avatar'

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null)
    })
  }, [supabase.auth])

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
    <div className="mt-6 space-y-4 px-4 bg-black">
      <h3 className="text-sm font-medium text-white/90">Comments</h3>

      <form onSubmit={handleAddComment} className="flex w-full items-stretch">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="min-w-0 flex-1 rounded-l-md rounded-r-none border border-r-0 border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1] focus:ring-inset"
        />
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-r-md rounded-l-none border border-white/30 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-[#25B4B1] disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Post
        </button>
      </form>

      <div
        className={`rounded-md border border-white/20 bg-transparent p-4 min-h-[120px] flex flex-col ${isLoading || topLevel.length === 0 ? 'items-center justify-center' : ''}`}
      >
        {isLoading ? (
          <p className="text-sm text-white/70">Loading comments...</p>
        ) : topLevel.length > 0 ? (
          <div className="w-full space-y-3">
            {topLevel.map((comment) => {
            const commentReplies = repliesByParent[comment.id] || []
            return (
              <div key={comment.id} className="py-1">
                <div className="mb-0.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div
                      className={`h-6 w-6 shrink-0 rounded-full overflow-hidden ${
                        isDefaultAvatar(comment.user?.profile_image_url) ? 'bg-white p-0.5' : ''
                      }`}
                    >
                      <img
                        src={getAvatarUrl(comment.user?.profile_image_url)}
                        alt={comment.user?.username ?? ''}
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
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
                  <div className="flex shrink-0 items-center gap-2">
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
                    <CommentActionsMenu
                      commentId={comment.id}
                      commentAuthorId={comment.user?.id ?? null}
                      currentUserId={currentUserId}
                      targetType="grid_slot_comment"
                      variant="dark"
                      initialContent={comment.content}
                      onDeleted={(deletedId) => {
                        setComments((prev) =>
                          prev.filter(
                            (c) => c.id !== deletedId && c.parent_comment_id !== deletedId
                          )
                        )
                      }}
                      onEdited={(editedId, newContent) => {
                        setComments((prev) =>
                          prev.map((c) =>
                            c.id === editedId ? { ...c, content: newContent } : c
                          )
                        )
                      }}
                    />
                  </div>
                </div>
                <p className="text-sm text-white/90 pl-8">{comment.content}</p>
                {commentReplies.length > 0 && (
                  <div className="mt-2 ml-4 space-y-2 border-l border-white/10 pl-3">
                    {commentReplies.map((reply) => (
                      <div key={reply.id}>
                        <div className="mb-0.5 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <div
                              className={`h-5 w-5 shrink-0 rounded-full overflow-hidden ${
                                isDefaultAvatar(reply.user?.profile_image_url) ? 'bg-white p-0.5' : ''
                              }`}
                            >
                              <img
                                src={getAvatarUrl(reply.user?.profile_image_url)}
                                alt={reply.user?.username ?? ''}
                                className="h-full w-full rounded-full object-cover"
                              />
                            </div>
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
                          <div className="flex shrink-0 items-center gap-2">
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
                            <CommentActionsMenu
                              commentId={reply.id}
                              commentAuthorId={reply.user?.id ?? null}
                              currentUserId={currentUserId}
                              targetType="grid_slot_comment"
                              variant="dark"
                              initialContent={reply.content}
                              onDeleted={(deletedId) => {
                                setComments((prev) =>
                                  prev.filter(
                                    (c) =>
                                      c.id !== deletedId && c.parent_comment_id !== deletedId
                                  )
                                )
                              }}
                              onEdited={(editedId, newContent) => {
                                setComments((prev) =>
                                  prev.map((c) =>
                                    c.id === editedId ? { ...c, content: newContent } : c
                                  )
                                )
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-sm text-white/90">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          </div>
        ) : (
          <p className="text-sm text-white/60 text-center">No comments yet. Be the first to comment.</p>
        )}
      </div>
    </div>
  )
}
