# Playwright E2E Tests

## Prerequisites
- `pnpm install --filter web`
- Install browsers: `pnpm --filter web exec playwright install`
- Set base URL (staging recommended): `PLAYWRIGHT_BASE_URL=https://<staging-host>`

## Running
- All tests: `pnpm --filter web test:e2e`
- UI mode: `pnpm --filter web test:e2e:ui`
- Debug: `pnpm --filter web test:e2e:debug`

## Account creation
- Tests create accounts via the UI signup flow (`/signup`), generating unique emails.
- No shared state is assumed; each test can generate fresh credentials.

## Structure
- `playwright.config.ts` – config, baseURL, retries, projects
- `e2e/fixtures` – auth helpers, test-data
- `e2e/utils` – multi-account helpers
- `e2e/*.spec.ts` – test suites (auth enabled; others scaffolded/skip until selectors are finalized)

## Notes
- Likes/discussion/multi-user suites are `describe.skip` scaffolds; enable after stable selectors + seeded data.
- If signup requires email verification in staging, provide seeded test users or API shortcuts and update helpers.

