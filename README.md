# Who's on Pole? - F1 Fan Community Platform

A comprehensive full-stack web application built with Next.js 14, Supabase, and TypeScript.

## 🏗️ Architecture

- **Monorepo**: pnpm workspaces
- **Frontend (User)**: Next.js 14 App Router (`apps/web`)
- **Frontend (Admin)**: Next.js 14 App Router (`apps/admin`)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **Data Source**: OpenF1 API for F1 data ingestion
- **Deployment**: Cloudflare Pages

## 📁 Project Structure

```
wop-platform/
├── apps/
│   ├── web/          # User-facing Next.js app
│   └── admin/        # Admin dashboard Next.js app
├── packages/
│   └── supabase/     # Shared Supabase utilities
├── supabase/
│   ├── migrations/   # SQL migration files
│   └── functions/    # Edge Functions
└── package.json      # Root workspace config
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wop-platform
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:

Create `.env.local` files in both `apps/web` and `apps/admin`:

**apps/web/.env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://akjgphgaisyhumgmaeqo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYXdnYnZtZnZyb3ZyY2txeHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDAwMDAsImV4cCI6MjA3MDcxNjAwMH0.CO_DuBRCIfWmby3C8MJDsdndAYod_4aZNLT5yGBgNvE
NEXT_PUBLIC_GOOGLE_CLIENT_ID=988898868785-dajalt9mqvoaqur28ms64rn791qovnq3.apps.googleusercontent.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**apps/admin/.env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://akjgphgaisyhumgmaeqo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYXdnYnZtZnZyb3ZyY2txeHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDAwMDAsImV4cCI6MjA3MDcxNjAwMH0.CO_DuBRCIfWmby3C8MJDsdndAYod_4aZNLT5yGBgNvE
NEXT_PUBLIC_GOOGLE_CLIENT_ID=988898868785-dajalt9mqvoaqur28ms64rn791qovnq3.apps.googleusercontent.com
NEXT_PUBLIC_SITE_URL=http://localhost:3001
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Note:** Get your `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard > Settings > API > service_role key

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Database Setup

1. Create a new Supabase project
2. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql` - Creates all tables, enums, RLS policies 
   - `supabase/migrations/002_points_strikes_triggers.sql` - Creates points & strikes system
   - `supabase/migrations/004_add_unique_constraints.sql` - Adds UNIQUE constraints for OpenF1 upserts (required!)
3. Deploy the Edge Function:
   ```bash
   supabase functions deploy ingest-openf1
   ```
   Or manually via Supabase Dashboard > Edge Functions > Deploy

4. Set up OpenF1 ingestion (choose one method):
   - **Simplest**: Manually trigger from Supabase Dashboard > Edge Functions > ingest-openf1 > Invoke
   - **Recommended**: Set up scheduled function (Dashboard > Edge Functions > Schedule)
   - **Advanced**: Use pg_cron (see `docs/OPENF1_SETUP.md` for detailed instructions)
   
   See [OpenF1 Setup Guide](./docs/OPENF1_SETUP.md) for complete instructions.

### Development

Run both apps in development mode:
```bash
pnpm dev
```

Or run individually:
```bash
pnpm dev:web    # Runs on http://localhost:3000
pnpm dev:admin  # Runs on http://localhost:3001
```

## 🔐 Security Features

- **Row Level Security (RLS)**: All tables have strict RLS policies
- **Input Sanitization**: All user-generated content is sanitized
- **Admin Access Control**: Admin app requires @whosonpole.org email or admin role
- **Ban Enforcement**: Middleware checks `profiles.banned_until` on every request
- **Service Role Key**: Never exposed to client-side code

## 📊 Database Schema

### Key Tables

- **profiles**: User profiles linked to auth.users
- **drivers, teams, tracks**: F1 data (synced from OpenF1 API)
- **grids**: User-created rankings (drivers, teams, tracks)
- **posts, comments**: Discussion threads
- **votes**: Upvote system (1 point per vote)
- **reports**: Content moderation queue
- **track_tips**: User-submitted track tips (moderated)
- **polls, news_stories, articles**: Admin-created content
- **live_chat_messages**: Real-time race chat
- **race_schedule**: Race calendar

### Points & Strikes System

- **Points**: Awarded for votes (+1), comments (+1), approved tips (+2)
- **Strikes**: Added when content is removed due to reports (+1 per removal)
- **Banning**: Automatic ban when strikes >= 3

## 🛠️ Development Status

### ✅ Completed

- [x] Phase 1.1: Complete SQL schema with RLS policies
- [x] Phase 1.2: Points & Strikes triggers
- [x] Phase 1.3: OpenF1 data ingestion Edge Function
- [x] Monorepo setup with pnpm workspaces
- [x] Phase 2.1: Admin secure layout and middleware

### 🚧 In Progress

- Admin dashboard features (Data Enrichment, Content Creation, Moderation)
- Web app authentication and core features
- User-facing pages and components

## 📝 Next Steps

1. Complete admin dashboard features (Phases 2.2-2.6)
2. Implement web app authentication (Phase 3.1)
3. Build user-facing pages and components (Phases 3-6)
4. Set up deployment pipelines
5. Configure authentication providers

## 🔗 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenF1 API](https://www.openf1.org/)

## 📄 License

Private - All rights reserved

