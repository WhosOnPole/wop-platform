/**
 * Date utilities for admin (tracks/schedule).
 * Kept in sync with apps/web/utils/date-utils for parseDateOnly, formatWeekendRange.
 * localToUtc is used when saving track_events (local at track -> UTC).
 */

export function parseDateOnly(dateStr: string | null): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  return new Date(dateStr + 'T12:00:00Z')
}

export function formatDateShort(dateStr: string | null, timeZone = 'UTC'): string | null {
  const d =
    dateStr?.includes('T') || (dateStr && dateStr.length > 10)
      ? new Date(dateStr)
      : parseDateOnly(dateStr ?? null)
  if (!d || isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: dateStr && dateStr.length <= 10 ? undefined : 'numeric',
    timeZone,
  })
}

/** Format weekend range from start_date and end_date. Same month: "Mar 7-8". Different months: "Mar 7 - Apr 2". */
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
  if (diff > 12 * 60) tzMins -= 24 * 60
  else if (diff < -12 * 60) tzMins += 24 * 60
  return tzMins - utcMins
}

/**
 * Convert local datetime string (YYYY-MM-DDTHH:mm) in the given IANA timezone to ISO UTC.
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

/**
 * Format a UTC ISO string for display in the given timezone (for datetime-local value).
 */
export function utcToLocalDatetimeString(utcIso: string, timezone: string): string {
  if (!utcIso || !timezone) return ''
  const d = new Date(utcIso)
  if (isNaN(d.getTime())) return ''
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(d)
  const get = (type: Intl.DateTimeFormatPart['type']) =>
    parts.find((p) => p.type === type)?.value ?? ''
  const y = get('year')
  const m = get('month')
  const day = get('day')
  const h = get('hour')
  const min = get('minute')
  return `${y}-${m}-${day}T${h}:${min}`
}
