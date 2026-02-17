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
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: opts?.year ?? (dateStr && dateStr.length <= 10 ? undefined : 'numeric'),
    timeZone: opts?.timeZone ?? 'UTC',
  })
}

/**
 * Format weekend range from start_date and end_date.
 * Same month: "Mar 7-8". Different months: "Mar 7 - Apr 2".
 */
export function formatWeekendRange(
  startDate: string | null,
  endDate: string | null
): string | null {
  const start = startDate?.includes('T') ? new Date(startDate) : parseDateOnly(startDate ?? null)
  const end = endDate?.includes('T') ? new Date(endDate) : parseDateOnly(endDate ?? null)
  if (!start || isNaN(start.getTime())) {
    return endDate ? formatDateShort(endDate) : null
  }
  if (!end || isNaN(end.getTime())) {
    return formatDateShort(startDate)
  }
  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() &&
    start.getUTCFullYear() === end.getUTCFullYear()
  if (sameMonth) {
    const monthShort = end.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    return `${monthShort} ${start.getUTCDate()}-${end.getUTCDate()}`
  }
  return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`
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
