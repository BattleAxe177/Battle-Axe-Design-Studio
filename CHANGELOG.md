# Changelog

## 0.4.0-alpha.6 — Structured Map Compiler & Command Audit

- Replaces raster-first normal terrain promotion with a structured PPTX-authored terrain manifest for Pavia.
- Uses PowerPoint object descriptions and geometry as the primary battlefield source; SVG and PDF are validation/rendering sources.
- Bundled Pavia compiler recognizes authored Marsh, Woods, Roads, Streams, Park Walls, Gates, tree lines, Bridges, built-up areas and Earthworks while excluding explicitly decorative building artwork.
- Terrain review highlights the exact compiled polygon/polyline geometry instead of feature bounding boxes.
- Approved terrain geometry is consumed directly by the browser playtest engine.
- Adds geometry-aware point/line terrain queries and open-crossing bridge overrides.
- Adds Impassable-terrain movement blocking to the browser adapter.
- Moves raster/appearance detection to Geometry Explorer-only fallback duty.
- Adds local in-browser PPTX metadata inventory on Map Intake.
- Audits command rules: command-specific 3-inch bonus, general 4-inch bonus, explicit post-activation commander movement up to 4 inches, enemy-distance restriction, and command-coverage logging.
- Preserves Scenario Builder, deployment polygons, external AI bridge, deterministic playtesting, replay and heat maps from alpha.4.

## 0.4.0-alpha.6 — Scenario Workbench UX + Manual Terrain Authoring
- Added **Add missing feature** authoring directly on the battlefield: polygon, line, or point geometry can be drawn when structured extraction misses a source feature.
- Manual features are non-destructive derived Studio geometry, persist with the project, enter the normal review queue, and use the same classification/effects inspector as compiled features.
- Added a persistent Scenario Builder checklist linking directly to sections needing attention.
- Added visual separation between **Source says**, **Studio suggests**, and **Designer accepted** states.
- Refined Scenario Builder into a less form-like workbench while preserving command-card drag/drop, rule editing, provenance, AI bridge, deployment, and playtest integration.

## 0.4.0-alpha.7
- Round-trip AI changeset review/apply workflow.
- Separate AI designer request field and playtest summary export.
- Camp/Baggage Train army assets.
- Deployment status + tactical symbols.
- Replay Play/Pause and speed controls.
- Final-position unit collision enforcement.
- Application-wide button interaction feedback.
