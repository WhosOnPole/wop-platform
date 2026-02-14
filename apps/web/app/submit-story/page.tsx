'use client'

import { useRouter } from 'next/navigation'
import { StoryModal } from '@/components/create/modals/story-modal'

export default function SubmitStoryPage() {
  const router = useRouter()

  function handleClose() {
    router.push('/podiums')
  }

  return (
    <div className="min-h-screen bg-black/40">
      <StoryModal onClose={handleClose} />
    </div>
  )
}
