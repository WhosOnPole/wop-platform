#!/usr/bin/env node

/**
 * Build-time environment variable verification script
 * Ensures required Supabase env vars are available during Cloudflare Pages build
 */

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

const missingVars = requiredVars.filter((varName) => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables during build:')
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`)
  })
  console.error('\n💡 Make sure these are set in Cloudflare Pages:')
  console.error('   Settings → Variables and Secrets → Add variable')
  console.error('\n   For build-time access, ensure variables are available during the build phase.')
  process.exit(1)
}

console.log('✅ All required environment variables are available during build')
requiredVars.forEach((varName) => {
  const value = process.env[varName]
  const preview = value.length > 30 ? value.substring(0, 30) + '...' : value
  console.log(`   ${varName}: ${preview}`)
})

