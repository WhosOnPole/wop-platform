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
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-normal text-white md:text-4xl text-center">
            Who We Are
          </h2>
          <div className="mt-8 space-y-6 font-sans text-base text-white/90 md:text-lg leading-relaxed">
            <p>Hello racing fans! ❤️</p>
            <p>
              We are so excited to welcome you to Who&apos;s On Pole - our passion project created to enhance the motorsport fan experience and give all fans, especially the new wave of supporters, a space to feel like an important part of the sport and its community. Because you are.
            </p>
            <p>
              We&apos;re a mother-daughter team who dreamed up this site after attending our very first race, the 2025 Belgian Grand Prix. It was a life-changing experience that fundamentally changed the way we thought about the world of F1. A few things stood out most:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-white">F1 fan passion is unmatched.</strong> From figuring out the Belgian bus system with zero French skills, to dragging our suitcases down rural dirt roads, to trekking to and from the track each hot day - we realized how much dedication it takes for the average fan to simply be there. Yet we were far from alone. Hundreds of thousands of people lined every inch of Spa&apos;s 7 km circuit - from the glamour of the paddock club balconies to hammocks strung up in the forest.
              </li>
              <li>
                <strong className="text-white">A new type of fan is reshaping motorsport.</strong> Everywhere we went, it was clear: women have embraced Formula 1 with unstoppable energy. They are a driving force behind F1&apos;s rise in the U.S. and beyond, carving out unapologetic space in a world that wasn&apos;t originally built with them in mind. We love this type of fan, because we are this type of fan. Who&apos;s On Pole is our love letter to motorsport and the joy it&apos;s brought into our lives.
              </li>
              <li>
                <strong className="text-white">F1 is expensive.</strong> This sport is expensive and inaccessible for many. While we can&apos;t change that, we hope to create expansion and give our passionate users experiences you might not otherwise have. This site is community-funded. Some donations will go toward gifting these experiences to those whose stories touch us and those whose contributions make this site a place other fans want to be.
              </li>
            </ul>
            <p>
              We hope you love this site as much as we do. We built it for you - the fan who looks forward to race day all week through long, hard days at work. The fan who found a passion for engineering, marketing, or hospitality through motorsport. The fan who cried when Danny Ric left (don&apos;t worry, we did too). The fan who never stops believing in their driver, no matter what other people think. The fan who&apos;s discovered true community and belonging in this sport.
            </p>
            <p className="italic text-white">
              To borrow the words of the amazing Laura Winter: &ldquo;We are here to stay, and we are right where we belong.&rdquo;
            </p>
            <p>With love, D & M</p>
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
