// ──────────────────────────────────────────────────────────────────────────────
// scripts/seed/seedEntities.ts
// Seed entities data (drivers, teams, tracks)
// Usage: tsx scripts/seed/seedEntities.ts
// ──────────────────────────────────────────────────────────────────────────────

import { Client } from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  console.log('No database URL provided. Skipping entities seeding.');
  console.log('To run entities seeding, set SUPABASE_DB_URL or DATABASE_URL environment variable.');
  process.exit(0);
}

const client = new Client({ connectionString: DB_URL });

const drivers = [
  { name: 'Lewis Hamilton', bio: '7-time World Champion', series: 'F1' },
  { name: 'Max Verstappen', bio: '3-time World Champion', series: 'F1' },
  { name: 'Charles Leclerc', bio: 'Ferrari driver', series: 'F1' },
  { name: 'Lando Norris', bio: 'McLaren driver', series: 'F1' },
  { name: 'George Russell', bio: 'Mercedes driver', series: 'F1' }
];

const teams = [
  { name: 'Mercedes', bio: '8-time Constructors Champions', series: 'F1' },
  { name: 'Red Bull Racing', bio: '6-time Constructors Champions', series: 'F1' },
  { name: 'Ferrari', bio: '16-time Constructors Champions', series: 'F1' },
  { name: 'McLaren', bio: '8-time Constructors Champions', series: 'F1' },
  { name: 'Aston Martin', bio: 'Rising team', series: 'F1' }
];

const tracks = [
  { name: 'Silverstone', bio: 'Home of British Grand Prix', series: 'F1' },
  { name: 'Monaco', bio: 'The crown jewel of F1', series: 'F1' },
  { name: 'Spa-Francorchamps', bio: 'The most challenging track', series: 'F1' },
  { name: 'Monza', bio: 'Temple of Speed', series: 'F1' },
  { name: 'Suzuka', bio: 'Figure-8 circuit', series: 'F1' }
];

async function main() {
  await client.connect();
  console.log('Connected to database');

  // Ensure entities table exists
  await client.query(`
    create table if not exists entities (
      id uuid primary key default gen_random_uuid(),
      type text not null check (type in ('driver', 'team', 'track')),
      name text not null,
      bio text,
      facts jsonb,
      series text,
      created_at timestamptz not null default now()
    );
  `);

  // Insert drivers
  for (const driver of drivers) {
    await client.query(`
      insert into entities (type, name, bio, series) 
      values ('driver', $1, $2, $3) 
      on conflict (name, type) do nothing
    `, [driver.name, driver.bio, driver.series]);
    console.log(`→ Inserted driver: ${driver.name}`);
  }

  // Insert teams
  for (const team of teams) {
    await client.query(`
      insert into entities (type, name, bio, series) 
      values ('team', $1, $2, $3) 
      on conflict (name, type) do nothing
    `, [team.name, team.bio, team.series]);
    console.log(`→ Inserted team: ${team.name}`);
  }

  // Insert tracks
  for (const track of tracks) {
    await client.query(`
      insert into entities (type, name, bio, series) 
      values ('track', $1, $2, $3) 
      on conflict (name, type) do nothing
    `, [track.name, track.bio, track.series]);
    console.log(`→ Inserted track: ${track.name}`);
  }

  await client.end();
  console.log('Entities seeding complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
