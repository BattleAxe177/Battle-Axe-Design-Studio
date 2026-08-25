# Battle Axe Design Studio v0.6.3.0 — ACW & Custom Base Geometry

## Scope

This release makes the **American Civil War** supplement a practical Studio period module and extends the shared Battle Axe geometry model so scenarios can use rectangular or mixed physical base sizes, including the current ACW working concept of **50 × 25 mm regiment bases**.

The ACW module remains a plugin selected through **Period Supplement**. ACW rules and tactical doctrine are capability-guarded and do not replace or fork the common movement, collision, charge, combat, commander, terrain, replay, deployment, import, or Publisher systems.

The release carries forward the current v0.6.0.3 facing/Publisher/import compatibility hotfixes together with the v0.6.2 common-engine hardening work.

## Implemented

### American Civil War period plugin

Selecting **American Civil War** loads the published supplement profiles and rules:

- Infantry — M2 / C2 / A5 / Muskets / 1 point.
- Sharpshooters — M2 / C2 / A5 / Rifles / 2 points.
- Cavalry — M4 / C2 / A4 / Cavalry / 1 point.
- Cannons — M1 / C1 / A5 / Artillery / 2 points.
- Commander Competency ratings 0–3.
- ACW Command Tests: 5+, modified by the highest eligible friendly commander rating within 1 inch.
- Generic Union and Confederate commander-rating tables.
- Natural-1 Break Test D3 fallback.
- Enfilade Fire (+2 Shoot Value).
- Confederate Infantry Rebel Yell (+1 Combat Value on a charge turn).
- Refusal to Receive charge/defender Command Tests.
- Muskets and Rifles shooting behavior, including Rifle natural-6 double damage.
- Mounted/dismounted Cavalry state and dismount Action.
- ACW Artillery Bombardment and artillery destruction on enemy contact.
- Infantry/Cavalry brigade composition validation, army Sharpshooter cap, and 1-point commanders.

The Force Builder uses the ACW unit library when the supplement is selected and keeps the common two-side scenario model.

### ACW playtest doctrine

The engine-only ACW doctrine uses the shared tactical-plan architecture. Its governing concept is:

> **Fight the brigade; maneuver the regiments.**

The doctrine adds or strengthens:

- brigade frontage and neighboring-regiment awareness;
- first-wave, follow-up, and support/reserve roles;
- supported/successive assaults rather than independent unit rushing;
- sustained infantry fire before unsupported frontal charges;
- flank security and enfilade preference;
- Sharpshooter screening/probing behavior;
- artillery support and battery-preservation behavior;
- Cavalry mobility-first behavior with dismount preference for sustained combat;
- command-rating friction for complex maneuvers;
- command-level traffic management and blocker-first activation sequencing;
- spatial Screen behavior and latched Reserve release.

These are Studio AI behaviors, not additional printed ACW tabletop rules.

### Custom and rectangular physical bases

Scenario Parameters now support independent physical dimensions for:

- unit base **width/frontage**;
- unit base **depth**;
- commander base diameter;
- rules measurement multiplier.

Presets now include:

- Original square — 25 × 25 mm, 1× measurements.
- Double square — 50 × 50 mm, 2× measurements.
- ACW regiment — **50 × 25 mm**, 25 mm commanders, 1× measurements.
- Custom / mixed.

The 50 × 25 mm ACW preset is a **Studio basing convention/recommendation only**. It is not a requirement printed in the ACW supplement and selecting the ACW supplement does not silently force the preset.

Individual units may override scenario-default width and depth. Legacy square `baseMm` values remain square unless explicit width/depth are supplied, preventing fixed-size assets from being stretched by a rectangular scenario default.

### Shared geometry changes required by rectangular bases

Physical base dimensions are now carried through the common engine rather than being treated as a display-only setting.

The authoritative footprint is used for:

