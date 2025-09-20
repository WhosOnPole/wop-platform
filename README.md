# WOP Platform - Monorepo

A Formula 1 fan community platform built with React, TypeScript, and Supabase, structured as a monorepo with separate web and admin applications.

## 🏗️ Architecture

```
/apps
  /web    → Public site (React + Vite)
  /admin  → Admin dashboard (React + Vite)
/packages
  /ui           → Shared unstyled React components
  /tsconfig     → Shared TypeScript configurations
  /eslint       → Shared ESLint configuration
  /supabase     → Supabase client and helpers
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (see `.nvmrc`)
- pnpm 8+ (recommended package manager)
- Supabase project with database access

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd wop-platform
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your Supabase credentials
   # SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:5432/postgres
   # SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   # VITE_SUPABASE_URL=your_supabase_url_here
   # VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Set up database:**
   ```bash
   # Run database migrations and seed data
   pnpm postbuild
   ```

### Development

**Start both apps in development mode:**

```bash
# Terminal 1 - Web app (port 3000)
pnpm dev:web

# Terminal 2 - Admin app (port 3001)
pnpm dev:admin
```

**Individual app development:**

```bash
# Web app only
pnpm --filter web dev

# Admin app only
pnpm --filter admin dev
```

### Building for Production

```bash
# Build all apps
pnpm build

# Build individual apps
pnpm --filter web build
pnpm --filter admin build
```

## 📱 Applications

### Web App (`/apps/web`)

**Routes:**
- `/` - Coming Soon page with email signup
- `/login` - User authentication
- `/signup` - User registration
- `/reset-password` - Password reset
- `/feed` - Community feed (protected)
- `/drivers/:id` - Driver detail pages
- `/teams/:id` - Team detail pages
- `/tracks/:id` - Track detail pages
- `/polls` - Community polls
- `/profile/:handle` - User profiles

**Features:**
- Email/password authentication via Supabase
- Responsive design with CSS Modules
- Clean, minimal styling (no external UI frameworks)

### Admin App (`/apps/admin`)

**Routes:**
- `/` - Dashboard overview
- `/reports` - Content moderation queue
- `/highlights` - Highlight approval system
- `/discussions` - Comment moderation
- `/spotlight` - Featured content management
- `/polls` - Poll creation and management
- `/entities` - Driver/team/track CRUD
- `/users` - User management
- `/races` - Race event management
- `/settings` - Platform configuration
- `/audit-log` - System activity logs

**Features:**
- Protected admin routes
- Comprehensive management interface
- Real-time data from Supabase

## 🗄️ Database Schema

The platform uses a comprehensive PostgreSQL schema with the following key tables:

- **`entities`** - Drivers, teams, and tracks
- **`users_public`** - Public user profiles
- **`comments`** - Community discussions
- **`highlights`** - User-submitted content
- **`polls`** - Community polls and voting
- **`reports`** - Content moderation
- **`spotlights`** - Featured content
- **`audit_log`** - System activity tracking

All tables include Row Level Security (RLS) policies for data protection.

## 🚀 Deployment

### Cloudflare Pages

**Web App Deployment:**
1. Connect your repository to Cloudflare Pages
2. Set build command: `pnpm install --frozen-lockfile --filter=web && pnpm --filter=web build`
3. Set output directory: `apps/web/dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

**Admin App Deployment:**
1. Create a separate Cloudflare Pages project
2. Set build command: `pnpm install --frozen-lockfile --filter=admin && pnpm --filter=admin build`
3. Set output directory: `apps/admin/dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

**Database Setup:**
After deployment, run the database setup script:
```bash
# Set environment variables
export SUPABASE_DB_URL="your_database_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Run database setup
node scripts/postbuild-db-setup.js
```

## 🛠️ Development

### Code Standards

- **TypeScript** with strict mode enabled
- **ESLint** with shared configuration
- **CSS Modules** for styling (no Tailwind)
- **System fonts** for consistent typography
- **Functional components** with hooks
- **Declarative patterns** over imperative code

### Package Management

This monorepo uses **pnpm workspaces** for efficient dependency management:

```bash
# Install all dependencies
pnpm install

# Add dependency to specific app
pnpm --filter web add react-router-dom

# Add dependency to shared package
pnpm --filter @wop/ui add clsx

# Run scripts across all packages
pnpm -r lint
pnpm -r typecheck
```

### Shared Packages

- **`@wop/ui`** - Unstyled React components (Button, TextField, Card, LayoutStack)
- **`@wop/supabase`** - Supabase client and helper functions
- **`@wop/tsconfig`** - TypeScript configuration presets
- **`@wop/eslint`** - ESLint configuration

## 🔧 Environment Variables

### Required for Development
```bash
# Database access (for post-build setup)
SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Supabase client (for both apps)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### App-specific Variables

Each app can have its own `.env` file:
- `apps/web/.env`
- `apps/admin/.env`

## 📝 Scripts

```bash
# Development
pnpm dev:web          # Start web app
pnpm dev:admin        # Start admin app

# Building
pnpm build            # Build all apps
pnpm --filter web build    # Build web app only
pnpm --filter admin build  # Build admin app only

# Database
pnpm postbuild        # Run database setup

# Code Quality
pnpm lint             # Lint all packages
pnpm typecheck        # Type check all packages
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the code standards
4. Run `pnpm lint` and `pnpm typecheck`
5. Test your changes in both web and admin apps
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.