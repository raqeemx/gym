# Exercise Demonstrations

This folder contains visual demonstrations shown in the **ℹ️ Form Notes modal** for each exercise (feature 3.2).

## Current State (V8.4)

Each exercise ships with a lightweight animated **SVG** placeholder (~1.5–3 KB each) that runs offline without dependencies. They illustrate the primary motion direction and provide the minimum visual cue a beginner needs.

| File | Exercise | Path in `EXERCISE_FORM_NOTES` |
|---|---|---|
| `chest-press.svg` | Chest Press | `assets/gifs/chest-press.svg` |
| `pectoral-fly.svg` | Pectoral Fly | `assets/gifs/pectoral-fly.svg` |
| `shoulder-press.svg` | Shoulder Press | `assets/gifs/shoulder-press.svg` |
| `delts-machine.svg` | Delts Machine | `assets/gifs/delts-machine.svg` |
| `lat-machine.svg` | Lat Machine | `assets/gifs/lat-machine.svg` |
| `low-row.svg` | Low Row | `assets/gifs/low-row.svg` |
| `reverse-fly.svg` | Reverse Fly | `assets/gifs/reverse-fly.svg` |
| `crossover-cables.svg` | Crossover Cables | `assets/gifs/crossover-cables.svg` |

## Replacing with real GIFs

To replace any placeholder with a real demonstration GIF/video, just drop the new file in this folder and update the `gif` field in [`js/program-data.js`](../../js/program-data.js):

```js
EXERCISE_FORM_NOTES = {
  "Chest Press": {
    title: "Chest Press — ضغط صدر",
    formNote: "<b>الأسلوب الصحيح:</b>...",
    gif: "assets/gifs/chest-press.gif"   // ← change here
  },
  ...
}
```

### Recommendations for real assets

| Aspect | Guideline |
|---|---|
| **Size budget** | 50–120 KB per file (keeps offline cache lean) |
| **Format priority** | `webp` (best compression) → `gif` → `mp4`. The modal supports any `<img src>`-compatible format. |
| **Dimensions** | 480×280 or 16:9, max 600px wide (the modal caps render at 280px max-height) |
| **Loop** | Must loop seamlessly (typical: 2.5–3s eccentric→concentric cycle) |
| **Background** | Transparent if possible; if not, dark (`#10131A`) to match the app theme |
| **Content** | Show the **full rep**: starting position → end position → return. Side-view usually clearest. |

### Adding a new exercise to the catalog

1. Add the GIF file here (e.g., `assets/gifs/leg-press.svg` or `.gif`).
2. Add an entry in `EXERCISE_FORM_NOTES` in `js/program-data.js`:
   ```js
   "Leg Press": {
     title: "Leg Press — ضغط أرجل",
     formNote: "...",
     gif: "assets/gifs/leg-press.svg"
   }
   ```
3. Add the asset path to `service-worker.js` ASSETS array if you want guaranteed offline caching:
   ```js
   './assets/gifs/leg-press.svg',
   ```
   (Otherwise, the asset is cached on first fetch via the runtime cache strategy.)

## Sourcing real GIFs

Public-domain or fair-use sources we recommend:
- [Wger Workout Manager](https://wger.de/en/exercise/overview/) — open-source exercise database (AGPL, attribution required)
- [Strength Level](https://strengthlevel.com/) — for technique references
- Record your own short clips and convert via:
  - `ffmpeg -i input.mp4 -vf "fps=15,scale=480:-1:flags=lanczos" -loop 0 output.gif`
  - Or use [ezgif.com](https://ezgif.com/) (browser-based, no upload to third parties beyond the converter)

## Fallback behavior

The modal handles missing assets gracefully:
- If the file at `gif` path returns 404, the image area is hidden — only the text instructions remain.
- If `gif` is `null`, the image area is not rendered at all.
- See `openFormNoteModal()` in [`js/program-render.js`](../../js/program-render.js) for the exact logic.
