# Unreleased — Human-first Scenario Authoring Foundation

- Separates canonical scenario state, proposal/reference state, and publication narrative in schema 1.2.0.
- Replaces structural French/Imperial side keys with neutral `sideA`/`sideB` IDs across authoring, deployment, deterministic playtest, tactical exchange, replay, results, and Publisher; legacy projects migrate transparently while retaining historical display labels.
- Adds the validated `battle-axe-scenario-proposal` 1.0 contract. Proposal import preserves unknown extensions and routes forces, rule opportunities, terrain, deployment, victory, sources, and unresolved items without silently changing the canonical scenario.
- Makes arbitrary narrative intake evidence-only. Explicitly structured source headings remain available for deterministic extraction.
- Makes scenario rules human-authored canonical records. Imported rule opportunities require **Create Rule**; readable rule text is distinct from engine automation, and text changes mark non-tabletop automation stale for review.
- Adds record-level controls for proposed commands and units without auto-populating the force roster.
- Makes proposed-force actions idempotent and visibly marks applied records instead of duplicating canonical commands or units.
- Adds separately editable publication narrative, retains imported narrative only into blank fields, and makes Publisher use concise copy for the Scenario Sheet and full historical/battlefield narrative for the Design Dossier while retaining legacy canonical text fallbacks.
- Adds the downloadable `Battle_Axe_AI_Authoring_Pack.zip` to Source Intake and the Scenario Design AI bridge, containing the authoring guide, proposal schema/template, starting prompt, response contract, and tactical/playtest reference.
- Adds `AGENTS.md` contract-maintenance rules and regression coverage for neutral exports, legacy migration, proposal-only import, narrative routing, and documentation/schema drift.
- Adds bounded playtest-worker startup and execution watchdogs with a deterministic main-thread fallback so a failed worker cannot leave a run indefinitely on `Running…`.
- Verification: 252/252 automated tests, static build/deployment checks, legacy Glendale migration and deterministic browser playtest, human-first authoring workflow, authoring-pack download, AI bridge rendering, Scenario Library loading, and rebuilt Publisher narrative output.

# Unreleased — Canonical TacticalIntent follow-up

- Adds one validated TacticalIntent 1.0 structure shared by free-text plans, Auto Plan, External AI imports, and deterministic execution.
- Parses action/target/security/condition semantics before legacy keyword preferences, so “attack the southern flank of the Union line” remains an offensive geographic-flank order rather than flank security.
- Adds structured `ANY`/`ALL` reserve conditions with executable turn, destroyed-unit, named-terrain, line-state, and vulnerability predicates; command release remains permanently latched.
- Compiles “a Union artillery unit is destroyed, or by Turn 3, whichever happens first” as an `ANY` predicate tree rather than a ranged-fire preference.
- Makes External AI rich tactical fields executable directly after ID/schema validation instead of round-tripping them through free text.
- Labels ACW pre-contact tests explicitly as **Charge Test** and **Receive Charge Test** in engine events and the battle log.
- Aligns source/runtime/cache/export version markers with `VERSION` and fixes the release manifest's Windows path handling.
- Verification is included in the current 252-test Human-first Scenario Authoring Foundation pass above.

# v0.6.8.1 — Deployment Map Label & Polygon UX Hotfix

- Compact historical unit labels now sit outside unit bases in Deployment Editor and replay, while full names remain in tooltips/rosters.
- Reserve point/edge/edge-portion/zone labels are smaller, abbreviated, and anchored inside the battlefield so edge labels do not clip.
- Polygon and reserve-zone drawing can be completed by clicking the first vertex, double-clicking the last vertex, pressing Enter, or using Finish.
- Active polygon drawing now exposes Undo vertex; Backspace/Delete removes the last vertex; Esc/Cancel abandons the drawing.
- No battlefield compiler/detection logic changes.

# v0.6.8.0 — Hierarchy Authoring, AI Apply-All & Visual Reserve Entry

