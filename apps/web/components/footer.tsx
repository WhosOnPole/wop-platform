import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export function Footer() {
  return (
    <footer className="text-white">
      <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <Logo variant="gradient" size="md" href="/" className="mb-4" />
            <p className="text-sm text-gray-400 max-w-md mb-6">
              We're on our formation lap. <br/><br/>
              Join us in building the ultimate F1 fan community. Rank drivers, share stories, vote, debate, and chat during races. <br/><br/>
              If you want it here - let's build it together. <br/><br/>
              Drop us your ideas at <a href="mailto:team@whosonpole.org" className="text-gray-400 hover:text-white">team@whosonpole.org</a>
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
                <Link href="/#features" className="text-sm text-gray-400 hover:text-white">
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
                <Link href="/delete-data" className="text-sm text-gray-400 hover:text-white">
                  Delete Your Data
                </Link>
              </li>
              <li>
                <a href="https://www.whosonpole.org/terms" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white">
                  Terms of Service
                </a>
              </li>
              <li>
                <Link href="/sitemap" className="text-sm text-gray-400 hover:text-white">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 w-full max-w-4xl mx-auto text-center text-xs text-gray-400 leading-relaxed">
          This platform is an independent, community-supported fan site created for informational, entertainment, and community engagement purposes. It is not affiliated with, endorsed by, sponsored by, or officially connected to Formula 1®, Formula One Management, the FIA, any Formula 1 teams, drivers, sponsors, event organizers, or affiliated entities. All trademarks, service marks, logos, team names, driver names, and related intellectual property referenced on this platform are the property of their respective owners and are used solely for nominative and descriptive purposes. No claim of ownership, partnership, or official association is made or implied. <br /> <br /> Membership fees and other payments made through this platform support site operations, development, and community features and do not confer any official status, affiliation, or access to Formula 1® or related organizations. Any rewards or benefits provided to users are administered solely by this independent platform and are not sponsored, endorsed, or administered by Formula 1® or any affiliated entity. The content presented reflects the views of the platform and its community contributors and does not represent the views or positions of Formula 1® or any related organization. <br /> <br />
        </p>

        <div className="mt-8 border-t border-gray-800 pt-8">
          <p className="text-center text-xs text-gray-400 space-x-2">
            <span>&copy; {new Date().getFullYear()} Who&apos;s on Pole? All rights reserved.</span>
            <span className="inline-block text-gray-500">|</span>
            <Link href="/privacy" className="text-gray-400 hover:text-white">
              Privacy Policy
            </Link>
            <span className="inline-block text-gray-500">|</span>
            <Link href="/delete-data" className="text-gray-400 hover:text-white">
              Delete Your Data
            </Link>
            <span className="inline-block text-gray-500">|</span>
            <Link href="/terms" className="text-gray-400 hover:text-white">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

