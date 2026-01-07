# BotID Implementation Guide

This document describes the BotID implementation for form protection and injection attack prevention.

## Overview

BotID from Vercel has been integrated to protect all forms and submissions from bots and injection attacks. The implementation includes:

1. **Client-side BotID Provider** - Wraps the app to initialize BotID
2. **Server-side Verification** - Validates BotID tokens on API routes
3. **Input Sanitization** - Blocks SQL injection, XSS, command injection, and path traversal attacks
4. **Playwright Tests** - Comprehensive test suite for BotID protection and injection blocking

## Setup

### 1. Install Dependencies

```bash
cd apps/web
pnpm add botid
```

### 2. Environment Variables

Add the BotID key to your environment variables:

```bash
# .env.local or Vercel environment variables
BOTID=your_botid_secret_key_here
```

**Where to get BotID keys:**
- Go to your Vercel project dashboard
- Navigate to Settings → Environment Variables
- Add `BOTID` with your secret key from Vercel BotID settings
- Or visit: https://vercel.com/docs/botid

### 3. Package Installation

The `package.json` uses the `botid` package. Run:

```bash
pnpm install
```

## Implementation Details

### Client-Side

1. **BotIDProvider** (`components/providers/botid-provider.tsx`)
   - Wraps the application in the root layout
   - Fetches BotID site key from API route
   - Initializes BotID for all forms

2. **Form Integration**
   - Reset Password Form (`app/auth/reset-password/page.tsx`)
   - Coming Soon Subscription Form (`components/coming-soon/coming-soon-content.tsx`)
   - Both forms use `useBotId()` hook to get tokens

### Server-Side

1. **BotID Verification Utility** (`utils/botid.ts`)
   - `verifyBotId()` function validates tokens
   - Handles development mode gracefully
   - Fails closed in production

2. **Protected API Routes**
   - `/api/auth/reset-password` - Password reset with BotID + injection protection
   - `/api/coming-soon/subscribe` - Email subscription with BotID + injection protection

3. **Injection Attack Prevention**
   - SQL injection patterns blocked
   - XSS (Cross-Site Scripting) patterns blocked
   - Command injection patterns blocked
   - Path traversal patterns blocked
   - Input sanitization (trim, lowercase, length limits)

## Testing

### Run Playwright Tests

```bash
# Run all BotID protection tests
pnpm test:e2e botid-protection

# Run with UI
pnpm test:e2e:ui botid-protection

# Run in debug mode
pnpm test:e2e:debug botid-protection
```

### Test Coverage

The test suite (`e2e/botid-protection.spec.ts`) covers:

1. **BotID Protection**
   - Forms require BotID tokens
   - Requests without tokens are rejected

2. **Injection Attack Prevention**
   - SQL injection attempts blocked
   - XSS injection attempts blocked
   - Command injection attempts blocked
   - Path traversal attempts blocked

3. **Input Sanitization**
   - Whitespace trimming
   - Email normalization
   - Length validation

## Forms Protected

1. **Reset Password Form** (`/auth/reset-password`)
   - Protected by BotID
   - Validates password strength
   - Blocks injection attacks

2. **Coming Soon Subscription** (`/coming-soon`)
   - Protected by BotID
   - Validates email format
   - Blocks injection attacks

## Adding BotID to New Forms

### Client-Side

The `BotIdClient` component automatically handles adding BotID headers to protected routes. You don't need to manually get tokens or add headers.

```tsx
'use client'

export function MyForm() {
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // BotIdClient automatically adds necessary headers to protected routes
    // Just make a normal fetch request
    const response = await fetch('/api/my-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ /* form data */ }),
    })
  }
}
```

Make sure the route is listed in the `protect` array of `BotIdClient`:
```tsx
<BotIdClient
  protect={[
    { path: '/api/my-endpoint', method: 'POST' },
  ]}
/>
```

### Server-Side

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyBotId } from '@/utils/botid'

export async function POST(request: NextRequest) {
  // Verify BotID first
  const botIdResult = await verifyBotId(request)
  if (!botIdResult.valid) {
    return NextResponse.json(
      { error: 'Bot verification failed' },
      { status: 403 }
    )
  }
  
  // Sanitize and validate input
  const data = await request.json()
  // ... your logic here
}
```

## Security Notes

1. **Development Mode**: BotID verification is lenient in development to allow testing
2. **Production Mode**: BotID verification is strict - all requests must have valid tokens
3. **Input Sanitization**: All user inputs are sanitized before processing
4. **Error Messages**: Generic error messages prevent information leakage

## Troubleshooting

### BotID not working in development

- Check that `BOTID` environment variable is set
- In development, BotID allows requests even without proper tokens (for testing)
- Check browser console for BotID initialization errors

### Forms failing with 403 errors

- Verify `BOTID` environment variable is set correctly
- Check that `BotIdClient` is included in your layout with the correct `protect` array
- Ensure the route path and method match exactly in the `protect` array
- Make sure requests are made from a page (not direct API calls) so BotIdClient can add headers

### Tests failing

- Ensure test environment has `BOTID` set (or tests will fail BotID checks)
- Some tests use fake tokens to test injection blocking - this is expected
- Real BotID tokens require actual page load and BotID initialization

## Next Steps

1. Install `botid` package: `pnpm add botid`
2. Set `BOTID` environment variable in Vercel dashboard
3. Test forms locally to ensure BotID is working
4. Run Playwright tests to verify protection
5. Deploy to Vercel and verify in production

