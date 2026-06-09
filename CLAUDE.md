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
3. `js/db.js` → exposes `window.DB`
4. `js/pdf.js` → exposes `window.PDFGen`, depends on `window.jspdf`
5. `js/app.js` → main app, depends on `DB` and `PDFGen`

**Routing:** Hash-based SPA. `#home` (or empty) → home screen; `#form?id=<uuid>` → edit form; `#form?id=new` → new ficha (pre-creates a DB record immediately so photo blobs can reference it).

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
  aguaTipo,      // string[] — ['corriendo', 'estancada']
  seccionTransversal,
  parametros: { humedad, temperatura, presion, velViento, co2 },       // boolean
  equiposRadiacion: { alphaE, gammaScout, gmqGmc600, dosimetros, sondaBeta }, // boolean
  equiposAdicionales: { medidorRadiacionCosmica },                      // boolean
  observaciones
}
```

`collectFormData()` in `app.js` reads the live DOM to build this object. Toggle Sí/No buttons write directly to the in-memory `ficha` object via `setNestedValue()` using dot-path strings (e.g. `"parametros.humedad"`), then `autoSave()` persists to IndexedDB.

## PDF Generation (`js/pdf.js`)

Uses jsPDF + AutoTable. Each section maps to an `autoTable` call with explicit `columnStyles` widths. Section header rows are drawn as filled rectangles before each table. Color constants are defined as RGB arrays at the top of `PDFGen`.

The `generate(ficha, fotos)` function is `async` because photo blobs require `FileReader` to convert to data URLs before `doc.addImage()`.

## Service Worker (`sw.js`)

Cache name is `ficha-medicion-v1`. **Bump this string when adding new assets** — the activate handler purges all caches with a different name. The `ASSETS` array must list every file the app needs to function offline; omitting a file breaks offline mode silently.

## Bundled Libraries

`js/libs/` contains vendored copies of jsPDF and AutoTable — **never use CDN URLs**. To update, run:

```bash
cd /tmp && npm install jspdf jspdf-autotable
cp node_modules/jspdf/dist/jspdf.umd.min.js <repo>/js/libs/
cp node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.min.js <repo>/js/libs/
```

Then bump `CACHE_NAME` in `sw.js`.

## Deployment (GitHub Pages)

Push to `gh-pages` branch or configure Pages to serve from `/docs`. The `.nojekyll` file prevents GitHub from ignoring files prefixed with `_`.
