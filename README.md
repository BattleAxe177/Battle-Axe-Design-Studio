# Battle Axe Design Studio v0.6.0.3

## Facing, Publisher & Compatibility Hotfix

This release is a common-Studio handoff build based on v0.6.0.2. It intentionally does **not** merge the separate ACW branch; use it as the common baseline for the ACW conversation.

### Main fixes
- Deployment Rotate buttons now change the selected unit's authoritative facing by 15° per click.
- Square unit bases display an explicit front/facing arrow in Deployment.
- Playtest continues to consume the exact facing stored by Deployment; there is no faction-specific auto-facing.
- Publisher deployment unit/commander colors use print-color preservation so browser Print → Save as PDF retains side colors.
- Open Project accepts current project exports plus older unwrapped project JSON and scenario-only JSON, migrating missing fields in memory.
- v0.6.0.1 SVG viewport normalization and v0.6.0.2 battlefield crop repair are retained.

Run `npm run verify` for the release-owned test manifest, static build, and GitHub Pages deployment check.
