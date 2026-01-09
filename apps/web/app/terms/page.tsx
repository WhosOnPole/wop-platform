import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Who’s on Pole?',
  description: 'Review the Terms of Service for using Who’s on Pole? products and services.',
  robots: 'index,follow',
}

export default function TermsPage() {
  return (
    <div className="bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-700 mb-6">
          Our full Terms of Service are coming soon. In the meantime, by using Who’s on Pole? you
          agree to use the service responsibly, respect other users, and comply with applicable laws.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-gray-700">
          <li>Use the platform lawfully and do not abuse, harass, or infringe on others’ rights.</li>
          <li>Do not upload content you do not have the right to share.</li>
          <li>We may update these terms; continued use after updates constitutes acceptance.</li>
          <li>Contact us with any questions: <a className="text-blue-600 hover:underline" href="mailto:delisa.wray@gmail.com">delisa.wray@gmail.com</a>.</li>
        </ul>
        <p className="text-gray-600 mt-6">
          This placeholder will be replaced with the full Terms of Service document soon.
        </p>
      </div>
    </div>
  )
}
