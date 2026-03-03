import Image from 'next/image'

/**
 * Shared loading UI: logo (seal) in gradient circle + "Loading..." text.
 * Used by LoadingScreen (initial/nav overlay) and route loading.tsx files
 * for a consistent loading experience.
 */
export function LoadingLogo() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative flex h-[min(28vw,144px)] w-[min(28vw,144px)] min-h-[80px] min-w-[80px] max-h-[160px] max-w-[160px] flex-shrink-0 overflow-hidden rounded-full">
        <div
          className="absolute left-1/2 top-1/2 z-0 h-[200%] w-[170%] min-h-[170%] min-w-[170%] -translate-x-1/2 -translate-y-1/2 animate-slot-border-rotate"
          style={{
            background:
              'linear-gradient(90deg, #EC6D00 0%,#25B4B1 10%, #FF006F 20%, #25B4B1 30%, #FF006F 40%, #25B4B1 50%, #FF006F 60%, #25B4B1 70%, #FF006F 80%, #EC6D00 100%)',
          }}
        />
        <div className="absolute inset-[2.5px] z-10 flex min-h-0 items-center justify-center overflow-hidden rounded-full bg-black p-4">
          <Image
            src="/images/seal_white.png"
            alt=""
            width={112}
            height={112}
            priority
            className="h-full w-full object-contain"
          />
        </div>
      </div>
      <p className="font-display text-lg text-white">Loading...</p>
    </div>
  )
}
