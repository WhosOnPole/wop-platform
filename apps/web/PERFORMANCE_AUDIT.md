# Site Speed Audit & Performance Report

**App:** `apps/web` (Next.js 16)  
**Audit focus:** Load time, Core Web Vitals, and “not too slow” assurance.

---

## 1. Executive summary

| Area | Status | Notes |
|------|--------|--------|
| **Caching / ISR** | Mixed | Entity and some pages use `revalidate`; feed is `force-dynamic` |
| **Images** | Good | Next/Image with `sizes` in many places; some raw `img`/CSS backgrounds |
| **JS / Client** | Watch | 80+ `'use client'` components; no loading boundaries on key routes |
| **Data fetching** | Mixed | Some pages do extra work (HEAD fetch, Instagram) on the critical path |
| **Measurement** | Missing | No built-in Lighthouse or bundle analysis in scripts |

**Verdict:** The site is in a reasonable state but has clear levers to avoid it feeling slow: add route-level loading UIs, relax feed dynamism where possible, and tighten a few heavy server paths. Below is the detailed audit and a concrete action list.

---

## 2. Current setup (from codebase)

- **Framework:** Next.js 16.1.1, React 19, App Router.
- **Config:** `output: 'standalone'`, `reactStrictMode: true`, `images.remotePatterns` for Supabase and formula1.com.
- **Root layout:** `QueryProvider` → `BotIDProviderWrapper` → `AuthSessionProvider` → `LoadingScreen` → `LayoutWrapper` → children. All run on every request.
- **Revalidation:**
  - `[type]/[slug]`: `revalidate = 3600`
  - `pitlane`: `revalidate = 300`
  - `story/[id]`, `article/[slug]`: `revalidate = 3600`
  - Feed: `dynamic = 'force-dynamic'` (no static/cache).
- **Loading UI:** No `loading.tsx` (or route-level Suspense) under `app/`; only local Suspense in auth pages.

---

## 3. Findings

### 3.1 Positive

- **ISR on entity and content pages** – `revalidate` (3600/300) limits repeated DB work and keeps TTFB reasonable.
- **Image optimization** – Many components use `next/image` with sensible `sizes` (e.g. pitlane, grids, feed cards, entity gallery).
- **Priority for LCP** – Pitlane hero uses `priority` and appropriate `sizes`.
- **Server-heavy pages** – Entity, feed, podiums, profile, etc. use server components and server Supabase clients where it matters.

### 3.2 Issues and risks

1. **No route-level loading states**  
   There are no `loading.tsx` files. During navigation or slow data, users see a blank or stalled screen until the full RSC payload is ready. This makes the site feel slower than it needs to be.

2. **Feed is fully dynamic**  
   `export const dynamic = 'force-dynamic'` on the feed means every visit hits the server and all feed queries. For a read-heavy feed, this increases TTFB and server load. Consider at least short revalidation (e.g. `revalidate = 60`) if freshness allows.

3. **Entity page ([type]/[slug]) – extra work on critical path**  
   - For **teams**, the page does a `fetch(backgroundUrl, { method: 'HEAD' })` to decide between background and logo. That blocks rendering and can be slow or flaky. Prefer a convention (e.g. always use background if present) or move this to a non-blocking path.
   - For **drivers** with `instagram_url`, `getRecentInstagramMedia()` runs during the request. External API calls in the main render path add latency and variability. Consider moving to client fetch after shell render, or a short-lived cache.

4. **Heavy client boundary at root**  
   Many providers and the global loading screen are client-side. The initial JS bundle includes QueryProvider, BotID, Auth, LayoutWrapper, etc. Any lazy-loading of below-the-fold or modal UI would reduce main-thread work.

5. **Landing and entity heroes not using Next/Image**  
   - Home: background via `style={{ backgroundImage: 'url(...)' }}` and a raw `<img>` for the seal. Background is hard to optimize; the seal could be `next/image` for consistency and automatic optimization.
   - Entity hero: background image is often applied via inline `backgroundImage`. Where the URL is known at build/render time, consider a dedicated Next/Image layer for the hero (if layout allows) to get automatic formats and sizing.

6. **No built-in performance measurement**  
   There are no scripts for Lighthouse or bundle analysis. Without them, regressions and impact of changes are hard to track.

7. **Large number of client components**  
   ~80 files use `'use client'`. Not all need to be client-side; some could be server components with small client islands (e.g. modals, interactive tabs). Reducing client scope improves first load and keeps the site from feeling heavy.

---

## 4. Recommendations (priority order)

### P0 – Quick wins

1. **Add `loading.tsx` for key routes**  
   - `app/loading.tsx` – global fallback (e.g. minimal spinner or skeleton).
   - `app/feed/loading.tsx`, `app/[type]/[slug]/loading.tsx`, `app/pitlane/loading.tsx` (and optionally profile, podiums). Use simple skeletons or spinners so the shell appears immediately and the site feels responsive.

