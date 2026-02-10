/** Default avatar image when a user has no profile image. Used site-wide. */
export const DEFAULT_AVATAR_URL = '/images/seal_color.png'

export function getAvatarUrl(profileImageUrl: string | null | undefined): string {
  return profileImageUrl?.trim() || DEFAULT_AVATAR_URL
}
