export const UNIT_LIBRARY = [
  {profile:'Gendarmes', category:'Cavalry', icon:'♞', m:3,c:4,a:6,pts:3, traits:['Shock Cavalry'], armies:['Later French'], source:'Italian Wars Supplement — Later French Army List'},
  {profile:'Knights', category:'Cavalry', icon:'♞', m:3,c:3,a:6,pts:2, traits:['Shock Cavalry'], armies:['Later Imperial'], source:'Italian Wars Supplement — Later Imperial Army List'},
  {profile:'Heavy Cavalry', category:'Cavalry', icon:'♞', m:3,c:3,a:6,pts:2, traits:['Shock Cavalry'], armies:['Scenario alias'], source:'Scenario-friendly alias using the later Imperial/Spanish heavy-cavalry profile'},
  {profile:'Reiters', category:'Cavalry', icon:'♞', m:3,c:3,a:5,pts:2, traits:['Pistols'], armies:['Later French','Later Imperial'], source:'Italian Wars Supplement'},
  {profile:'Demi-Lancers', category:'Cavalry', icon:'♞', m:4,c:3,a:5,pts:2, traits:['Shock Cavalry'], armies:['Later French'], source:'Italian Wars Supplement — Later French Army List'},
  {profile:'Light Cavalry', category:'Cavalry', icon:'➶', m:4,c:2,a:4,pts:1, traits:['Shock Cavalry'], armies:['Later Imperial'], source:'Italian Wars Supplement — Later Imperial Army List'},
  {profile:'Stradiots', category:'Cavalry', icon:'➶', m:4,c:2,a:4,pts:1, traits:['Javelins'], armies:['Later French','Later Imperial'], source:'Italian Wars Supplement'},
  {profile:'Swiss Pikemen', category:'Infantry', icon:'⚔', m:2,c:4,a:5,pts:2, traits:['Fury','Pikes'], armies:['Later French','Later Imperial'], source:'Italian Wars Supplement'},
  {profile:'Landsknechts', category:'Infantry', icon:'⚔', m:2,c:4,a:5,pts:2, traits:['Elite','Pikes'], armies:['Later French','Later Imperial'], source:'Italian Wars Supplement'},
  {profile:'Pikemen', category:'Infantry', icon:'⚔', m:2,c:4,a:5,pts:1, traits:['Pikes'], armies:['Later French','Later Imperial'], source:'Italian Wars Supplement'},
  {profile:'Verlorne Hope', category:'Infantry', icon:'⚔', m:4,c:3,a:5,pts:1, traits:['Elite','Fury'], armies:['Later Imperial'], source:'Italian Wars Supplement — Later Imperial Army List'},
  {profile:'Halberdiers', category:'Infantry', icon:'⚔', m:2,c:3,a:5,pts:1, traits:['Fury'], armies:['Later Imperial'], source:'Italian Wars Supplement — Later Imperial Army List'},
  {profile:'Swordsmen', category:'Infantry', icon:'⚔', m:2,c:3,a:5,pts:1, traits:['Fury'], armies:['Later French'], source:'Italian Wars Supplement — Later French Army List'},
  {profile:'Crossbowmen', category:'Infantry', icon:'⌁', m:2,c:1,a:4,pts:1, traits:['Shoot 2'], armies:['Later French','Later Imperial'], source:'Italian Wars Supplement'},
  {profile:'Arquebusiers', category:'Infantry', icon:'⌁', m:2,c:1,a:4,pts:1, traits:['Arquebus'], armies:['Later French','Later Imperial'], source:'Italian Wars Supplement'},
  {profile:'Cannon', category:'Artillery', icon:'●', m:1,c:1,a:6,pts:2, traits:['Artillery'], armies:['Later French','Later Imperial'], source:'Italian Wars Supplement'}
];

