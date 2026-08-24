# Battle Axe Design Studio v0.6.2.0 — Common Engine Hardening + ACW Integration

## Scope

This release extends the current shared Studio/common-engine baseline. The American Civil War supplement remains a rules/AI plugin selected through the normal Period Supplement architecture; it does not own or duplicate common movement, collision, replay, deployment, scenario-state, or import logic.

The release was driven by the current common-engine consolidation requirements. In particular, recently claimed fixes for 50 mm collision, exact deployment dragging, command congestion, battlefield synchronization and legacy JSON import are treated as needing evidence rather than being assumed complete from a prior version number.

## Implemented in this release

### Shared footprint and positional-state geometry

- Added `src/modules/footprintGeometry.js` as the shared footprint geometry service.
- Rendering/collision helpers now understand physical width, depth and shape metadata rather than requiring every object to be treated as a center point.
- Deployment legality and playtest collision use polygon penetration tests where exact edge touch is legal and actual penetration is illegal.
- Full rotated footprint battlefield bounds are enforced.
- Unit/commander endpoint checks include both units and separately based commanders.
- Charge translation now uses a continuous swept-footprint contact calculation to stop at first base contact rather than driving a sample ray into the defender.
- Charge conform retains the agreed minimum-pivot interpretation and records lateral conform translation as `0`; pivot displacement is reported separately.
- A universal post-action assertion is applied to positional changes wired through movement, charge/contact/conform, compulsory fallback, commander movement/escape, skirmish withdrawal and counter-charge. Illegal final states are reverted and logged as `state_assertion_revert`.
- Deployment, replay and Publisher deployment maps consume shared physical-footprint sizing data.

### Deployment authoring

- Existing deployed pieces use pointer-event dragging with the exact original grab offset preserved.
- Pointer coordinates for an active piece drag are not clamped to the map frame, preventing the grabbed point from drifting when the cursor reaches an edge.
- Illegal drops return to the original placement instead of recentering, snapping or substituting another location.
- Cancel and Escape exit paths are wired for deployment-zone authoring.
- Existing visible deployment facing continues to seed playtest starting facing.

### Command-level tactical behavior

- Offensive commands assign dynamic first-wave, follow-up and support/reserve roles when multiple subordinate units are active.
- Activation ordering considers friendly lane blockers and moves the blocking formation earlier when that opens the command's intended advance.
- Follow-up/support units are encouraged to wait, fire or preserve depth instead of repeatedly attempting a blocked move.
- Existing edge-recovery candidate search is retained: forward/no-wheel, alternate wheel, sideways, backward and shorter endpoints are tested before declaring a move blocked.
- Meaningless near-zero movement is rejected rather than recorded as a useful advance.
- Reserve release is latched at command level; after release, all subordinate units see the command as released unless a future authored rule explicitly introduces a reversible trigger.
- Screen orders now generate actual lateral screening frontage instead of only changing utility scores.
- Defend continues to seek nearby usable Defensive terrain before strong Hold inertia takes over.

### Diagnostics and replay analysis

- Charge diagnostics report first contact, contacted defender edge, actual conform angle, zero lateral conform translation and pivot displacement.
- Attack diagnostics include attack-count derivation and rule/trait reason codes.
- Break-Test diagnostics include threshold, modifiers/reason codes and separate ACW D3 fallback rolls.
- Movement/blocking events retain blocker IDs where the blocking unit is known.
- Detailed replay can highlight the blocking unit and now carries tactical order, maneuver-wave and Reserve held/released state in snapshots/status overlays.
- Designer findings now retain blocked and shortened movement, repeated movement blocks, final command gaps, Defensive-position use, terrain use, units that never moved meaningfully, and Reserve-release timing.

### Legacy project/scenario import

- File import now passes through an explicit migration pipeline before current-structure validation.
- The importer recognizes current Studio wrappers, older project wrappers, top-level scenario wrappers and scenario-only JSON.
- Flat legacy rosters migrate into current command structures.
- Current defaults are supplied for ruleset/deployment/two-side/workspace fields before validation.
- Unknown recoverable scenario/project fields are preserved rather than causing wholesale rejection.
- Migration occurs in memory; the source file is not overwritten.
- Added regression fixtures representing an early roster-based scenario and a wrapped 0.5.3-era project.

### ACW plugin preserved on the common engine

