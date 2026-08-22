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