export const PAVIA_DRAFT_SAMPLE = `BATTLE AXE SCENARIO DRAFT
Battle of Pavia
Date: 24 February 1525
Location: Mirabello Park, outside Pavia, Duchy of Milan
Table: 4' × 4'
Game Length: 8 Battle Axe Turns
Status: Playtest Baseline

Historical Situation
King Francis I had besieged Imperial-held Pavia. Before dawn on 24 February Imperial engineers breached the walls of Mirabello Park, triggering a confused battle among woods, gardens and open ground.

French Army
King's Gendarmes — Gendarmes — Francis I's household cavalry
Swiss Vanguard — Swiss Pikemen — forward Swiss battle
Swiss Main Battle — Swiss Pikemen — main Swiss battle
Swiss Rear Battle — Swiss Pikemen — rear Swiss battle
Black Band — Landsknechts — veteran German mercenaries
French Infantry Reserve — Pikemen — remaining French foot
French Artillery — Cannon — French siege artillery
Alençon's Cavalry — Heavy Cavalry — mounted reserve

Imperial Army
Pescara's Arquebusiers — Arquebusiers — Spanish arquebus vanguard
Frundsberg's Vanguard — Landsknechts — forward Landsknecht battle
Frundsberg's Main Battle — Landsknechts — main Landsknecht battle
Bourbon's Battle — Landsknechts — supporting infantry
Imperial Men-at-Arms — Heavy Cavalry — Lannoy's cavalry
Stradiot Scouts — Stradiots — reconnaissance and pursuit
Imperial Artillery — Cannon — field artillery
Leyva's Garrison — Pikemen — Pavia garrison, off-table at start

Deployment
French forces deploy within the French deployment area. Artillery begins deployed. Imperial forces deploy first within the Imperial deployment area. Leyva's garrison begins off-table inside Pavia.

Scenario Rules
Surprise: French formations more than 18 inches from every Imperial unit begin Unalerted and must pass a normal Battle Axe Command Test before activating. Imperial Initiative: the Imperial player has the first turn. Leyva's Sortie: the Imperial player decides when to commit the Pavia garrison.

Victory Conditions
French Major Victory: break the Imperial relief force while denying Imperial control of Mirabello Park.
French Minor Victory: hold Mirabello Park at the end of Turn 8 with an effective fighting force.
Imperial Major Victory: seize Mirabello Park and break the French main battle.
Imperial Minor Victory: secure Mirabello Park while preserving the bulk of the relief army.
Draw: neither side achieves its operational objectives by the end of Turn 8.`;

export const WARGAMERS_GUIDE_SAMPLE = `Battle of Pavia, 24 February 1525

Historical Situation
The French army under Francis I is besieging Pavia while an Imperial relief army approaches. The scenario narrative describes the Imperial attack beginning in early-morning mist after engineers broke into the Mirabello park. The French must react quickly while the Imperial army drives into the park. A later sortie by the Pavia garrison adds pressure to the French rear.

French Army
Gendarmes — Gendarmes — Francis I
French Pikemen — Pikemen
French Crossbowmen — Crossbowmen
Light Artillery — Cannon
Landsknechts — Landsknechts — Black Band
Swiss Pike — Swiss Pikemen
Mounted Crossbowmen — Crossbowmen
Heavy Artillery — Cannon
Alençon force — Heavy Cavalry — French pike, gendarmes and arquebusiers

Imperial Army
Spanish Arquebusiers — Arquebusiers — Pescara
Neapolitan Arquebusiers — Arquebusiers
Light Artillery — Cannon
Spanish Men-at-Arms — Heavy Cavalry
Spanish Light Cavalry — Light Cavalry
Landsknechts — Landsknechts — Frundsberg
Landsknechts — Landsknechts — Bourbon
Spanish Light Cavalry — Light Cavalry
Off-table Artillery — Cannon
Defenders of Pavia — Pikemen — Leyva

Deployment
The Imperial force breaks into the park in the morning and advances through the breach. The French must respond quickly. The scenario map carries much of the deployment information rather than presenting it only in prose.

Scenario Notes
Early-morning mist and surprise are part of the published narrative. The Pavia garrison later conducts a sortie. These are source observations; a Battle Axe designer may represent them with special rules or may deliberately omit them.`;

export function createBlankScenario(){
  return {
    metadata:{title:'',date:'',location:'',gameLength:'',status:'Draft',tableSize:''},
    historicalSituation:'', deploymentNotes:'', victoryText:'',
    sources:[], observations:[], suggestions:[], ignoredSuggestionIds:[], acceptedSuggestionIds:[],
    sourceForces:[], rosters:{French:[],Imperial:[],Garrison:[]},
    unresolved:[], lastAnalysis:null
  };
}
