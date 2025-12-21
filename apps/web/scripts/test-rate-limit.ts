/**
 * Test script for rate limiting API
 * 
 * Usage:
 *   pnpm tsx apps/web/scripts/test-rate-limit.ts
 * 
 * This script simulates multiple requests to test rate limiting
 */

const API_URL = process.env.API_URL || 'http://localhost:3000'
const ENDPOINT = 'login'

async function makeRequest(attempt: number) {
  try {
    const response = await fetch(`${API_URL}/api/auth/rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint: ENDPOINT }),
    })

    const data = await response.json()
    const headers = {
      limit: response.headers.get('X-RateLimit-Limit'),
      remaining: response.headers.get('X-RateLimit-Remaining'),
      reset: response.headers.get('X-RateLimit-Reset'),
    }

    console.log(`\nAttempt ${attempt}:`)
    console.log(`  Status: ${response.status} ${response.statusText}`)
    console.log(`  Response:`, data)
    console.log(`  Headers:`, headers)

    return {
      success: response.ok,
      status: response.status,
      data,
      headers,
    }
  } catch (error: any) {
    console.error(`Attempt ${attempt} failed:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🧪 Testing Rate Limiting API')
  console.log(`📍 API URL: ${API_URL}`)
  console.log(`🎯 Endpoint: ${ENDPOINT}`)
  console.log('\n' + '='.repeat(50))

  const results = []

  // Make 7 requests (5 allowed + 2 should be blocked)
  for (let i = 1; i <= 7; i++) {
    const result = await makeRequest(i)
    results.push(result)

    // Small delay between requests
    if (i < 7) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Summary:')
  console.log('='.repeat(50))

  const successful = results.filter((r) => r.success && r.status === 200).length
  const rateLimited = results.filter((r) => r.status === 429).length
  const failed = results.filter((r) => !r.success || (r.status !== 200 && r.status !== 429)).length

  console.log(`✅ Successful requests (200): ${successful}`)
  console.log(`🚫 Rate limited requests (429): ${rateLimited}`)
  console.log(`❌ Failed requests: ${failed}`)

  // Expected: 5 successful, 2 rate limited
  if (successful === 5 && rateLimited === 2) {
    console.log('\n🎉 Test PASSED! Rate limiting is working correctly.')
  } else {
    console.log('\n⚠️  Test results unexpected. Expected 5 successful and 2 rate limited.')
    console.log('   This might be normal if:')
    console.log('   - The migration hasn\'t been applied yet')
    console.log('   - Environment variables are missing')
    console.log('   - You\'re testing from a different IP')
  }

  // Show rate limit info from last successful request
  const lastSuccess = results.find((r) => r.success && r.status === 200)
  if (lastSuccess?.headers) {
    console.log('\n📋 Rate Limit Info:')
    console.log(`   Limit: ${lastSuccess.headers.limit} requests`)
    console.log(`   Remaining: ${lastSuccess.headers.remaining} requests`)
    if (lastSuccess.headers.reset) {
      const resetDate = new Date(lastSuccess.headers.reset)
      console.log(`   Resets at: ${resetDate.toLocaleString()}`)
    }
  }

  // Show rate limited response
  const rateLimitedResponse = results.find((r) => r.status === 429)
  if (rateLimitedResponse?.data) {
    console.log('\n🚫 Rate Limited Response:')
    console.log(`   Error: ${rateLimitedResponse.data.error}`)
    if (rateLimitedResponse.data.retryAfter) {
      console.log(`   Retry after: ${rateLimitedResponse.data.retryAfter} seconds`)
    }
  }
}

// Run tests
runTests().catch(console.error)

