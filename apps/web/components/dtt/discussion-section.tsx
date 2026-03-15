'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { sanitizeUserContent, CONTENT_MAX_LENGTHS } from '@/utils/sanitize'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { CommentIcon } from '@/components/ui/comment-icon'
import Link from 'next/link'
import { LikeButton } from '@/components/discussion/like-button'
import { DiscussionReportButton } from '@/components/discussion/report-button'
import { CommentActionsMenu } from '@/components/discussion/comment-actions-menu'
import { FeedPostActionsMenu } from '@/components/feed/feed-post-actions-menu'
import { getAvatarUrl, isDefaultAvatar } from '@/utils/avatar'
import { toast } from 'sonner'

interface User {
  id: string
  username: string
  profile_image_url: string | null
}

interface Post {
  id: string
  content: string
  created_at: string
  like_count: number
  user: User | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  post_id: string
  parent_comment_id: string | null
  like_count: number
  user: User | null
}

interface DiscussionSectionProps {
  posts: Post[]
  parentPageType: 'driver' | 'team' | 'track' | 'poll' | 'hot_take' | 'profile' | 'story'
  parentPageId: string
  variant?: 'light' | 'dark'
  /** When true, uses smaller height for modal contexts (e.g. poll/hot take modals) */
  compact?: boolean
  /** When true, comment input is fixed at bottom and comments area scrolls (for modals) */
  fixedInput?: boolean
}

