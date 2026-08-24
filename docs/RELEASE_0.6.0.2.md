# Battle Axe Design Studio v0.6.0.2 — Battlefield Crop Repair

This hotfix corrects a regression where a PowerPoint-authored SVG could render the entire authoring slide instead of the calibrated tabletop crop. The selected feature overlay then appeared enormous because PPTX feature geometry was being projected into the full-slide viewBox.

The application now re-detects the explicit tabletop boundary in the loaded SVG and repairs persisted `mapSource.playArea` state when it is missing, equals the full SVG root, or differs materially from the detected tabletop. The repaired crop is saved back into the canonical battlefield SVG used by all downstream workspaces.
