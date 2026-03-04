/**
 * Date parsing and formatting utilities for race dates.
 * Use parseDateOnly for PostgreSQL date-only (YYYY-MM-DD) strings to avoid
 * timezone shift when displaying in local timezones.
 */

/**
 * For date-only YYYY-MM-DD strings: append noon UTC to avoid timezone shift
 * when formatting (e.g. toLocaleDateString in PST would show previous day otherwise).
 */
export function parseDateOnly(dateStr: string | null): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  return new Date(dateStr + 'T12:00:00Z')
}

/**
 * Format a date string (ISO or YYYY-MM-DD) as short date (e.g. "Mar 8").
 * Uses parseDateOnly for date-only strings to avoid offset bug.
 */
export function formatDateShort(
  dateStr: string | null,
  opts?: { timeZone?: string; year?: boolean }
): string | null {
  const d =
    dateStr?.includes('T') || (dateStr && dateStr.length > 10)
      ? new Date(dateStr)
      : parseDateOnly(dateStr ?? null)
  if (!d || isNaN(d.getTime())) return null
  const showYear =
    opts?.year === true ? true : opts?.year === false ? false : !(dateStr && dateStr.length <= 10)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: showYear ? ('numeric' as const) : undefined,
    timeZone: opts?.timeZone ?? 'UTC',
  })
}

/**
 * Normalize an ISO or YYYY-MM-DD string to date-only for calendar display.
 * Avoids timezone shift: "2026-03-06T00:00:00.000" (no Z) is parsed as local and can show as Mar 5.
 */
function toDateOnlyForDisplay(dateStr: string | null): string | null {
  if (!dateStr) return null
  const dateOnly = /^\d{4}-\d{2}-\d{2}/.exec(dateStr)?.[0] ?? (dateStr.length >= 10 ? dateStr.slice(0, 10) : null)
  return dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : null
}

/**
 * Format weekend range from start_date and end_date.
 * Uses the calendar date (weekend_start / weekend_end) only so display is correct in any timezone.
 * Same month: "Mar 6-8". Different months: "Mar 6 - Apr 2".
 * Pass opts.year: false to omit the year.
 */
export function formatWeekendRange(
  startDate: string | null,
  endDate: string | null,
  opts?: { year?: boolean }
): string | null {
  const startPart = toDateOnlyForDisplay(startDate)
  const endPart = toDateOnlyForDisplay(endDate)
  const start = startPart ? parseDateOnly(startPart) : null
  const end = endPart ? parseDateOnly(endPart) : null
  const noYear = opts?.year === false
  if (!start || isNaN(start.getTime())) {
    return endPart ? formatDateShort(endPart, { year: noYear ? false : undefined }) : null
  }
  if (!end || isNaN(end.getTime())) {
    return formatDateShort(startPart, { year: noYear ? false : undefined })
  }
  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() &&
    start.getUTCFullYear() === end.getUTCFullYear()
  if (sameMonth) {
    const monthShort = end.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    return `${monthShort} ${start.getUTCDate()}-${end.getUTCDate()}`
  }
  return `${formatDateShort(startPart, { year: noYear ? false : undefined })} - ${formatDateShort(endPart, { year: noYear ? false : undefined })}`
}

/**
 * Get the offset in minutes (tz - UTC) for a timezone at a given date.
 * So UTC = localMs - offsetMs.
 */
function getTimezoneOffsetMinutes(timezone: string, date: Date): number {
  const utcHour = date.getUTCHours()
  const utcMin = date.getUTCMinutes()
  const tzFormatted = date.toLocaleString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const [tzH, tzM] = tzFormatted.split(':').map(Number)
  const utcMins = utcHour * 60 + utcMin
  let tzMins = tzH * 60 + (tzM ?? 0)
  const diff = tzMins - utcMins
  // Handle day boundary (e.g. tz next day)
  if (diff > 12 * 60) tzMins -= 24 * 60
  else if (diff < -12 * 60) tzMins += 24 * 60
  return tzMins - utcMins
}

const EASTERN = 'America/New_York'

/**
 * Format the timezone difference between a track's timezone and Eastern Time.
 * Returns e.g. "16 hours ahead of EST" or "5 hours behind EDT".
 */
export function formatTimezoneVsEst(trackTimezone: string): string {
  const now = new Date()
  const trackOffsetMin = getTimezoneOffsetMinutes(trackTimezone, now)
  const easternOffsetMin = getTimezoneOffsetMinutes(EASTERN, now)
  const diffMin = trackOffsetMin - easternOffsetMin
  const diffHours = Math.round(diffMin / 60)
  const easternLabel = easternOffsetMin === -300 ? 'EST' : 'EDT'
  if (diffHours === 0) return `same as ${easternLabel}`
  if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ahead of ${easternLabel}`
  return `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} behind ${easternLabel}`
}

/**
 * Convert a local datetime string (YYYY-MM-DDTHH:mm or HH:mm) in the given
 * IANA timezone to an ISO string in UTC.
 */
export function localToUtc(localDatetime: string, timezone: string): string {
  if (!localDatetime?.trim() || !timezone) return ''
  const s = localDatetime.trim()
  const datePart = s.slice(0, 10)
  const timePart = s.includes('T') ? s.slice(11, 16) : '00:00'
  const [hours, minutes] = timePart.split(':').map(Number)
  const [y, m, d] = datePart.split('-').map(Number)
  const localAsUtc = Date.UTC(y, (m ?? 1) - 1, d ?? 1, hours ?? 0, minutes ?? 0, 0, 0)
  const refDate = new Date(localAsUtc)
  const offsetMin = getTimezoneOffsetMinutes(timezone, refDate)
  const utcMs = localAsUtc - offsetMin * 60 * 1000
  return new Date(utcMs).toISOString()
}