export function DiscussionSection({
  posts: initialPosts,
  parentPageType,
  parentPageId,
  variant = 'light',
  compact = false,
  fixedInput = false,
}: DiscussionSectionProps) {
  const isDark = variant === 'dark'
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({})
  const [userReports, setUserReports] = useState<Record<string, boolean>>({})
  const [newPostContent, setNewPostContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null)
  const [showReplyToComment, setShowReplyToComment] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState<Record<string, string>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null)
    })
  }, [supabase.auth])

  // Sync posts state and fetch comments when initialPosts changes
  useEffect(() => {
    setPosts(initialPosts)
    if (initialPosts.length > 0) {
      loadCommentsForPosts(initialPosts)
      loadUserLikesAndReports(initialPosts)
    }
  }, [initialPosts])

  // Real-time subscriptions for like_count updates on posts and comments
  useEffect(() => {
    const postIds = posts.map((p) => p.id)
    const allCommentIds = Object.values(comments).flat().map((c) => c.id)

    // If nothing to subscribe to, skip
    if (postIds.length === 0 && allCommentIds.length === 0) return

    const channels: any[] = []

    if (postIds.length > 0) {
      const postsChannel = supabase
        .channel(`discussion-posts-${parentPageId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'posts',
            filter: `id=in.(${postIds.join(',')})`,
          },
          (payload) => {
            const updated = payload.new as any
            if (updated?.id && updated.like_count !== undefined) {
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === updated.id ? { ...p, like_count: updated.like_count } : p
                )
              )
            }
          }
        )
        .subscribe()

      channels.push(postsChannel)
    }

    if (allCommentIds.length > 0) {
      const commentsChannel = supabase
        .channel(`discussion-comments-${parentPageId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'comments',
            filter: `id=in.(${allCommentIds.join(',')})`,
          },
          (payload) => {
            const updated = payload.new as any
            if (updated?.id && updated.like_count !== undefined) {
              setComments((prev) => {
                const next = { ...prev }
                Object.keys(next).forEach((postId) => {
                  next[postId] = next[postId].map((c) =>
                    c.id === updated.id ? { ...c, like_count: updated.like_count } : c
                  )
                })
                return next
              })
            }
          }
        )
        .subscribe()

      channels.push(commentsChannel)
    }

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [supabase, parentPageId, posts, comments])

  async function loadUserLikesAndReports(postsToLoad: Post[]) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    const postIds = postsToLoad.map((p) => p.id)

    // Load user likes for posts
    const { data: postLikes } = await supabase
      .from('votes')
      .select('target_id')
      .eq('user_id', session.user.id)
      .eq('target_type', 'post')
      .in('target_id', postIds)

    // Load user reports for posts
    const { data: postReports } = await supabase
      .from('reports')
      .select('target_id')
      .eq('reporter_id', session.user.id)
      .eq('target_type', 'post')
      .in('target_id', postIds)

    const likesMap: Record<string, boolean> = {}
    const reportsMap: Record<string, boolean> = {}

    postLikes?.forEach((like) => {
      likesMap[like.target_id] = true
    })

    postReports?.forEach((report) => {
      reportsMap[report.target_id] = true
    })

    setUserLikes(likesMap)
    setUserReports(reportsMap)
  }

  async function loadCommentsForPosts(postsToLoad: Post[]) {
    if (postsToLoad.length === 0) return

    const postIds = postsToLoad.map((post) => post.id)

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
      .in('post_id', postIds)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading comments:', error)
      return
    }

    // Group comments by post_id
    const commentsByPost: Record<string, Comment[]> = {}
    if (data) {
      data.forEach((comment) => {
        if (!commentsByPost[comment.post_id]) {
          commentsByPost[comment.post_id] = []
        }
        commentsByPost[comment.post_id].push(comment as Comment)
      })
    }

    setComments(commentsByPost)

    // Load user likes and reports for comments
    if (session && data && data.length > 0) {
      const commentIds = data.map((c) => c.id)

      const [commentLikes, commentReports] = await Promise.all([
        supabase
          .from('votes')
          .select('target_id')
          .eq('user_id', session.user.id)
          .eq('target_type', 'comment')
          .in('target_id', commentIds),
        supabase
          .from('reports')
          .select('target_id')
          .eq('reporter_id', session.user.id)
          .eq('target_type', 'comment')
          .in('target_id', commentIds),
      ])

      const likesMap = { ...userLikes }
      const reportsMap = { ...userReports }

      commentLikes.data?.forEach((like) => {
        likesMap[like.target_id] = true
      })

      commentReports.data?.forEach((report) => {
        reportsMap[report.target_id] = true
      })

      setUserLikes(likesMap)
      setUserReports(reportsMap)
    }
  }

  async function loadCommentsForPost(postId: string) {
    setLoadingComments({ ...loadingComments, [postId]: true })

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
      setLoadingComments({ ...loadingComments, [postId]: false })
      return
    }

    setComments({ ...comments, [postId]: (data || []) as Comment[] })

    // Load user likes and reports for comments
    if (session && data && data.length > 0) {
      const commentIds = data.map((c) => c.id)

      const [commentLikes, commentReports] = await Promise.all([
        supabase
          .from('votes')
          .select('target_id')
          .eq('user_id', session.user.id)
          .eq('target_type', 'comment')
          .in('target_id', commentIds),
        supabase
          .from('reports')
          .select('target_id')
          .eq('reporter_id', session.user.id)
          .eq('target_type', 'comment')
          .in('target_id', commentIds),
      ])

      const likesMap = { ...userLikes }
      const reportsMap = { ...userReports }

      commentLikes.data?.forEach((like) => {
        likesMap[like.target_id] = true
      })

      commentReports.data?.forEach((report) => {
        reportsMap[report.target_id] = true
      })

      setUserLikes(likesMap)
      setUserReports(reportsMap)
    }

    setLoadingComments({ ...loadingComments, [postId]: false })
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault()
    if (!newPostContent.trim()) return

    const result = sanitizeUserContent(newPostContent, {
      maxLength: CONTENT_MAX_LENGTHS.post,
      fieldName: 'Post',
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setIsSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        content: result.value,
        user_id: session.user.id,
        parent_page_type: parentPageType,
        parent_page_id: parentPageId,
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
      console.error('Error creating post:', error)
      toast.error('Failed to create post. Please check your internet connection and try again.')
    } else {
      setPosts([data, ...posts])
      setNewPostContent('')
    }
    setIsSubmitting(false)
  }

  async function handleCreateReply(postId: string) {
    const content = replyContent[postId]
    if (!content?.trim()) return

    const result = sanitizeUserContent(content, {
      maxLength: CONTENT_MAX_LENGTHS.comment,
      fieldName: 'Comment',
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        content: result.value,
        user_id: session.user.id,
        post_id: postId,
        parent_comment_id: null, // Top-level comment
      })
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
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      toast.error('Failed to create comment')
    } else {
      // Add the new comment to the comments state
      const newComment = { ...data, like_count: (data as { like_count?: number })?.like_count ?? 0 } as Comment
      const currentComments = comments[postId] || []
      setComments({
        ...comments,
        [postId]: [...currentComments, newComment],
      })
      setShowReplyForm(null)
      setReplyContent({ ...replyContent, [postId]: '' })
    }
  }

  async function handleCreateReplyToComment(commentId: string, postId: string) {
    const content = replyContent[commentId]
    if (!content?.trim()) return

    const result = sanitizeUserContent(content, {
      maxLength: CONTENT_MAX_LENGTHS.comment,
      fieldName: 'Reply',
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        content: result.value,
        user_id: session.user.id,
        post_id: postId,
        parent_comment_id: commentId, // Reply to comment
      })
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
      .single()

    if (error) {
      console.error('Error creating reply:', error)
      toast.error('Failed to create reply')
    } else {
      // Add the new reply to the comments state
      const newReply = { ...data, like_count: (data as { like_count?: number })?.like_count ?? 0 } as Comment
      const currentComments = comments[postId] || []
      setComments({
        ...comments,
        [postId]: [...currentComments, newReply],
      })
      setShowReplyToComment(null)
      setReplyContent({ ...replyContent, [commentId]: '' })
    }
  }

  // Group comments by parent_comment_id
  function groupComments(commentsList: Comment[]) {
    const topLevel: Comment[] = []
    const repliesByParent: Record<string, Comment[]> = {}

    commentsList.forEach((comment) => {
      if (!comment.parent_comment_id) {
        topLevel.push(comment)
      } else {
        if (!repliesByParent[comment.parent_comment_id]) {
          repliesByParent[comment.parent_comment_id] = []
        }
        repliesByParent[comment.parent_comment_id].push(comment)
      }
    })

    return { topLevel, repliesByParent }
  }

  const sectionClasses = isDark
    ? `flex flex-col gap-4 ${fixedInput ? 'flex-1 min-h-0 pb-0' : 'pb-8'}`
    : `flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow ${fixedInput ? 'flex-1 min-h-0' : ''}`
  const headingClasses = isDark
    ? 'text-sm font-medium text-white/90 text-right'
    : 'text-sm font-medium text-gray-900 text-right'
  const contentHeight = fixedInput
    ? 'flex-1 min-h-0 min-h-[40vh] sm:min-h-0 overflow-y-auto'
    : compact
      ? 'min-h-[6rem] max-h-[35vh]'
      : 'min-h-[6rem] max-h-[50vh]'
  const contentBoxClasses = isDark
    ? `mt-6 flex ${contentHeight} flex-col rounded-md border border-white/20 bg-transparent p-4`
    : `mt-6 flex ${contentHeight} flex-col rounded-md border border-gray-200 bg-gray-50/50 p-4`
  const contentBoxEmptyClasses = isDark
    ? 'items-center justify-center'
    : 'items-center justify-center'
  const textareaClasses = isDark
    ? 'min-w-0 flex-1 rounded-l-md rounded-r-none border border-r-0 border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1] focus:ring-inset'
    : 'min-w-0 flex-1 rounded-l-md rounded-r-none border border-r-0 border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
  const submitButtonClasses = isDark
    ? 'flex shrink-0 items-center justify-center gap-1.5 rounded-r-md rounded-l-none border border-white/30 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-[#25B4B1] disabled:opacity-50'
    : 'flex shrink-0 items-center justify-center gap-1.5 rounded-r-md rounded-l-none border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 disabled:opacity-50'
  const emptyTextClasses = isDark
    ? 'text-sm text-white/60 text-center'
    : 'text-sm text-gray-500 text-center'
  const postBorderClasses = isDark ? 'border-b border-white/20' : 'border-b border-gray-200'
  const avatarBgClasses = isDark ? 'bg-white/20' : 'bg-gray-300'
  const avatarTextClasses = isDark ? 'text-white' : 'text-gray-600'
  const usernameClasses = isDark
    ? 'font-medium text-white hover:text-white/80'
    : 'font-medium text-gray-900 hover:text-blue-600'
  const timestampClasses = isDark ? 'text-xs text-white/60' : 'text-xs text-gray-500'
  const contentClasses = isDark ? 'my-3 text-white/90' : 'mb-3 text-gray-700'
  const replyButtonClasses = isDark
    ? 'text-sm text-white/80 hover:text-white'
    : 'text-sm text-blue-600 hover:text-blue-800'
  const commentBorderClasses = isDark ? 'border-l-2 border-white/20' : 'border-l-2 border-gray-200'
  const commentTextClasses = isDark ? 'mb-2 text-sm text-white/90' : 'mb-2 text-sm text-gray-700'
  const replyTextClasses = isDark ? 'text-xs text-white/80 hover:text-white' : 'text-xs text-blue-600 hover:text-blue-800'
  const replyTextareaClasses = isDark
    ? 'w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm shadow-sm focus:border-white/40 focus:outline-none focus:ring-white/20 text-white placeholder:text-white/50'
    : 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-black'
  const replySubmitClasses = isDark
    ? 'mt-2 rounded-md bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30'
    : 'mt-2 rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700'
  const replyContentClasses = isDark ? 'mb-1 text-xs text-white/90' : 'mb-1 text-xs text-gray-700'

  return (
    <section className={sectionClasses}>

      {/* Posts list - scrollable, same layout as grid detail comment section */}
      <div
        className={`${contentBoxClasses} ${posts.length === 0 ? contentBoxEmptyClasses : ''}`}
      >
        {posts.length === 0 ? (
          <p className={emptyTextClasses}>No discussions yet. Be the first to post!</p>
        ) : (
          <div className="w-full space-y-6">
          {posts.map((post) => {
            const postComments = comments[post.id] || []
            const { topLevel, repliesByParent } = groupComments(postComments)

            return (
              <div key={post.id} id={`post-${post.id}`} className={`${postBorderClasses} pb-6 last:border-0`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start space-x-3">
                    <div
                      className={`h-8 w-8 shrink-0 rounded-full overflow-hidden ${
                        isDefaultAvatar(post.user?.profile_image_url) ? 'bg-white/10' : ''
                      }`}
                    >
                      <img
                        src={getAvatarUrl(post.user?.profile_image_url)}
                        alt={post.user?.username ?? ''}
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/u/${post.user?.username || 'unknown'}`}
                        className={usernameClasses}
                      >
                        {post.user?.username || 'Unknown'}
                      </Link>
                      <p className={timestampClasses}>
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                      {post.content ? <p className={contentClasses}>{post.content}</p> : null}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <FeedPostActionsMenu
                      postId={post.id}
                      postAuthorId={post.user?.id ?? null}
                      variant={variant}
                      onDeleted={(deletedId) => {
                        setPosts((prev) => prev.filter((p) => p.id !== deletedId))
                        setComments((prev) => {
                          const next = { ...prev }
                          delete next[deletedId]
                          return next
                        })
                      }}
                    />
                  </div>
                </div>
                {'image_url' in post && typeof (post as { image_url?: string }).image_url === 'string' && (
                  <div className="mt-2 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={(post as { image_url: string }).image_url}
                      alt=""
                      className="max-h-80 w-full object-contain"
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="mb-3 flex items-center space-x-4">
                  <LikeButton
                    targetId={post.id}
                    targetType="post"
                    initialLikeCount={post.like_count || 0}
                    initialIsLiked={userLikes[post.id] || false}
                    onLikeChange={(targetId, isLiked) => {
                      setUserLikes({ ...userLikes, [targetId]: isLiked })
                    }}
                  />
                  <button
                    onClick={() => {
                      const newShowReplyForm = showReplyForm === post.id ? null : post.id
                      setShowReplyForm(newShowReplyForm)
                      // Load comments when opening reply form if not already loaded
                      if (newShowReplyForm && !comments[post.id]) {
                        loadCommentsForPost(post.id)
                      }
                    }}
                    className={`flex items-center gap-1.5 ${replyButtonClasses}`}
                    aria-label={topLevel.length > 0 ? `Reply (${topLevel.length})` : 'Reply'}
                  >
                    <CommentIcon className="h-4 w-4 shrink-0" />
                    {topLevel.length > 0 ? <span>{topLevel.length}</span> : null}
                  </button>
                </div>

                {/* Comments List */}
                {topLevel.length > 0 && (
                  <div className="mt-4 ml-8 space-y-4 border-l border-white/20 pl-2">
                    {topLevel.map((comment) => {
                      const commentReplies = repliesByParent[comment.id] || []

                      return (
                        <div key={comment.id} className="py-2">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex min-w-0 flex-1 items-start space-x-2">
                              <div
                                className={`h-6 w-6 shrink-0 rounded-full overflow-hidden ${
                                  isDefaultAvatar(comment.user?.profile_image_url) ? 'bg-white/10' : ''
                                }`}
                              >
                                <img
                                  src={getAvatarUrl(comment.user?.profile_image_url)}
                                  alt={comment.user?.username ?? ''}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/u/${comment.user?.username || 'unknown'}`}
                                  className={`text-sm font-medium ${isDark ? 'text-white hover:text-white/80' : 'text-gray-900 hover:text-blue-600'}`}
                                >
                                  {comment.user?.username || 'Unknown'}
                                </Link>
                                <p className={timestampClasses}>
                                  {new Date(comment.created_at).toLocaleString()}
                                </p>
                                <p className={commentTextClasses}>{comment.content}</p>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <CommentActionsMenu
                                commentId={comment.id}
                                commentAuthorId={comment.user?.id ?? null}
                                currentUserId={currentUserId}
                                targetType="comment"
                                variant={variant}
                                initialContent={comment.content}
                                onDeleted={(deletedId) => {
                                  setComments((prev) => ({
                                    ...prev,
                                    [post.id]: (prev[post.id] || []).filter(
                                      (c) => c.id !== deletedId && c.parent_comment_id !== deletedId
                                    ),
                                  }))
                                }}
                                onEdited={(editedId, newContent) => {
                                  setComments((prev) => ({
                                    ...prev,
                                    [post.id]: (prev[post.id] || []).map((c) =>
                                      c.id === editedId ? { ...c, content: newContent } : c
                                    ),
                                  }))
                                }}
                              />
                            </div>
                          </div>

                          {/* Comment Actions */}
                          <div className="mb-2 ml-8 flex items-center space-x-4">
                            <LikeButton
                              targetId={comment.id}
                              targetType="comment"
                              initialLikeCount={comment.like_count || 0}
                              initialIsLiked={userLikes[comment.id] || false}
                              onLikeChange={(targetId, isLiked) => {
                                setUserLikes({ ...userLikes, [targetId]: isLiked })
                              }}
                            />
                            <button
                              onClick={() => {
                                const newShowReply =
                                  showReplyToComment === comment.id ? null : comment.id
                                setShowReplyToComment(newShowReply)
                              }}
                              className={`flex items-center gap-1.5 ${replyTextClasses}`}
                              aria-label="Reply"
                            >
                              <CommentIcon className="h-4 w-4 shrink-0" />
                            </button>
                          </div>

                          {/* Reply to Comment Form */}
                          {showReplyToComment === comment.id && (
                            <div className="mt-2 ml-4">
                              <textarea
                                value={replyContent[comment.id] || ''}
                                onChange={(e) =>
                                  setReplyContent({
                                    ...replyContent,
                                    [comment.id]: e.target.value,
                                  })
                                }
                                placeholder="Write a reply..."
                                rows={2}
                                className={replyTextareaClasses}
                              />
                              <button
                                onClick={() => handleCreateReplyToComment(comment.id, post.id)}
                                className={replySubmitClasses}
                              >
                                Post Reply
                              </button>
                            </div>
                          )}

                          {/* Replies to this comment */}
                          {commentReplies.length > 0 && (
                            <div className={`mt-2 ml-4 space-y-2 ${commentBorderClasses} pl-3`}>
                              {commentReplies.map((reply) => (
                                <div key={reply.id} className="py-1">
                                  <div className="mb-1 flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 flex-1 items-start space-x-2">
                                      <div
                                        className={`h-5 w-5 shrink-0 rounded-full overflow-hidden ${
                                          isDefaultAvatar(reply.user?.profile_image_url) ? 'bg-white/10' : ''
                                        }`}
                                      >
                                        <img
                                          src={getAvatarUrl(reply.user?.profile_image_url)}
                                          alt={reply.user?.username ?? ''}
                                          className="h-full w-full rounded-full object-cover"
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <Link
                                          href={`/u/${reply.user?.username || 'unknown'}`}
                                          className={`text-xs font-medium ${isDark ? 'text-white hover:text-white/80' : 'text-gray-900 hover:text-blue-600'}`}
                                        >
                                          {reply.user?.username || 'Unknown'}
                                        </Link>
                                        <p className={timestampClasses}>
                                          {new Date(reply.created_at).toLocaleString()}
                                        </p>
                                        <p className={replyContentClasses}>{reply.content}</p>
                                      </div>
                                    </div>
                                    <div className="shrink-0">
                                      <CommentActionsMenu
                                        commentId={reply.id}
                                        commentAuthorId={reply.user?.id ?? null}
                                        currentUserId={currentUserId}
                                        targetType="comment"
                                        variant={variant}
                                        initialContent={reply.content}
                                        onDeleted={(deletedId) => {
                                          setComments((prev) => ({
                                            ...prev,
                                            [post.id]: (prev[post.id] || []).filter(
                                              (c) =>
                                                c.id !== deletedId &&
                                                c.parent_comment_id !== deletedId
                                            ),
                                          }))
                                        }}
                                        onEdited={(editedId, newContent) => {
                                          setComments((prev) => ({
                                            ...prev,
                                            [post.id]: (prev[post.id] || []).map((c) =>
                                              c.id === editedId ? { ...c, content: newContent } : c
                                            ),
                                          }))
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="ml-7 flex items-center space-x-3">
                                    <LikeButton
                                      targetId={reply.id}
                                      targetType="comment"
                                      initialLikeCount={reply.like_count || 0}
                                      initialIsLiked={userLikes[reply.id] || false}
                                      onLikeChange={(targetId, isLiked) => {
                                        setUserLikes({ ...userLikes, [targetId]: isLiked })
                                      }}
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

                {/* Reply Form (for post) */}
                {showReplyForm === post.id && (
                  <div className="mt-3 ml-11">
                    <textarea
                      value={replyContent[post.id] || ''}
                      onChange={(e) =>
                        setReplyContent({ ...replyContent, [post.id]: e.target.value })
                      }
                      placeholder="Write a reply..."
                      rows={2}
                      className={replyTextareaClasses}
                    />
                    <button
                      onClick={() => handleCreateReply(post.id)}
                      className={isDark
                        ? 'mt-2 rounded-md bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30'
                        : 'mt-2 rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700'}
                    >
                      Post Reply
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          </div>
        )}
      </div>

      {/* Create post form - same order and style as grid detail (input at bottom) */}
      <form onSubmit={handleCreatePost} className={`flex w-full items-stretch ${fixedInput ? 'shrink-0 pt-4' : ''}`}>
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className={textareaClasses}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newPostContent.trim()}
          className={submitButtonClasses}
        >
          <Send className="h-4 w-4" />
          Post
        </button>
      </form>
    </section>
  )
}
