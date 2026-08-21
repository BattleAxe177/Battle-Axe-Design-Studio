# Battle Axe Design Studio v0.5.7.1


**v0.5.7.1 hotfix:** fixes the Battlefield Feature Review startup error caused by missing user-facing confidence/source helper functions in v0.5.7.0.
Battle Axe Design Studio is a browser-based workspace for turning historical source material and authored battlefield maps into Battle Axe scenarios, deployments, playtests, analysis, and publishable scenario material.

## Current release: Battlefield Registration & Designer-Facing Polish

Version 0.5.7.1 focuses on the issues found while testing Cerignola and on making the now-stable Studio structure feel more like a finished scenario-design application.

- PowerPoint-authored tabletop boundaries are now registered directly into the matching SVG coordinate system and become authoritative for crop and feature alignment.
- Historical Battlefield Description and Input Map Notes are now analyzed as terrain context; matching terrain concepts can strengthen classification confidence while unknown geometry remains unresolved rather than being invented.
- Force Builder no longer dedicates a large column to duplicated imported-force cards; the suggested-force diagram and final army builder receive substantially more space.
- Battlefield Review defaults to plain-English confidence and source summaries, with detector percentages and diagnostic reasoning moved under Technical details.
- Deployment dragging preserves the exact point where the user grabbed a unit, so release drops the piece where it visually sits instead of recentering it under the cursor.
- Playtest stale-state and warning text is rewritten for scenario designers rather than exposing configuration hashes.
- Top-level actions and other controls receive higher contrast, larger hit areas, and clearer primary/secondary hierarchy.
- Additional developer-oriented copy is reduced or moved behind expandable diagnostic sections.
- Release verification: 119 automated tests pass, production build passes, and the GitHub Pages static deployment check passes.

## Development commands

```sh
npm test
npm run build
npm run check
npm run verify
```

See `CHANGELOG.md` for release history and `docs/` for architecture notes.
