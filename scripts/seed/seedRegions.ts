// ──────────────────────────────────────────────────────────────────────────────
// scripts/seed/seedRegions.ts
// Seed regions data
// Usage: tsx scripts/seed/seedRegions.ts
// ──────────────────────────────────────────────────────────────────────────────

import { Client } from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  console.log('No database URL provided. Skipping regions seeding.');
  console.log('To run regions seeding, set SUPABASE_DB_URL or DATABASE_URL environment variable.');
  process.exit(0);
}

const client = new Client({ connectionString: DB_URL });

const regions = [
  { name: 'North America', code: 'NA' },
  { name: 'Europe', code: 'EU' },
  { name: 'Asia', code: 'AS' },
  { name: 'South America', code: 'SA' },
  { name: 'Africa', code: 'AF' },
  { name: 'Oceania', code: 'OC' }
];

async function main() {
  await client.connect();
  console.log('Connected to database');

  // Create regions table if it doesn't exist
  await client.query(`
    create table if not exists regions (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      code text not null unique,
      created_at timestamptz not null default now()
    );
  `);

  // Insert regions
  for (const region of regions) {
    await client.query(`
      insert into regions (name, code) 
      values ($1, $2) 
      on conflict (code) do nothing
    `, [region.name, region.code]);
    console.log(`→ Inserted region: ${region.name}`);
  }

  await client.end();
  console.log('Regions seeding complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
