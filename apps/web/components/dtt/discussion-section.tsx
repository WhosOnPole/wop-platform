'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { MessageSquare, Send } from 'lucide-react'
import Link from 'next/link'
import { LikeButton } from '@/components/discussion/like-button'
import { DiscussionReportButton } from '@/components/discussion/report-button'

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
}

export function DiscussionSection({
  posts: initialPosts,
  parentPageType,
  parentPageId,
}: DiscussionSectionProps) {
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
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H4',location:'discussion-section.tsx:posts-sub',message:'post like_count update',data:{postId:updated.id,like_count:updated.like_count},timestamp:Date.now()})}).catch(()=>{})
              // #endregion
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
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H5',location:'discussion-section.tsx:comments-sub',message:'comment like_count update',data:{commentId:updated.id,like_count:updated.like_count},timestamp:Date.now()})}).catch(()=>{})
              // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run2',hypothesisId:'H6',location:'discussion-section.tsx:loadUserLikesAndReports:posts',message:'loaded user likes/reports for posts',data:{userId:session?.user.id,postIds,likes:Object.keys(likesMap),reports:Object.keys(reportsMap)},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

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

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/28d01ed4-45e5-408c-a9a5-badf5c252607',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run2',hypothesisId:'H7',location:'discussion-section.tsx:loadCommentsForPosts:comments',message:'loaded user likes/reports for comments',data:{userId:session?.user.id,commentIds,likes:Object.keys(likesMap),reports:Object.keys(reportsMap)},timestamp:Date.now()})}).catch(()=>{})
      // #endregion

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

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex items-center space-x-2">
        <MessageSquare className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-900">Discussion</h2>
      </div>

      {/* Create Post Form */}
      <form onSubmit={handleCreatePost} className="mb-6">
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="Start a discussion..."
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-black"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span>Post</span>
        </button>
      </form>

      {/* Posts List */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No discussions yet. Be the first to post!</p>
        ) : (
          posts.map((post) => {
            const postComments = comments[post.id] || []
            const { topLevel, repliesByParent } = groupComments(postComments)

            return (
              <div key={post.id} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="mb-3 flex items-center space-x-3">
                  {post.user?.profile_image_url ? (
                    <img
                      src={post.user.profile_image_url}
                      alt={post.user.username}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                      <span className="text-xs font-medium text-gray-600">
                        {post.user?.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/u/${post.user?.username || 'unknown'}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {post.user?.username || 'Unknown'}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="mb-3 text-gray-700">{post.content}</p>

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
                    className="text-sm text-blue-600 hover:text-blue-800"
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
                  <div className="mt-4 ml-11 space-y-4 border-l-2 border-gray-200 pl-4">
                    {topLevel.map((comment) => {
                      const commentReplies = repliesByParent[comment.id] || []

                      return (
                        <div key={comment.id} className="py-2">
                          <div className="mb-2 flex items-center space-x-2">
                            {comment.user?.profile_image_url ? (
                              <img
                                src={comment.user.profile_image_url}
                                alt={comment.user.username}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300">
                                <span className="text-xs font-medium text-gray-600">
                                  {comment.user?.username?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <div>
                              <Link
                                href={`/u/${comment.user?.username || 'unknown'}`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600"
                              >
                                {comment.user?.username || 'Unknown'}
                              </Link>
                              <p className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="mb-2 text-sm text-gray-700">{comment.content}</p>

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
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Reply
                            </button>
                            <DiscussionReportButton
                              targetId={comment.id}
                              targetType="comment"
                              initialIsReported={userReports[comment.id] || false}
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
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-black"
                              />
                              <button
                                onClick={() => handleCreateReplyToComment(comment.id, post.id)}
                                className="mt-2 rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                              >
                                Post Reply
                              </button>
                            </div>
                          )}

                          {/* Replies to this comment */}
                          {commentReplies.length > 0 && (
                            <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
                              {commentReplies.map((reply) => (
                                <div key={reply.id} className="py-1">
                                  <div className="mb-1 flex items-center space-x-2">
                                    {reply.user?.profile_image_url ? (
                                      <img
                                        src={reply.user.profile_image_url}
                                        alt={reply.user.username}
                                        className="h-5 w-5 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300">
                                        <span className="text-xs font-medium text-gray-600">
                                          {reply.user?.username?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <Link
                                        href={`/u/${reply.user?.username || 'unknown'}`}
                                        className="text-xs font-medium text-gray-900 hover:text-blue-600"
                                      >
                                        {reply.user?.username || 'Unknown'}
                                      </Link>
                                      <p className="text-xs text-gray-500">
                                        {new Date(reply.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="mb-1 text-xs text-gray-700">{reply.content}</p>
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
                                    <DiscussionReportButton
                                      targetId={reply.id}
                                      targetType="comment"
                                      initialIsReported={userReports[reply.id] || false}
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-black"
                    />
                    <button
                      onClick={() => handleCreateReply(post.id)}
                      className="mt-2 rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
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