- Extends the external AI Bridge changeset schema to first-class hierarchical commands with stable command IDs, generic `commandType`, `parentCommandId`, commander/rating metadata, reserve status, and unit command assignment/reassignment.
- Replaces line-by-line external AI acceptance with a concise grouped preview and one validated **Apply All Changes** transaction, plus Cancel and **Undo AI Apply**.
- Makes Force Builder command hierarchy directly editable by drag and drop: drop a subordinate command onto its parent, or onto the side root to make it top-level; cross-side drops and circular hierarchies are rejected.
- Adds visible Delete controls for commands and units. Safe command deletion promotes subordinate commands rather than orphaning them, while directly assigned units are removed only after confirmation.
- Adds Force Builder Undo/Redo for command creation/deletion, hierarchy changes, unit creation/deletion/editing, and unit reassignment.
- Reworks reserve/reinforcement entry authoring into visual Deployment Editor tools: click a point, select a table edge, drag an edge portion, or draw a polygon zone directly on the battlefield map.
- Displays persistent reserve entry markers/lines/zones on the deployment map and stores their actual geometry in scenario deployment/reserve data.
- Adds Deployment Undo/Redo and keeps explicit Cancel/Escape paths for drawing/editing tools.
- Advances project schema to 1.1.0 while retaining legacy `echelon` compatibility and migrating it to generic `commandType` without losing parent IDs.
- Preserves the v0.6.5.0 battlefield/compiler functional baseline; normalized comparison confirms no protected battlefield/compiler logic changes.
- Release verification: 208/208 automated tests, static site build, deployment check, and protected battlefield/compiler preservation comparison passed.

# v0.6.7.1 — Legacy Map Import Safety Hotfix

- Legacy scenario-only JSON files are now explicitly detected as lacking a battlefield workspace.
- Opening such a file while a battlefield is already loaded offers to retain the current authoritative map, approved terrain, crop, and battlefield revision instead of silently replacing them with an empty project shell.
- When the legacy scenario title matches the current project and the legacy file contains no deployment, the current deployment is retained with that battlefield.
- Every project import now creates an automatic pre-import recovery copy in browser storage.
- Added **Restore Previous Project** beside Open Project so a destructive or mistaken import can be undone.
- Full v0.6.7.x Studio Project exports remain self-contained and include the compiled map, approved features, command/OOB state, and deployment.

# v0.6.7.0 — Command, ACW AI & Scenario Portability

- Reworks historical OOB interpretation around a generic nested command tree before Battle Axe leaf-profile mapping; the full Glendale fixture resolves to 82 explicit leaf units across 27 command nodes without narrative-unit leakage.
- Preserves formation names separately from commanders, including historical/scenario commander overrides, ratings, statuses, roles, parent commands, and unresolved commands with no invented units.
- Adds generic hierarchical Command Authority so commanders affect only their own command and descendant commands; ACW brigade/division/corps/army and Italian Wars shallower command structures use the same mechanism.
- Applies command authority to ACW command-test modifier selection, commander coverage, and commander movement AI.
- Improves ACW brigade cohesion and order-driven formation behavior: Defend favors useful frontage, Advance balances line and depth, Assault preserves follow-on echelons, Reserve stays compact, and Screen favors broad coverage.
- Improves commander positioning toward the useful rear-center of authorized formations while discouraging movement-lane obstruction and pointless coverage chasing.
- Fixes core LOS action legality so intervening friendly units and commanders can block fire; stores tested LOS rays/blockers for audit and includes the Glendale event-328 friendly-cannon case as a regression test.
- Adds structured off-table reserve deployment by point, edge, edge segment, or polygon zone at the end of the owning side's turn, with commander-first placement, temporary deployment command unit fallback, normal command-distance placement, partial-entry retention, and no action on the entry turn.
- Adds structured Turn-1 initiative override support while preserving normal initiative thereafter.
- Introduces schema-versioned, self-contained full-project JSON export/import retaining compiled map SVG, approved terrain/features and decisions, hierarchy/OOB, deployment/facing, reserve data, rules, tactical state, and compatibility metadata.
- Adds legacy project/scenario migration, safe defaults, unknown-field preservation where practical, stable command normalization, and visible post-import migration/warning feedback.
- Preserves the v0.6.5.0 battlefield/compiler functional baseline; release-version/cache references are the only intentional changes in that protected pipeline.
- Release verification: 199 automated tests plus static build/deployment checks and normalized battlefield-pipeline preservation comparison.

# v0.6.5.0 — Map Authoring & ACW OOB Reliability

- Applies PowerPoint DrawingML rotation, flip, group, and nested-group transforms before authored terrain geometry is normalized.
- Adds parent-group alt-text inheritance with child-metadata precedence and auditable metadata-conflict notes.
- Adds conservative no-alt-text visual/style inference for woodland, watercourse, fence, and road candidates.
- Cross-checks transformed PPT feature footprints against SVG detector geometry; PDF remains a registered appearance reference rather than an automated geometry authority.
- Normalizes promoted Geometry Explorer items into canonical terrain names/categories while preserving meaningful designer/source names.
- Makes Road a first-class Terrain Review rule role and keeps generic Track separate.
- Moves sticky multi-feature Terrain Review controls flush to the top of the review pane.
- Re-analyzes retained scenario source when the period supplement changes, eliminating stale Italian Wars interpretation after switching to ACW.
- Renders proposed forces as a hierarchical command tree and retains unresolved brigades without fabricating regiments.
- Preserves v0.6.4.0 crop synchronization, source scenario rules, ACW rectangular bases, command bulk rotation, road movement policy, and Italian Wars isolation.
- Release verification: 188 automated tests plus static build/deployment checks.

