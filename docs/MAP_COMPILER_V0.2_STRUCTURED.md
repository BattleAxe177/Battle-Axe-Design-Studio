# Battle Axe Map Compiler v0.2 — Structured Source Rewrite

## Governing design decision
The scenario-defined play boundary is established before map ingestion. For normal compilation, the PowerPoint authoring file is the primary source for object geometry and author metadata. The SVG is a vector-rendering check and the PDF is a visual-appearance check. Raster/image recognition is not allowed to silently create normal-review terrain; it is reserved for Geometry Explorer as a recovery tool.

## Pavia implementation
The bundled Pavia project includes `public/projects/pavia/pptx-terrain-manifest.json`, compiled from the uploaded PowerPoint. The source already contains useful object descriptions including `Streams`, `Woods`, `Roads`, `Park Walls`, `Gates`, `tree lines along roads`, `Bridges`, `Marsh`, and an explicit instruction that decorative buildings should not affect game play.

The structured manifest preserves authored geometry as percentage-coordinate polygon/polyline parts clipped to the 48×48 scenario play boundary. Review highlighting uses those parts directly. Approved terrain is passed to the playtest engine as geometry, not as bounding rectangles.

## Local PPTX inventory
The browser can inspect a selected PPTX locally and report recognized authoring descriptions without uploading the file. The current alpha uses the precompiled manifest for the bundled Pavia project while the generic upload compiler is expanded incrementally.

## Engine boundary
The engine consumes only approved terrain records. The rendered map is a display layer during playtesting; terrain adjudication uses the approved geometry dataset.
