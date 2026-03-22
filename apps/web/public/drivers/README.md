# Local driver images (fallback)

Place `body.png` and/or `profile.jpg` in each driver folder to use as fallbacks when remote Supabase images fail to load (e.g. during Vercel image optimization limits).

**Path format:** `drivers/{slug}/body.png` and `drivers/{slug}/profile.jpg`

**Slug format:** Driver name in lowercase with spaces → underscores (e.g. "Lewis Hamilton" → `lewis_hamilton`).

**Examples:**
- `lewis_hamilton/body.png` – full-body hero image
- `lewis_hamilton/profile.jpg` – headshot/profile image

These images are only requested when the remote images fail to load—they do not load on normal page views.
