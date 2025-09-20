# Shared Scripts

This folder contains shared scripts that can be used by both the web and admin apps.

## Database Scripts

### Setup Database
```bash
# From root
pnpm db:setup

# From web app
pnpm --filter web db:setup

# From admin app
pnpm --filter admin db:setup
```

### Seed Data
```bash
# From root
pnpm db:seed:all

# From web app
pnpm --filter web db:seed:all

# From admin app
pnpm --filter admin db:seed:all
```

## Environment Variables

Set these environment variables before running database scripts:

```bash
export SUPABASE_DB_URL="postgresql://user:password@host:port/database"
# or
export DATABASE_URL="postgresql://user:password@host:port/database"
```

## Available Scripts

- `postbuild-db-setup.ts` - Sets up database schema, indexes, and RLS policies
- `seed/seedRegions.ts` - Seeds region data
- `seed/seedEntities.ts` - Seeds entity data (drivers, teams, tracks)
- `seed/seed-from-openf1.ts` - Seeds data from OpenF1 API

## Usage

All scripts can be run from:
1. **Root level**: `pnpm <script-name>`
2. **Individual apps**: `pnpm --filter <app-name> <script-name>`

This allows both web and admin apps to share the same database setup and seeding logic.
