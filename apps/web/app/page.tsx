import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  const cycleItems = [
    { word: 'Passion', subline: 'Connection fueled by obsession' },
    { word: 'Community', subline: 'F1 fandom, redefined' },
    { word: 'Motorsport', subline: 'Built for the love of it' },
  ] as const

  return (
    <div className="min-h-screen bg-black">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/landing_bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          aria-hidden
        />
      </div>
        {/* Gradient overlay: fade to black toward bottom */}
        <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.95) 85%, #000 100%)',
        }}
      />
      
      <section className="relative min-h-screen w-full max-w-7xl mx-auto  overflow-hidden">
        <div className="relative z-10 flex min-h-screen flex-col pt-24">
          {/* Main hero row: left 2/3 cycling words, right 1/3 text + line + seal — same grid/alignment on mobile and desktop */}
          <div className="grid flex-1 grid-cols-12 gap-4 items-center px-6 pt-10 pb-0 lg:gap-8 lg:px-12 lg:pt-16">
            {/* Left: cycling display words + sublines (2/3), left-aligned, vertically centered */}
            <div className="relative min-h-[200px] w-full col-span-8 lg:min-h-[260px] self-center">
              {cycleItems.map((item, i) => (
                <div
                  key={item.word}
                  className={`absolute inset-0 flex flex-col justify-center font-display text-white ${`hero-cycle-item-${i + 1}`}`}
                  style={{ pointerEvents: 'none' }}
                >
                  <span className="text-5xl font-normal tracking-tight md:text-[10em]">
                    {item.word}
                  </span>
                  <span className="mt-2 font-sans text-base font-normal text-white/80 md:text-lg lg:text-xl">
                    {item.subline}
                  </span>
                </div>
              ))}
            </div>

            {/* Right: small text, vertical line, seal (1/3) */}
            <div className="flex min-h-[200px] flex-col items-end justify-center gap-4 col-span-4 lg:min-h-0">
              <p className="max-w-[180px] text-right font-sans text-sm font-normal text-white/90 lg:text-base">
                Where passion becomes community
              </p>
              <div className=" w-px bg-white/50 md:h-[35vh] h-[20vh] mr-10" aria-hidden />
              <Image
                src="/images/seal_white.png"
                alt=""
                width={128}
                height={128}
                className="h-auto w-24 object-contain lg:w-32"
                aria-hidden
              />
            </div>
          </div>

          {/* Centered row: tagline, button, "or learn more", trio — section height shows only top half of a larger image */}
          <div className="flex flex-1 w-full min-h-0 flex-col items-center gap-6 px-4 pb-0 pt-6 md:pt-0 lg:px-6">
            <p className="max-w-2xl text-center font-sans text-base text-white/90 md:text-lg">
              The Formula 1 fan platform built on passion, not performance metrics.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Sign Up
            </Link>
            {/* Clipped so phones are centered; on mobile only 50% of screen height; flush to next section on desktop */}
            <div className="relative w-full max-w-6xl overflow-hidden mx-auto flex-1
              min-h-[22vh] max-h-[50vh] md:min-h-[45vh] md:max-h-none">
              <Image
                src="/images/trio.png"
                alt=""
                width={500}
                height={550}
                className="absolute inset-0 object-cover object-top w-full h-full"
                sizes="(max-width: 768px) 100vw, 1024px"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
