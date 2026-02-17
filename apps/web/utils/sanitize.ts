/**
 * Shared sanitization and validation for user inputs to prevent injection attacks
 * (SQL, XSS, command injection). Use for track tips and other user-generated content.
 */

const INJECTION_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /union\s+select/i,
  /drop\s+table/i,
  /insert\s+into/i,
  /delete\s+from/i,
  /['";]/,
  /<\s*iframe/i,
  /<\s*object/i,
  /<\s*embed/i,
  /data:\s*text\/html/i,
]

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const TIP_TYPE_ALLOWED = ['tips', 'stays', 'transit'] as const
export type TipType = (typeof TIP_TYPE_ALLOWED)[number]

const TIP_CONTENT_MAX_LENGTH = 2000

/**
 * Validates that a string is a valid UUID format.
 */
export function validateUuid(value: string): boolean {
  if (typeof value !== 'string' || !value.trim()) return false
  return UUID_REGEX.test(value.trim())
}

/**
 * Validates that tip type is one of the allowed values.
 */
export function validateTipType(value: string): value is TipType {
  return TIP_TYPE_ALLOWED.includes(value as TipType)
}

/**
 * Sanitizes and validates tip content. Returns { ok: true, value } or { ok: false, error }.
 * - Trims whitespace
 * - Enforces max length (2000 chars)
 * - Rejects content matching injection/XSS patterns
 */
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
