# Battle Axe Design Studio v0.5.7.0 — Rules Audit Export & Combat Corrections

- Added a low-profile **Export results** disclosure to Playtest. Normal users get a readable HTML report; an Advanced subsection downloads a ZIP diagnostic package containing the report, full event/snapshot timeline, scenario snapshot, engine diagnostics, and optional batch summary.
- Downstream Deployment, Replay, Publisher and Geometry images now normalize the active SVG to the saved play-area `viewBox` at render time, preventing a raw full-slide authoring SVG from reappearing after compilation.
- Initial unit facing is inferred from the opposing force geometry when the designer has not explicitly supplied a facing. Removed the old faction-based north/south fallback.
- Commanders now seek non-overlapping endpoints during normal movement and escape; initially overlapping commanders are corrected to the nearest legal position for the playtest runtime.
- Corrected Italian Wars **Pikes**: non-charging pike units double melee attacks and treat all facings as Front; removed the unsupported reroll-of-1s behavior; active pikes now suppress flank/rear doubling against them.
- Tightened Defensive terrain adjudication so both combatants do not receive the same area-defense benefit merely because they occupy the same Defensive polygon.
- Replay command/combat/destruction cues now dwell longer at normal speed, with event-aware replay timing.
- Skirmish/Javelin attacks are identified explicitly in the battle log.
- Current-release test manifest retained; stale repository tests remain ignored.

# Battle Axe Design Studio v0.5.6.1 — Repository Test Isolation Hotfix

- Replaces the broad `tests/*.test.mjs` test glob with a release-owned test manifest.
- GitHub-retained stale test files are now reported and ignored instead of breaking deployment.
- Missing tests that belong to the current release still fail verification.
- No gameplay or scenario behavior changes from v0.5.6.0.

# Battle Axe Design Studio v0.5.6.1 — Tactical AI, Replay Cues & Interaction Fixes

- Added a zero-input Auto tactical planner to Playtest. It derives broad army posture and command orders from deployment, approved Defensive terrain, and unit roles before the first activation.
- Added Playtest-only army posture dropdowns (`Auto`, `Offensive`, `Balanced`, `Defensive`, `Delay`) and command-order dropdowns (`Auto`, `Hold`, `Defend`, `Advance`, `Assault`, `Reserve`, `Screen`, `Maneuver`, `Withdraw`). Unspecified commands remain on Auto.
- Added optional free-text tactical intent and deterministic interpretation into bounded structured modifiers for position preservation, fire preference, counterattack triggers, delayed commitment, force preservation, aggression, flank/screen emphasis, and no-pursuit intent.
- Added `Hold` as a first-class tactical action and replaced the universal shoot/charge/move priority with utility scoring informed by order, terrain value, unit role, and threat state.
- Prepared defenders now strongly penalize voluntarily abandoning approved Defensive terrain; ranged troops prefer useful fire; artillery prefers useful firing positions; reserves stay held until a close threat releases them.
- Added order-specific movement intent: Defend can seek nearby Defensive terrain, Maneuver takes a flank-biased route, Withdraw moves away from the nearest enemy, and Screen approaches to a useful engagement envelope rather than behaving as a generic assault order.
- Kept tactical decisions reproducible without consuming the Battle Axe combat/command RNG stream merely for AI tie-breaking.
- Added tactical-plan explanations and detailed decision reasons to Playtest/Debug output while keeping the default Run Playtest workflow one-click.
- Added transient replay visual cues: green/red command-test standards, firing smoke, shot arrows, charge arrows, crossed-swords melee cue, skull cue before removal, commander escape cue, and active event-log highlighting.
- Added `Off / Standard / Detailed` replay-cue control; Detailed mode also shows a small deliberate-Hold marker.
- Fixed deployed-piece drag pickup so the grab offset is preserved from pointer-down through drop; labels cannot affect physical footprint or drag geometry.
- Strengthened command hierarchy extraction to distinguish commander-in-chief, subordinate commander, and associated commander roles and link formations to the enclosing source command.
- Re-analysis now enriches matching historical evidence and command links instead of leaving an older orphan copy that continues to appear as “Command organization unresolved.”
- Pinned Terrain & Feature Review heading and bulk action controls while feature rows scroll.
- Added v0.5.6 regression coverage for hierarchy parsing, free-text intent, zero-input prepared-defense behavior, Playtest-only order isolation, RNG-stream preservation, drag offset behavior, sticky terrain controls, and replay cue UI.

