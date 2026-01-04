# Cloudflare Pages Build Configuration

## Environment Variables for Build

For ISR (Incremental Static Regeneration) to work, Supabase environment variables must be available during the build process.

### Required Variables

The following environment variables must be set in Cloudflare Pages:

1. `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Setting Variables in Cloudflare Pages

1. Go to Cloudflare Dashboard → Your Project → **Settings**
2. Navigate to **Variables and Secrets**
3. Ensure both variables are listed:
   - `NEXT_PUBLIC_SUPABASE_URL` (can be Plaintext)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (should be Secret)

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

