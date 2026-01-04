import { Metadata } from 'next'
import { ComingSoonContent } from '@/components/coming-soon/coming-soon-content'

export const metadata: Metadata = {
  title: 'Coming Soon | Who\'s on Pole?',
  description: 'Join the F1 fan community. Coming soon - stay tuned for the launch of Who\'s on Pole?',
}

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default function HomePage() {
  // Home page now shows coming-soon content
  // Auth redirects are handled by middleware
  return <ComingSoonContent />
}
