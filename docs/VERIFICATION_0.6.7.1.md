# Verification — Battle Axe Design Studio v0.6.7.1

## Automated repository verification

The release-owned current test manifest contains 35 test files and completed with:

**199 tests passed / 0 failed.**

The v0.6.7.1 regression coverage adds deterministic checks for:

- full Glendale ACW OOB interpretation: 82 explicit leaf units, 30 Union / 52 Confederate, 27 command nodes;
- correct formation/commander separation, historical/scenario commander context, unresolved commands, and no narrative-unit leakage;
- generic nested Command Authority and exclusion of sibling-command influence;
- core LOS blocking by friendly units and commanders, including the Glendale event-328 friendly-cannon geometry;
- legal-action suppression of blocked shooting and restoration when the blocker moves clear;
- ACW Defend-versus-Assault frontage/depth role assignment;
- command-authority-aware commander coverage behavior;
- end-of-owning-turn reserve deployment with commander-first entry and no action on the entry turn;
- temporary deployment command unit behavior when a reserve has no commander;
- Turn-1 initiative override behavior;
- full project JSON round trip retaining map SVG, approved terrain, command hierarchy, deployment/facing, reserve configuration, and unknown compatibility fields;
- legacy scenario-only migration with safe current-schema normalization.

All existing baseline tests remain in the manifest and pass alongside the new regression cases.

## Build and static deployment verification

`npm run verify` completed successfully, including:

- automated test suite;
- static site build;
- static deployment/reference check.

## v0.6.5.0 battlefield/compiler preservation check

The protected battlefield pipeline was compared against the extracted v0.6.5.0 authoritative baseline after normalizing only release cache/version query strings. No functional differences were found in the compared battlefield/compiler modules.

Protected comparison set:

- `src/modules/structuredMapCompiler.js`
- `src/modules/battlefieldDetector.js`
- `src/modules/featureReview.js`
- `src/modules/geometryExplorer.js`
- `src/modules/battlefieldCrop.js`
- `src/modules/battlefieldState.js`
- `src/modules/mapView.js`
- `src/modules/battlefieldScale.js`
- `src/modules/roadMovement.js`

## Important verification boundary

Automated tests protect deterministic data/model/engine contracts. Live browser acceptance remains appropriate for visual ergonomics such as reserve-entry drawing/editing, formation appearance under unusual terrain congestion, and the migration feedback banner in different viewport sizes. The release is designed so those UI concerns do not alter the protected v0.6.5.0 battlefield compiler logic.

- Legacy scenario-only import retention and cross-scenario deployment isolation are covered by deterministic regression tests.
- Automatic pre-import recovery is wired through the current project payload/migration pipeline.
