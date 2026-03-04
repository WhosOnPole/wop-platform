# Testing Rate Limiting

This guide explains how to test the rate limiting functionality after migrating to Supabase.

## Prerequisites

1. **Apply the migration:**
   ```bash
   # Option 1: Using Supabase CLI
   supabase migration up
   
   # Option 2: Via Supabase Dashboard
   # Go to SQL Editor and run:
   # supabase/migrations/021_create_rate_limits_table.sql
   ```

2. **Verify environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Should be set
   - `SUPABASE_SECRET_KEY` - Should be set (server-side only)

3. **Start the development server:**
   ```bash
   pnpm dev:web
   # Server should be running on http://localhost:3000
   ```

## Testing Methods

### Method 1: Using curl (Recommended)

Open a terminal and run:

```bash
# Make 7 requests to test rate limiting
for i in {1..7}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/auth/rate-limit \
    -H "Content-Type: application/json" \
    -d '{"endpoint":"login"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 0.5
done
```

**Expected Results:**
- Requests 1-5: `Status: 200` with `"success": true`
- Requests 6-7: `Status: 429` with `"error": "Too many requests..."`

### Method 2: Using the Test Script

```bash
# Make script executable
chmod +x apps/web/scripts/test-rate-limit.sh

# Run the test
./apps/web/scripts/test-rate-limit.sh
```

### Method 3: Manual Browser Testing

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run this JavaScript:

```javascript
async function testRateLimit() {
  for (let i = 1; i <= 7; i++) {
    const response = await fetch('/api/auth/rate-limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: 'login' })
    });
    
    const data = await response.json();
    console.log(`Request ${i}:`, response.status, data);
    
    if (i < 7) await new Promise(r => setTimeout(r, 500));
  }
}

testRateLimit();
```

### Method 4: Using Postman or Insomnia

1. Create a POST request to: `http://localhost:3000/api/auth/rate-limit`
2. Set headers:
   - `Content-Type: application/json`
3. Set body (JSON):
   ```json
   {
     "endpoint": "login"
   }
   ```
4. Send the request 7 times
5. Check responses:
   - First 5: Status 200
   - Last 2: Status 429

## What to Look For

### Successful Response (200):
```json
{
  "success": true,
  "remaining": 4,
  "resetAt": "2024-01-15T10:30:00.000Z"
}
```

**Response Headers:**
- `X-RateLimit-Limit: 5`
- `X-RateLimit-Remaining: 4`
- `X-RateLimit-Reset: 2024-01-15T10:30:00.000Z`

### Rate Limited Response (429):
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 900,
  "resetAt": "2024-01-15T10:30:00.000Z"
}
```

**Response Headers:**
- `Retry-After: 900`
- `X-RateLimit-Limit: 5`
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: 2024-01-15T10:30:00.000Z`

## Verifying Database

You can check the rate limits table in Supabase:

```sql
-- View current rate limits
SELECT * FROM rate_limits 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for expired records (should be cleaned up automatically)
SELECT * FROM rate_limits 
WHERE expires_at < NOW();

-- Manual cleanup (if needed)
SELECT cleanup_expired_rate_limits();
```

## Troubleshooting

### Issue: All requests return 200
**Possible causes:**
- Migration not applied
- `SUPABASE_SECRET_KEY` not set
- Database connection issue

**Solution:**
1. Check migration status in Supabase Dashboard
2. Verify environment variable is set
3. Check server logs for errors

### Issue: Getting 500 errors
**Possible causes:**
- Missing environment variables
- Database permissions issue
- RLS policy blocking access

**Solution:**
1. Check server console for error messages
2. Verify service role key has correct permissions
3. Check RLS policies on `rate_limits` table

### Issue: Rate limits not persisting
**Possible causes:**
- Using different IP addresses
- Database not being written to
- Multiple instances with different databases

**Solution:**
1. Ensure you're testing from the same IP
2. Check database for records after requests
3. Verify Supabase connection is working

## Testing Different Endpoints

You can test different endpoints:

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/rate-limit \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"login"}'

# Test signup endpoint
curl -X POST http://localhost:3000/api/auth/rate-limit \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"signup"}'
```

Each endpoint has its own rate limit counter.

## Testing Expiration

To test that rate limits expire after 15 minutes:

1. Make 5 requests (should all succeed)
2. Make 6th request (should be rate limited)
3. Wait 15 minutes
4. Make another request (should succeed - window reset)

## Next Steps

After confirming rate limiting works:
1. ✅ Rate limiting is persistent across server restarts
2. ✅ Rate limiting works across multiple server instances
3. ✅ Expired records are cleaned up automatically
4. Consider setting up scheduled cleanup (optional)

