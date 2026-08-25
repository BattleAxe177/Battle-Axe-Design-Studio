# Battle Axe Design Studio v0.6.0.3

## Facing, Publisher & Compatibility Hotfix

This release is intentionally limited to the common Studio fixes identified after v0.6.0.2. It does **not** merge or alter the separate ACW development branch.

### Fixed
- Deployment Rotate buttons now change a selected unit's stored facing by 15° per click.
- Deployment units now display an explicit front/facing arrow, so square bases have an unambiguous front.
- The facing shown in Deployment remains the authoritative starting facing consumed by Playtest; no faction-specific facing rule is introduced.
- Scenario Publisher applies print-color preservation to deployment units and commanders so French/Spanish side colors survive browser Print → Save as PDF.
- Open Project now accepts current project exports, older unwrapped Studio project state, raw project JSON, and legacy scenario-only JSON, migrating missing modern fields in memory.
- Original imported JSON files are never overwritten by migration.

### Retained
- v0.6.0.1 SVG viewport normalization.
- v0.6.0.2 authoritative battlefield crop repair.
- v0.6.0.0 common engine, tactical AI, replay, and publisher baseline.

### Handoff note
The ACW branch should merge this common Studio release as its new baseline rather than reimplement these fixes independently.
