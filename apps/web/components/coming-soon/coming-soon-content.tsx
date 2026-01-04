'use client'

import { useState } from 'react'
import { Logo } from '@/components/ui/logo'
import { Clock, Mail, Sparkles, CheckCircle } from 'lucide-react'

// Navbar items as points of interest
const pointsOfInterest = [
  'Drivers',
  'Polls',
  'Track Tips',
  'Team Info',
  'Grids',
  'Live Chat',
  'Community',
  'Leaderboards',
].filter(Boolean)

export function ComingSoonContent() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    // TODO: Implement email subscription API endpoint
    // For now, just simulate success
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    setSubmitted(true)
    setLoading(false)
    setEmail('')
    
    // Reset after 5 seconds
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <div className="flex min-h-screen bg-cover bg-center bg-no-repeat bg-[url(/images/backsplash.png)] lg:bg-background">
      {/* Left Side - Background Points of Interest */}

      <div className="lg:w-1/3 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-background lg:bg-white/75 backdrop-blur-sm p-8 shadow-lg">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="rounded-full p-4">
                <Logo variant="white" size="xl" />
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Coming Soon
            </h1>
            <p className="text-lg text-white/50">
            Stay tuned for the launch of Who&apos;s on Pole - your ultimate F1 fan community
            </p>

          </div>

          <div className="space-y-4 rounded-lg border border-gray-400/50 p-6 bg-white/5 backdrop-blur-sm">
            <div className="flex items-start space-x-6 mb-6">
              <Clock className="h-5 w-5 text-racing-orange mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-racing-orange">What to Expect</h3>
                <p className="mt-1 text-sm">
                  Join a community of F1 fans in sharing their passion, live chats during races, visiting tips, creating ranked grids and competing for the top spot!
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <Mail className="h-5 w-5 text-bright-teal mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-bright-teal">Stay in the Loop!</h3>
                <p className="mt-1 text-sm">
                  Be the first to know when we launch. Follow us on social media for updates.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-center text-sm text-sunset-start">
              Follow us for updates
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <a
                href="https://www.tiktok.com/@whos_on_pole"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white transition-colors hover:text-bright-teal"
                aria-label="TikTok"
              >
                <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/whos_on_pole"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white transition-colors hover:text-bright-teal"
                aria-label="Instagram"
              >
                <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Coming Soon Panel */}
      <div className="hidden lg:flex w-full lg:w-2/3 flex items-center justify-center p-8 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/backsplash.png)' }}>
        <div className="absolute inset-0 opacity-5 text-white">
          <div className="grid grid-cols-3 gap-28 p-8 h-full w-full">
            {pointsOfInterest.map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-center"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <span className="text-6xl font-bold text-white transform rotate-12 hover:rotate-0 transition-transform duration-300">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Logo overlay */}
        <div className="relative z-10 text-center space-y-6 p-12">
          <p className="text-8xl font-display text-gray-800/50">
            We're putting the finishing touches on something amazing!
          </p>
        </div>
      </div>
    </div>
  )
}
