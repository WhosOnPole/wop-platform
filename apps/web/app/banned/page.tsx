import Link from 'next/link'

export default function BannedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg text-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Suspended</h1>
          <p className="mt-4 text-gray-600">
            Your account has been suspended due to violations of our community guidelines.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
        <div>
          <Link
            href="/"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

