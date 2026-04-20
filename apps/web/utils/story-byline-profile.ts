export type StoryProfileRow = {
  id: string
  username: string
  profile_image_url: string | null
}

function firstRelation<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

/** Prefer submitter (community author on promoted stories), else admin/editor author. */
export function getStoryBylineProfile(story: {
  submitter?: StoryProfileRow | StoryProfileRow[] | null
  author?: StoryProfileRow | StoryProfileRow[] | null
}): StoryProfileRow | null {
  return firstRelation(story.submitter) ?? firstRelation(story.author) ?? null
}
