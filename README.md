# Battle Axe Design Studio v0.5.5.0

Battle Axe Design Studio is a browser-based workspace for turning historical source material and authored battlefield maps into Battle Axe scenarios, deployments, playtests, analysis, and publishable scenario material.

## Current release: PPTX Geometry Ontology & Compact Force Diagram

Version 0.5.5.0 changes the map compiler architecture so a structured PowerPoint map is treated as the preferred gameplay-geometry source instead of merely as supporting evidence.

- **PowerPoint-authored geometry is primary when a PPTX and matching SVG are supplied.** Freeforms, rectangles, connectors, shape bounds, and author descriptions are read directly from the PPTX. The SVG remains the rendered/cropped battlefield and visual fallback.
- **General terrain ontology replaces the short exact-name dictionary.** The compiler recognizes broad families such as relief, hydrology, wet ground, vegetation, agriculture, roads/tracks, walls/barriers, fortifications, crossings, settlements, structures, and military areas using aliases and source wording rather than battle-specific names.
- **Unknown authored geometry is never silently discarded.** A meaningful PowerPoint shape whose terminology is unfamiliar is retained in Geometry Explorer as an `Unknown` source-authored candidate for human classification.
- **Source wording is preserved.** The compiler records the user's own label/description alongside the normalized terrain suggestion and confidence.
- **Freeform geometry is retained.** PowerPoint custom geometry paths, including line and Bézier segments, are converted to battlefield-relative geometry for feature highlighting and game use.
- **SVG clipping coordinates are stable.** Vector bounding boxes are normalized into root SVG coordinates so changing the battlefield `viewBox` no longer shifts feature coordinates after clipping/reload.
- **Generic visual fallback remains available.** Maps without a structured PPTX still use SVG/vector/appearance detection and Geometry Explorer rather than failing silently.
- **Suggested Force Composition is now a compact read-only force sketch.** Each side is presented as an army/command tree with short formation bullets and the suggested canonical Battle Axe profile. It is deliberately visually distinct from the actual drag/drop roster below and no longer acts as a second card editor.
- **GitHub Pages workflow uses Node-24-generation actions** (`checkout@v5` and `setup-node@v5`) while continuing to run the full verification pipeline before deployment.

Pavia and Cerignola are regression examples only. The compiler's acceptance tests deliberately include terrain terminology not used by either map (for example bocage, sunken lanes, rice paddies, wadis, redoubts, ravines, and fords).

## Development commands

```sh
npm test
npm run build
npm run check
npm run verify
```

See `CHANGELOG.md` for release history and `docs/` for architecture notes.
