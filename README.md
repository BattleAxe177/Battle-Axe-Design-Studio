# Battle Axe Design Studio v0.5.7.0

Battle Axe Design Studio is a browser-based workspace for turning historical source material and authored battlefield maps into Battle Axe scenarios, deployments, playtests, analysis, and publishable scenario material.

## Current release: Tactical AI, Replay Cues & Interaction Fixes

Version 0.5.7.0 adds rules-audit export, combat conformance corrections, battlefield-render synchronization, inferred initial facing, commander non-overlap, and more readable replay timing while preserving the v0.5.6 tactical AI workflow.

- **Auto tactical planning requires no setup.** Pressing Run Playtest generates broad army postures and command orders from approved Defensive terrain, deployment, and unit roles. Prepared defenders now prefer to retain useful positions instead of automatically advancing toward the nearest enemy.
- **Optional Playtest-only orders.** Army posture dropdowns (`Auto`, `Offensive`, `Balanced`, `Defensive`, `Delay`) and command orders (`Auto`, `Hold`, `Defend`, `Advance`, `Assault`, `Reserve`, `Screen`, `Maneuver`, `Withdraw`) can override only the parts the user wants to control. These choices do not alter the published scenario or its stale-playtest fingerprint.
- **Optional free-text tactical intent.** Plain-language additions such as “remain behind the earthworks,” “prefer fire,” “counterattack after the enemy closes,” and “do not pursue” are interpreted once into bounded structured modifiers. Unrecognized wording is ignored rather than silently invented.
- **Utility-based action selection.** Legal Battle Axe actions are scored against command order, prepared-position value, unit role, threat distance, reserve release, and bounded user modifiers. The rules engine still determines what is legal and adjudicates all dice/combat results.
- **Meaningful movement intents.** Withdraw moves away from the nearest threat, Maneuver seeks a flank approach, Defend can move toward nearby approved Defensive terrain, Screen advances toward screening range, and Reserve remains held until a close threat releases it.
- **Auditable decisions.** Playtest events record the chosen action, active order, score, and reasons. Debug log mode exposes this information without requiring the normal replay view to parse technical output.
- **Replay visual cues.** Standard replay cues add green/red command-test flags, firing smoke and target arrows, charge arrows, crossed swords for close combat, a skull before destroyed pieces disappear, commander-escape cues, and synchronized battle-log highlighting. Cues can be set to `Off`, `Standard`, or `Detailed`.
- **Replay cues are visual only.** They are transient overlays and never participate in movement, collision, contact, terrain, or other game geometry.
- **Deployment drag offset fixed.** Repositioning an already-deployed piece now preserves the exact pickup point instead of snapping the unit center under the pointer and jumping down/right.
- **Command hierarchy extraction strengthened.** Intake parsing distinguishes commander-in-chief, subordinate commander, and associated commander roles, preserves enclosing command hierarchy, and refreshes prior evidence on re-analysis instead of leaving stale orphan formations labeled as command-unresolved.
- **Terrain review controls stay accessible.** The feature-review heading and bulk Approve/Apply/Reject controls remain sticky while the long feature list scrolls.

The v0.5.5.0 PPTX-primary terrain compiler, generalized terrain ontology, unknown-feature preservation, and compact suggested-force diagram remain in this release.

## Development commands

```sh
npm test
npm run build
npm run check
npm run verify
```

See `CHANGELOG.md` for release history and `docs/` for architecture notes.

## v0.5.6.1 deployment hotfix

GitHub web uploads can retain files that are absent from a later ZIP. Verification now uses `tests/current-tests.json`, so obsolete test files left in the repository are ignored with a warning rather than executed. This removes the recurring stale-test deployment failure while still failing if a test required by the current release is missing.
