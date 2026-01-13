# Setup Instructions

## Quick Start

1. **Copy environment files:**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp apps/admin/.env.example apps/admin/.env.local
   ```

2. **Update the anon key in both files:**
   - Open `apps/web/.env.local` and `apps/admin/.env.local`
   - Replace `your-supabase-anon-key` with your actual Supabase anon key:


3. **Add service role key to admin app:**
   - Open `apps/admin/.env.local`
   - Add your service role key (get it from Supabase Dashboard > Settings > API):
     ```
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
     ```

4. **Install dependencies:**
   ```bash
   pnpm install
   ```

5. **Run database migrations:**
   - Go to Supabase Dashboard > SQL Editor
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_points_strikes_triggers.sql`
   - Manually add banned_until column:
     ```sql
     ALTER TABLE auth.users ADD COLUMN banned_until TIMESTAMPTZ;
     ```

6. **Start development servers:**
   ```bash
   pnpm dev
   ```

## Environment Variables Reference

### Web App (`apps/web/.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `NEXT_PUBLIC_SITE_URL` - Your site URL (for OAuth redirects)

### Admin App (`apps/admin/.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `NEXT_PUBLIC_SITE_URL` - Your admin site URL
- `SUPABASE_SERVICE_ROLE_KEY` - **SECRET** - Service role key (server-side only)

### Edge Functions
Set these in Supabase Dashboard > Edge Functions > Settings:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key

## Important Notes

⚠️ **Never commit `.env.local` files to git!**

⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code!**

The service role key bypasses RLS and should only be used in:
- Server Actions
- API Routes
- Edge Functions
- Admin operations

