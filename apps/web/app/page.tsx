import Image from 'next/image'
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
            <Link
              href="/#who-we-are"
              className="text-center text-sm text-white/70 underline underline-offset-2 hover:text-white"
            >
              or learn more
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

      {/* What we do */}
      <section
        id="features"
        className="scroll-mt-20 border-t border-white/10 px-6 py-16 lg:px-12"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-normal text-white md:text-4xl text-center">
            What We Do
          </h2>
          <div className="mt-8 space-y-10 font-sans text-base text-white/90 md:text-lg leading-relaxed">
            <p>
              Who&apos;s On Pole is a social platform designed for fans to broadcast their racing opinions, find community, and share their stories. Think of us as a mix of old-school MySpace, F1 meme forums, and a motorsport news outlet - but centered on you, the fan.
            </p>

            <div>
              <h3 className="font-display text-xl font-normal text-white md:text-2xl mb-3">
                Your Profile
              </h3>
              <p className="mb-3">
                Your profile page is the heart of the Who&apos;s On Pole experience - a blank space to make your own. Build your dream grid by selecting up to 10 drivers. Maybe you&apos;ve got data and essays defending every pick. Maybe you&apos;re a loyalist and only showcase your #1. Every type of grid is perfect, as long as it&apos;s unapologetically yours.
              </p>
              <p>
                Your profile also displays your favorite tracks, your votes in polls, and your comments across driver and team pages. Think of it as your racing DNA - easy to share, easy to discover, and a great way to find like-minded fans. And if you&apos;re really dedicated, you might even land a spot on a driver&apos;s Top Fans Grid.
              </p>
            </div>

            <div>
              <h3 className="font-display text-xl font-normal text-white md:text-2xl mb-3">
                Fan Features
              </h3>
              <p className="mb-3">
                This is where fans take center stage. Fan Features is a space to read others&apos; experiences - or share your own. No story is too big or too small:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Meeting a driver you&apos;ve always admired</li>
                <li>A funny travel mishap on the way to a race</li>
                <li>Landing your dream job in motorsport</li>
                <li>A throwback from the Senna days</li>
                <li>Your reaction to a recent race or news story</li>
                <li>Showcasing fun piece of merch or craft you made</li>
              </ul>
              <p>
                Send it in (with a picture if you&apos;d like), and your story could be featured on our front page or socials.
              </p>
            </div>

            <div>
              <h3 className="font-display text-xl font-normal text-white md:text-2xl mb-3">
                Poles & Podiums
              </h3>
              <p>
                For the highly opinionated - which, let&apos;s face it, most of us are. Poles & Podiums is our ever-updated section of interactive polls and predictions, fueled by the F1 rumor mill. Rookie of the Year? Cadillac&apos;s future driver lineup? Place your bets and share your takes. And if your prediction comes true? That&apos;s bragging rights forever.
              </p>
            </div>

            <div>
              <h3 className="font-display text-xl font-normal text-white md:text-2xl mb-3">
                More to Explore
              </h3>
              <p className="mb-3">
                These are just the highlights. You can also:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Dive into driver, team, and track discussion pages</li>
                <li>Scroll through your personalized daily feed</li>
                <li>Join our live race reaction chats</li>
              </ul>
              <p className="mb-3">
                And this is just the beginning. As Who&apos;s On Pole grows, we plan to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Partner with F1 teams to create fan experiences</li>
                <li>Launch a marketplace spotlighting innovative, female-focused motorsport businesses</li>
                <li>Keep evolving based on your feedback</li>
              </ul>
              <p>
                We want you along for the ride. Got questions, suggestions, complaints, compliments, or just want to say hi? Reach us at{' '}
                <a
                  href="mailto:contactus@whosonpole.org"
                  className="text-white underline underline-offset-2 hover:text-white/90"
                >
                  contactus@whosonpole.org
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
