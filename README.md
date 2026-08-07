# Battle Axe Design Studio

Battle Axe Design Studio is the permanent browser application for the Battle Axe scenario-development workflow: map intake and compilation, battlefield feature review, scenario authoring, deployment, engine playtesting, analytics, and publication.

## Current release

**v0.4.0-alpha.1 — Map Review + Scenario Builder Alpha**

This release extends the existing geometry-first map workflow and introduces the first functional Scenario Builder workbench.

### Map Studio
- Runtime scanning of the immutable Pavia SVG rather than hard-coded feature boxes.
- Hydrology detector accepts long/thin filled water polygons and line-based watercourses.
- Sticky/frozen battlefield view on desktop while feature lists scroll.
- Multi-select Battlefield Features with bulk approve, reject, and shared-attribute application.
- Geometry Explorer multi-select, bulk import/ignore, and Select Similar.
- Detection confidence is separate from interpretation confidence.
- Source geometry is never modified.

### Scenario Builder alpha
- Flexible multi-source intake: TXT/MD/JSON/CSV are extracted directly; DOCX/PDF/images are registered as immutable evidence for future visual/document analysis.
- Bundled examples demonstrate both the structured Battle Axe Pavia draft and the visually structured scanned Wargamer's Guide scenario.
- Extraction Review separates source observations from Studio interpretations and highlights unresolved fields.
- Suggestion Tray proposes optional Battle Axe treatments such as fog, surprise, breach, and garrison sortie; each can be included, edited, ignored, or restored.
- Force Builder separates imported/historical forces from Battle Axe roster units.
- Drag/drop unit library and army rosters.
- Scenario unit instances can be renamed and edited without changing canonical Battle Axe profiles.
- Initial unit library encodes the commonly relevant later French/Imperial Italian Wars profiles, with M/C/A, traits, and points.
- Scenario JSON export saves reviewed parameters, accepted suggestions, force rosters, provenance records, ignored suggestions, and unresolved items.

### Not yet implemented
- Automatic text/visual extraction from arbitrary PDF/DOCX/image uploads in the static browser app. These files are registered now; the later analysis service will supply multimodal extraction.
- Deployment editing from imported deployment diagrams.
- Engine/playtest integration in the website.
- Final formatted scenario-document publishing.

## GitHub Pages deployment

The repository contains `.github/workflows/pages.yml`. In GitHub: **Settings → Pages → Source: GitHub Actions**. Every push to `main` runs tests, builds `dist/`, verifies the deployment package, and publishes it when successful.

## Verify locally

```bash
npm ci
npm run verify
```

No third-party runtime dependencies are required in this alpha.
