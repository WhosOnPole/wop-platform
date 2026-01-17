const INSTAGRAM_USERNAME_REGEX =
  /(?:https?:\/\/www\.instagram\.com\/|data-instgrm-permalink=")(?:.*?instagram\.com\/)?([A-Za-z0-9._]+)\/?/i

interface ParseInstagramUsernameParams {
  embedHtml: string | null | undefined
}

export function getInstagramUsernameFromEmbed({ embedHtml }: ParseInstagramUsernameParams) {
  if (!embedHtml) return null

  const match = embedHtml.match(INSTAGRAM_USERNAME_REGEX)
  if (!match || !match[1]) return null

  const username = match[1].replace(/\/$/, '')
  if (!username) return null

  return { username }
}
