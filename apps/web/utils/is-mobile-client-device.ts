type NavigatorWithUaData = Navigator & {
  userAgentData?: { mobile?: boolean }
}

/**
 * True when the browser is very likely running on a phone or tablet.
 * Intentionally ignores viewport width so resizing a desktop window cannot unlock the app.
 */
export function isMobileClientDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  const uaData = (navigator as NavigatorWithUaData).userAgentData
  if (uaData?.mobile === true) return true

  const ua = (
    navigator.userAgent ||
    navigator.vendor ||
    (typeof window !== 'undefined' && (window as Window & { opera?: string }).opera) ||
    ''
  ).toLowerCase()

  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) return true

  // iPadOS 13+ “desktop” Safari: Mac UA but multi-touch hardware
  if (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1 && /macintosh/.test(ua)) {
    return true
  }

  return false
}
