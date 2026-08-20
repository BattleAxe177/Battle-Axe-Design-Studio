# Battle Axe Design Studio v0.5.4.0

Battle Axe Design Studio is a browser-based workspace for turning historical source material and authored battlefield maps into Battle Axe scenarios, deployments, playtests, analysis, and publishable scenario material.

## Current release: Compiler, Force Plan, Token Geometry & Playtest State

Version 0.5.4.0 is a focused test release for the issues exposed by the first non-Pavia scenario workflow.

- Battlefield detection now includes a scenario-independent rendered-appearance fallback and retains an explicit Geometry Explorer diagnostic instead of silently reporting a successful zero-feature compile for image-heavy SVGs.
- Deployment and Playtest now share one calibrated battlefield transform. Unit and commander footprints are derived from the configured physical base sizes and the scenario battlefield dimensions, so 25/50 mm square units remain physically square on both square and rectangular tables.
- Unit labels are presentation-only overlays: they may extend beyond the base for legibility but never change collision/contact geometry.
- Stale prepared playtest replays are cleared from the current-scenario preview when the scenario fingerprint changes; the preview always rebinds to the active battlefield.
- Force Builder now presents a visual Suggested Force Composition diagram from historical evidence. It shows proposed commanders/commands and the recommended canonical Battle Axe profile for each historical formation without automatically creating a cluttered roster. Users create commands and select/drag final units from the Unit Library.
- AI Review Bridge now shows plain-English recommendation cards by default. Raw Studio destination fields and JSON remain available only under an expandable Technical Detail section.

Pavia remains an explicit regression/sample project, not a runtime fallback or the default recognition target.

## Development commands

```sh
npm test
npm run build
npm run check
npm run verify
```

See `CHANGELOG.md` for release history and the `docs/` directory for architecture notes.
