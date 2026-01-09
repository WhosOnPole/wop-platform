import { GET as tiktokHandler } from '../tiktok/route'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  return tiktokHandler(request)
}
