# Cloudflare Pages Build Configuration

## Environment Variables for Build

For ISR (Incremental Static Regeneration) to work, Supabase environment variables must be available during the build process.

### Required Variables

The following environment variables must be set in Cloudflare Pages:

1. `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Setting Variables in Cloudflare Pages

Environment variables are defined in `wrangler.toml` for build-time and runtime access:

```toml
[vars]
NEXT_PUBLIC_SUPABASE_URL = "https://akjgphgaisyhumgmaeqo.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key-here"
```

**Note**: The `NEXT_PUBLIC_*` prefix means these variables are public-facing and safe to commit to the repository.

**Alternative Configuration**: You can also set these in Cloudflare Pages dashboard:
1. Go to Cloudflare Dashboard → Your Project → **Settings**
2. Navigate to **Variables and Secrets**
3. Add both variables:
   - `NEXT_PUBLIC_SUPABASE_URL` (Plaintext)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Plaintext or Secret)

Variables defined in `wrangler.toml` take precedence and will be available during both build and runtime.

### Build Verification

The build process includes a verification step that checks for required environment variables:

```bash
pnpm verify-env  # Runs before build
```

If variables are missing, the build will fail with a clear error message.

### Build Command

The build command used by Cloudflare Pages is:
```bash
pnpm install --frozen-lockfile && pnpm dlx @cloudflare/next-on-pages
```

This runs:
1. `pnpm install` - Install dependencies
2. `pnpm dlx @cloudflare/next-on-pages` - Build with Cloudflare adapter
   - Which internally runs: `pnpm run build` (in apps/web)
   - Which runs: `pnpm verify-env && next build`

**Current Issue**: The build log shows `Build environment variables: (none found)`, which means Cloudflare Pages is not passing environment variables to the build process.

### Why Variables Aren't Available During Build

Cloudflare Pages environment variables are typically available at **runtime** but may not be automatically available during the **build phase**. This is a limitation when using `@cloudflare/next-on-pages` which runs `vercel build` internally.

### Solutions

#### Option 1: Verify Cloudflare Pages Configuration (Recommended)

1. **Check Variable Settings**:
   - Go to Cloudflare Dashboard → Your Project → Settings → Variables and Secrets
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are listed
   - Variables should be set as **Plaintext** (not just Secrets) for build-time access

2. **Trigger New Deployment**:
   - After adding/modifying variables, trigger a new deployment
   - Variables may not be available until a fresh deployment

3. **Check Build Logs**:
   - Look for the verification output in build logs
   - If you see "❌ Missing", variables aren't being passed to build

#### Option 2: Use Runtime-Only Rendering (Fallback)

If environment variables cannot be made available during build, you'll need to use `export const dynamic = 'force-dynamic'` instead of `export const revalidate = 3600`. This means:
- ✅ Pages will work without build-time env vars
- ❌ Pages won't be statically generated (no ISR benefits)
- ❌ Slower initial page loads

#### Option 3: Contact Cloudflare Support

If variables are set correctly but still not available during build, this may be a Cloudflare Pages limitation. Consider:
- Checking Cloudflare Pages documentation for build-time env var configuration
- Contacting Cloudflare support about build-time environment variable access

### Troubleshooting

If build fails with "env variables required" error:

1. **Verify variables are set**: Check Cloudflare Pages → Settings → Variables and Secrets
2. **Check build logs**: Look for the verification output:
   - ✅ = Variables available
   - ❌ = Variables missing
3. **Variable scope**: Ensure variables are available for the build environment (not just runtime)

### Note on ISR

Pages using `export const revalidate = 3600` require environment variables during build time because Next.js statically generates these pages at build time. If variables aren't available, the build will fail.

If you need to use `export const dynamic = 'force-dynamic'` instead, pages will be rendered on-demand at runtime, which doesn't require build-time env vars but loses the performance benefits of ISR.

