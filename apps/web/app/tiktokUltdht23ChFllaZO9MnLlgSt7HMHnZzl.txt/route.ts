import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// TikTok domain verification file
// This file is required by TikTok for domain verification
export async function GET() {
  return new NextResponse('tiktokUltdht23ChFllaZO9MnLlgSt7HMHnZzl', {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
