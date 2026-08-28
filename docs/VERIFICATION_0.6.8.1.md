# v0.6.8.1 Verification

Verification completed before packaging:

- `npm test`: **213/213 passed**.
- `npm run build`: passed; static GitHub Pages site generated in `dist/`.
- `npm run check`: passed.
- New regression coverage validates compact historical unit labels, abbreviated reserve command labels, inward edge-label anchoring, polygon finish/undo/cancel affordances, and outside-the-token label CSS.
- Protected battlefield/compiler modules were compared against v0.6.5.0 after normalizing only `?v=` cache references; all compared files were functionally identical.

Protected comparison set:
- `structuredMapCompiler.js`
- `battlefieldCrop.js`
- `battlefieldDetector.js`
- `battlefieldScale.js`
- `battlefieldState.js`
- `featureReview.js`
- `geometryExplorer.js`
- `mapView.js`

This hotfix intentionally changes only deployment/replay labeling, reserve-entry overlay presentation, polygon authoring controls, release cache stamps, and associated tests/documentation.
