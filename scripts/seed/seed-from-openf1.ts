// ──────────────────────────────────────────────────────────────────────────────
// scripts/seed/seed-from-openf1.ts
// Seed Regions, Tracks, Teams, Drivers from OpenF1 (https://api.openf1.org)
// Usage examples:
// tsx scripts/seed/seed-from-openf1.ts --all --upsert --source https://api.openf1.org
// tsx scripts/seed/seed-from-openf1.ts --drivers --source https://api.openf1.org
// Env (Node-only): SUPABASE_DB_URL
// ──────────────────────────────────────────────────────────────────────────────


import { Client as PG } from 'pg';
import crypto from 'node:crypto';


const argv = new Set(process.argv.slice(2));
const flag = (f: string) => argv.has(f);
const getArg = (name: string, fallback?: string) => {
const idx = process.argv.findIndex((a) => a === name);
if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
return fallback;
};


const SOURCE = getArg('--source', 'https://api.openf1.org');
const DRY = flag('--dry');
const UPSERT = flag('--upsert') || flag('--all');
const WANT_REGIONS = flag('--regions') || flag('--all');
const WANT_TRACKS = flag('--tracks') || flag('--all');
const WANT_TEAMS = flag('--teams') || flag('--all');
const WANT_DRIVERS = flag('--drivers') || flag('--all');


// NOTE: OpenF1 exposes multiple resources. Endpoints differ by path/params.
// To avoid guessing, we make the path configurable via env/args and provide
// safe defaults that you can adjust once you finalize which OpenF1 endpoints
// you want to use for each entity.
const PATHS = {
// TODO: confirm/fill exact endpoints you want to use
tracks: getArg('--tracks-path', '/'),
teams: getArg('--teams-path', '/'),
drivers:getArg('--drivers-path','/'),
};


function slugify(s: string) {
return s
.toLowerCase()
.replace(/[^a-z0-9]+/g, '-')
.replace(/(^-|-$)+/g, '');
}


async function fetchJSON<T>(url: string): Promise<T> {
const res = await fetch(url, { headers: { 'accept': 'application/json' } });
if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
return res.json() as Promise<T>;
}


function extId(value: unknown): string {
  // A stable external id from upstream value; if none provided, hash the row
  if (typeof value === 'string' && value) return value;
  return crypto.createHash('md5').update(JSON.stringify(value)).digest('hex');
}