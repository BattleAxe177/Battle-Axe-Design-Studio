# Changelog

## 0.4.0-alpha.4 — Geometry review & facing repair

- Map Studio now flashes raster-derived features using the actual recognized pixel geometry instead of a bounding rectangle.
- Vector-derived features continue to flash their exact SVG source geometry; boxes are now last-resort diagnostics only.
- Raster tree-line/avenue guesses are no longer auto-promoted without stronger topology evidence; ambiguous candidates stay in Geometry Explorer.
- Playtest units now carry facing as engine state, pivot toward movement/contact direction, emit pivot events, and render rotated in replay with a facing arrow.
- Historical formation notes and Studio rationale/designer notes remain normalized from alpha.3.
- Polygon deployment zones and the external-AI bridge remain available.

## 0.4.0-alpha.4 — Playtest Center and workflow consolidation

### Map Studio
- Preserved the successful appearance-assisted watercourse detector.
- Added appearance-assisted wall, woodland, tree-line/avenue, and lower-confidence road detection when equivalent clean vectors are absent.
- Expanded map diagnostics to report class counts rather than only the total promotion pipeline.
- Retained conservative Geometry Explorer behavior for lower-confidence objects.

### Scenario Studio
- Restricted force extraction to recognized force/army sections where possible, preventing narrative paragraphs containing words such as “artillery” from becoming spurious unit cards.
- Added concise historical notes to imported formations while retaining the exact source row separately as evidence.
- Studio-generated Battle Axe units now receive an editable rationale explaining why they were created, what they represent, and why the canonical profile was proposed.
- Retained command hierarchy on both source/historical and Battle Axe rosters.
- Added External AI Bridge: export/copy a structured project brief and save a returned external-AI response as a scenario source.

### Deployment Editor
- Replaced rectangle-only zone storage with editable polygon geometry.
- Added rectangle-zone and free-polygon creation tools.
- Added draggable zone vertices and whole-zone movement.
- Added basic vertex insertion/removal controls.

### Playtest Center
- Added deterministic seeded single-game browser playtests.
- Added 1–250 run batch balance analysis using sequential deterministic seeds.
- Added replay snapshots, step controls, and a typed event log.
- Added movement, combat, casualty, commander-influence, and congestion heat-map overlays.
- Added readiness diagnostics for undeployed units, missing sides, and unapproved terrain.
- Browser adapter is explicitly marked as an incremental port; the Python Development Consolidation 1 engine remains the reference implementation.

### Rules data
- Canonical Italian Wars library remains scenario-independent and includes Archers and Forlorn Hope.
