import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use | Who’s on Pole?',
  description: 'Review the Terms of Use for using Who’s on Pole? products and services.',
  robots: 'index,follow',
}

export default function TermsPage() {
  const termsHtml = fs.readFileSync(
    path.join(process.cwd(), 'public', 'legal', 'terms.html'),
    'utf-8'
  )

  return (
    <div className="bg-white text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: termsHtml }} />
      </div>
    </div>
  )
}
