# Battle Axe Design Studio Architecture

## Core invariant
The imported battlefield map is immutable. Studio creates reviewed, derived gameplay interpretations without altering source geometry.

## Scenario data layers
1. **Source evidence** — what an imported document/map actually says or depicts.
2. **Historical/source commands and formations** — structured reconstruction of command relationships.
3. **Studio suggestions** — optional Battle Axe interpretations that must be accepted, edited, or ignored.
4. **Working Battle Axe scenario** — designer-approved `Side → Command → Unit` hierarchy and scenario rules.
5. **Deployment** — placements/zones that reference stable command and unit IDs.

## Map recognition
Vector features are normalized into the outer SVG coordinate system using each SVG element's local bounding box and current transformation matrix. Raster-assisted hydrology is a fallback only for features visibly present in the map image but unavailable as discrete vector elements. Raster-derived candidates are explicitly labeled and remain derived review geometry.

## Scenario Builder alpha.2
The builder supports flexible source text, multi-paragraph section extraction, historical/source command grouping, rule suggestions, a canonical unit library, and command-aware working rosters. External sources remain authoritative evidence; Studio suggestions are design proposals.

## Deployment Editor alpha.2
The deployment model stores percentages within the scenario-defined play space. Units reference scenario unit IDs; commanders reference command IDs. Rendering converts the canonical tabletop base sizes (50 mm unit squares and 25 mm commander circles) to percentages of the current play-space width/height.
