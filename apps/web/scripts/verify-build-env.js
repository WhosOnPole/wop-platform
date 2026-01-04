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
  console.error('\n💡 SOLUTION: Configure environment variables in Cloudflare Pages')
  console.error('\n   1. Go to Cloudflare Dashboard → Your Project → Settings')
  console.error('   2. Navigate to "Variables and Secrets"')
  console.error('   3. Add the missing variables:')
  console.error('      - NEXT_PUBLIC_SUPABASE_URL (Plaintext)')
  console.error('      - NEXT_PUBLIC_SUPABASE_ANON_KEY (Secret)')
  console.error('\n   ⚠️  IMPORTANT: After adding variables, you may need to:')
  console.error('      - Trigger a new deployment')
  console.error('      - Or wait for the next automatic deployment')
  console.error('\n   📖 See apps/web/CLOUDFLARE_BUILD.md for detailed instructions')
  console.error('\n   🔍 Current environment check:')
  console.error(`      NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ Missing'}`)
  console.error(`      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing'}`)
  console.error('\n   💭 Note: If variables are set in Cloudflare but still missing here,')
  console.error('      they may only be available at runtime, not during build.')
  console.error('      This will prevent ISR (Incremental Static Regeneration) from working.')
  process.exit(1)
}

console.log('✅ All required environment variables are available during build')
requiredVars.forEach((varName) => {
  const value = process.env[varName]
  const preview = value.length > 30 ? value.substring(0, 30) + '...' : value
  console.log(`   ${varName}: ${preview}`)
})

