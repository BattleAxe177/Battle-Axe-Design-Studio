## 0.3.3.2 — Cache/deployment visibility fix
- Bumped the PWA cache namespace from the legacy v0.3.2 cache.
- Switched HTML/JS/CSS requests to network-first so new GitHub Pages deployments become visible promptly.
- Added cache-busting version parameters to the application shell assets.
- Preserved offline cache-first behavior for static map assets.

# Changelog

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
