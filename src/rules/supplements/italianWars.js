export const ITALIAN_WARS_SUPPLEMENT = Object.freeze({
  id:'italian-wars',name:'Italian Wars',version:'1',source:'Battle Axe Italian Wars Supplement',description:'Period module layered on top of the Battle Axe core rules.',
  capabilities:{swissMutualRestriction:true,pikeShotTransit:true,campBaggageAssets:true,italianWarsTraits:true,shockCavalryCounterCharge:true},
  armyAssetPolicy:{campMax:1,baggageMax:1,mutuallyExclusive:true,source:'Italian Wars supplement — Camp / Baggage rule'},
  profileMatchers:[
    ['Swiss Pikemen',/swiss\s+(?:pike|pikemen)|swiss main|swiss vanguard|swiss rear/i],['Arquebusiers',/arquebus/i],['Landsknechts',/landsknecht/i],['Gendarmes',/gendar/i],['Stradiots',/stradiot/i],['Cannon',/artillery|cannon|guns?\b/i],['Heavy Cavalry',/heavy cavalry|men-at-arms|men at arms/i],['Light Cavalry',/light cavalry/i],['Crossbowmen',/crossbow/i],['Archers',/\barchers?\b/i],['Pikemen',/\bpike(?:men)?\b/i]
  ],
  unitLibrary:[

  {profile:'Gendarmes',category:'Cavalry',icon:'♞',m:3,c:4,a:6,pts:3,traits:['Shock Cavalry'],armies:['Early French','Later French'],source:'Italian Wars Supplement'},
  {profile:'Knights',category:'Cavalry',icon:'♞',m:3,c:3,a:6,pts:2,traits:['Shock Cavalry'],armies:['Early Imperial','Later Imperial'],source:'Italian Wars Supplement'},
  {profile:'Heavy Cavalry',category:'Cavalry',icon:'♞',m:3,c:3,a:6,pts:2,traits:['Shock Cavalry'],armies:['Italian'],source:'Italian Wars Supplement — Italian Army List'},
  {profile:'Reiters',category:'Cavalry',icon:'♞',m:3,c:3,a:5,pts:2,traits:['Pistols'],armies:['Later French','Later Imperial'],source:'Italian Wars Supplement'},
  {profile:'Demi-Lancers',category:'Cavalry',icon:'♞',m:4,c:3,a:5,pts:2,traits:['Shock Cavalry'],armies:['Later French','Tudor'],source:'Italian Wars Supplement'},
  {profile:'Light Cavalry',category:'Cavalry',icon:'➶',m:4,c:2,a:4,pts:1,traits:['Shock Cavalry'],armies:['Italian','Early Imperial','Later Imperial'],source:'Italian Wars Supplement'},
  {profile:'Stradiots',category:'Cavalry',icon:'➶',m:4,c:2,a:4,pts:1,traits:['Javelins'],armies:['French','Italian','Imperial'],source:'Italian Wars Supplement'},
  {profile:'Border Cavalry',category:'Cavalry',icon:'➶',m:4,c:2,a:4,pts:1,traits:['Javelins'],armies:['Tudor'],source:'Italian Wars Supplement — Tudor Forces'},
  {profile:'Ginetes',category:'Cavalry',icon:'➶',m:4,c:2,a:4,pts:1,traits:['Javelins'],armies:['Spanish'],source:'Italian Wars Supplement — Spanish Army List'},
  {profile:'Swiss Pikemen',category:'Infantry',icon:'⚔',m:2,c:4,a:5,pts:2,traits:['Fury','Pikes'],armies:['French','Italian','Imperial'],source:'Italian Wars Supplement'},
  {profile:'Swiss Guard',category:'Infantry',icon:'⚔',m:2,c:4,a:5,pts:2,traits:['Elite','Fury'],armies:['Italian'],source:'Italian Wars Supplement — Italian Army List'},
  {profile:'Landsknechts',category:'Infantry',icon:'⚔',m:2,c:4,a:5,pts:2,traits:['Elite','Pikes'],armies:['French','Italian','Imperial','Spanish','Tudor'],source:'Italian Wars Supplement'},
  {profile:'Pikemen',category:'Infantry',icon:'⚔',m:2,c:4,a:5,pts:1,traits:['Pikes'],armies:['French','Italian','Imperial'],source:'Italian Wars Supplement'},
  {profile:'Forlorn Hope',category:'Infantry',icon:'⚔',m:4,c:3,a:5,pts:1,traits:['Elite','Fury'],armies:['Later Imperial'],source:'Italian Wars Supplement — Later Imperial Army List'},
  {profile:'Halberdiers',category:'Infantry',icon:'⚔',m:2,c:3,a:5,pts:1,traits:['Fury'],armies:['Imperial'],source:'Italian Wars Supplement'},
  {profile:'Swordsmen',category:'Infantry',icon:'⚔',m:2,c:3,a:5,pts:1,traits:['Fury'],armies:['French','Spanish'],source:'Italian Wars Supplement'},
  {profile:'Crossbowmen',category:'Infantry',icon:'⌁',m:2,c:1,a:4,pts:1,traits:['Shoot 2'],armies:['French','Italian','Imperial','Spanish'],source:'Italian Wars Supplement'},
  {profile:'Archers',category:'Infantry',icon:'⌁',m:2,c:2,a:4,pts:1,traits:['Shoot 3'],armies:['Tudor'],source:'Italian Wars Supplement — Tudor Forces'},
  {profile:'Arquebusiers',category:'Infantry',icon:'⌁',m:2,c:1,a:4,pts:1,traits:['Arquebus'],armies:['French','Italian','Imperial','Spanish'],source:'Italian Wars Supplement'},
  {profile:'Spanish Tercio',category:'Infantry',icon:'⚔',m:2,c:4,a:5,pts:3,traits:['Tercio'],armies:['Spanish'],source:'Italian Wars Supplement — Spanish Army List'},
  {profile:'Colunela Pike',category:'Infantry',icon:'⚔',m:2,c:4,a:5,pts:2,traits:['Elite','Pikes'],armies:['Spanish'],source:'Italian Wars Supplement — Spanish Army List'},
  {profile:'Camp',category:'Army Asset',icon:'⌂',m:0,c:0,a:0,pts:4,traits:['Immobile','Army Asset','Camp'],armies:['French','Italian','Imperial','Spanish','Tudor'],source:'Italian Wars Supplement — Camp / Baggage rules',baseMm:40,asset:true},
  {profile:'Baggage Train',category:'Army Asset',icon:'▣',m:0,c:0,a:0,pts:2,traits:['Immobile','Army Asset','Baggage Train'],armies:['French','Italian','Imperial','Spanish','Tudor'],source:'Italian Wars Supplement — Camp / Baggage rules',baseMm:40,asset:true},
  {profile:'Cannon',category:'Artillery',icon:'●',m:1,c:1,a:6,pts:2,traits:['Artillery'],armies:['French','Italian','Imperial','Spanish','Tudor'],source:'Italian Wars Supplement'}
  ],
  ruleProvenance:{'Swiss mutual restriction':'Italian Wars Supplement','Pike and Shot Tactics':'Italian Wars Supplement','Camp / Baggage Train':'Italian Wars Supplement','Arquebus':'Italian Wars Supplement','Artillery':'Italian Wars Supplement','Elite':'Italian Wars Supplement','Fury':'Italian Wars Supplement','Javelins':'Italian Wars Supplement','Pikes':'Italian Wars Supplement','Pistols':'Italian Wars Supplement','Shock Cavalry':'Italian Wars Supplement','Tercio':'Italian Wars Supplement'}
});