# v0.6.3.0 — ACW & Custom Base Geometry

- Completes the ACW period plugin with the published four-unit Army Builder library, brigade validation, commander competency, ACW combat rules, mounted/dismounted cavalry, artillery, and brigade-centric playtest doctrine.
- Adds scenario-wide custom unit width/frontage and depth, commander diameter, measurement multiplier, and per-unit footprint overrides.
- Adds the optional 50 × 25 mm ACW regiment preset while keeping basing separate from printed rules measurements and from ACW RAW.
- Extends shared geometry through rotated collision/bounds, movement, continuous straight-path swept collision, wheel pivots, charge contact/conform, fallback, replay, Publisher, command range, LOS, defensive-terrain adjacency, and tactical frontage.
- Detects overlaps/off-table footprints created by base-size changes in Deployment and blocks Playtest from starting from invalid geometry.
- Keeps fixed-size/legacy `baseMm` assets square unless explicit width/depth overrides are supplied.
- Publisher keeps differently based units separate, prints their dimensions, preserves rectangular proportions/facing, and records default basing in scenario metadata.
- Carries forward the v0.6.0.3 facing, Publisher color, and tolerant import hotfix behavior plus v0.6.2 common-engine hardening.
- Release verification: 174 automated tests, plus build/static deployment checks. Large 50 × 25 mm formations still require live browser stress testing before those UX behaviors are treated as closed.

# v0.6.2.0 — Common Engine Hardening + ACW Integration

- Keeps American Civil War as a Period Supplement plugin on the shared Battle Axe engine rather than an ACW fork.
- Adds shared authoritative footprint geometry for Deployment and Playtest collision/bounds, swept first-contact charge movement, replay sizing and Publisher deployment-map sizing.
- Adds universal post-action positional-state rollback for illegal overlap/off-table endpoints.
- Reworks deployed-piece dragging around the exact original grab point and preserves illegal-drop return-to-origin behavior.
- Adds command-level offensive waves, blocker-first activation sequencing, spatial Screen frontage and permanently latched Reserve release.
- Enriches charge/combat/Break diagnostics and Detailed replay blocking/tactical-state overlays.
- Adds in-memory legacy JSON migration before validation, with regression fixtures for multiple earlier shapes.
- Retains canonical battlefield/crop, scenario-isolation, release-manifest, Publisher and existing ACW/Italian Wars regression safeguards.
- Automated regression coverage is not treated as proof of live UX correctness: 50 mm collision, drag behavior, congestion, battlefield synchronization and broad legacy-import compatibility remain explicitly flagged for live verification.
- 50 × 25 mm rectangular ACW bases are not yet exposed/advertised as a finished Studio authoring mode.

# v0.6.1.0 — American Civil War Supplement Plugin

- Adds American Civil War to the Scenario Builder period supplement selector through the existing rules-plugin architecture.
- Loads the four published ACW unit profiles: Infantry, Sharpshooters, Cavalry, and Cannons.
- Implements ACW Commander Competency, 5+ rating-assisted Command Tests, generic Union/Confederate rating tables, Break-Test fallback, enfilade fire, Rebel Yell, Refusal to Receive, Muskets, Rifles, and mounted/dismounted cavalry behavior.
- Adds ACW brigade-composition validation and 1-point commanders to published force totals.
- Adds an engine-only brigade-centric ACW tactical doctrine for regimental maneuver, fire-before-charge behavior, flank security, screening, artillery preservation, cavalry dismounting, and command friction.
- Preserves Italian Wars behavior behind supplement capability guards.
- Does not change unit footprint geometry; proposed 50 × 25 mm ACW bases remain a separate engine improvement.
- Adds v0.6.1.0 ACW regression coverage and updates release cache/version markers.

# v0.6.0.3 — Facing, Publisher & Compatibility Hotfix

- Fixed non-functional Deployment Rotate controls.
- Added explicit Deployment facing/front arrows.
- Preserved Deployment facing as the authoritative Playtest starting facing.
- Added print/PDF color-preservation rules for Publisher deployment units and commanders.
- Added tolerant legacy project/scenario JSON import and in-memory migration.
- Retained SVG viewport and authoritative battlefield-crop repairs.
- Added v0.6.0.3 release regression tests.

