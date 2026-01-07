# Setup Instructions

## Quick Start

1. **Copy environment files:**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp apps/admin/.env.example apps/admin/.env.local
   ```

2. **Update the publishable key in both files:**
   - Open `apps/web/.env.local` and `apps/admin/.env.local`
   - Replace `your-supabase-publishable-key` with your Supabase publishable key:
     ```
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
     ```

3. **Add the Supabase secret key to the admin app (server-only):**
   - Open `apps/admin/.env.local`
   - Add your Supabase secret key (from Supabase Dashboard > Settings > API):
     ```
   SUPABASE_SECRET_KEY=sb_secret_your_key
     ```

4. **Install dependencies:**
   ```bash
   pnpm install
   ```


5. **Start development servers:**
   ```bash
   pnpm dev
   ```

## Environment Variables Reference

### Web App (`apps/web/.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable key (public)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `NEXT_PUBLIC_SITE_URL` - Your site URL (for OAuth redirects)

### Admin App (`apps/admin/.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable key (public)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `NEXT_PUBLIC_SITE_URL` - Your admin site URL
- `SUPABASE_SECRET_KEY` - **SECRET** - Supabase secret key (server-side only)

### Edge Functions
Set these in Supabase Dashboard > Edge Functions > Settings:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SECRET_KEY` - Secret key (server-only)

## Important Notes

⚠️ **Never commit `.env.local` files to git!**

⚠️ **Never expose `SUPABASE_SECRET_KEY` to client-side code!**

The secret key bypasses RLS and should only be used in:
- Server Actions
- API Routes
- Edge Functions
- Admin operations

