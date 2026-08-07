# Changelog


## 0.3.3.5 — Promotion pipeline repair

- Repairs the detected-geometry → battlefield-feature promotion stage.
- Uses rendered SVG geometry bounds so nested PowerPoint transforms cannot silently drop review features.
- Adds raw/classified/promoted/Geometry Explorer diagnostics to the map header.
- Cache-busts all first-party ES module imports during runtime stabilization.
- Improves gate/opening anchoring by preferring compact source-map objects adjacent to wall geometry; falls back to the source label rather than inventing a wall location.
- Keeps historical context out of spatial placement.

## v0.3.3.1 — GitHub Actions verification fix
- Fixed CI ordering so tests run first, the production `dist/` site is built second, and deployment artifact checks run after the build exists.
- No battlefield detection or UI behavior changed from v0.3.3.


## 0.3.2 — Repository Foundation
- Established permanent repository-ready application structure.
- Split application into ES modules rather than a monolithic prototype file.
- Added automated repository checks, node tests, build script, and GitHub Pages Actions workflow.
- Added a verified Pavia sample dataset with promoted hydrology, walls, openings, roads, vegetation, structures, and Geometry Explorer candidates.
- Added whole-map Geometry Explorer candidate previews.
- Added cumulative rules-context display.
- Preserved responsive desktop/iPhone layouts and PWA support.

## 0.3.3 — Geometry-First Recognition Pass
- Replaced hard-coded Pavia feature boxes with a runtime scan of the imported SVG geometry.
- Detection now starts from source-map geometry/color/topology; historical context is not used to create or place features.
- Added separate detection and interpretation confidence values.
- Gate and breach locations are derived from source-map labels associated to the nearest detected wall geometry rather than historical prose.
- Streams/wet channels, woods, wall linework, tree-line geometry, and compact bridge symbols are inventoried directly from SVG features.
- Added exact geometry highlighting for detected SVG paths/polygons.
- Made the desktop battlefield map sticky while feature and inspector panels scroll independently.

## 0.3.3.3 — Runtime repair
- Added browser-visible startup error diagnostics.
- Added explicit application/build version stamp.
- Versioned the main module and battlefield map requests.
- Temporarily disabled/unregistered service-worker caching so stale releases cannot mask GitHub deployments.
- Added base-aware GitHub Pages asset resolution.
- Added runtime smoke tests and browser smoke-test support.

## 0.3.3.5 — SVG loader repair
- Parse imported battlefield SVG as XML (`image/svg+xml`) rather than inserting source text with `innerHTML`.
- Correctly accepts namespace-prefixed SVG roots such as PowerPoint-derived `<ns0:svg>` via `localName` and namespace URI.
- Imports the parsed SVG root into the live HTML document before geometry detection.
- Adds explicit diagnostics for HTTP, empty-response, parser, root-element, and map-host failures.