- Published ACW unit profiles remain: Infantry, Sharpshooters, Cavalry and Cannons.
- Commander Competency, rating-assisted 5+ Command Tests, Union/Confederate generic rating tables, natural-1 Break fallback, enfilade, Rebel Yell, Refusal to Receive, Muskets, Rifles, mounted/dismounted cavalry and ACW artillery behavior remain capability-guarded in the ACW module.
- Brigade validation and commander point cost remain supplement-owned.
- The brigade-centric ACW tactical doctrine continues to use the shared command-plan/activation architecture rather than a parallel ACW simulator.

## Regression-protected / preserved

The current release-owned manifest keeps prior tests for the following shared behavior in addition to the new v0.6.2.0 tests:

- canonical battlefield revision/crop reuse across Battlefield Workspace, Geometry Explorer, Deployment, Playtest and Publisher;
- PowerPoint-derived SVG viewport normalization and battlefield-crop repair;
- New Scenario isolation and removal of named-scenario runtime fallback behavior;
- two-side scenario model;
- deployment facing preservation;
- close-combat sequencing and defender-first precedence where applicable;
- directional Defensive terrain adjudication;
- movement wheel/sideways/backward rules and Pike-and-Shot interpenetration exception;
- Off / Standard / Detailed replay-cue selection and replay legend;
- deterministic Scenario Sheet / Booklet / Design Dossier publisher architecture;
- release-owned test manifest behavior;
- Italian Wars supplement isolation;
- ACW supplement registration and rule/doctrine regression tests.

## Still unresolved / requires live verification

These are deliberately **not** declared finished solely from automated test results:

- **50 mm collision reliability in live Studio use.** The release replaces duplicate collision calculations with shared polygon geometry and adds automated 50 mm/rotated-footprint tests, but the previously observed visible-overlap failure needs direct browser replay/deployment verification before it is considered closed.
- **Exact deployment grab-point behavior in the browser.** The implementation and pure drag invariant are regression-tested, but the prior UX defect should be verified by manually grabbing units at several off-center points and dragging through/near the battlefield edges.
- **Command-level congestion/wave behavior.** First/follow-up/support waves and blocker-first sequencing are implemented and unit-tested, but large-force live playtests are still required to show that offensive commands no longer stall pathologically.
- **Battlefield state synchronization.** Existing canonical-crop regression tests remain green, but Cerignola/Pavia should still be used as a live smoke test after deployment because this was previously a browser-state regression.
- **Legacy JSON compatibility breadth.** The migration pipeline and two historical fixtures are now present, but the project does not yet contain a comprehensive fixture corpus for every prior public Studio release. A recoverable file outside the known shapes may still expose another migration case.
- **50 × 25 mm rectangular units are not yet exposed as a supported authoring option.** Shared geometry/rendering can carry width/depth metadata and charge/collision uses that footprint, but the Studio has not yet completed end-to-end UI authoring and live regression coverage for rectangular ACW regiments. Do not advertise 50 × 25 as finished in this release.
- Detailed replay does not yet render every terrain effect or firing arc persistently for every unit at every snapshot; current detailed overlays are improved but remain an analysis feature under development.
- Full command-parser improvements for Commander-in-Chief / attached / provisional relationships remain future Force Builder work.
- Congestion heatmap comparison across batches remains a future enhancement; the existing heat data is retained.

## Not applicable to the ACW plugin itself

The following remain common-engine or other-period concerns and are not encoded as ACW-specific rules:

- Italian Wars Pike and Shot Tactics, Swiss restrictions, Pikes/Fury/Elite/Tercio and Shock Cavalry behavior;
- scenario-specific surprise, sortie, reinforcement or terrain effects unless authored in the scenario;
- battlefield detection/classification architecture;
- Publisher prose generation through an embedded LLM (the Studio intentionally has none; deterministic exports remain primary and the external AI Review Bridge is optional).

## Regression tests added

`tests/v0620_common_engine_hardening.test.mjs` adds functional coverage for:

- 50 mm edge-touch vs polygon penetration and rotated-footprint bounds;
- exact deployment grab-point invariant;
- post-action illegal-state rollback;
- command-level Reserve latch;
- spatial Screen frontage;
- wave assignment and blocker-first activation ordering;
- migration of two legacy JSON shapes;
- shared footprint consumption across Deployment, Playtest and Publisher;
- conform/diagnostic reason-code fields;
- deployment drawing-tool Cancel/Escape paths.

The release manifest remains authoritative; stale tests retained outside `tests/current-tests.json` do not run automatically, while a missing manifest-owned test still fails the release.
