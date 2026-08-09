# Battle Axe Rules Conformance Audit — Phase 1

Status: Critical combat-legality pass
Build: v0.5.0.2-conformance.1

## Authorities reviewed
- Battle Axe core rules (user-supplied)
- Battle Axe Italian Wars Supplement (user-supplied)
- Current Battle Axe Studio browser playtest engine

## Confirmed discrepancies found and corrected
1. Close combat could occur without a completed charge. The old browser engine used a distance shortcut and called melee immediately. Charges are now distinct actions that must wheel legally, move within the unit's Move allowance, follow a clear path, and establish contact before combat.
2. Close combat was resolved during activation. It is now deferred to the close-combat phase, with charge/Defensive precedence recorded.
3. Shooting did not enforce intervening units or Obscuring terrain. These now block fire; exact front-edge LOS geometry remains a Phase 2 item.
4. The Italian Wars Big Battles rule allowing a second Move without a Command Test on 2'×2' or larger tables when no enemy is within 12" was missing and is now implemented.
5. Camp/Baggage Train handling was incomplete. Camp contact now grants Defensive status; Baggage destruction is 2 VP, Camp destruction is 4 VP, and a surviving Camp/Baggage Train scores 1 VP.
6. Units without a shooting-capable trait cannot generate ranged attacks.

## Remaining audit items
- exact Move Action sideways/backwards geometry;
- exact front-edge Line of Sight geometry;
- Dangerous terrain / Danger Test consequence;
- trait semantics: Fury, Pikes, Shock Cavalry, Elite, Javelins, Pistols, Arquebus, Artillery;
- multiple-front close-combat allocation;
- counter-charge behavior;
- commander capture/escape;
- commander movement/contact restrictions;
- walls, ramparts, bridges and directional Defensive terrain;
- shooting/artillery procedure and ranges;
- scenario-rule overrides versus canonical rules.

## Regression invariants added
- non-shooting cavalry cannot make ranged attacks;
- every close-combat attack carries verified contact;
- Baggage Train destruction value is 2 VP;
- surviving army assets contribute their survival VP.

## Test status
42/42 automated tests passing before packaging.
Production build passes.
Static GitHub Pages deployment check passes.
