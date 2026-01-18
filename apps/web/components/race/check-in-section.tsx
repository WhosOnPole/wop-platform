'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { MapPin, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  username: string
  profile_image_url: string | null
}

interface CheckIn {
  id: number
  user: User | null
  created_at: string
}

interface CheckInSectionProps {
  trackId: string
  raceName: string
  userCheckIn: any
  checkIns: CheckIn[]
}

export function CheckInSection({
  trackId,
  raceName,
  userCheckIn,
  checkIns: initialCheckIns,
}: CheckInSectionProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [checkIns, setCheckIns] = useState(initialCheckIns)
  const [isCheckedIn, setIsCheckedIn] = useState(!!userCheckIn)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCheckIn() {
    setIsSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase.from('race_checkins').insert({
      user_id: session.user.id,
      track_id: trackId,
      is_verified: false,
    })

    if (error) {
      if (error.code === '23505') {
        // Already checked in
        setIsCheckedIn(true)
      } else {
        console.error('Error checking in:', error)
        alert('Failed to check in')
      }
    } else {
      setIsCheckedIn(true)
      // Refresh check-ins list
      router.refresh()
    }
    setIsSubmitting(false)
  }

  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Race Check-In</h2>
        </div>
        {isCheckedIn && (
          <div className="flex items-center space-x-1 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Checked In</span>
          </div>
        )}
      </div>

      {!isCheckedIn ? (
        <div>
          <p className="mb-4 text-gray-600">
            Let others know you&apos;re at the {raceName}!
          </p>
          <button
            onClick={handleCheckIn}
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Checking in...' : "I'm at this race!"}
          </button>
        </div>
      ) : (
        <p className="text-gray-600">You&apos;re checked in for this race!</p>
      )}

      {/* Check-ins List */}
      {checkIns.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700">
              {checkIns.length} {checkIns.length === 1 ? 'person' : 'people'} checked in
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {checkIns.slice(0, 20).map((checkIn) => (
              <Link
                key={checkIn.id}
                href={`/u/${checkIn.user?.username || 'unknown'}`}
                className="flex items-center space-x-2 rounded-full bg-gray-100 px-3 py-1 hover:bg-gray-200 transition-colors"
              >
                {checkIn.user?.profile_image_url ? (
                  <img
                    src={checkIn.user.profile_image_url}
                    alt={checkIn.user.username}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300">
                    <span className="text-xs font-medium text-gray-600">
                      {checkIn.user?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <span className="text-sm text-gray-700">{checkIn.user?.username || 'Unknown'}</span>
              </Link>
            ))}
            {checkIns.length > 20 && (
              <span className="flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                +{checkIns.length - 20} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