# v0.6.0.2 — Battlefield Render Hotfix

- Repairs Battlefield Workspace rendering for SVG sources that provide width/height without an explicit viewBox (common in PowerPoint exports).
- Normalizes a responsive SVG viewBox before fixed dimensions are removed, preventing the browser 300×150 fallback viewport from producing a blank/white battlefield strip.
- Restores feature highlighting to the actual battlefield geometry instead of falling through to an oversized HTML bounding-box overlay when the SVG viewport is missing.
- Adds a release regression test for width/height-only SVG battlefield sources and current local-map startup.

# Battle Axe Design Studio v0.5.8.0 — Movement & Combat Conformance

## Rules / engine
- Full rotated unit footprints must remain inside the battlefield; center-only edge legality is no longer sufficient.
- Movement path collision samples the moving footprint, preventing ordinary friendly interpenetration and overlap.
- Italian Wars Pike and Shot Tactics is directional: Swordsmen, Crossbowmen, and Arquebusiers may pass through friendly Pike formations; Pike formations do not gain the reverse permission.
- Normal Move Actions now distinguish forward wheel-and-move, half-speed backward movement, and half-speed sideways movement.
- Forward movement wheels around the appropriate front corner (up to 90 degrees) before straight movement.
- Charge conforming preserves the initial contact point and uses only the minimum pivot needed to align contacted edges; the previous lateral snap/centering search is removed.
- Shooting and Javelin Skirmish targeting now use the Studio front-90-degree shooting convention.
- A unit that charged into a defensive feature does not gain Defensive terrain protection for that same close-combat resolution.
- Commander movement now stays put when repositioning would not actually improve command coverage.

## Tactical plan
- Free-text intent recognizes conditional phrases such as line breached, friendly defensive line abandoning its position, and enemy becoming tactically vulnerable.
- Explicit release conditions take precedence over the generic proximity-based Reserve release trigger.
- Conditional instructions bias units to preserve position until their interpreted trigger is satisfied.
- The interpretation remains bounded and deterministic; unsupported conditional wording defaults toward preserving position rather than silently inventing behavior.

## Deployment
- New and repositioned units/commanders are kept fully inside the battlefield.
- Deployment refuses final stacking and searches for the nearest legal non-overlapping placement.
- Existing pickup-offset drag behavior is retained.

## Quality
- Test manifest remains release-owned so stale GitHub test files are ignored.
- Added v0.5.8 movement/combat regression coverage.

## v0.6.0.2 — Design Complete
- Deployment drag now preserves the exact cursor grab point throughout the drag; illegal drops return to origin rather than snapping elsewhere.
- Deployment orientation is stored as starting facing and is no longer replaced by enemy-centroid auto-facing.
- Added deployment rotate controls and cancel control for deployment-zone authoring.
- Strengthened rotated-footprint deployment checks and retained full-footprint playtest collision checks.
- Added staged first-/second-wave activation ordering for congested offensive commands and alternate movement candidate use.
- Zero-distance tactical moves are rejected.
- Explicit Reserve release conditions latch at command level once triggered.
- Screen orders use spatial screening targets rather than only a score bonus.
- Defend orders continue to seek nearby approved Defensive terrain before settling into Hold.
- Charge log distinguishes first contact, conform angle, and completed charge; conform reports zero lateral translation under the Studio convention.
- Detailed replay legend now documents command flags, smoke, arrows, melee, casualties, retreat/escape, range bubbles, and blocked actions.
- Detailed replay status labels use plain language instead of DEF/CMD/OUT abbreviations.
- Added Battle Axe Scenario Sheet, Scenario Booklet, and Design Dossier publication modes.
- One-page Scenario Sheet includes deterministic short overview, battlefield effects, deployment brief, points rosters, command subtotals/army totals, rules, victory and deployment map.
- Playtest results expose designer findings including blocked/shortened movement and reserve release events.
- Retains scenario-isolation, authoritative battlefield-revision, no-scenario-fallback, and release test-manifest safeguards.

## 0.6.0.2 — Battlefield crop repair
- Repairs saved battlefields whose play-area crop was accidentally widened to the full authoring SVG canvas.
- Re-detects the explicit tabletop boundary from the source SVG at startup and treats it as authoritative when a stored crop is missing, full-slide, or materially inconsistent.
- Re-serializes the canonical battlefield SVG after repair so Battlefield Workspace, Geometry Explorer, Deployment, Playtest, and Publisher all use the same crop.
- Retains the 0.6.0.1 SVG viewport normalization fix for width/height-only PowerPoint exports.
- Adds regression coverage for crop repair and authoritative boundary reuse.
