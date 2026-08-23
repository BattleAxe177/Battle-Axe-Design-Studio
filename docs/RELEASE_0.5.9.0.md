# Battle Axe Design Studio v0.5.9.0 — Scenario Analysis, Movement Search & Deployment

This release is focused on scenario-designer visibility and maneuver reliability.

## Playtest analysis cues
- Detailed cue mode now exposes persistent unit state: Defensive position, engaged state, and command coverage.
- Clicking a commander in Detailed mode shows the command radius.
- Shooting/artillery events show a transient range bubble and front 90° firing sector.
- Blocked actions receive an explicit battlefield cue.
- Existing Standard mode remains intentionally cleaner.

## Tactical movement
- Forward movement now searches multiple legal front-corner wheel angles instead of failing after one desired wheel.
- If a preferred forward solution cannot be completed, the engine tests straight-forward, sideways, and backward legal alternatives.
- Fallback movement keeps the Battle Axe half-speed restriction for sideways/backward movement.
- Detailed movement events identify fallback movement modes.

## Defensive AI
- Defend orders distinguish "already manning" a defensive feature from "near enough to establish" the position.
- Nearby Defensive terrain is evaluated with a physical adjacency tolerance rather than relying solely on center-point polygon overlap.
- Defending units that are slightly out of position can make a local adjustment toward the defensive feature before positional inertia dominates.

## Tactical intent
- Reserve log explanations now distinguish generic close-threat release from explicit user-authored release conditions.

## Deployment Editor
- Dragging caches the battlefield transform for the duration of the drag and renders through requestAnimationFrame.
- Existing cursor-to-base offset is preserved.
- Drag preview indicates legal/illegal placement before release.
- A legal drop no longer runs the more expensive nearest-position search unnecessarily.
