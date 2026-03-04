import { GET as tiktokHandler } from '../route'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  return tiktokHandler(request)
}
