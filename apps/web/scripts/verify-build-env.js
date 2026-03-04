#!/usr/bin/env node

/**
 * Build-time environment variable verification script
 * Ensures required Supabase env vars are available during build
 */

const fs = require('fs')
const path = require('path')

// Load .env.local file if it exists (for local development)
const envLocalPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envLocalPath)) {
  try {
    const envFile = fs.readFileSync(envLocalPath, 'utf8')
    envFile.split('\n').forEach((line) => {
      const trimmedLine = line.trim()
      // Skip comments and empty lines
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^([^=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim()
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          // Only set if not already in process.env (env vars take precedence)
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      }
    })
  } catch (error) {
    console.warn('⚠️  Could not read .env.local, continuing with existing environment:', error?.message)
  }
}

const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']

const missingVars = requiredVars.filter((varName) => !process.env[varName])

// Only fail in CI environments, allow local builds to proceed
const isCI = process.env.CI === 'true' || process.env.VERCEL === '1'

if (missingVars.length > 0) {
  if (isCI) {
    // In CI, this is a critical error
    console.error('❌ Missing required environment variables during build:')
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`)
    })
    console.error('\n💡 SOLUTION: Configure environment variables in your hosting env')
    console.error('\n   1. Go to your project dashboard → Settings')
    console.error('   2. Navigate to environment variables / secrets')
    console.error('   3. Add the missing variables:')
    console.error('      - NEXT_PUBLIC_SUPABASE_URL (Plaintext)')
    console.error('      - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Publishable key)')
    console.error('\n   ⚠️  IMPORTANT: After adding variables, you may need to:')
    console.error('      - Trigger a new deployment')
    console.error('      - Or wait for the next automatic deployment')
    console.error('\n   📖 See deployment docs for detailed instructions')
    console.error('\n   🔍 Current environment check:')
    console.error(`      NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ Missing'}`)
    console.error(
      `      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✅ Found' : '❌ Missing'
      }`,
    )
    console.error('\n   💭 Note: Variables must be available at build time for ISR.')
    console.error('      This will prevent ISR (Incremental Static Regeneration) from working.')
    process.exit(1)
  } else {
    // In local development, just warn but allow build to continue
    console.warn('⚠️  Missing environment variables (local build - continuing anyway):')
    missingVars.forEach((varName) => {
      console.warn(`   - ${varName}`)
    })
    console.warn('   💡 These should be set in your hosting environment for production builds')
    console.warn('   📖 See deployment docs for details\n')
  }
}

console.log('✅ All required environment variables are available during build')
requiredVars.forEach((varName) => {
  const value = process.env[varName]
  if (!value) {
    console.log(`   ${varName}: (not set in process.env)`)
    return
  }
  const preview = value.length > 30 ? value.substring(0, 30) + '...' : value
  console.log(`   ${varName}: ${preview}`)
})

