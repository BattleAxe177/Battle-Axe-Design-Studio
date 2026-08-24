# Battle Axe Design Studio v0.6.1.0 — American Civil War Supplement Plugin

## Scope

This release adds the American Civil War as a selectable period supplement without changing the Battle Axe core rules or the Italian Wars supplement. It is implemented through the existing ruleset/supplement architecture so a scenario can switch the active period module from the Scenario Builder supplement selector.

This release does **not** implement rectangular 50 × 25 mm unit footprints. Unit footprint geometry remains a separate engine-level improvement; the ACW work in this release is the requested rules/AI plugin only.

## ACW unit library

Selecting **American Civil War** loads the four supplement profiles:

- Infantry — M2 C2 A5, Muskets, 1 point
- Sharpshooters — M2 C2 A5, Rifles, 2 points
- Cavalry — M4 C2 A4, Cavalry, 1 point
- Cannons — M1 C1 A5, Artillery, 2 points

## Supplement rules implemented in the playtest engine

- Commander Competency ratings 0–3.
- ACW Command Test: D6 + the highest friendly commander rating within 1 inch; 5+ succeeds.
- Historical/scenario command ratings may be entered in the command editor. Leaving the rating blank generates the generic Union or Confederate rating from the supplement table at playtest setup.
- Break Test natural 1: compulsory D3 fallback; leaving the battlefield destroys the unit.
- Enfilade fire: +2 Shoot Value when firing into a presented side.
- Rebel Yell: Confederate Infantry gains +1 Combat Value in a turn in which it charged.
- Refusal to Receive: both charger and target resolve the supplement Command Tests before the charge is completed; a target that fails falls back D3.
- Muskets use Shoot Value 3.
- Rifles use Shoot Value 2; a natural attack roll of 6 causes the supplement's additional point of damage.
- Cavalry uses Shoot Value 1 mounted, may dismount as an Action, and then uses Move 2 / Shoot Value 2.
- Cannons use the existing Battle Axe artillery bombardment implementation: 8-inch range, LOS, 5+ for D3 damage and a Break Test, and destruction on enemy contact.

## Force Builder / publisher

- ACW scenarios validate the supplement's brigade organization:
  - Infantry Brigade: 2–8 Infantry, up to 1 Sharpshooter and 2 Cannons.
  - Cavalry Brigade: 1–4 Cavalry.
  - Army maximum: 2 Sharpshooters.
  - A brigade should include a commander.
- ACW commanders cost 1 point and are included in Publisher command/army totals.
- Command cards show explicit Command Rating or `CR auto` when the generic table will be used.
- On a blank generic scenario, switching to ACW changes the display-side defaults to Union and Confederate without overwriting meaningful existing side names.

## ACW tactical AI doctrine

The supplement also loads an engine-only ACW tactical doctrine. This is not an extra tabletop rule. It is the tactical behavior profile developed for the simulator so the AI uses the published units in a broadly historical ACW manner.

The doctrine is brigade-centric: **fight the brigade; maneuver the regiments**. It biases the AI toward brigade frontage and staged lines, flank security, fire before unsupported frontal charges, favorable/exploitative charges, sharpshooters screening ahead of formed infantry, artillery support and preservation, cavalry dismounting before sustained combat, and additional friction for low-rated commanders attempting complex maneuvers.

## Architecture

- New module: `src/rules/supplements/americanCivilWar.js`
- Registered through `src/rules/ruleset.js`
- Supplement-specific behavior is guarded by capabilities and supplement metadata; Italian Wars remains isolated.
- Scenario overrides still layer after Core and Supplement rules.

## Quality / regression

- Release manifest bumped to v0.6.1.0.
- Added ACW supplement regression coverage for registration, profiles, command competency, enfilade, Rebel Yell, cavalry mounted state, generic command-rating generation, brigade limits, and doctrine metadata.
- Existing Battle Axe regression suite retained.
