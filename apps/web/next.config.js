const path = require('path')
const { withBotId } = require('botid/next/config')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Set tracing root for monorepo builds
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http', // allow localhost in dev
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'www.formula1.com',
      },
    ],
  },
}

// Build-time verification of required env vars
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  console.log('✅ Supabase env vars are available during build')
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...')
  console.log(
    '   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.substring(0, 20) + '...',
  )
} else {
  console.error('❌ Supabase env vars are MISSING during build!')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌')
  console.error(
    '   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✅' : '❌',
  )
  if (process.env.CI) {
    console.error('   This will cause build failures. Ensure env vars are set in deployment settings.')
  }
}

module.exports = withBotId(nextConfig)

