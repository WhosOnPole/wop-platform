import Link from 'next/link'

export default function HomePage() {
  const cycleItems = [
    { word: 'Community', subline: 'F1 fandom, redefined' },
    { word: 'Motorsport', subline: 'Built for the love of it' },
    { word: 'Passion', subline: 'Connection fueled by obsession' },
  ] as const

  return (
    <div className="min-h-screen bg-black">
      {/* Background image */}
      <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/images/landing_bg.jpg)' }}
      />
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
              <img
                src="/images/seal_white.png"
                alt=""
                className="h-auto w-24 object-contain lg:w-32"
                width={128}
                height={128}
              />
            </div>
          </div>

          {/* Centered row: tagline, button, "or learn more", trio - hidden on mobile, visible from md up */}
          <div className="flex w-full flex-col items-center gap-6 px-6 pb-12 lg:pb-16 pt-24 md:pt-0">
            <p className="max-w-2xl text-center font-sans text-base text-white/90 md:text-lg">
              The Formula 1 fan platform built on passion, not performance metrics.
            </p>
            <Link
              href="/signup"
              className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Sign Up
            </Link>
            <Link
              href="/#who-we-are"
              className="text-center text-sm text-white/70 underline underline-offset-2 hover:text-white"
            >
              or learn more
            </Link>
            <img
              src="/images/trio.png"
              alt=""
              className="h-auto w-full max-w-5xl object-contain px-4 relative md:top-[-10vh]"
              width={500}
              height={550}
            />
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section
        id="who-we-are"
        className="scroll-mt-20 border-t border-white/10 px-6 py-16 lg:px-12"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-normal text-white md:text-4xl">
            Who we are
          </h2>
          <p className="mt-4 font-sans text-base text-white/80 md:text-lg">
            We&apos;re building a space for women and fans in the world of F1. Community over
            metrics, passion over performance. Join the conversation.
          </p>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t border-white/10 px-6 py-16 lg:px-12"
      >
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-normal text-white md:text-4xl">
            Features
          </h2>
          <p className="mt-4 font-sans text-base text-white/80 md:text-lg">
            Build your dream grid, connect with fans, chat during race weekends, and more.
          </p>
        </div>
      </section>
    </div>
  )
}
