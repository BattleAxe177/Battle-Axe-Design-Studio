# Battle Axe Design Studio v0.5.3.0

Battle Axe Design Studio is a browser-based workspace for turning historical source material and authored battlefield maps into Battle Axe scenarios, deployments, playtests, analysis, and publishable scenario material.

## Current release: Scenario Isolation & Battlefield State

Version 0.5.3.0 makes the active scenario and its battlefield the single source of truth across the Studio. Imported SVG maps are compiled and clipped to the tabletop play area, persisted with the project, and shared by Battlefield Workspace, Geometry Explorer, Deployment, Playtest, and Scenario Publisher. Starting a new scenario no longer permits map, terrain, deployment, playtest, or export artifacts from the previous scenario to appear as current data.

Force Builder now has exactly two opposing sides. Garrisons, reserves, detachments, reinforcements, and sortie forces are represented as roles or commands within one of those sides rather than as a third faction. Historical formations remain available even when their command organization is unresolved.

Pavia remains an explicit test/sample project, not a runtime fallback for unrelated scenarios.

## Development commands

```sh
npm test
npm run build
npm run check
npm run verify
```

See `CHANGELOG.md` for release history and the `docs/` directory for architecture notes.
