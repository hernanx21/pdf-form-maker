# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Server

```bash
python3 -m http.server 8765
# Then open http://localhost:8765
```

No build step — pure static files. Changes take effect on browser refresh.

To test Service Worker caching, use an incognito window or clear site data between tests (`Application > Storage > Clear site data` in DevTools).

## Architecture

Static PWA (no framework, no bundler, no backend). Hosted on GitHub Pages via `/docs` or `gh-pages` branch.

**Script load order in `index.html` matters:**
1. `js/libs/jspdf.umd.min.js` → exposes `window.jspdf`
2. `js/libs/jspdf.plugin.autotable.min.js` → patches `jsPDF.prototype`
3. `js/db.js` → declares global `DB` (via `const` — accessible in subsequent scripts but **not** as `window.DB`)
4. `js/pdf.js` → declares global `PDFGen`, depends on `jspdf`
5. `js/app.js` → main app, depends on `DB` and `PDFGen`

**Routing:** Hash-based SPA. `#home` (or empty) → home screen; `#form?id=<uuid>` → edit form; `#form?id=new` → new ficha (pre-creates a DB record immediately so photo blobs can reference it by UUID before the URL reflects it).

**State:** No global state object. `currentFichaId` in `app.js` tracks the active form. All persistent state lives in IndexedDB.

## Data Layer (`js/db.js`)

Two IndexedDB object stores in `fichaMedicion` DB (v1):
- `fichas` — keyed by `id` (UUID), index on `updatedAt`
- `fotos` — auto-increment key, index on `fichaId`; blobs stored natively

Photos are stored as raw `Blob` objects (not base64) in IndexedDB. They are only converted to base64 for JSON export/import, and to data URLs for jsPDF embedding.

## Form Data Model

```js
{
  id, createdAt, updatedAt,
  cueva, punto, fecha, horaInicio, horaFin,
  agua,          // 'si' | 'no' | ''
  aguaTipo,      // { corriendo: true|false|null, estancada: true|false|null }
                 // ⚠️ old fichas may have array format ['corriendo','estancada'] — always use
                 // aguaTipoVal(f, key) in app.js and getAguaTipo(ficha, key) in pdf.js to read
  seccionTransversal,
  parametros:          { humedad, temperatura, presion, velViento, co2 },
  equiposRadiacion:    { alphaE, gammaScout, gmqGmc600, dosimetros, sondaBeta },
  equiposAdicionales:  { medidorRadiacionCosmica },
  // All boolean fields use true | false | null (null = user has not selected yet)
  observaciones
}
```

`collectFormData()` in `app.js` reads the live DOM to build this object. Toggle Sí/No buttons write directly to the in-memory `ficha` object via `setNestedValue()` using dot-path strings (e.g. `"parametros.humedad"`), then `autoSave()` persists to IndexedDB.

**Toggle state convention:** `true` = Sí (green), `false` = No (red), `null` = not yet selected (unstyled). The `toggleItem()` renderer and `collectFormData()` both rely on this three-way distinction — do not coerce `null` to `false` when rendering.

## PDF Generation (`js/pdf.js`)

Uses jsPDF + AutoTable. Key design decisions:

- **No Unicode checkboxes** — Helvetica in jsPDF uses WinAnsi encoding; `☑`/`☐` render as `&`. Yes/No values use colored `autoTable` cells instead: `ynCell(val)` returns a green cell for `true`, red for `false`, gray `—` for `null`.
- Each section maps to an `autoTable` call. Section headers are filled rectangles drawn before each table.
- **Photos:** each photo gets its own A4 page (`doc.addPage()`). Dimensions are obtained via `getImageDimensions(dataUrl)` (loads into an `Image` element), then scaled uniformly with `Math.min(availW/w, availH/h)` and centered.
- Color constants are RGB arrays at the top of the IIFE.
- `generate(ficha, fotos)` is `async` because blobs require `FileReader` and image dimension detection requires `Image.onload`.

## PWA Install (`js/app.js`)

Install is always available via the **⋮ menu → "Instalar app"**, regardless of device. The `beforeinstallprompt` event is captured and stored in `deferredInstallPrompt` but never triggers a banner automatically. `triggerInstall()` dispatches to one of three paths:

- **Android/desktop with captured prompt** → calls `deferredInstallPrompt.prompt()`
- **iOS** (detected via UA) → shows a dialog with step-by-step Safari instructions
- **Other / no prompt** → shows a generic "look in browser menu" dialog

When already installed (`isInStandaloneMode()`), the menu item is shown disabled.

## Service Worker (`sw.js`)

Cache name is currently `ficha-medicion-v6`. **Bump this string whenever adding new assets or making breaking changes** — the activate handler purges all caches with a different name. The `ASSETS` array must list every file the app needs; omitting a file breaks offline mode silently.

The app also exposes a **"Limpiar caché y datos"** option in the home ⋮ menu (`clearAllData()` in `app.js`) which deletes all IndexedDB records, clears all SW caches, and unregisters the SW.

## Bundled Libraries

`js/libs/` contains vendored copies of jsPDF and AutoTable — **never use CDN URLs**. To update:

```bash
cd /tmp && npm install jspdf jspdf-autotable
cp node_modules/jspdf/dist/jspdf.umd.min.js <repo>/js/libs/
cp node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.min.js <repo>/js/libs/
```

Then bump `CACHE_NAME` in `sw.js`.

## Deployment (GitHub Pages)

Push to `gh-pages` branch or configure Pages to serve from `/docs`. The `.nojekyll` file prevents GitHub from ignoring files prefixed with `_`. HTTPS is required for `beforeinstallprompt` to fire on Android — GitHub Pages provides this automatically.
