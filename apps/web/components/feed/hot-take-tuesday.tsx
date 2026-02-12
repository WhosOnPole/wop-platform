import Link from 'next/link'
import { Radio } from 'lucide-react'

interface Grid {
  id: string
  type: string
  comment: string | null
  ranked_items: any[]
  user: {
    id: string
    username: string
    profile_image_url: string | null
  } | null
}

interface HotTake {
  id: string
  content_text: string
  featured_grid_id: string | null
  featured_grid: Grid | null
}

interface HotTakeTuesdayProps {
  hotTake: HotTake
}

export function HotTakeTuesday({ hotTake }: HotTakeTuesdayProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-4 shadow backdrop-blur-sm">
      <div className="mb-4 flex items-center space-x-2">
        <Radio className="h-5 w-5 text-white/90" />
        <h2 className="text-lg font-bold text-white">Hot Take Tuesday</h2>
      </div>
      <p className="mb-4 text-white/90">{hotTake.content_text}</p>

      {hotTake.featured_grid && (
        <div className="rounded-md bg-white/10 p-4">
          <p className="mb-2 text-sm font-medium text-white/90">
            Featured Grid by{' '}
            <Link
              href={`/u/${hotTake.featured_grid.user?.username || 'unknown'}`}
              className="text-[#25B4B1] hover:text-[#25B4B1]/90 hover:underline"
            >
              {hotTake.featured_grid.user?.username || 'Unknown'}
            </Link>
          </p>
          {hotTake.featured_grid.comment && (
            <p className="mb-3 italic text-white/90">
              &quot;{hotTake.featured_grid.comment}&quot;
            </p>
          )}
          <div className="space-y-1">
            {Array.isArray(hotTake.featured_grid.ranked_items) &&
              hotTake.featured_grid.ranked_items.slice(0, 3).map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-sm text-white/90"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#25B4B1] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{item.name || 'Unknown'}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

