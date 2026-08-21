# Battle Axe Design Studio v0.5.8.0

Battle Axe Design Studio is a browser-based workspace for turning historical source material and authored battlefield maps into Battle Axe scenarios, deployments, playtests, analysis, and publishable scenario material.

## Current release: Command Hierarchy & Designer Workflow

Version 0.5.8.0 focuses on the workflow issues found during Cerignola testing while preserving the now-working terrain compiler.

- Structured scenario briefs now retain real battlefield command headings, commanders-in-chief, subordinate commanders, formation links, and provisional assignments.
- Suggested Force Composition no longer uses repeated fake “Command organization unresolved” branches; uncertain formations are shown once as unassigned evidence.
- Scenario-rule extraction filters internal Scenario Builder instructions and other meta-language that does not describe a playable rule.
- Geometry Explorer imports can be renamed in Battlefield Review, and reclassification moves them into the appropriate normal terrain family while keeping source provenance in Technical details.
- Deployment has explicit Select / Move, Rectangle Zone, and Polygon Zone modes with Finish, Cancel, and Escape behavior. Placing a unit returns to Select / Move.
- Battlefield dimensions are checked against the authored map aspect ratio, with a one-click Match battlefield proportions helper.
- Release verification: 127 automated tests pass; production build and GitHub Pages static deployment checks pass.

## Development commands

```sh
npm test
npm run build
npm run check
npm run verify
```

See `CHANGELOG.md` for release history and `docs/` for architecture notes.
