# Local driver body images (fallback)

Place `body.png` in each driver folder to use as a fallback when remote Supabase images fail to load (e.g. during Vercel image optimization limits).

**Path format:** `drivers/{slug}/body.png`

**Slug format:** Driver name in lowercase with spaces → underscores (e.g. "Lewis Hamilton" → `lewis_hamilton`).

**Example:** Add `lewis_hamilton/body.png` for Lewis Hamilton.

These images are only requested when the remote body.png fails to load—they do not load on normal page views.
