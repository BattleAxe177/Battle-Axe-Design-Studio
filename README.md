# Battle Axe Design Studio v0.5.6.0

Battle Axe Design Studio is a browser-based workspace for turning historical source material and authored battlefield maps into Battle Axe scenarios, deployments, playtests, analysis, and publishable scenario material.

## Current release: Shared Battlefield Renderer & UI Polish

Version 0.5.6.0 concentrates on making the now-stable Studio workflow more reliable to read and more polished to use while preserving the PPTX-first compiler architecture introduced in v0.5.5.0.

- **Battlefield source SVGs are now immutable project evidence.** Generate Battlefield stores the original SVG text unchanged. The detected tabletop boundary is stored separately and applied as a render-time `viewBox` crop.
- **Shared cropped renderer fixes the blank/shallow battlefield failure.** Render clones receive explicit intrinsic width/height from the detected play area, so PowerPoint SVG exports retain a reliable aspect ratio in Battlefield Workspace, Geometry Explorer, Deployment, Playtest, replay, and Publisher images.
- **Downstream battlefield images use the same render crop.** Deployment, Geometry Explorer, and Playtest data-image URLs are produced from the immutable source plus the current play-area boundary rather than from a previously rewritten SVG.
- **Suggested Force Composition is now stacked vertically by side.** Each army gets the full available width, with larger headings, command labels, and formation bullets for substantially better readability while remaining a compact briefing graphic rather than a second roster editor.
- **AI Review adds `Accept all remaining`.** Batch acceptance uses the same change application path as individual Accept buttons, preserves rejected decisions, reports the accepted count, and provides an Undo accepted batch action.
- **External AI brief refreshed.** It now includes read-only source-force evidence, two-side rules, historical uncertainty guidance, the suggested-force planning model, canonical Battle Axe translation principles, map/terrain constraints, and plain-English review expectations.
- **Visual identity pass.** The Studio now uses stronger typography, brass/cartographic accents, richer panels, module illustrations, refined navigation, clearer empty states, improved AI review styling, and more deliberate interaction states without changing the established workflow.
- **Regression protection expanded.** v0.5.6 tests verify immutable SVG storage, render-time cropping, battlefield aspect handling, vertically stacked force sketches, batch AI acceptance, and the new visual presentation hooks.

**Upgrade note:** projects whose local map was generated under v0.5.5.0 may contain an already-rewritten SVG. Re-import the original PPTX/SVG once under v0.5.6.0 to gain the immutable-source renderer behavior.

## Development commands

```sh
npm test
npm run build
npm run check
npm run verify
```

See `CHANGELOG.md` for release history and `docs/` for architecture notes.
