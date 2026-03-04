'use client'

import { useLiveRace } from '@/hooks/use-live-race'

/**
 * When a live race (active event) exists, we do not show this fixed bottom bar;
 * the TopNav shows a "Join Live Chat!" button instead. So this component
 * returns null whenever useLiveRace() reports a live race.
 */
export function LiveRaceBanner() {
  const { liveRace } = useLiveRace()

  if (liveRace) return null

  return null
}
