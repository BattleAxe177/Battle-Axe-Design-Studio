# v0.5.6.0 Renderer and UI Notes

## Battlefield source contract

The author-provided SVG is immutable evidence. `mapSource.svgText` stores that original text. `mapSource.playArea` stores the table crop independently. Runtime renderers create a clone, apply the play-area `viewBox`, and give the clone intrinsic dimensions matching the crop.

This prevents PowerPoint-exported SVGs containing image fills, clip paths, namespace-prefixed nodes, and `<use>` references from being repeatedly serialized and damaged by the Studio lifecycle.

## Shared presentation contract

Battlefield Workspace, Geometry Explorer, Deployment, Playtest/replay, and Publisher should always derive their current visual from the active project `mapSource` and its play area. No downstream module owns a default or previous-scenario map.

## Suggested force presentation

Suggested Force Composition is a read-only briefing diagram. Sides are stacked vertically so each army gets the full panel width. The final Battle Axe roster below remains the editing surface.

## AI review batch actions

`Accept all remaining` applies only pending changes, using the same `applyChange` path as individual acceptance. Rejected proposals remain rejected. The immediately preceding batch can be undone until another batch replaces its snapshot.
