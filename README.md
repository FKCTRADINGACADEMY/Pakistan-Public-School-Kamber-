# Pakistan Public School Kamber — PWA Assets

App icons and manifest generated from the school logo for the
Pakistan Public School Kamber Management System.

## Contents

- `index.html` — the main app (login, dashboard, fees, results, etc.)
- `manifest.json` — web app manifest (name, theme color, icon list)
- `icon-192.png` — apple touch icon (used at the root, referenced directly by `index.html`)
- `favicon.png` — browser tab icon
- `/icons/` — full PWA icon set generated from the school logo:
  - 16×16, 32×32, 48×48, 64×64, 96×96, 128×128, 144×144, 152×152, 180×180, 192×192, 384×384, 512×512
  - 192×192 and 512×512 maskable versions (for Android adaptive icons)

## Installation

1. Upload all files to your hosting root in this exact structure:
   ```
   /
   ├── index.html
   ├── manifest.json
   ├── icon-192.png
   ├── favicon.png
   ├── icons/
   │   └── (all icon-*.png files)
   └── sw.js
   ```
2. Don't rename or move the `icons` folder — `manifest.json` points to
   `/icons/icon-*.png` paths, so it must stay at the root.
3. `index.html` already links `manifest.json` and `icon-192.png` in its
   `<head>` — no extra setup needed.

## Note on the service worker path

`index.html` currently registers the service worker at:
```
/The-Smart-Modern-Public-School-Qamber-/sw.js
```
This is left over from the old project name. If you're hosting this
under a different folder/repo name (e.g. GitHub Pages), update this
path to match your actual hosting folder, or the offline/installable
PWA features won't work correctly.

---
Icons generated for Pakistan Public School Kamber