# Battle Axe Design Studio v0.5.5.0 — PPTX Geometry Ontology & Compact Force Diagram

- Reworked map compilation so a matching PPTX is the preferred source of gameplay terrain geometry; the SVG supplies rendering, clipping, and visual fallback.
- Added browser-side extraction of PowerPoint shape bounds, freeforms, connectors, custom geometry paths, and author descriptions.
- Replaced the narrow exact-label terrain dictionary with a broad terrain ontology covering relief, hydrology, wet ground, vegetation, agriculture, routes, walls/barriers, fortifications, crossings, built environments, structures, and military areas.
- Added synonym/alias handling for varied mapmaker terminology and explicit regression vocabulary not present in the Pavia or Cerignola examples.
- Unknown but meaningful PowerPoint-authored geometry is retained as an `Unknown` Geometry Explorer candidate instead of being discarded.
- Preserved original source labels and interpretation confidence separately from the normalized terrain suggestion.
- Added actual PowerPoint custom-geometry path extraction, including sampled Bézier curves, so structured feature highlighting is based on authored shapes rather than only bounding rectangles.
- Fixed SVG coordinate normalization so geometry is measured in root SVG user coordinates and remains stable after battlefield viewBox clipping or reload.
- Removed named Pavia gate/castle heuristics from the generic visual detector; generic labels such as gate/porta/breach may still ground a candidate without proper-name assumptions.
- Redesigned Suggested Force Composition as a compact, read-only command-tree sketch with bullet-style formations and canonical Battle Axe profile references; removed command-creation controls from the suggestion graphic.
- Expanded terrain review classes to preserve source concepts such as Elevated Ground, Vineyard, Orchard, Field, Hedge, Earthwork, Fortification, Ford, Water Body, Ditch, Ravine, and Settlement.
- Updated GitHub Pages workflow to `actions/checkout@v5` and `actions/setup-node@v5`.
- Added v0.5.5 regression tests for broad non-sample terrain vocabulary, unknown-term preservation, PPTX-primary compilation, viewBox-stable geometry, removal of named Pavia runtime heuristics, and compact force-sketch presentation.

# Battle Axe Design Studio v0.5.3.0 — Scenario Isolation & Battlefield State

- New Scenario now establishes a clean scenario boundary: map, terrain, force, deployment, playtest, and publisher state can no longer silently reuse the prior scenario.
- Added one authoritative battlefield revision shared by Battlefield Workspace, Geometry Explorer, Deployment, Playtest, and Scenario Publisher.
- Local imported SVG battlefields now persist across reloads, compile terrain immediately, and carry their play-area/compile metadata with the project.
- Generate Battlefield now determines the table boundary, clips the rendered battlefield to that play area, generates review/explorer candidates, invalidates dependent deployment/playtest state, and reloads all workspaces against the new battlefield.
- Added scenario-independent vector candidate fallback so meaningful source geometry is surfaced in Geometry Explorer when classification confidence is too low for normal review. A geometry-rich map that yields zero candidates now raises an explicit compiler warning.
- Removed runtime Pavia-map fallbacks from Geometry Explorer, Deployment, Playtest, and Scenario Publisher; an unavailable battlefield is shown as unavailable rather than substituted with a test fixture.
- Force Builder now models exactly two opposing sides. Garrison, reserve, detachment, reinforcement, and sortie forces remain commands/roles within one of those sides rather than creating a third faction column.
- Added arbitrary army-heading/side registration so new scenarios are not limited to French/Imperial source terminology; the old internal keys remain compatibility slots only.
- Historical formations remain visible in Force Builder even when command organization is unresolved, and proposed Battle Axe translations can be created before perfect command assignment.
- Deployment now reports an empty force list correctly and detects battlefield-revision mismatch rather than treating 0/0 units as a complete deployment.
- Playtest configuration fingerprints now include battlefield revision, preventing a prepared run for an earlier map from being treated as current.
- Scenario Publisher/export now renders exclusively from the active scenario battlefield and current two-side roster; stale Pavia export content is not used as a fallback.
- Added cross-scenario regression tests for two-side forces, legacy garrison migration, map persistence, clipping/compilation, downstream battlefield binding, playtest invalidation, and removal of Pavia runtime fallbacks.

