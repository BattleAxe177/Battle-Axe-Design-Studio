# Battle Axe Rules Conformance Audit - Phase 3

Build: v0.5.0.2-conformance.3
Rules model: Battle Axe Core -> selected Period Supplement -> Scenario Overrides

## Scope

Phase 3 audits commander interaction, terrain directionality, movement-through-terrain edge cases, retreat/recoil assumptions, and the boundary between rules legality and AI tactical choice. Italian Wars-specific behavior is audited only where the selected supplement modifies or adds to Core.

## Battle Axe Core - confirmed and implemented

### Commanders

Core says Commanders are a special type of Unit. After all units activate, Commanders may move up to 4 inches and may not move within 1 inch of enemy units. Friendly units within 3 inches gain +1 to Command Tests; the General extends this to 4 inches.

The browser engine now:
- moves commanders after unit activations and before the close-combat phase;
- uses 3-inch command range and 4-inch General range;
- enforces the 1-inch enemy exclusion for voluntary commander movement;
- records commander move/hold decisions and command-coverage changes.

### Charging and capturing Commanders

Core says a Commander cannot be shot and may only be charged if it is the nearest visible Unit. When an enemy moves into contact, the Commander makes a Command Test. On success it escapes D3 inches directly away; on failure it is destroyed, representing capture or death.

The engine now:
- never presents a Commander as a shooting target;
- permits a Commander charge only when that Commander is the nearest visible enemy actor;
- moves the charger into contact before resolving the Commander test;
- resolves the Commander test on 4+;
- on success moves the Commander D3 directly away from the charger;
- on failure removes the Commander and logs capture/death;
- scores destroyed normal Commanders at 2 VP and the General at 3 VP.

### No general retreat or recoil rule

The supplied Core rules do not contain a general retreat/recoil result for ordinary units. A failed Break Test destroys the Unit; a passed Break Test removes accumulated Damage. The engine therefore does not invent a generic recoil, retreat, fallback, or push-back result.

This does not affect specific movement contained in another rule, such as Commander escape or the Italian Wars Javelin Skirmish action.

### Defensive terrain directionality

Core says Defensive terrain gives Armour 6 and attacks first in combat, but walls and ramparts are defensible only when the enemy is attacking over them.

The engine now distinguishes:
- area Defensive terrain: applies while the defender is occupying/manning the area;
- Camp Defensive status: supplied by the Italian Wars supplement when a friendly unit is in contact with its Camp;
- linear Defensive terrain: applies only when the attack line crosses the wall/rampart immediately in front of the defender.

This directional relation is used for both shooting Armour and close-combat Defensive status.

### Dangerous terrain

Core requires every Unit that moves across Dangerous terrain to make a Danger Test; a roll of 1 destroys the Unit.

The engine now checks the actual traversed path after collision/path shortening, rather than the originally intended destination. Danger Tests are applied to normal movement, charges, Javelin Skirmish movement, counter-charge movement, and Commander movement/escape where the actual path crosses Dangerous terrain.

### Difficult terrain and charges

Because Difficult terrain halves the Move Value of Units moving into it, a charge whose contact path enters Difficult terrain now uses half the charger's Move Value when determining whether initial contact is reachable. Free post-contact conformity remains free and may exceed the nominal Move allowance, as established in Phase 2.

## Italian Wars supplement - confirmed and implemented

### Shock Cavalry Counter Charge

The Italian Wars supplement says that when Shock Cavalry is the target of a Charge Action it may Counter Charge by passing a Command Test, then charges forward D3 inches before the enemy charges; both units count as charging.

The prior implementation could effectively turn the counter-charger toward the attacker. Phase 3 corrects this: the D3 movement is straight forward from the unit's existing facing. If that straight move contacts the charger, contact/conformity is resolved; otherwise the counter-charger simply completes the legal straight-forward D3 movement.

### Javelin Skirmish action

The Skirmish action is limited to once per turn, not once per activation. The unit may still attempt a second Action through the normal Core Command Test after completing a Skirmish, provided it is not engaged. Its optional post-shoot Move now respects Difficult, Impassable, Dangerous, collision, and enemy-exclusion rules while retaining the supplement's full-speed directly-backwards permission.

## Rules legality vs tactical AI

Phase 3 introduces an explicit boundary:

1. `legalActionsForUnit` identifies actions that are currently legal under the effective ruleset.
2. `chooseTacticalAction` is the AI policy that chooses among those legal actions.
3. `executeAction` performs the already-selected legal action.

The event log records `ai_action_choice`, including the chosen action and the number of legal options considered.

This separation matters because a poor tactical decision should not be confused with a rules error. Future AI policies can be replaced without rewriting the Battle Axe legality layer.

The current AI intentionally samples a conservative subset of legal Move choices - primarily movement toward an enemy. Core also permits sideways/backwards movement at half Move, but the current tactical AI does not yet exploit the full continuous movement space. That is an AI limitation, not a restriction added to the rules engine.

## Interpretation notes below 80% confidence

The following remain explicitly unresolved rather than silently decided:

- A Unit defending a linear obstacle while simultaneously engaged from an open flank: Phase 3 treats the Defensive relation pair-by-pair for Armour, but attack-order precedence is granted if at least one engaged enemy is attacking over the defended feature. The Core text does not spell out this mixed multi-front case.
- Exact attack division when a Unit's Combat value cannot divide evenly among multiple fronts. The current front -> side -> rear round-robin allocation remains a documented interpretation.
- Commander interaction with Difficult terrain is not explicit because Commanders have a fixed 4-inch movement allowance rather than a listed Move Value. Phase 3 does not silently halve Commander movement in Difficult terrain.
- Forced Commander escape into/through an Impassable obstruction is not specifically resolved by the supplied text. No special invented capture rule has been added for that edge case.
- The 25 mm round Commander base is approximated by the browser geometry for contact/visibility calculations. This is sufficient for current playtest resolution but should be revisited if exact circle geometry becomes tactically important.

## Regression coverage added

- Commanders cannot be shot.
- Commanders can only be charged when nearest visible.
- Commander escape and capture/death both occur under deterministic seeds.
- General capture/death is worth 3 VP.
- Linear Defensive terrain works only from the defended side.
- Dangerous terrain uses the actual traversed path.
- No generic retreat/recoil event exists.
- Shock Cavalry Counter Charge uses straight-forward D3 movement.
- Rules legality generation is separated from tactical action selection.
- Commander movement is sequenced after activations and before close combat.
