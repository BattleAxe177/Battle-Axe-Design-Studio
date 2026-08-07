# Battle Axe Design Studio v0.4.0-alpha.3

This release extends the permanent browser application with the first usable Playtest Center while preserving the scenario-independent Battle Axe architecture.

## Major additions

- Multi-class appearance-assisted battlefield detection: hydrology, walls, woods, tree lines, and lower-confidence roads supplement the SVG vector classifier.
- Historical force cards are command-based and now carry concise historical/source notes rather than stray battle-narrative paragraphs.
- Studio-generated Battle Axe units include a rationale explaining why the unit was created, what it is intended to represent, and why the profile was proposed.
- External AI Bridge exports the current project as a structured Markdown prompt for use with ChatGPT, Claude, Gemini, or another external AI; pasted AI responses can be stored as scenario sources for later review.
- Deployment zones are editable polygons. Rectangle and free-polygon creation are supported; selected zones can be moved and reshaped with vertex handles.
- Playtest Center alpha: deterministic seeded single runs, batch balance runs, replay event stepping, event log, and movement/combat/casualty/commander/congestion heat-map overlays.

## Browser engine status

The Playtest Center is an incremental browser adapter derived from the Battle Axe Engine v0.4.0 Development Consolidation 1 architecture. It currently covers canonical M/C/A profiles, command tests, movement, shooting, artillery, melee/break tests, approved Difficult/Dangerous/Defensive terrain, surprise/readiness, and a configurable garrison activation turn.

The consolidated Python engine remains the adjudication reference while exact parity is expanded. Facing/contact arcs, counter-charge, commander escape/capture, full objective scoring, and arbitrary external scenario-rule modules are not yet fully ported to the browser adapter.

## Verification

Run:

```bash
npm run verify
```

The GitHub Pages workflow runs the same verification before deployment.