# Battle Axe Design Studio v0.5.2.3 — Module Startup / Cache Hotfix

- Fixed the release entry point still requesting `main.js?v=0.5.0-ui-preview`.
- Updated all browser module cache-busters to `0.5.2.3` so GitHub Pages/browser caches cannot mix old and new JavaScript modules.
- Updated the startup watchdog to report the current release.
- Added regression tests that reject stale module query versions in future releases.
- Preserves the v0.5.2.2 Generate Battlefield and Source Intelligence v2 changes.

# Battle Axe Design Studio v0.5.2.2 — Battlefield Generation & Source Intelligence v2

- Added explicit Generate Battlefield for new projects using the selected SVG/vector map.
- Consolidated Map & Terrain and Feature Review into one normal battlefield workspace.
- Added Historical Extraction Register with provenance/confidence.
- Historical formations are evidence first; Battle Axe translations are separate Studio proposals.
- Removed troop-keyword command invention; uncertain command structures remain unresolved.
- Expanded generic handling for objectives, scenario character, battlefield character, and special-rule/event candidates.
- Regression tests use abstract examples rather than Pavia/Cerignola-specific expected outputs.

# Battle Axe Design Studio v0.5.2.1 — Scale, Navigation & UI Polish

- Corrected visual footprint scaling: base size is now rendered relative to the current battlefield dimensions in Deployment and Playtest.
- A 50 mm base on a 24″ table therefore appears twice as large relative to the map as the same base on a 48″ table.
- Measurement multiplier remains independent and affects rules distances only.
- Added persistent Battlefield local navigation and explicit Back to Battlefield controls in Sources & Context / Geometry tools.
- Added first UI polish pass: cleaner persistent navigation, more restrained developer information, Advanced / Diagnostics treatment, and improved interaction states.
- Added explicit **Load Pavia Test Scenario** regression fixture.
- Added Pavia isolation audit and tests so generic Studio modules do not rely on Pavia-specific names or coordinates.
- New Scenario continues to open a genuinely blank project.

# Battle Axe Design Studio v0.5.2 — Scenario Configuration & Validation

- Added independent tabletop geometry and rules-measurement controls.
- Added Original Scale preset: 25 mm square units, 15 mm round commanders, 1× rules measurements.
- Added Double Scale preset: 50 mm square units, 25 mm round commanders, 2× rules measurements.
- Presets can be uncoupled/customized, including 50 mm units with rules-as-written 1× distances.
- Playtest collision/contact geometry uses selected base sizes; movement/range/command distances use the independent measurement multiplier.
- Scale configuration is included in the playtest fingerprint, configuration summary and External AI brief.
- Added Scenario Check for common setup problems.
- Added Rules / Engine Interpretation inspector for accepted scenario rules.
- Added Open Project for restoring editable Studio project JSON exports.
- Added a plain-English How to Use Studio guide covering the full workflow.
- Preserves v0.5.1.1 responsiveness and v0.5.1.2 label-orientation fixes.

# Battle Axe Design Studio v0.5.1.3 — New Scenario / Clean Start

- Added a persistent **New Scenario** control to the Studio header.
- New Scenario clears map/terrain state, source/extraction state, forces, commanders, rules, deployment, playtests, AI-review state, and publisher project state.
- Installed Battle Axe Core/supplement architecture is preserved; a clean project currently defaults to the Italian Wars supplement.
- Added **Export / Save Current Scenario First**, which downloads a complete editable Studio project JSON before reset.
- Reset no longer silently reloads the bundled Pavia battlefield; Studio returns to a genuinely blank map/source workspace.
- Reset reloads the application after clearing persisted scenario state so no stale in-memory playtest or editor data survives.

# Battle Axe Design Studio v0.5.1.2 — Replay Label Orientation Hotfix

- Counter bodies and facing arrows continue to rotate with actual facing.
- Unit-name labels now explicitly counter-rotate and remain screen-upright at every facing angle.
- Corrected a CSS cascade issue that had overridden the earlier label counter-rotation.
- Preserves v0.5.1.1 playtest responsiveness and all rules-conformance changes.

