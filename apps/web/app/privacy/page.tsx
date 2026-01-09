import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Who’s on Pole?',
  description:
    'Learn how Who’s on Pole? collects, uses, and protects your personal information.',
  robots: 'index,follow',
}

export default function PrivacyPage() {
  const privacyHtml = fs.readFileSync(
    path.join(process.cwd(), 'public', 'legal', 'privacy.html'),
    'utf-8'
  )

  return (
    <div className="bg-white text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: privacyHtml }} />
      </div>
    </div>
  )
}
