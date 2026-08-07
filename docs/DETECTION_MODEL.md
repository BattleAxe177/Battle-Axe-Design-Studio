# Battlefield Recognition Model — v0.3.3

## Governing project sources
- Pavia Map SVG/PPT/PDF authoring package: spatial source of truth.
- Battlefield Ground, Architecture, and Visual Reference: interpretive context and expected feature relationships.
- Battle Axe core rules: terrain effect vocabulary.

## v0.3.3 design rule
Detection is geometry-first. Historical Battlefield Description is never used to create or place geometry. Source-map labels may name or associate geometry because they are part of the imported map itself. Input Map Notes may inform interpretation but do not modify geometry.

## Pipeline
1. Load the imported SVG read-only and inline it for inspection.
2. Locate the scenario play boundary from the map boundary geometry.
3. Inventory vector geometry by fill/stroke, shape, transform, and location.
4. Promote high-confidence functional feature families to Battlefield Features.
5. Keep ambiguous compact/rendered objects in Geometry Explorer.
6. Associate named gates/breach from map text to the nearest actual detected wall geometry.
7. Maintain separate detection and interpretation confidence.
8. Highlight exact SVG geometry where available; synthetic openings use a precise map marker plus the related wall segment.

## Current Pavia visual conventions detected directly
- Cyan filled paths: water/wet channels.
- Green filled paths: woodland blocks.
- Salmon stroked paths: park wall linework.
- Green stroked paths: roadside/tree-line geometry.
- Dark gray compact paths: bridge/crossing proposals.
- Gray compact paths: structures/landmarks, normally held for review unless linked to a named feature.
- Brown patterned geometry: possible tracks/boundaries, held in Geometry Explorer.
- SVG image/use instances: deep-scan candidates, never auto-promoted in v0.3.3.

## Known limitation
Some PowerPoint artwork may arrive in SVG as embedded raster/grouped objects rather than clean vector features. v0.3.3 surfaces a filtered set of these in Geometry Explorer, but full PPTX object-structure ingestion remains a later compiler increment.
