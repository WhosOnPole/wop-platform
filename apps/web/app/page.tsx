import Link from 'next/link'
import Image from 'next/image'
import { Logo } from '@/components/ui/logo'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default function HomePage() {
  // Auth redirects are handled by middleware
  // This page only renders static content for unauthenticated users

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Split Layout */}
      <div className="flex h-screen">
        {/* Left Panel - Login/Create Account (1/3) */}
        <div className="hidden lg:flex lg:w-1/3 bg-background flex-col items-center justify-center p-12">
          <div className="w-full max-w-sm space-y-8">
            <Logo variant="gradient" size="md" href="/" className="mx-auto w-full" />
            <div className="space-y-4">
              <Link
                href="/login"
                className="block w-full rounded-full bg-white px-6 py-3 text-center text-base font-medium text-background-text transition-colors hover:bg-gray-100"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="block w-full rounded-full border-2 border-white px-6 py-3 text-center text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                Create Account
              </Link>
            </div>
            <p className="text-center text-sm text-gray-400">
              Join the F1 fan community
            </p>
          </div>
        </div>

        {/* Right Panel - Scrollable Content (2/3) */}
        <div className="w-full lg:w-2/3 m-0 p-0">
          {/* Hero Section */}
          <section className="relative min-h-[100vh] flex flex-row overflow-hidden m-0 p-0">
            {/* Background Image - Flush with top */}
            <Image
              src="/images/backsplash.png"
              alt="Backsplash"
              fill
              className="object-cover object-top"
              style={{ top: 0, left: 0 }}
              priority
            />
            {/* Content Overlay */}
            <div className="relative z-10 h-full w-full text-center max-w-3xl mx-auto text-white flex flex-col items-center justify-center px-10 pt-8">
              <Logo variant="white" size="lg" href="/" className="mx-auto mb-8" />
              <h1 className="font-secondary text-xl lg:text-3xl mb-6">
                Building community. Highlighting fan stories. Making a space for women in the world of F1.
              </h1>
              <p className="text-sm lg:text-lg mb-8 leading-relaxed">
                Follow now to be a part of a racing community where no one will accuse you of being a &quot;Drive to Survive&quot; fan.
                <br />
                <br />
                Build your dream grid, connect with fans, chat during race weekends, and so much more!
              </p>
              <Link
                href="/signup"
                className="inline-block rounded-full bg-background px-8 py-4 text-lg font-bold italic text-white transition-colors hover:opacity-90"
              >
                Join Us!
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
