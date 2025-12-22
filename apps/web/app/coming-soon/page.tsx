import { Metadata } from 'next'
import { ComingSoonContent } from '@/components/coming-soon/coming-soon-content'

export const metadata: Metadata = {
  title: 'Coming Soon | Who\'s on Pole?',
  description: 'Join the F1 fan community. Coming soon - stay tuned for the launch of Who\'s on Pole?',
  robots: 'noindex, nofollow', // Don't index coming soon pages
}

export default function ComingSoonPage() {
  return <ComingSoonContent />
}
