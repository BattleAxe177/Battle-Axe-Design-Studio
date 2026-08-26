# Battle Axe Design Studio v0.6.4.0 — ACW Workflow Reliability

## Scope

This release is a focused reliability update on the v0.6.3.0 ACW/custom-base baseline. It does not fork the ACW simulator or replace shared engine systems. It addresses live defects exposed while building the Glendale scenario and restores Force Builder behavior previously intended for the common Studio workflow.

## Implemented

### Authoritative PowerPoint battlefield crop

- The authored PowerPoint tabletop frame is treated as the authoritative crop when structured map metadata exposes it.
- The crop converter accepts multiple compiler metadata spellings rather than hard-coding one test-case shape.
- If compiler metadata does not expose a boundary, the map pipeline can recover the largest plausible black/no-fill SVG frame as a safe fallback.
- The same crop is applied to the rendered SVG and persisted battlefield state so feature highlights and the map background use one coordinate frame.
- Startup SVG boundary repair no longer overwrites a persisted PowerPoint-authored crop.

### Source-authored scenario rules

- Explicit rules under `## Scenario Rules` / `## Special Rules` are parsed as **SOURCE** rules, not as optional AI suggestions.
- Source rules enter scenario state as accepted rules and therefore feed the checklist, Scenario Summary, export/publishing data, and rule inspector.
- Designer edits to a source rule are retained on re-analysis; re-analysis refreshes the evidence without silently restoring discarded wording or acceptance state.
- Glendale regression fixture expects exactly seven rules: Confederate Initiative, Successive Assaults, Simmons's Reserve, Sedgwick Reinforcements, Whitlock Breastworks, Minor Watercourses, and Farm Fields and Most Fences.

### ACW OOB parsing and Force Builder presentation

- Parser recognizes ACW hierarchy instead of treating the intake as a bag of troop keywords.
- Division/command → brigade → regiment/battery relationships are preserved.
- Ranked personal names are treated as commanders. `Brig. Gen. James J. Archer` cannot become the canonical `Archers` profile.
- Narrative/guidance sentences are not converted into units merely because they contain a troop word.
- McCall's listed 13 Pennsylvania Reserve regiments are preserved as 13 historical Infantry formations.
- Randol's, Kerns/Amsden, Cooper's, Diederichs, and Knieriem remain five separate battery formations.
- Brigades named without a detailed regiment roster remain unresolved rather than receiving invented Battle Axe units.
- Raw source-force cards are removed from the normal Force Builder working layout; historical evidence remains available in Extraction Review.
- Suggested sides are stacked vertically/full-width in the proposed-force area, with parent-command context shown where available.
- The final roster continues to be built deliberately from the canonical Battle Axe Unit Library; suggested mappings remain guidance rather than automatic acceptance.

### Deployment bulk rotation

- Existing per-unit rotation is preserved.
- A selected deployed unit now exposes command-level clockwise/counter-clockwise rotation when multiple members of that command are deployed.
- Every unit rotates about its own center and keeps its position.
- The operation is atomic: if any resulting footprint would overlap another base or leave the battlefield, all members revert and no partial rotation is saved.
- Deployment facing remains the authoritative starting facing for playtest.

### Core road movement policy

Roads grant **no movement bonus**. The common policy is now explicit in `roadMovement.js`:

- any overlap between the moving unit's base and a road treats the underlying terrain as Open for movement-cost/impassability adjudication;
- Difficult and Impassable are suppressed for movement while road overlap exists;
- movement multiplier can never exceed 1.0 because of a road;
- non-movement terrain effects are not stripped, so Obscuring, Defensive, LOS and other effects continue normally.

`playtestEngine.js` exposes `resolveRoadMovementTerrain()` as the common movement-policy hook. The updater intentionally does not globally replace every `Difficult`/`Impassable` check because those terms also occur in LOS, defensive and other non-movement adjudication. The live road-overlap path therefore remains a mandatory manual acceptance test after applying this update; if a concrete v0.6.3 movement call path bypasses the hook, that resolver should be patched specifically rather than weakening terrain semantics globally.

## Regression protected in this package

`tests/v0640_acw_workflow_fixes.test.mjs` covers:

- seven Glendale source-authored rules;
- 13 McCall regiments + five named batteries;
- incomplete brigades left unresolved;
- Archer surname/profile collision prevention;
- Longstreet/Hill parent hierarchy;
- no road speed bonus and movement-only road overrides;
- authored boundary transformation and SVG-frame fallback.

The updater also runs a post-apply JavaScript syntax gate so the packaging syntax failure that interrupted the first v0.6.4.0 attempt cannot be reported as success.

## Still requires live/manual verification

- actual `Glendale_Map(3).pptx` import and black-border/background registration;
- source-rule edit/ignore/re-analysis behavior in the browser;
- Force Builder vertical layout at normal desktop and narrow widths;
- command bulk rotation near base collisions and map edges;
- **road/base overlap through Difficult and Impassable terrain in the live playtest engine**;
- all v0.6.3.0 manual stress items that were not previously closed by live testing, especially dense 50×25 mm maneuver, command congestion/waves, unusual-angle pointer dragging, and broad legacy JSON compatibility.

## Compatibility

The ACW supplement remains a plugin on the shared Battle Axe engine. Existing ACW profiles, rectangular base geometry, deployment-facing authority, collision protections, Publisher behavior, legacy-import migration, and Italian Wars isolation are intended to remain unchanged except where explicitly described above.
