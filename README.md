# Kya fix kiya — PPS Kamber App (hang/loading issue)

## Asal wajah (root cause)
`index.html` ke andar **3 tasveerein seedha text (base64) ke tor par
chipki hui thi** — puri school logo (512×512, ~260KB) har baar page
load hone par decode ho rahi thi, plus ek chhota favicon bhi dobara
inline tha. Isi wajah se:

- File ka size **1.27MB** tha (sirf inline images ki wajah se ~400KB
  extra) — kamzor mobile net ya sasta Android phone par ye parse hone
  mein time leta tha → app "hang" jaisi feel deti thi, khaas kar
  offline ho ya connection slow ho.
- `sw.js` (service worker) cache list mein `icon-192x192.png` aur
  `icon-512x512.png` naam ki files thi jo **hosting par exist hi nahi
  karti** (aapki asal files `icon-192.png` root par aur
  `icons/icon-512.png` folder mein hain — README.md mein yehi likha
  hai). Jab ek file 404 ho, to `cache.addAll()` **poori list fail** kar
  deta hai — matlab offline cache kabhi sahi se bharta hi nahi tha,
  is liye offline mode bhi kaam nahi karta tha (ya bohot slow/hang
  hoti thi).

## Kya badla (files is folder mein)

1. **index.html** — teeno inline base64 images nikaal di gayi:
   - Bara logo ab ek real, chhota file `app-logo.png` (128×128,
     ~21KB — pehle 260KB tha) se load hota hai.
   - Ek unused/corrupt base64 variable (`GOLD_STAMP_B64`, kahin
     use hi nahi ho raha tha) hata diya.
   - Favicon ab dobara base64 ki bajaye maujooda `favicon.png` file
     se load hota hai.
   - **Result: file 1.27MB se ghat kar ~860KB ho gayi.**
2. **sw.js** — cache list mein sahi filenames (`icon-192.png`,
   `icons/icon-512.png`, `app-logo.png`, `favicon.png`) daale, aur
   cache version bump ki (`v7 → v8`) taake purane, adhoore cache
   sab devices par khud-ba-khud replace ho jayein.
3. **manifest.json** — icons ka path bhi isi tarah sahi kiya.
4. **offline.html** — icon path fix kiya.

Cloud sync (Firebase), auto-update (service worker background check),
aur staff attendance sync ka logic pehle se hi sahi tha (merge/arrayUnion
use ho raha tha taake do devices ek dusre ka data overwrite na karein) —
usko chhera nahi gaya, sirf upar wali asal "hang" wali wajah fix ki gayi hai.

## Aapko kya karna hai (upload steps)

1. Neeche di gayi 5 files apni hosting root mein purani files ki
   jagah **replace** kar dein:
   - `index.html`
   - `sw.js`
   - `manifest.json`
   - `offline.html`
   - `app-logo.png`  ← ye NAYI file hai, isay root mein add karein
     (jahan `icon-192.png` aur `favicon.png` pehle se hain)
2. `/icons/` folder ko bilkul chhu na — wo pehle se sahi hai.
3. Upload ke baad, ek dafa apne phone par app **poori tarah band
   karke dobara kholein** (ya browser cache clear karein) taake naya
   service worker (`v8`) load ho jaye — uske baad se har device par
   automatic update khud ho jayega (har 5 minute check + jab bhi tab
   wapis khulay).

## Agar phir bhi kahin dheela lage
Sabse zyada asar dalne wali cheez ab bhi ye ho sakti hai ke internet
bohot kamzor ho — is halat mein app khud "Offline — local save, net
aane par cloud sync hoga" dikhati hai, ye normal hai, data save ho
chuka hota hai aur net aate hi khud sync ho jata hai.
