# Battle Axe Scenario Library

`index.json` is the catalog read by Battle Axe Design Studio v0.6.9.0 and later.

The library is intentionally data-driven. To publish a scenario:

1. Export a normal editable **Battle Axe Studio Project JSON** from Studio.
2. Place the JSON under this `scenarios/` folder (subfolders such as `acw/` or `italian-wars/` are encouraged).
3. Add one entry to `scenarios/index.json` with the metadata Studio should display and a relative `path` to that project JSON.
4. Commit/push normally. No Studio JavaScript change is required for each new scenario.

Example catalog entry:

```json
{
  "id": "glendale-1862",
  "title": "Battle of Glendale / Frayser's Farm",
  "date": "30 June 1862",
  "location": "Henrico County, Virginia",
  "period": "American Civil War",
  "supplement": "american-civil-war",
  "status": "Playtest",
  "tableSize": "24 × 24 inches",
  "description": "Current Battle Axe playtest scenario.",
  "path": "./scenarios/acw/glendale-1862.json",
  "version": "0.1"
}
```

The first v0.6.9.0 catalog ships empty on purpose: no development/test fixture is silently promoted to a published scenario. Existing local JSON import remains available through **Open Project**.
