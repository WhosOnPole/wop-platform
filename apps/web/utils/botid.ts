import { checkBotId } from 'botid/server'

/**
 * Server-side BotID verification utility
 * Validates BotID token from request headers
 * 
 * @param request - Next.js request object
 * @returns Promise<{ valid: boolean; error?: string }>
 */
export async function verifyBotId(request: Request): Promise<{ valid: boolean; error?: string }> {
  try {
    // checkBotId reads BOTID from environment automatically
    // It also handles development mode automatically
    const result = await checkBotId(request)

    if (!result.valid) {
      return { valid: false, error: result.reason || 'BotID verification failed' }
    }

    return { valid: true }
  } catch (error) {
    console.error('BotID verification error:', error)
    // Fail closed in production, open in development
    if (process.env.NODE_ENV === 'development') {
      return { valid: true }
    }
    return { valid: false, error: 'BotID verification error' }
  }
}

