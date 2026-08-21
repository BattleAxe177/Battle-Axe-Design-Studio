# Map Compiler v0.3 — PPTX Authored Geometry & Terrain Ontology

## Principle

Map compilation separates **geometry discovery**, **terrain interpretation**, and **Battle Axe effects**.

1. Meaningful authored geometry is retained first.
2. Source labels, geometry type, and visual evidence are used to suggest a terrain concept.
3. Battle Axe effects remain reviewable decisions and are not allowed to determine whether geometry exists.

## Source priority

When the designer supplies all three normal map products:

1. **PPTX** — primary authored geometry and semantic metadata.
2. **SVG** — rendered battlefield, play-area clipping, vector corroboration, and visual fallback.
3. **PDF** — visual/reference evidence only in the browser release.

If no structured PPTX is available, the SVG detector continues to surface vector and appearance candidates.

## Ontology behavior

The ontology is family-based rather than a list of exact scenario labels. It includes relief, hydrology, wet ground, vegetation, agriculture, linear vegetation, routes, crossings, barriers, fortifications, built environment, structures, military areas, reference geometry, and an explicit Unknown class.

The original source term is always retained. An unrecognized term is not a compiler failure: its geometry is kept for review as `Unknown`.

## Anti-overfitting rule

Pavia and Cerignola may be used as regression fixtures, but generic compiler modules must not contain proper-name logic for those battles. Tests also include terrain terminology absent from both examples.
