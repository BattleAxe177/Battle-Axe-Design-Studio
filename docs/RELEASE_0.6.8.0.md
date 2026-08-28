# Battle Axe Design Studio v0.6.8.0

## Release scope

v0.6.8.0 is an authoring/UX release layered on the v0.6.7.1 command and compatibility work. The v0.6.5.0 battlefield/compiler pipeline remains protected.

### Force Builder command hierarchy
- Commands form an explicit generic parent/child tree.
- Drag a command onto another command to make it subordinate.
- Drag a command onto the side root to make it top-level.
- Drag units between commands to reassign them.
- Cross-side parentage and circular command trees are rejected.
- Commands and units have visible Delete controls.
- Safe command deletion promotes child commands while removing directly assigned units only after confirmation.
- Force Builder Undo/Redo covers the principal structural authoring operations.

### External AI Bridge
- Changeset protocol version 1.2 supports `commandId`, `commandType`, `parentCommandId`, commander/rating metadata, reserve data, and unit command assignment.
- The normal review workflow is grouped and summary-driven rather than line-by-line.
- **Apply All Changes** validates and applies the complete changeset atomically. If validation fails, the scenario is left unchanged.
- Cancel discards the pending proposal and **Undo AI Apply** restores the pre-apply scenario after a successful transaction.

### Visual reserve entry authoring
- Reserve commands can define entry by point, whole table edge, edge portion, or polygon zone directly on the Deployment Editor map.
- Edge portions are drawn interactively along the battlefield edge.
- Reserve zones reuse the existing polygon-zone geometry model.
- Persistent map overlays identify reserve entry geometry and command ownership.
- Deployment Undo/Redo is available, and Escape/Cancel exits active drawing tools.

### Compatibility
- Project schema is 1.1.0.
- Legacy command `echelon` remains accepted and is normalized to `commandType`.
- Parent command IDs are retained during migration.
- The v0.6.7.x self-contained scenario/map/deployment export and legacy migration safeguards remain in place.
