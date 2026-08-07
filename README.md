# Battle Axe Design Studio

Battle Axe Design Studio is the permanent browser application for the Battle Axe scenario-development workflow: map intake and compilation, battlefield feature review, scenario authoring, deployment, engine playtesting, analytics, and publication.

## Current release

**v0.3.3 — Repository Foundation**

This is the first release intended to live permanently in the GitHub repository. Future releases should modify this source tree rather than replace it with unrelated prototypes.

### Functional now
- Responsive desktop/iPhone application shell
- Scenario-defined play-space settings
- Historical Battlefield Description and Input Map Notes
- Bundled Pavia battlefield map
- Pre-populated battlefield-feature review queue
- Bright-red flash + translucent selected-feature highlight
- Cumulative Battle Axe rules context
- Separate Geometry Explorer with whole-map candidate previews
- Import candidate into normal review / ignore candidate
- Browser-local project persistence
- PWA manifest and service worker
- Automated repository checks, tests, build, and GitHub Pages deployment

### Foundation modules visible but not yet connected
- Scenario Builder
- Deployment Editor
- Battle Axe Engine / Playtest Center
- Scenario Publisher

## GitHub Pages deployment

The repository contains `.github/workflows/pages.yml`. In GitHub: **Settings → Pages → Source: GitHub Actions**. Every push to `main` runs checks/tests/build and publishes `dist/` if successful.

## Local verification (optional)

With Node 20+ installed:

```bash
npm ci
npm run verify
```

No third-party runtime dependencies are required in v0.3.3.

## v0.3.3 focus
Battlefield recognition now scans the imported SVG first, keeps the historical description as context only, derives gate/breach placement from source-map evidence, and keeps the battlefield map visible during desktop feature review.
