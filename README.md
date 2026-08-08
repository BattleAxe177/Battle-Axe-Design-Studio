# Battle Axe Design Studio v0.4.0-alpha.6

This release is a corrective architecture milestone focused on battlefield compilation and commander adjudication.

## Map Compiler v0.2
Normal terrain creation no longer relies on raster recognition. The bundled Pavia project is compiled from PowerPoint authoring geometry/metadata into an explicit terrain manifest. SVG remains the display/vector check and PDF the visual check. Raster recognition is available only as an additional-feature recovery path.

Selecting a terrain feature flashes the actual compiled feature geometry. Approved terrain geometry—not the rendered picture—is what the playtest engine queries.

## Commander audit
Command bonuses are tied to the appropriate command, commander holds/moves are explicitly logged, and commanders receive a post-unit-activation movement phase to improve command coverage when needed.

See `docs/MAP_COMPILER_V0.2_STRUCTURED.md` and `docs/COMMAND_RULES_AUDIT.md`.
