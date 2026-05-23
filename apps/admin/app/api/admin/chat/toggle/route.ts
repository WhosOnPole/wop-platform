import { NextResponse } from 'next/server'

/** Track-level chat toggle removed; live chat is scheduled per event in admin. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Track-level chat toggle is no longer supported. Enable live chat per session in Data Enrichment → Schedules.',
    },
    { status: 410 }
  )
}
