'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { MessageSquare, Send } from 'lucide-react'
import Link from 'next/link'
import { LikeButton } from '@/components/discussion/like-button'
import { DiscussionReportButton } from '@/components/discussion/report-button'
import { CommentActionsMenu } from '@/components/discussion/comment-actions-menu'
import { getAvatarUrl, isDefaultAvatar } from '@/utils/avatar'

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
  parentPageType: 'driver' | 'team' | 'track' | 'poll' | 'hot_take' | 'profile'
  parentPageId: string
  variant?: 'light' | 'dark'
}

export function DiscussionSection({
  posts: initialPosts,
  parentPageType,
  parentPageId,
  variant = 'light',
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
        content: newPostContent.trim(),
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
      alert('Failed to create post')
    } else {
      setPosts([data, ...posts])
      setNewPostContent('')
    }
    setIsSubmitting(false)
  }

  async function handleCreateReply(postId: string) {
    const content = replyContent[postId]
    if (!content?.trim()) return

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
        content: content.trim(),
        user_id: session.user.id,
        post_id: postId,
        parent_comment_id: null, // Top-level comment
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
      alert('Failed to create comment')
    } else {
      // Add the new comment to the comments state
      const currentComments = comments[postId] || []
      setComments({
        ...comments,
        [postId]: [...currentComments, data as Comment],
      })
      setShowReplyForm(null)
      setReplyContent({ ...replyContent, [postId]: '' })
    }
  }

  async function handleCreateReplyToComment(commentId: string, postId: string) {
    const content = replyContent[commentId]
    if (!content?.trim()) return

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
        content: content.trim(),
        user_id: session.user.id,
        post_id: postId,
        parent_comment_id: commentId, // Reply to comment
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
      console.error('Error creating reply:', error)
      alert('Failed to create reply')
    } else {
      // Add the new reply to the comments state
      const currentComments = comments[postId] || []
      setComments({
        ...comments,
        [postId]: [...currentComments, data as Comment],
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
    ? ''
    : 'rounded-lg border border-gray-200 bg-white p-2 shadow'
  const headingIconClasses = isDark ? 'h-5 w-5 text-white/80' : 'h-5 w-5 text-blue-500'
  const headingTextClasses = isDark
    ? 'text-xl font-semibold text-white'
    : 'text-xl font-semibold text-gray-900'
  const textareaClasses = isDark
    ? 'w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 shadow-sm focus:border-white/40 focus:outline-none focus:ring-white/20 text-white placeholder:text-white/50'
    : 'w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-black'
  const submitButtonClasses = isDark
    ? 'mt-2 flex items-center space-x-2 rounded-md bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30 disabled:opacity-50 float-right'
    : 'mt-2 flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
  const emptyTextClasses = isDark
    ? 'text-center text-white/60'
    : 'text-center text-gray-500'
  const postBorderClasses = isDark ? 'border-b border-white/20' : 'border-b border-gray-200'
  const avatarBgClasses = isDark ? 'bg-white/20' : 'bg-gray-300'
  const avatarTextClasses = isDark ? 'text-white' : 'text-gray-600'
  const usernameClasses = isDark
    ? 'font-medium text-white hover:text-white/80'
    : 'font-medium text-gray-900 hover:text-blue-600'
  const timestampClasses = isDark ? 'text-xs text-white/60' : 'text-xs text-gray-500'
  const contentClasses = isDark ? 'mb-3 text-white/90' : 'mb-3 text-gray-700'
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
      {/* Create Post Form */}
      <form onSubmit={handleCreatePost} className="mb-20">
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="Start a discussion..."
          rows={4}
          className={textareaClasses}
          required
        />
        <button type="submit" disabled={isSubmitting} className={submitButtonClasses}>
          <Send className="h-4 w-4" />
          <span>Post</span>
        </button>
      </form>

      {/* Posts List */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <p className={emptyTextClasses}>No discussions yet. Be the first to post!</p>
        ) : (
          posts.map((post) => {
            const postComments = comments[post.id] || []
            const { topLevel, repliesByParent } = groupComments(postComments)

            return (
              <div key={post.id} className={`${postBorderClasses} pb-6 last:border-0`}>
                <div className="mb-3 flex items-center space-x-3">
                  <div
                    className={`h-8 w-8 shrink-0 rounded-full overflow-hidden ${
                      isDefaultAvatar(post.user?.profile_image_url) ? 'bg-white p-0.5' : ''
                    }`}
                  >
                    <img
                      src={getAvatarUrl(post.user?.profile_image_url)}
                      alt={post.user?.username ?? ''}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/u/${post.user?.username || 'unknown'}`}
                      className={usernameClasses}
                    >
                      {post.user?.username || 'Unknown'}
                    </Link>
                    <p className={timestampClasses}>
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {post.content ? <p className={contentClasses}>{post.content}</p> : null}
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
                    className="text-sm text-white/80 hover:text-white"
                  >
                    Reply {topLevel.length > 0 ? `(${topLevel.length})` : ''}
                  </button>
                  <DiscussionReportButton
                    targetId={post.id}
                    targetType="post"
                    initialIsReported={userReports[post.id] || false}
                  />
                </div>

                {/* Comments List */}
                {topLevel.length > 0 && (
                  <div className="mt-4 ml-11 space-y-4 border-l-2 border-white/20 pl-4">
                    {topLevel.map((comment) => {
                      const commentReplies = repliesByParent[comment.id] || []

                      return (
                        <div key={comment.id} className="py-2">
                          <div className="mb-2 flex items-center space-x-2">
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
                            <div>
                              <Link
                                href={`/u/${comment.user?.username || 'unknown'}`}
                                className={`text-sm font-medium ${isDark ? 'text-white hover:text-white/80' : 'text-gray-900 hover:text-blue-600'}`}
                              >
                                {comment.user?.username || 'Unknown'}
                              </Link>
                              <p className={timestampClasses}>
                                {new Date(comment.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className={commentTextClasses}>{comment.content}</p>

                          {/* Comment Actions */}
                          <div className="mb-2 flex items-center space-x-4">
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
                              className={replyTextClasses}
                            >
                              Reply
                            </button>
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
                                  <div className="mb-1 flex items-center space-x-2">
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
                                    <div>
                                      <Link
                                        href={`/u/${reply.user?.username || 'unknown'}`}
                                        className={`text-xs font-medium ${isDark ? 'text-white hover:text-white/80' : 'text-gray-900 hover:text-blue-600'}`}
                                      >
                                        {reply.user?.username || 'Unknown'}
                                      </Link>
                                      <p className={timestampClasses}>
                                        {new Date(reply.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  <p className={replyContentClasses}>{reply.content}</p>
                                  <div className="flex items-center space-x-3">
                                    <LikeButton
                                      targetId={reply.id}
                                      targetType="comment"
                                      initialLikeCount={reply.like_count || 0}
                                      initialIsLiked={userLikes[reply.id] || false}
                                      onLikeChange={(targetId, isLiked) => {
                                        setUserLikes({ ...userLikes, [targetId]: isLiked })
                                      }}
                                    />
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
          })
        )}
      </div>
    </section>
  )
}
