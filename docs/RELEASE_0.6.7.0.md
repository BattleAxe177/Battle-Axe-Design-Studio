# Battle Axe Design Studio v0.6.7.0
## Command, ACW AI & Scenario Portability

### Release intent

v0.6.7.0 is a focused Scenario Builder / command / playtest-engine release built from the v0.6.5.0 battlefield-authoring baseline. It does not redesign or refactor the working PowerPoint/SVG battlefield compiler.

### Historical OOB and Force Builder

The historical force interpreter now treats command organization as the primary structure and Battle Axe unit-profile mapping as a later leaf-unit step. It supports nested commands rather than assuming a flat `Side → Command → Unit` layout.

The release regression fixture uses the full Glendale / Frayser's Farm ACW OOB and verifies 82 explicit leaf units across 27 command nodes, including:

- Army, Division, Brigade, artillery/support, and leaf-unit relationships;
- distinct formation and commander names;
- commander ratings and status/role fields;
- historical versus scenario commander context where supplied;
- unresolved commands that remain visible with zero explicit units;
- grouped regimental lists expanded into individual leaf units;
- no conversion of narrative notes into Infantry, Cannons, or other units;
- no false `Archers` mapping from Brig. Gen. James J. Archer.

### Hierarchical Command Authority

Command Authority is now a generic core hierarchy. A commander may influence units assigned directly to that command or any descendant command, but not sibling or unrelated friendly commands. Normal distance and other rule requirements still apply.

The engine does not hard-code ACW echelon names. ACW can therefore use Army / Corps / Division / Brigade while Italian Wars scenarios can use Army / Battle / Wing / Vanguard / Reserve or other period labels over the same parent/descendant mechanism.

### ACW command cohesion and formations

The ACW AI now treats command cohesion as a meaningful but soft tactical objective. Units prefer to remain or return within legitimate command influence when the tactical cost is small, while frontage, terrain, firepower, and immediate threats can justify going out of command.

Order-driven formation doctrine is also more deliberate:

- **Defend** favors broad useful frontage and can retain a shallow support line when the command has enough units.
- **Advance** favors a coherent line with some supporting depth.
- **Assault** deliberately preserves first and follow-on echelons so rear units can replace losses or exploit gaps instead of continually trying to squeeze through a healthy front line.
- **Reserve** favors a compact supported footprint.
- **Screen** favors broad coverage and preservation.

Commander movement is evaluated against authorized subordinate coverage and the formation's useful center, normally behind rather than inside the primary movement/firing lanes.

### Core LOS correction and diagnostics

Line of sight now treats other units, including friendly units and commander bases, as potential blockers. An illegal shot is excluded from the unit's legal action set rather than being allowed and corrected only during resolution.

The engine retains the exact LOS rays tested and blocker information for diagnostics. A deterministic test recreates the Glendale playtest condition in which infantry attempted to shoot through a friendly cannon (event 328): with the cannon masking every legal ray, Shoot is unavailable; when the cannon moves clear, Shoot becomes available.

### Structured reserve entry

Reserve commands may be configured with a deployment turn and one of four entry geometries:

- point;
- full table edge;
- segment of a table edge;
- defined polygon deployment zone.

At the end of the owning side's turn, the command attempts to enter. A real commander is placed first when present. Subordinate units are then placed so some portion of their base lies within normal command distance of that commander. If no commander exists, a temporary deployment command unit is nominated only for placement purposes; it does not become a Commander actor or gain Commander abilities.

Entry itself is not an Action. Newly entered units do not act during the turn in which they deploy and operate normally on the following turn. If legal space is insufficient, unplaced units remain in reserve for a later attempt.

### Turn-1 initiative override

Scenario data can now identify one side as automatically receiving initiative on Turn 1. Beginning with Turn 2, the normal initiative sequence resumes unless another future scenario rule changes it.

### Self-contained scenario/project JSON

The project export is now explicitly schema-versioned and intended to be an authoritative portable scenario package. It retains the complete current project state needed to reopen the scenario, including:

- scenario metadata and selected period supplement;
- structured rules;
- full command hierarchy, commanders, ratings, units, attachments/status where present;
- compiled battlefield SVG rather than only original authoring-file references;
- approved terrain/features and review decisions;
- deployment zones, exact unit/commander positions and facing;
- reserve configuration and entry geometry;
- tactical-plan/playtest workspace state where applicable;
- compatibility metadata and preserved unknown envelope fields.

Legacy project and scenario-only JSON shapes are migrated through a compatibility layer. Missing newer fields receive safe defaults where possible, unknown data is preserved where practical, and the Studio displays migration steps/warnings after the imported project reloads instead of silently hiding them.

### Battlefield preservation

The v0.6.5.0 battlefield/compiler stack remains the protected baseline for this release. Functional logic in the structured compiler, detector, battlefield crop/state, Geometry Explorer, Terrain Review, map view/scale, and road-movement modules is preserved. Release cache/version query references may differ as required for v0.6.7.0 deployment.
