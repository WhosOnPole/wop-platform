#!/bin/bash

# Test script for rate limiting API
# Usage: ./test-rate-limit.sh [API_URL]
# Example: ./test-rate-limit.sh http://localhost:3000

API_URL="${1:-http://localhost:3000}"
ENDPOINT="login"

echo "🧪 Testing Rate Limiting API"
echo "📍 API URL: $API_URL"
echo "🎯 Endpoint: $ENDPOINT"
echo ""
echo "=" | head -c 50 && echo ""

# Make 7 requests (5 allowed + 2 should be blocked)
for i in {1..7}; do
  echo ""
  echo "Attempt $i:"
  
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"endpoint\":\"$ENDPOINT\"}" \
    "$API_URL/api/auth/rate-limit")
  
  http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_STATUS:/d')
  
  echo "  Status: $http_status"
  echo "  Response: $body"
  
  # Extract headers if available
  if [ "$http_status" = "200" ] || [ "$http_status" = "429" ]; then
    limit=$(curl -s -I -X POST \
      -H "Content-Type: application/json" \
      -d "{\"endpoint\":\"$ENDPOINT\"}" \
      "$API_URL/api/auth/rate-limit" 2>/dev/null | grep -i "X-RateLimit-Limit" | cut -d: -f2 | tr -d ' ')
    remaining=$(curl -s -I -X POST \
      -H "Content-Type: application/json" \
      -d "{\"endpoint\":\"$ENDPOINT\"}" \
      "$API_URL/api/auth/rate-limit" 2>/dev/null | grep -i "X-RateLimit-Remaining" | cut -d: -f2 | tr -d ' ')
    
    if [ ! -z "$limit" ]; then
      echo "  Headers: Limit=$limit, Remaining=$remaining"
    fi
  fi
  
  # Small delay between requests
  if [ $i -lt 7 ]; then
    sleep 0.5
  fi
done

echo ""
echo "=" | head -c 50 && echo ""
echo "📊 Test Complete!"
echo ""
echo "Expected results:"
echo "  ✅ First 5 requests should return 200 (success)"
echo "  🚫 Last 2 requests should return 429 (rate limited)"
echo ""
echo "If results differ, check:"
echo "  1. Migration has been applied to database"
echo "  2. SUPABASE_SERVICE_ROLE_KEY is set in environment"
echo "  3. Server is running and accessible"

