import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export function Footer() {
  return (
    <footer className="text-white">
      <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <Logo variant="gradient" size="md" href="/" className="mb-4" />
            <p className="text-sm text-gray-400 max-w-md">
              The ultimate Formula 1 fan community. Build your dream grid, connect with fans, and
              chat during race weekends.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/pitlane" className="text-sm text-gray-400 hover:text-white">
                  Drivers
                </Link>
              </li>
              <li>
                <Link href="/pitlane" className="text-sm text-gray-400 hover:text-white">
                  Teams
                </Link>
              </li>
              <li>
                <Link href="/pitlane" className="text-sm text-gray-400 hover:text-white">
                  Tracks
                </Link>
              </li>
              <li>
                <Link href="/podiums" className="text-sm text-gray-400 hover:text-white">
                  Podiums
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-sm text-gray-400 hover:text-white">
                  Features
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="text-sm text-gray-400 hover:text-white">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Who&apos;s on Pole? All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

