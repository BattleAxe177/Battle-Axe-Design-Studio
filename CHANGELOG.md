# v0.6.6.0 — Workflow Reliability Hotfix

- Fixed scenario-only project import on mobile/desktop.
- Added PPT rotation/flip/group transform handling and group alt-text inheritance.
- Added Road terrain authoring hook and movement-only road corridor handling.
- Improved ACW command/brigade hierarchy extraction.
- Added command-level bulk rotation and terrain-review normalization/polish.
- Restored full-source copy/overwrite release packaging.

# v0.6.6.0 — ACW & Custom Base Geometry

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