# Battle Axe Design Studio v0.5.1.1 — Playtest Responsiveness Hotfix

- Moved deterministic and batch playtests into a Web Worker so simulation geometry cannot freeze the Studio UI.
- Added a hard simulation event guard with turn/side/actor diagnostics.
- Removed duplicate legal-action enumeration during activations.
- Preserved the Phase 1–3 conformance engine and Core → Supplement → Scenario Override architecture.
- Playtest failures now halt safely and display diagnostic context instead of causing an unresponsive page.

# Battle Axe Design Studio v0.5.1 — Rules-Conformant Playtest & UI Polish

- Integrated Rules Conformance Audit Phases 1–3 and the Phase 2.5 Core/Supplement/Scenario rules architecture into the main site release.
- Playtest labels now remain screen-upright while counters and facing arrows rotate with actual unit facing.
- Increased visual separation among command colors within each side while preserving French/Imperial/Garrison color families.
- Deployment Editor unit labels are again continuously visible on simple color-coded counters.
- Scenario Publisher deployment-map unit labels now visually match Deployment Editor counters more closely while preserving true base footprint.
- Retained scenario-rule overrides above supplement validation, including multiple-Camp exceptions.
- Retained charge-to-contact and free conformity, legal action generation, commander rules, directional Defensive terrain, period supplement separation, and the audited Italian Wars traits.

# Battle Axe Design Studio v0.5.0.2-conformance.3 - Rules Conformance Audit Phase 3

- Implemented Core Commander charge, escape, capture/death, and Commander/General VP rules.
- Moved commander movement to the Core sequence between unit activations and close combat.
- Added directional Defensive-terrain handling for walls and ramparts.
- Applied Dangerous tests to actual traversed paths and added Difficult-terrain charge-range handling.
- Confirmed the Core rules do not contain a generic retreat/recoil result; the engine does not invent one.
- Corrected Italian Wars Shock Cavalry Counter Charge to straight-forward D3 movement.
- Corrected Italian Wars Javelin Skirmish to once per turn while preserving normal second-Action eligibility.
- Split legal-action generation from tactical AI selection/execution.
- Added Phase 3 commander, terrain, and action-legality regression tests.
- See `docs/RULES_CONFORMANCE_AUDIT_PHASE3.md`.

# Battle Axe Design Studio v0.5.0.2-conformance.2 — Phase 2.5 Rules Architecture

- Split Core from period supplements.
- Added supplement selector architecture with Italian Wars as the first installed module.
- Added Core → Supplement → Scenario Override precedence.
- Force Builder, source analysis, AI Review, and Playtest now consume the selected ruleset.

# Battle Axe Design Studio v0.5.0.2-conformance.2

- Rules Conformance Audit Phase 2: movement, charge conformity, close-combat sequencing, LOS, Italian Wars traits and period rules.
- Charge now contacts then freely conforms flush to the defender base edge; conformity may exceed the Move allowance after legal initial contact.
- Added oriented rectangular base geometry, 90° Move wheel, 45° Charge wheel, 1-inch enemy exclusion, base-to-base ranges and front-edge LOS.
- Added Swiss restriction, Pike-and-Shot transit, Javelins, corrected Pikes, Pistols pre-charge fire, Shock Cavalry counter-charge, Tercio expansion and Artillery contact destruction.
- Removed unsupported Big Battles second-Move shortcut.
- See docs/RULES_CONFORMANCE_AUDIT_PHASE2.md.

# Battle Axe Design Studio v0.5.0.2-conformance.1

- Began formal Battle Axe Rules Conformance Audit.
- Replaced distance-triggered instant melee with legal Charge-to-contact geometry.
- Deferred close combat to a close-combat phase and enforced contact before melee attacks.
- Added LOS blocking by intervening units and Obscuring terrain.
- Added Italian Wars Big Battles second-Move rule.
- Corrected Camp/Baggage Train Defensive contact and VP rules.
- Added combat-legality regression tests.
- See `docs/RULES_CONFORMANCE_AUDIT_PHASE1.md`.

# Battle Axe Design Studio v0.5.0.1

