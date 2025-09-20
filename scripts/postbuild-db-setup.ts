// ──────────────────────────────────────────────────────────────────────────────
// scripts/postbuild-db-setup.ts
// Idempotent DB bootstrap for Supabase (Postgres)
// Usage: pnpm dlx tsx scripts/postbuild-db-setup.ts --apply
// Env (Node-only): SUPABASE_DB_URL
// ──────────────────────────────────────────────────────────────────────────────

import { Client } from 'pg';

const APPLY = process.argv.includes('--apply');
const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  console.log('No database URL provided. Skipping database setup.');
  console.log('To run database setup, set SUPABASE_DB_URL or DATABASE_URL environment variable.');
  process.exit(0);
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Connected to database');

  const statements = [
    // Extensions
    `create extension if not exists "uuid-ossp";`,
    `create extension if not exists "pg_trgm";`,

    // Core tables
    `create table if not exists users_public (
      user_id uuid primary key,
      handle text unique not null,
      region text,
      bio text,
      avatar_url text,
      created_at timestamptz not null default now()
    );`,

    `create table if not exists entities (
      id uuid primary key default gen_random_uuid(),
      type text not null check (type in ('driver', 'team', 'track')),
      name text not null,
      bio text,
      facts jsonb,
      series text,
      created_at timestamptz not null default now()
    );`,

    `create table if not exists follows (
      user_id uuid not null,
      entity_id uuid not null,
      created_at timestamptz not null default now(),
      primary key (user_id, entity_id)
    );`,

    `create table if not exists grid_items (
      user_id uuid not null,
      driver_id uuid not null,
      rank integer not null,
      created_at timestamptz not null default now(),
      primary key (user_id, driver_id)
    );`,

    `create table if not exists comments (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      entity_id uuid not null,
      parent_id uuid,
      body text not null,
      score integer not null default 0,
      created_at timestamptz not null default now()
    );`,

    `create table if not exists votes (
      user_id uuid not null,
      comment_id uuid not null,
      created_at timestamptz not null default now(),
      primary key (user_id, comment_id)
    );`,

    `create table if not exists highlights (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      caption text,
      image_url text,
      ig_url text,
      approved boolean not null default false,
      created_at timestamptz not null default now()
    );`,

    `create table if not exists highlight_tags (
      highlight_id uuid not null,
      entity_id uuid not null,
      created_at timestamptz not null default now(),
      primary key (highlight_id, entity_id)
    );`,

    `create table if not exists polls (
      id uuid primary key default gen_random_uuid(),
      question text not null,
      closes_at timestamptz,
      created_at timestamptz not null default now()
    );`,

    `create table if not exists poll_options (
      id uuid primary key default gen_random_uuid(),
      poll_id uuid not null,
      text text not null,
      created_at timestamptz not null default now()
    );`,

    `create table if not exists poll_votes (
      poll_id uuid not null,
      option_id uuid not null,
      user_id uuid not null,
      created_at timestamptz not null default now(),
      primary key (poll_id, option_id, user_id)
    );`,

    `create table if not exists reports (
      id uuid primary key default gen_random_uuid(),
      reporter_id uuid not null,
      target_type text not null,
      target_id uuid not null,
      reason text not null,
      status text not null default 'pending',
      created_at timestamptz not null default now()
    );`,

    `create table if not exists spotlights (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      body text not null,
      starts_at timestamptz,
      ends_at timestamptz,
      featured_by uuid,
      created_at timestamptz not null default now()
    );`,

    `create table if not exists audit_log (
      id uuid primary key default gen_random_uuid(),
      actor_id uuid,
      action text,
      target text,
      before jsonb,
      after jsonb,
      created_at timestamptz not null default now()
    );`,

    // Indexes (safe create)
    `create index if not exists idx_entities_name on entities(name);`,
    `create index if not exists idx_comments_entity_time on comments(entity_id, created_at desc);`,
    `create index if not exists idx_highlights_approved_time on highlights(approved, created_at desc);`,
    `create index if not exists idx_follows_user on follows(user_id);`,
    `create index if not exists idx_grid_items_user on grid_items(user_id);`,
    `create index if not exists idx_poll_votes_poll on poll_votes(poll_id);`,

    // Enable RLS where sensible
    `alter table users_public enable row level security;`,
    `alter table comments enable row level security;`,
    `alter table highlights enable row level security;`,
    `alter table reports enable row level security;`,

    // Basic permissive policies (adjust later for tighter rules)
    `create policy if not exists users_public_select on users_public for select using (true);`,
    `create policy if not exists users_public_upsert_self on users_public for insert with check (auth.uid() = user_id);`,
    `create policy if not exists users_public_update_self on users_public for update using (auth.uid() = user_id);`,

    `create policy if not exists comments_sel on comments for select using (true);`,
    `create policy if not exists comments_ins on comments for insert with check (auth.uid() = user_id);`,
    `create policy if not exists comments_upd_own on comments for update using (auth.uid() = user_id);`,

    `create policy if not exists highlights_sel_public on highlights for select using (approved = true or auth.role() = 'service_role');`,
    `create policy if not exists highlights_ins_auth on highlights for insert with check (auth.uid() = user_id);`,

    `create policy if not exists reports_ins on reports for insert with check (auth.uid() = reporter_id);`
  ];

  if (!APPLY) {
    console.log('DRY RUN: would execute', statements.length, 'statements');
    await client.end();
    return;
  }

  for (const sql of statements) {
    console.log('→', sql.split('\n')[0]);
    await client.query(sql);
  }

  await client.end();
  console.log('DB setup complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});