2. **Relax feed dynamism**  
   - If acceptable for product: remove `force-dynamic` and add `revalidate = 60` (or 300) so the feed can be cached and revalidated in the background. If feed must be real-time, keep dynamic but ensure DB and queries are indexed and fast.

3. **Remove or defer entity page HEAD fetch**  
   - For teams: either always use a single source (e.g. background URL if set, else logo) or resolve the “which image” logic in a non-blocking way (e.g. client-side or background job). Avoid blocking the main RSC render on a HEAD request.

### P1 – Important

4. **Defer or cache Instagram on driver pages**  
   - Option A: Fetch Instagram in a client component after the driver shell is visible (e.g. in the gallery or a dedicated section).  
   - Option B: Call Instagram from an API route or server action with a short cache (e.g. 5–15 minutes) so the entity page itself doesn’t wait on the external API.

5. **Add performance measurement to the repo**  
   - **Lighthouse:** Add a script (e.g. `pnpm run lighthouse` or `node scripts/lighthouse.js`) that runs Lighthouse CI or a one-off run against a few URLs (e.g. `/`, `/feed`, `/drivers/lewis-hamilton`) and writes a report (e.g. `./.lighthouse/` or `./reports/`). Run in CI or before releases.  
   - **Bundle:** Add `@next/bundle-analyzer` and run it in a separate build (e.g. `ANALYZE=true pnpm build`) so you can see chunk sizes and spot heavy client bundles.

6. **Optional: Report Web Vitals in production**  
   - Use Next.js `reportWebVitals` (or the App Router equivalent) to send LCP, FID/INP, CLS to your analytics or a logging endpoint. This gives ongoing “is the site slow?” signals from real users.

### P2 – Nice to have

7. **Use Next/Image for above-the-fold static assets**  
   - Home: seal image → `next/image` with fixed width/height.  
   - Entity hero: where the hero image URL is known and layout allows, consider Next/Image for the main hero image to get automatic formats and `priority`/`sizes`.

8. **Reduce client scope**  
   - Audit high-traffic pages (feed, entity, pitlane, profile) and move pure presentational or static parts to server components. Keep `'use client'` for interactivity (modals, tabs, forms, real-time). This reduces main bundle and improves first load.

9. **Lazy-load heavy client components**  
   - Modals (create menu, tip, story, poll, post), grid picker, comment sections, etc. can be loaded with `next/dynamic` and `loading` fallback so they don’t block initial paint.

---

## 5. How to measure (so the site stays “not too slow”)

- **Local:**  
  - Run the app and open Chrome DevTools → Lighthouse. Record Performance (and optionally Best Practices, Accessibility) for Mobile and Desktop on `/`, `/feed`, and one entity URL.  
  - Use the Network panel and “Slow 3G” to simulate slow connections; ensure loading skeletons or `loading.tsx` appear quickly.

- **CI / one-off:**  
  - Use the Lighthouse script above (or Lighthouse CI) and fail the build or a check if Performance score drops below a threshold (e.g. &lt; 70 or &lt; 80) for critical routes.

- **Production:**  
  - Enable Web Vitals reporting and track LCP (e.g. &lt; 2.5s), FID/INP (&lt; 100ms), CLS (&lt; 0.1). Use these to decide when to prioritize performance work.

- **Bundle:**  
  - Run the bundle analyzer periodically and after adding large dependencies; keep the main app and first-route chunks under a reasonable size (e.g. main &lt; 200–250 KB gzipped where possible).

---

## 6. Checklist (copy and use)

- [ ] Add `app/loading.tsx` and route-level `loading.tsx` for feed, entity, pitlane (and optionally others).
- [ ] Change feed from `force-dynamic` to `revalidate` if product allows; otherwise verify feed queries and indexes.
- [ ] Remove or defer team background HEAD fetch on entity page.
- [ ] Defer or cache Instagram fetch on driver entity pages.
- [ ] Add Lighthouse script (and optionally CI step) and document where reports are saved.
- [ ] Add `@next/bundle-analyzer` and run at least once; document how to run and how to interpret.
- [ ] (Optional) Add Web Vitals reporting in production.
- [ ] (Optional) Use Next/Image for home seal and, where feasible, entity hero.
- [ ] (Optional) Lazy-load modals and heavy client components with `next/dynamic`.

---

## 7. Summary

The app is not fundamentally slow: it uses ISR, Next/Image in many places, and server components for data-heavy pages. To keep it “not too slow” and improve perceived performance:

1. Add loading UIs so users see progress immediately.  
2. Reduce blocking work on the entity page (HEAD fetch, Instagram).  
3. Relax feed dynamism or optimize its queries.  
4. Add simple, repeatable performance checks (Lighthouse + optional bundle analyzer and Web Vitals) so regressions are visible and fixable early.

Implementing the P0 items and the measurement steps (section 5) will give the biggest confidence that the site stays fast and measurable over time.
