# Battle Axe Rules Conformance Audit — Phase 2

Build: v0.5.0.2-conformance.2
Scope: Movement geometry, charge/contact/conformity, close-combat sequencing, Line of Sight, Italian Wars period rules and traits.

## Source-derived rules checked

### Core movement
- Move Action: wheel around a front corner by up to 90 degrees, then move straight forward up to Move value.
- Backward movement is up to half Move value.
- Normal movement may not move closer than 1 inch to an enemy.
- Difficult terrain halves Move value.
- Dangerous terrain requires a Danger Test; a roll of 1 destroys the unit.
- Impassable terrain cannot be crossed.

### Core charge/contact
- Charge Action: wheel by up to 45 degrees, then move straight forward up to Move value.
- The charge is legal if the charging front reaches any portion of the defender's base within that movement.
- Once contact is made the charging unit is pushed/conformed flush to the contacted defender base edge.
- Per designer clarification for Studio: the conformity movement is free and may cause total physical displacement to exceed the nominal Move allowance; only the movement required to make initial contact is tested against the charge allowance.

### Core Line of Sight
- LOS is tested from the front edge of the firing unit to the target base.
- Intervening units block LOS.
- Obscuring terrain blocks LOS when neither firing nor target unit occupies that obscuring terrain.
- Tall terrain permits units on it to see over ordinary intervening units.

### Core close combat
- Close combat occurs after unit activation.
- Units benefiting from Defensive terrain attack before chargers.
- Charging units then attack.
- Remaining engaged units attack afterward.
- Break Tests occur after each attack step, rather than immediately after every individual attack.
- A unit engaged on multiple fronts must split attacks among engaged enemies, prioritizing front, then side, then rear.
- A unit whose front is engaged with an enemy side/rear doubles the attacks directed at that enemy.

### Italian Wars: Period Specific Rules
- Swiss units may not charge/direct attacks at other Swiss units and never count as engaged with one another.
- Pike and Shot Tactics: Swordsmen, Crossbowmen and Arquebusiers may move through friendly Pikemen, and friendly Pikemen may move through those troop types; this includes Swiss and Landsknecht Pikemen. Final positions still may not overlap.
- Camp/Baggage Train behavior remains as corrected in Phase 1.

### Italian Wars traits
- Arquebuses: Shoot 2, 2-inch range, enemy Armour treated as 4.
- Artillery: bombardment against a target within 8 inches and LOS; 5+ inflicts D3 Damage then Break Test; cannot target an enemy engaged in combat; Artillery is destroyed if contacted by an enemy.
- Elite: Command Tests succeed on 3+.
- Fury: doubles combat attacks on a turn in which the unit made a Charge Action.
- Javelins: once per turn, Skirmish Action = 2 shooting attacks at an enemy within 2 inches, followed by a Move Action; the post-skirmish move may be directly backward at full speed.
- Pikes: if fighting to the front on a turn in which the unit did not Charge, double attacks and reroll all 1s.
- Pistols: Shoot 2 at 2 inches; enemy Armour treated as 5; when charging, may make the pistol shooting attacks immediately before contacting the enemy.
- Shock Cavalry: on a charge turn doubles combat attacks unless fighting Pikes; when targeted by an enemy charge may pass a Command Test to counter-charge forward D3 inches before the enemy charge, with both units counting as charging.
- Tercio: counts as having Arquebuses, Fury, Elite and Pikes.

## Engine changes made
- Replaced circular/center-distance contact with oriented rectangular base geometry.
- Charge contact is calculated from sampled points on the attacker's front edge against the defender's oriented base.
- Added explicit `charge_contact` and `charge_conform` replay events.
- Conformity rotates the charger parallel/flush to the contacted defender edge and does not consume charge allowance.
- Normal Move now limits the initial wheel to 90 degrees and moves straight along the resulting facing instead of rotating freely toward the target.
- Added the 1-inch enemy exclusion to normal movement.
- Range measurements now use approximate base-to-base distance rather than center-to-center distance.
- LOS now searches from multiple points on the firer's front edge to the target base.
- Obscuring/Tall LOS behavior updated to match the supplied terrain rules more closely.
- Added Pike-and-Shot friendly transit exception while continuing to prohibit final overlap.
- Reworked close combat into ordered global attack steps with deferred Break Tests.
- Added multiple-front allocation and side/rear attack bonus logic.
- Added Swiss-versus-Swiss prohibition.
- Added Javelin Skirmish Action, Pike front/reroll behavior, pistol pre-charge fire, Shock Cavalry counter-charge, Tercio trait expansion, and Artillery destruction on enemy contact.
- Removed the previously added 'Big Battles second Move' shortcut because it was not supported by the supplied Battle Axe core rules or Italian Wars supplement. It was an engine assumption, not a source rule.

## Interpretive note below 80% confidence
Multiple-front attack splitting is clear that attacks must be split and that front/side/rear establish priority, but the supplied text does not spell out the exact arithmetic when the attack pool cannot divide evenly. Studio currently uses deterministic round-robin allocation in front → side → rear priority. This is an explicit engine interpretation and should remain visible in the audit until confirmed by the designer/author.

Shock Cavalry counter-charge text says the unit charges forward D3 inches before the enemy charge. Studio interprets this as straight forward from its current facing and then recalculates the original charge against the new position. This is source-consistent but some geometric edge cases (especially oblique/flank incoming charges) remain below 80% confidence.

## Remaining Phase 3 audit items
- backward Move Action and deliberate lateral maneuver choices in the automated policy;
- exact defensive-terrain directionality for walls/ramparts and similar edge features;
- commander capture/escape and commander contact restrictions;
- artillery/obscuring edge cases and base-edge LOS stress tests;
- retreat/recoil behavior where scenario/period rules require it;
- scenario-rule override conformance across all engine procedures;
- AI policy choices versus legal-action generation (separate legality from tactical quality).
