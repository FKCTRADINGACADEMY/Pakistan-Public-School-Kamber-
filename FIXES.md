# PPS Kamber — Fixes Applied (Aug 2026)

## Files to put in repo root
- `index.html`  (fixed)
- `sw.js`       (fixed)
- `manifest.json` (improved)
- Put `deploy.yml` at: **`.github/workflows/deploy.yml`**

Also keep existing assets at root:
- `icon-192x192.png`, `icon-512x512.png`, `app-logo.png`

---

## What was fixed

### 1. Hang / freeze sources
| Problem | Fix |
|--------|-----|
| SW `reg.update()` every **3 seconds** | Now every **60 seconds** + on tab visible |
| Blind hard-reload loops | Update banner: user taps **Update Now** |
| Huge gallery base64 → localStorage full / freeze | Photos **compressed** (max ~900px JPEG 0.65) before save |
| Gallery stuffed into main storage key | Gallery uses separate key: `pps_kamber_school_data_v1_gallery` |
| Gallery unlimited growth | Soft limit **80 photos** |
| Core assets batch fail blocked offline | SW falls back to **one-by-one** cache if `addAll` fails |
| `./` path quirks | Removed from CORE_ASSETS list |

### 2. IDs
- `newId()` now uses timestamp + random + counter (less multi-device collision risk)

### 3. Homework
- Image attachments also go through the same compressor

### 4. Manifest
- `orientation: any`
- `categories`
- `purpose: maskable` icon entries (Android adaptive icons)

### 5. Deploy workflow
- Checks that `sw.js` exists before sed
- Comment: must live at `.github/workflows/deploy.yml`

---

## New UX feature
Bottom banner when a new PWA version is ready:

> 🔄 Naya version ready hai — **Update Now**

---

## Still your responsibility (not code)
1. **Firestore Security Rules** — must restrict write by role / auth
2. Repo layout: workflow file path, icons at root
3. After first deploy of new SW, users may need one manual refresh

## Deploy steps
1. Copy fixed files into your GitHub repo root
2. Move `deploy.yml` → `.github/workflows/deploy.yml`
3. Push to `main`
4. Wait for Actions → Pages live
5. Open app once online so new SW installs

