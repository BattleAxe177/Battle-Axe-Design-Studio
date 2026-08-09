# Changelog

## 0.5.0-ui-preview — UI stabilization milestone
- Reworked the application shell around six primary stages: Project, Battlefield, Scenario, Deployment, Playtest, and Publish.
- Reduced visual density, standardized spacing/buttons/panels, added a compact project header and persistent desktop status bar.
- Kept source intake and Geometry Explorer as contextual Battlefield tools instead of primary workflow stages.
- Restored simple color-coded, permanently labeled unit counters; side determines color family and the actual Studio command grouping determines a clearly distinct command shade.
- Restored direct pointer dragging for deployed units and commanders with no double-click prerequisite.
- Restored playtest facing as visible engine state: counters rotate with their facing and show a facing vector; pivot events remain part of replay state.
- Rebuilt the fitted replay viewport around one authoritative square stage shared by battlefield, units, commanders and heat-map overlays.
- Force Builder now evaluates accepted scenario-rule overrides when validating Camp limits, allowing scenario-specific exceptions such as two French Camps without changing canonical rules globally.
- Publisher keeps compact force lists, uses only authoritative current scenario text, renders deployment as a map, and lets deployment labels extend outside true unit footprints rather than clipping names.
- Preserves Army Asset immobility/destruction, Defensive terrain adjudication, stale-playtest reset/versioning, AI Review Bridge protocol, manual terrain authoring and Publisher functionality from the 0.4 alpha line.

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

## 0.5.0-ui-preview
- Round-trip AI changeset review/apply workflow.
- Separate AI designer request field and playtest summary export.
- Camp/Baggage Train army assets.
- Deployment status + tactical symbols.
- Replay Play/Pause and speed controls.
- Final-position unit collision enforcement.
- Application-wide button interaction feedback.

## 0.5.0-ui-preview
- Reverted map counters to simple color-coded labeled units with command shades.
- Restored alpha.6 deployment drag/drop behavior.
- Unified replay map/image/overlay transform.
- Hardened Camp/Baggage immobility and Army Asset destruction/VP handling.
- Cleaned Publisher force lists, duplicate text, and deployment-map output.
