import { LoadingLogo } from '@/components/loading-logo'

export default function EntityLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black" aria-hidden>
      <LoadingLogo />
    </div>
  )
}
