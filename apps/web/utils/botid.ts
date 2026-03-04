import { checkBotId } from 'botid/server'
import type { NextRequest } from 'next/server'
import type { IncomingHttpHeaders } from 'node:http'

/**
 * Server-side BotID verification utility
 * Validates BotID token from request headers
 * 
 * @param request - Next.js request object
 * @returns Promise<{ valid: boolean; error?: string }>
 */
export async function verifyBotId(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  try {
    // Extract headers from Next.js request and convert to IncomingHttpHeaders format
    const headers: IncomingHttpHeaders = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // checkBotId reads BOTID from environment automatically
    // Pass headers via advancedOptions
    const result = await checkBotId({
      developmentOptions: {
        isDevelopment: process.env.NODE_ENV === 'development',
      },
      advancedOptions: {
        headers,
      },
    })

    // Check if it's a bot (not human) and not a verified bot
    if (result.isBot && !result.isVerifiedBot) {
      return { valid: false, error: 'Bot detected' }
    }

    // Allow humans and verified bots
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

