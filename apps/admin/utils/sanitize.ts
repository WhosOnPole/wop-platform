/**
 * Sanitization for track tip content (admin edit). Matches web app sanitize logic.
 */

const INJECTION_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /union\s+select/i,
  /drop\s+table/i,
  /insert\s+into/i,
  /delete\s+from/i,
  /<\s*iframe/i,
  /<\s*object/i,
  /<\s*embed/i,
  /data:\s*text\/html/i,
]

const TIP_CONTENT_MAX_LENGTH = 2000

export function sanitizeTipContent(
  raw: string
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Invalid tip content.' }
  }
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return { ok: false, error: 'Tip content is required.' }
  }
  if (trimmed.length > TIP_CONTENT_MAX_LENGTH) {
    return { ok: false, error: `Tip must be ${TIP_CONTENT_MAX_LENGTH} characters or less.` }
  }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { ok: false, error: 'Tip contains invalid characters or patterns.' }
    }
  }
  return { ok: true, value: trimmed }
}
