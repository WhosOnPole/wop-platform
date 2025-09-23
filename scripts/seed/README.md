// Confirm OpenF1 endpoints and pass them via flags, e.g.:
// tsx scripts/seed/seed-from-openf1.ts \
// --all \
// --upsert \
// --source https:pi.openf1.org \
// --teams-path /v1/teams?year=2025 \
//--drivers-path /v1/drivers?year=2025 \
//--tracks-path /v1/circuits
//
// The script is idempotent: safe to re-run without duplicating rows.
// Unknown field names are preserved in the `meta` JSON column.
// "ext_id" is derived from upstream ids. If upstream lacks a stable id, we hash the row.
// Regions are seeded from a static list—replace with your preferred data.