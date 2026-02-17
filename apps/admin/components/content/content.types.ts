export interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  description: string | null
  created_at?: string | null
}

export interface HotTake {
  id: string
  content_text: string
  featured_grid_id: string | null
  active_date: string | null
  starts_at: string | null
  ends_at: string | null
  created_at?: string | null
}

export interface Poll {
  id: string
  question: string
  options: string[]
  is_featured_podium: boolean
  ends_at?: string | null
  created_at?: string | null
}

export interface NewsStory {
  id: string
  title: string
  image_url: string | null
  content: string
  is_featured: boolean
  created_at: string
}

export interface Article {
  id: string
  title: string
  slug: string
  content: string
  category: string
  header_image_url: string | null
  status: string
  created_at?: string | null
}
