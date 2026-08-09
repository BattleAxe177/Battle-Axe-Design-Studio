# Battle Axe Design Studio v0.4.0-alpha.9

## Counter / deployment rollback
- Removed experimental NATO-style glyphs from Deployment and Playtest.
- Restored simple side-colored unit footprints with always-visible labels.
- Commands use subtle brightness variations of the parent side color.
- Restored the alpha.6 HTML5 click/drag/drop behavior for already-deployed pieces.

## Playtest map transform
- Battlefield image, replay pieces, and heat-map canvas now share one square replay stage.
- Fit-to-screen changes display size only; simulation coordinates remain scenario-table coordinates.

## Army assets
- Camp and Baggage Train are hard-coded as immobile Army Assets in runtime construction even if imported unit traits are incomplete.
- Army Assets never activate or move.
- Enemy close contact destroys an Army Asset; destruction is logged and contributes its 4 VP value.

## Publisher cleanup
- Force lists publish only scenario unit name and Battle Axe profile.
- Repeated historical/victory/deployment prose is collapsed to the current authoritative text.
- Deployment coordinate dumps are removed and replaced by a clean deployment map generated from current placements.
