# Battle Axe Design Studio v0.6.8.0 — Hierarchy Authoring & Reserve Entry UX

This release builds on v0.6.7.1 and keeps the v0.6.5.0 battlefield/compiler as the protected functional baseline. It concentrates on authoring the command hierarchy, using the external AI Bridge efficiently, and making reserve entry setup visual and reversible.

Highlights:

- Force Builder now treats command parentage as a real drag-and-drop tree: create commands, drag subordinate commands onto parents, drag them back to the side root to unparent, and drag units between commands.
- Commands carry generic command types/echelons and structural parent IDs, supporting ACW Army/Corps/Division/Brigade structures and shallower Italian Wars Battle/Wing/Vanguard structures without hard-coding one period hierarchy.
- Commands and units have visible Delete controls, with safe hierarchy handling, plus Force Builder Undo/Redo.
- The external AI Bridge changeset schema now understands `commandType`, `parentCommandId`, commander/rating metadata, reserve state, and unit reassignment.
- External AI review now uses a concise grouped preview and **Apply All Changes** transaction rather than line-by-line acceptance; Cancel and Undo AI Apply are included.
- Reserve/reinforcement entry is authored visually in the Deployment Editor by map point, whole table edge, dragged edge portion, or polygon zone. Persistent overlays show the selected entry geometry.
- Deployment authoring includes Undo/Redo and explicit Cancel/Escape paths for drawing tools.
- Project schema 1.1.0 migrates legacy command `echelon` data into generic `commandType` while preserving parent relationships and the self-contained scenario/map/deployment compatibility protections introduced in v0.6.7.x.

The PowerPoint/SVG battlefield compiler, crop logic, terrain detection, Terrain Review, Geometry Explorer, and map rendering modules remain functionally identical to the v0.6.5.0 baseline after normalizing cache-version references.

See `docs/RELEASE_0.6.8.0.md` and `docs/VERIFICATION_0.6.8.0.md`.
