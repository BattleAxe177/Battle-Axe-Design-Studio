# Battle Axe Design Studio

Battle Axe Design Studio is the permanent browser application for the Battle Axe scenario-development workflow.

## Current release

**v0.4.0-alpha.2 — Map Geometry Repair + Command/Deployment Alpha**

This release keeps the v0.4.0-alpha.1 Scenario Builder and adds the next integrated workflow increment.

### Map Studio
- Uses SVG-local geometry coordinates (`getBBox` + CTM) instead of viewport coordinates for review extents.
- Filters clipped/origin-only artifacts before they enter Geometry Explorer.
- Separates cyan wet-ground polygons from stream channels.
- Adds raster-assisted hydrology detection for streams that are visible in the imported map but embedded in the PowerPoint-rendered image layer rather than preserved as discrete SVG paths.
- Retains multi-select and bulk approval/import workflows.

### Scenario Builder
- Multi-paragraph section extraction for Historical Situation, Deployment, and Victory Conditions.
- Editable Scenario Rule dialog with separate rule name and large multi-line rule text.
- Imported/source forces are grouped into historical commands with commanders and army commanders where the source/formation interpretation supports them.
- Working Battle Axe forces are `Side → Command → Unit`, with drag/drop between commands.
- Commands can be created, renamed, and assigned commanders.
- Canonical Italian Wars library is independent of the imported scenario and now includes Archers and the corrected Forlorn Hope name.

### Deployment Editor alpha
- Drag individual units, commanders, or complete commands onto the battlefield.
- 50 mm logical square unit bases and 25 mm logical circular commander bases scale to the scenario-defined play space.
- Reposition deployed objects by drag/drop.
- Draw and assign rectangular deployment zones.
- Basic warnings for undeployed units and unplaced commanders.
- Deployment is stored in the same scenario project state used by the Scenario Builder.

## Important alpha limitations
- PDF/DOCX/scanned-image scenario ingestion is still registered as source evidence rather than fully parsed in-browser.
- Raster-assisted hydrology currently provides derived review extents, not final vector centerlines/polygons for engine movement. User approval remains required.
- Deployment zones are rectangular in this first alpha.
- Deployment warnings do not yet understand scenario-specific off-table/reinforcement states.

## Development

```bash
npm test
npm run build
npm run check
# or
npm run verify
```

GitHub Pages is deployed through `.github/workflows/pages.yml`.