- Deployment rendering and placement legality;
- exact grab-point dragging;
- rotation and facing;
- full rotated-footprint battlefield bounds;
- unit/unit and unit/commander collision;
- normal movement path validation;
- continuous swept collision for straight translations;
- wheel geometry about the correct front corner;
- charge first contact;
- minimum-pivot conform;
- compulsory fallback;
- commander movement/escape;
- replay sizing/orientation;
- Publisher deployment-map sizing;
- AI frontage, wave depth, and screen spacing;
- base-edge command-distance measurement;
- shooting LOS samples from the actual front edge;
- defensive linear-terrain adjacency.

Edge touch remains legal. Actual polygon penetration is illegal.

### Base-size change safety

Changing a scenario from square bases to wider/deeper bases can make an existing deployment illegal. The Studio now detects this rather than allowing the playtest engine to begin from an invalid state.

- Deployment highlights illegal placed pieces.
- Deployment warnings identify overlap/off-table footprint problems.
- Playtest readiness reports those problems as blocking geometry issues.
- `runPlaytest` refuses to start with `BAX_INVALID_DEPLOYMENT` until the illegal placements are corrected.
- Positional actions during play continue to use the universal post-action legality assertion and rollback.

The engine no longer silently relocates an initially overlapping commander merely to make a playtest start.

### Publisher and export

- Deployment maps preserve rectangular base proportions and facing.
- Force roster grouping includes physical footprint, so otherwise-identical units with different bases are not collapsed together.
- Published force rows show unit base dimensions.
- Scenario-sheet metadata records default unit/commander basing and measurement multiplier.
- Existing print/PDF side-color preservation from v0.6.0.3 remains in place.

### Compatibility preserved

- Deployment facing remains the authoritative playtest starting facing.
- Deployment Rotate controls remain functional.
- Legacy project/scenario JSON is migrated in memory before current validation.
- Canonical battlefield crop/revision safeguards remain shared across Workspace, Geometry Explorer, Deployment, Playtest, and Publisher.
- PowerPoint-derived SVGs without an original `viewBox` continue to be normalized safely.
- New Scenario isolation, two-side structure, release-owned test manifest, and prior movement/combat conformance protections remain enabled.

## Regression-protected

Release tests cover:

- exact ACW four-profile library and supplement registration;
- ACW command competency, enfilade, Rebel Yell, cavalry state, force structure, and doctrine metadata;
- old square-basing migration to explicit width/depth;
- 50 × 25 mm rotation-aware footprint geometry;
- legal edge touch vs illegal penetration;
- fixed/legacy `baseMm` staying square under rectangular global defaults;
- per-unit rectangular overrides;
- base-edge ACW commander influence;
- frontage-aware ACW successive-wave destinations;
- illegal initial deployment detection and playtest refusal;
- shared Deployment/Replay/Publisher use of width/depth;
- exact Deployment grab-point behavior and facing controls;
- common collision, charge, post-action assertion, Reserve, Screen, congestion, import, battlefield, and Publisher safeguards.

## Still requires live/manual stress testing

Automated tests establish code-level invariants but are not a substitute for live Studio use. In particular, continue to treat the following as needing field verification:

- large 50 × 25 mm armies moving in dense multi-brigade formations;
- command-level wave/lane behavior on a full regimental ACW battlefield such as Second Manassas;
- long rectangular bases maneuvering obliquely along walls, fences, cuts, and other linear Defensive terrain;
- mixed-base authoring ergonomics at high unit counts;
- exact off-center pointer dragging at unusual angles in the live browser;
- collision behavior during highly congested simultaneous-looking situations;
- legacy scenario files from releases not represented by the current migration fixtures.

## Rules interpretation note

The printed ACW **Refusal to Receive** rule states that a defender failing its Command Test falls back, but the supplement text does not state a fallback distance in that rule. The current Studio implementation uses **D3 inches** as an explicit Studio interpretation so the engine can resolve the displacement. This should remain identified as an interpretation unless a source clarification is added.

## Verification

See `docs/VERIFICATION_0.6.3.0.md`.
