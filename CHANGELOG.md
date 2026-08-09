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
