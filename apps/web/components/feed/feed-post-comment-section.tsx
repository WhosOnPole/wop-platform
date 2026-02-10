'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { MessageSquare, Send } from 'lucide-react'
import Link from 'next/link'
import { LikeButton } from '@/components/discussion/like-button'
import { getAvatarUrl } from '@/utils/avatar'

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
}

export function FeedPostCommentSection({
  postId,
  initialCommentCount = 0,
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

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          const next = !isOpen
          setIsOpen(next)
          if (next) loadComments()
        }}
        className="inline-flex items-center gap-1 text-sm text-white/90 transition-colors hover:text-white"
      >
        <MessageSquare className="h-4 w-4" />
        <span>Comment{commentCount > 0 ? ` (${commentCount})` : ''}</span>
      </button>

      {isOpen && (
        <div className="mt-3 rounded-md border border-white/10 bg-black/40 p-3 backdrop-blur-sm">
          {isLoading ? (
            <p className="text-sm text-white/90">Loading comments...</p>
          ) : (
            <>
              {topLevel.length > 0 && (
                <div className="mb-4 space-y-3 border-l-2 border-white/10 pl-3">
                  {topLevel.map((comment) => {
                    const commentReplies = repliesByParent[comment.id] || []
                    return (
                      <div key={comment.id} className="py-1">
                        <div className="mb-1 flex items-center gap-2">
                          <img
                            src={getAvatarUrl(comment.user?.profile_image_url)}
                            alt={comment.user?.username ?? ''}
                            className="h-6 w-6 rounded-full object-cover"
                          />
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
                        <div className="mt-1">
                          <LikeButton
                            targetId={comment.id}
                            targetType="comment"
                            initialLikeCount={comment.like_count || 0}
                            initialIsLiked={userLikes[comment.id] || false}
                            onLikeChange={(targetId, isLiked) => {
                              setUserLikes((prev) => ({ ...prev, [targetId]: isLiked }))
                            }}
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
                                    href={`/u/${reply.user?.username || 'unknown'}`}
                                    className="text-xs font-medium text-white/90 hover:text-white"
                                  >
                                    {reply.user?.username || 'Unknown'}
                                  </Link>
                                  <span className="text-xs text-white/70">
                                    {new Date(reply.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-white/90">{reply.content}</p>
                                <LikeButton
                                  targetId={reply.id}
                                  targetType="comment"
                                  initialLikeCount={reply.like_count || 0}
                                  initialIsLiked={userLikes[reply.id] || false}
                                  onLikeChange={(targetId, isLiked) => {
                                    setUserLikes((prev) => ({ ...prev, [targetId]: isLiked }))
                                  }}
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
      )}
    </div>
  )
}
