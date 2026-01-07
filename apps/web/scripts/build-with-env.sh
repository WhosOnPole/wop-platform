#!/bin/bash

# Build wrapper script for Cloudflare Pages
# This script ensures environment variables are available during build

set -e

echo "🔍 Checking for environment variables..."

# Check if we're in Cloudflare Pages build environment
if [ -n "$CF_PAGES" ]; then
  echo "✅ Running in Cloudflare Pages environment"
  
  # In Cloudflare Pages, env vars should be available via process.env
  # But they might not be passed to the build process automatically
  # This script ensures they're exported before the build runs
  
  if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" ]; then
    echo "⚠️  Warning: Supabase env vars not found in build environment"
    echo "   This may cause ISR pages to fail during static generation"
    echo "   Make sure variables are set in Cloudflare Pages → Settings → Variables and Secrets"
  else
    echo "✅ Supabase environment variables found"
    # Export them to ensure they're available to the build process
    export NEXT_PUBLIC_SUPABASE_URL
    export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  fi
fi

# Run the build
echo "🚀 Starting build..."
exec pnpm run build

