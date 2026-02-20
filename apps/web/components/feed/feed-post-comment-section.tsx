'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { CommentIcon } from '@/components/ui/comment-icon'
import Link from 'next/link'
import { LikeButton } from '@/components/discussion/like-button'
import { CommentActionsMenu } from '@/components/discussion/comment-actions-menu'
import { getAvatarUrl, isDefaultAvatar } from '@/utils/avatar'

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return 'just now'
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`
}

interface CommentUser {
  id: string
  username: string
  profile_image_url: string | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  post_id: string
  parent_comment_id: string | null
  like_count: number
  user: CommentUser | null
}

interface FeedPostCommentSectionProps {
  postId: string
  initialCommentCount?: number
  /** When set, the expanded comment panel is portaled into this element id (e.g. bottom of card) */
  panelTargetId?: string
}

export function FeedPostCommentSection({
  postId,
  initialCommentCount = 0,
  panelTargetId,
}: FeedPostCommentSectionProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [replyContent, setReplyContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null)
    })
  }, [supabase.auth])

  useEffect(() => {
    setCommentCount(initialCommentCount)
  }, [initialCommentCount])

  async function loadComments() {
    setIsLoading(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { data, error } = await supabase
      .from('comments')
      .select(
        `
        *,
        like_count,
        parent_comment_id,
        user:profiles!user_id (
          id,
          username,
          profile_image_url
        )
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading comments:', error)
      setIsLoading(false)
      return
    }

    setComments((data || []) as Comment[])
    setCommentCount((data || []).length)

    if (session && data && data.length > 0) {
      const commentIds = data.map((c) => c.id)
      const { data: commentLikes } = await supabase
        .from('votes')
        .select('target_id')
        .eq('user_id', session.user.id)
        .eq('target_type', 'comment')
        .in('target_id', commentIds)
      const likesMap: Record<string, boolean> = {}
      commentLikes?.forEach((row: { target_id: string }) => {
        likesMap[row.target_id] = true
      })
      setUserLikes(likesMap)
    }
    setIsLoading(false)
  }


  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!replyContent.trim()) return

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({
        content: replyContent.trim(),
        user_id: session.user.id,
        post_id: postId,
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
      console.error('Error creating comment:', error)
      setIsSubmitting(false)
      return
    }

    setComments((prev) => [...prev, data as Comment])
    setCommentCount((prev) => prev + 1)
    setReplyContent('')
    setIsSubmitting(false)
  }

  const topLevel = comments.filter((c) => !c.parent_comment_id)
  const repliesByParent: Record<string, Comment[]> = {}
  comments.forEach((c) => {
    if (c.parent_comment_id) {
      if (!repliesByParent[c.parent_comment_id]) repliesByParent[c.parent_comment_id] = []
      repliesByParent[c.parent_comment_id].push(c)
    }
  })

  const panelContent = isOpen ? (
    <div className="rounded-md border border-white/10 bg-black/40 p-3 backdrop-blur-sm">
          {isLoading ? (
            <p className="text-sm text-white/90">Loading comments...</p>
          ) : (
            <>
              {topLevel.length > 0 && (
                <div className="mb-4 space-y-3">
                  {topLevel.map((comment) => {
                    const commentReplies = repliesByParent[comment.id] || []
                    return (
                      <div key={comment.id} className="py-1">
                        <div className="mb-1 flex items-center gap-2">
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
                            href={`/u/${comment.user?.username || 'unknown'}`}
                            className="text-sm font-medium text-white/90 hover:text-white"
                          >
                            {comment.user?.username || 'Unknown'}
                          </Link>
                          <span className="text-xs text-white/70">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-white/90">{comment.content}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <LikeButton
                            targetId={comment.id}
                            targetType="comment"
                            initialLikeCount={comment.like_count || 0}
                            initialIsLiked={userLikes[comment.id] || false}
                            onLikeChange={(targetId, isLiked) => {
                              setUserLikes((prev) => ({ ...prev, [targetId]: isLiked }))
                            }}
                            variant="dark"
                          />
                          <CommentActionsMenu
                            commentId={comment.id}
                            commentAuthorId={comment.user?.id ?? null}
                            currentUserId={currentUserId}
                            targetType="comment"
                            variant="dark"
                            initialContent={comment.content}
                            onDeleted={(deletedId) => {
                              setComments((prev) => {
                                const next = prev.filter(
                                  (c) =>
                                    c.id !== deletedId && c.parent_comment_id !== deletedId
                                )
                                setCommentCount(next.length)
                                return next
                              })
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
                        {commentReplies.length > 0 && (
                          <div className="mt-2 ml-4 space-y-2 border-l border-white/10 pl-3">
                            {commentReplies.map((reply) => (
                              <div key={reply.id} className="relative">
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
                                      href={`/u/${reply.user?.username || 'unknown'}`}
                                      className="text-xs font-medium text-white/90 hover:text-white shrink-0"
                                    >
                                      {reply.user?.username || 'Unknown'}
                                    </Link>
                                    <span className="text-xs text-white/70 shrink-0">
                                      {formatTimeAgo(reply.created_at)}
                                    </span>
                                  </div>
                                  <div className="shrink-0">
                                    <CommentActionsMenu
                                      commentId={reply.id}
                                      commentAuthorId={reply.user?.id ?? null}
                                      currentUserId={currentUserId}
                                      targetType="comment"
                                      variant="dark"
                                      initialContent={reply.content}
                                      onDeleted={(deletedId) => {
                                        setComments((prev) => {
                                          const next = prev.filter(
                                            (c) =>
                                              c.id !== deletedId &&
                                              c.parent_comment_id !== deletedId
                                          )
                                          setCommentCount(next.length)
                                          return next
                                        })
                                      }}
                                      onEdited={(editedId, newContent) => {
                                        setComments((prev) =>
                                          prev.map((c) =>
                                            c.id === editedId
                                              ? { ...c, content: newContent }
                                              : c
                                          )
                                        )
                                      }}
                                    />
                                  </div>
                                </div>
                                <p className="text-sm text-white/90">{reply.content}</p>
                                <div className="mt-1 flex justify-end">
                                  <LikeButton
                                    targetId={reply.id}
                                    targetType="comment"
                                    initialLikeCount={reply.like_count || 0}
                                    initialIsLiked={userLikes[reply.id] || false}
                                    onLikeChange={(targetId, isLiked) => {
                                      setUserLikes((prev) => ({ ...prev, [targetId]: isLiked }))
                                    }}
                                    variant="dark"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <form onSubmit={handleAddComment}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !replyContent.trim()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-transparent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Post Reply
                </button>
              </form>
            </>
          )}
    </div>
  ) : null

  const target = typeof document !== 'undefined' && panelTargetId ? document.getElementById(panelTargetId) : null
  const panelRendered = isOpen && panelContent

  return (
    <>
      <button
        type="button"
        onClick={() => {
          const next = !isOpen
          setIsOpen(next)
          if (next) loadComments()
        }}
        className="inline-flex items-center gap-1.5 text-sm leading-none text-white transition-colors hover:text-white/90"
        title={commentCount !== 1 ? `${commentCount} comments` : '1 comment'}
      >
        <CommentIcon className="h-5 w-5 shrink-0" />
        <span className="font-medium leading-none tabular-nums">{commentCount}</span>
      </button>
      {panelRendered && panelTargetId && target
        ? createPortal(panelContent, target)
        : panelRendered && !panelTargetId
          ? panelContent
          : null}
    </>
  )
}
