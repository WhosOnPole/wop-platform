import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

export async function DELETE(request: Request) {
  if (!SUPABASE_URL || !SECRET_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  let pollId: string | undefined
  try {
    const body = await request.json()
    pollId = body?.pollId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!pollId || typeof pollId !== 'string') {
    return NextResponse.json({ error: 'pollId is required' }, { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SECRET_KEY)

  try {
    const { data: relatedPosts, error: postsQueryError } = await supabase
      .from('posts')
      .select('id')
      .eq('parent_page_type', 'poll')
      .eq('parent_page_id', pollId)

    if (postsQueryError) throw postsQueryError

    const postIds = (relatedPosts || []).map((post) => post.id)
    if (postIds.length > 0) {
      await supabase.from('votes').delete().eq('target_type', 'post').in('target_id', postIds)

      const { error: postsDeleteError } = await supabase.from('posts').delete().in('id', postIds)
      if (postsDeleteError) throw postsDeleteError
    }

    const { error: pollDeleteError } = await supabase.from('polls').delete().eq('id', pollId)
    if (pollDeleteError) throw pollDeleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    const message = error?.message || 'Failed to delete poll'
    console.error('[admin/polls/delete] Error:', message, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