- Fixed Force Builder scenario override parsing so natural-language rules such as “French may deploy two Camps”, “two French Camps”, and “French Two-Camp Exception” raise the French Camp limit to two immediately in Force Builder.
- Canonical one-Camp validation remains the default when no accepted override exists.

# Changelog

## 0.5.0-ui-preview — UI stabilization milestone
- Reworked the application shell around six primary stages: Project, Battlefield, Scenario, Deployment, Playtest, and Publish.
- Reduced visual density, standardized spacing/buttons/panels, added a compact project header and persistent desktop status bar.
- Kept source intake and Geometry Explorer as contextual Battlefield tools instead of primary workflow stages.
- Restored simple color-coded, permanently labeled unit counters; side determines color family and the actual Studio command grouping determines a clearly distinct command shade.
- Restored direct pointer dragging for deployed units and commanders with no double-click prerequisite.
- Restored playtest facing as visible engine state: counters rotate with their facing and show a facing vector; pivot events remain part of replay state.
- Rebuilt the fitted replay viewport around one authoritative square stage shared by battlefield, units, commanders and heat-map overlays.
- Force Builder now evaluates accepted scenario-rule overrides when validating Camp limits, allowing scenario-specific exceptions such as two French Camps without changing canonical rules globally.
- Publisher keeps compact force lists, uses only authoritative current scenario text, renders deployment as a map, and lets deployment labels extend outside true unit footprints rather than clipping names.
- Preserves Army Asset immobility/destruction, Defensive terrain adjudication, stale-playtest reset/versioning, AI Review Bridge protocol, manual terrain authoring and Publisher functionality from the 0.4 alpha line.

## 0.4.0-alpha.6 — Structured Map Compiler & Command Audit

- Replaces raster-first normal terrain promotion with a structured PPTX-authored terrain manifest for Pavia.
- Uses PowerPoint object descriptions and geometry as the primary battlefield source; SVG and PDF are validation/rendering sources.
- Bundled Pavia compiler recognizes authored Marsh, Woods, Roads, Streams, Park Walls, Gates, tree lines, Bridges, built-up areas and Earthworks while excluding explicitly decorative building artwork.
- Terrain review highlights the exact compiled polygon/polyline geometry instead of feature bounding boxes.
- Approved terrain geometry is consumed directly by the browser playtest engine.
- Adds geometry-aware point/line terrain queries and open-crossing bridge overrides.
- Adds Impassable-terrain movement blocking to the browser adapter.
- Moves raster/appearance detection to Geometry Explorer-only fallback duty.
- Adds local in-browser PPTX metadata inventory on Map Intake.
- Audits command rules: command-specific 3-inch bonus, general 4-inch bonus, explicit post-activation commander movement up to 4 inches, enemy-distance restriction, and command-coverage logging.
- Preserves Scenario Builder, deployment polygons, external AI bridge, deterministic playtesting, replay and heat maps from alpha.4.

## 0.4.0-alpha.6 — Scenario Workbench UX + Manual Terrain Authoring
- Added **Add missing feature** authoring directly on the battlefield: polygon, line, or point geometry can be drawn when structured extraction misses a source feature.
- Manual features are non-destructive derived Studio geometry, persist with the project, enter the normal review queue, and use the same classification/effects inspector as compiled features.
- Added a persistent Scenario Builder checklist linking directly to sections needing attention.
- Added visual separation between **Source says**, **Studio suggests**, and **Designer accepted** states.
- Refined Scenario Builder into a less form-like workbench while preserving command-card drag/drop, rule editing, provenance, AI bridge, deployment, and playtest integration.

## 0.5.0-ui-preview
- Round-trip AI changeset review/apply workflow.
- Separate AI designer request field and playtest summary export.
- Camp/Baggage Train army assets.
- Deployment status + tactical symbols.
- Replay Play/Pause and speed controls.
- Final-position unit collision enforcement.
- Application-wide button interaction feedback.

## 0.5.0-ui-preview
- Reverted map counters to simple color-coded labeled units with command shades.
- Restored alpha.6 deployment drag/drop behavior.
- Unified replay map/image/overlay transform.
- Hardened Camp/Baggage immobility and Army Asset destruction/VP handling.
- Cleaned Publisher force lists, duplicate text, and deployment-map output.
