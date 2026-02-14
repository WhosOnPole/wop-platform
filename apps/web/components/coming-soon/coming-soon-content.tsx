'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Logo } from '@/components/ui/logo'

const RIGHT_SIDE_SLIDES = [
  'F1 fandom, redefined',
  'Connection fueled by shared obsession.',
  'Built for the love of it',
  "Hot takes welcome — hate isn't",
]

// Clone first slide at end for seamless loop
const SLIDES_LOOP = [...RIGHT_SIDE_SLIDES, RIGHT_SIDE_SLIDES[0]]
const SLIDE_COUNT = SLIDES_LOOP.length

export function ComingSoonContent() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const slideIndexRef = useRef(0)

  useEffect(() => {
    slideIndexRef.current = slideIndex
  }, [slideIndex])

  useEffect(() => {
    const t = setInterval(() => {
      const i = slideIndexRef.current
      const next = i + 1
      if (next === SLIDE_COUNT) {
        setTransitionEnabled(false)
        setSlideIndex(0)
      } else {
        setSlideIndex(next)
      }
    }, 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (slideIndex === 0 && !transitionEnabled) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionEnabled(true))
      })
      return () => cancelAnimationFrame(id)
    }
  }, [slideIndex, transitionEnabled])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading || submitted) return

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('website', '') // honeypot stays empty

      // Use absolute URL to avoid routing issues in production
      const apiUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/contact-form-handler`
        : '/api/contact-form-handler'
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Form submission failed:', response.status, errorData)
        throw new Error(errorData.error || 'Submission failed')
      }

      setSubmitted(true)
      setEmail('')
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex h-screen min-h-screen flex-col items-center justify-center overflow-hidden bg-[url('/images/backsplash_mobile.png')] lg:bg-[url('/images/backgrounds_image.svg')] bg-cover bg-center bg-no-repeat lg:flex-row lg:items-stretch lg:justify-between">
      {/* Left Side - Background Points of Interest */}

      <div className="relative flex w-full max-w-xl items-center justify-center p-6 lg:w-1/3">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-3 text-center">
            <div className="flex justify-center">
              <div className="rounded-full p-4">
                <Logo variant="gradient" size="lg"/>
              </div>
            </div>

            <h1 className="text-5xl font-display">
              Coming Soon
            </h1>
            <p className="text-base text-white px-16">
              We're opening the grid soon. <br></br> <br></br>
              Join the list to be notified when Who's on Pole goes live - and be a part of shaping it from the start.
            </p>

          </div>

          <div className="pt-2">
            <div className="relative mb-6 w-full">
              <div className="mb-6 flex justify-center space-x-4">
                <a
                  href="https://www.tiktok.com/@whos_on_pole"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white transition-colors hover:text-sunset-start"
                  aria-label="TikTok"
                >
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com/whos_on_pole"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white transition-colors hover:text-sunset-start"
                  aria-label="Instagram"
                >
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>

              {submitted && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background px-6 py-8 text-center text-white">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">Thank you — you&apos;re up next!</p>
                    <p className="text-sm text-white/80">We&apos;ll email you as soon as the grid opens.</p>
                  </div>
                </div>
              )}
              <form
                className="space-y-3 rounded-xl mx-4 border border-white/20 p-4 backdrop-blur"
                onSubmit={handleSubmit}
              >
              {/* Honeypot for basic bot blocking */}
                <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

                <label className="sr-only" htmlFor="coming-soon-email">Email</label>
                <input
                  id="coming-soon-email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-white placeholder:text-white/60 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/60"
                  disabled={loading || submitted}
                />
                <button
                  type="submit"
                  disabled={loading || submitted}
                  className="w-full rounded-lg bg-white px-5 py-3 text-center text-sm font-semibold text-background-text transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitted ? 'You’re on the list' : loading ? 'Submitting...' : 'Notify me'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* Right Side - Coming Soon Panel */}
      <div className="hidden lg:flex w-full lg:w-2/3 flex items-center justify-end p-8 relative overflow-hidden">
        {/* Background: blue car behind gradient */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90"
          style={{ backgroundImage: "url('/images/blue_car.svg')" }}
          aria-hidden
        />
        <div
          className="absolute inset-0 z-[1] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/bggradient.png')" }}
          aria-hidden
        />
        {/* Content */}
        <div className="relative z-10 flex w-full flex-col items-end justify-center gap-6">
          <Image
            src="/images/fans.png"
            alt=""
            width={600}
            height={400}
            className="w-2/3 max-w-xl object-cover object-right"
          />
          <div className="w-1/3 min-h-[4.5rem] overflow-hidden pl-10 pr-0 text-left font-black">
            <div
              className="flex ease-in-out"
              style={{
                width: `${SLIDE_COUNT * 100}%`,
                transform: `translateX(-${slideIndex * (100 / SLIDE_COUNT)}%)`,
                transition: transitionEnabled ? 'transform 500ms ease-in-out' : 'none',
              }}
            >
              {SLIDES_LOOP.map((text, idx) => (
                <p
                  key={idx}
                  className="shrink-0 text-2xl text-white"
                  style={{ width: `${100 / SLIDE_COUNT}%` }}
                  aria-live="polite"
                  aria-hidden={slideIndex !== idx}
                >
                  {text}
                </p>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 left-0 right-0 z-10 text-center text-xs text-white/70">
        <span>© 2026 Who&apos;s on Pole? All rights reserved.</span>
        <span className="mx-2 text-white/40">|</span>
        <Link href="/privacy" className="hover:text-white">
          Privacy Policy
        </Link>
        <span className="mx-2 text-white/40">|</span>
        <Link href="/terms" className="hover:text-white">
          Terms of Service
        </Link>
      </div>
    </div>
  </div>
  )
}
