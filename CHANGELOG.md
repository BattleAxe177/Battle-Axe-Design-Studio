# v0.6.0.1 — Battlefield Render Hotfix

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

## v0.6.0.1 — Design Complete
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
