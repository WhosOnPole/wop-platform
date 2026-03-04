#!/bin/bash

# Test Workers Script
# This script tests all background workers to ensure they're functioning correctly

set -e

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
SECRET_KEY="${SUPABASE_SECRET_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SECRET_KEY" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set"
  exit 1
fi

echo "Testing background workers..."
echo "================================"
echo ""

# Test Weekly Highlights Calculation
echo "1. Testing Weekly Highlights Calculation..."
curl -X POST \
  "${SUPABASE_URL}/functions/v1/calculate-weekly-highlights" \
  -H "Authorization: Bearer ${SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

# Test Email Queue Processing
echo "2. Testing Email Queue Processing..."
curl -X POST \
  "${SUPABASE_URL}/functions/v1/process-email-queue" \
  -H "Authorization: Bearer ${SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

# Test Notification Delivery
echo "3. Testing Notification Delivery..."
curl -X POST \
  "${SUPABASE_URL}/functions/v1/deliver-notifications" \
  -H "Authorization: Bearer ${SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

# Test Data Cleanup
echo "4. Testing Data Cleanup..."
curl -X POST \
  "${SUPABASE_URL}/functions/v1/cleanup-data" \
  -H "Authorization: Bearer ${SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

# Test Points Summary Generation
echo "5. Testing Weekly Points Summary..."
curl -X POST \
  "${SUPABASE_URL}/functions/v1/generate-points-summary" \
  -H "Authorization: Bearer ${SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"period_type": "weekly"}' | jq '.'
echo ""

echo "6. Testing Monthly Points Summary..."
curl -X POST \
  "${SUPABASE_URL}/functions/v1/generate-points-summary" \
  -H "Authorization: Bearer ${SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"period_type": "monthly"}' | jq '.'
echo ""

echo "================================"
echo "All worker tests completed!"

