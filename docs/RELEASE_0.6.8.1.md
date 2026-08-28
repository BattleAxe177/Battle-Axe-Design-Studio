# Battle Axe Design Studio v0.6.8.1

## Release scope

v0.6.8.1 is a narrow Deployment Editor / replay UX hotfix on top of v0.6.8.0. It does not change the protected battlefield compiler, crop, detection, terrain review, Geometry Explorer, or map-rendering logic.

### Compact historical unit labels
- Deployment Editor and playtest replay use compact map-only labels such as `7th PA Res.` and `20th MA`.
- Full historical unit names remain authoritative in the force structure and are retained in hover/tooltips.
- Map labels are moved outside the unit base rather than covering the token center.
- Labels use a smaller, restrained translucent tag and truncate only when needed.

### Reserve entry labels
- Reserve entry labels are abbreviated independently of the authoritative command name.
- Edge and edge-portion labels are explicitly anchored just inside the battlefield on north/south/east/west edges so text is not clipped.
- Reserve entry text is smaller and lower contrast so the entry geometry remains the primary visual cue.

### Polygon / reserve-zone completion
- Click the first vertex after at least three points to close the polygon.
- Double-click the final vertex to finish.
- Press Enter to finish.
- The visible Finish polygon / Finish reserve zone button remains available.
- Undo vertex removes the most recent point; Backspace/Delete provides the same action.
- Escape or Cancel abandons the active drawing operation.
- The first polygon vertex is visually emphasized while drawing.
