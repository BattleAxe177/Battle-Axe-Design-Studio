export const AMERICAN_CIVIL_WAR_SUPPLEMENT = Object.freeze({
  id:'american-civil-war',
  name:'American Civil War',
  version:'1',
  source:'Battle Axe American Civil War Supplement',
  description:'American Civil War rules, brigade organization, command competency, period unit profiles, and ACW tactical AI doctrine layered on top of the Battle Axe core rules.',

  recommendedTabletop:{preset:'acw-regiment',unitBaseWidthMm:50,unitBaseDepthMm:25,commanderBaseMm:25,measurementMultiplier:1,note:'Studio basing preset only; not a printed supplement requirement.'},

  capabilities:{
    acwCommandCompetency:true,
    acwBreakFallback:true,
    acwEnfiladeFire:true,
    acwRefusalToReceive:true,
    acwRebelYell:true,
    acwMountedDismounted:true,
    acwBrigadeDoctrine:true
  },

  commandRules:{
    mode:'rating-proximity',
    testThreshold:5,
    influenceRangeInches:1,
    useHighestFriendlyRating:true,
    ratingMin:0,
    ratingMax:3,
    commanderPointCost:1,
    genericRatingTables:{
      Union:{1:0,2:0,3:1,4:1,5:2,6:3},
      Confederate:{1:1,2:2,3:2,4:2,5:2,6:3},
      Default:{1:0,2:1,3:1,4:2,5:2,6:3}
    }
  },

  sideDefaults:{French:'Union',Imperial:'Confederate'},

  factionIdentities:[
    {id:'Union',match:/\b(union|federal|federals|u\.?s\.?|united states|army of the (?:tennessee|potomac|cumberland|ohio))\b/i},
    {id:'Confederate',match:/\b(confederate|confederacy|rebel|rebels|southern|army of (?:mississippi|northern virginia|tennessee))\b/i}
  ],

  forceStructure:{
    kind:'brigades',
    commanderPointCost:1,
    armyMax:{Sharpshooters:2},
    brigadeTypes:[
      {id:'infantry-brigade',name:'Infantry Brigade',primaryProfile:'Infantry',primaryMin:2,primaryMax:8,optionalMax:{Sharpshooters:1,Cannons:2}},
      {id:'cavalry-brigade',name:'Cavalry Brigade',primaryProfile:'Cavalry',primaryMin:1,primaryMax:4,optionalMax:{}}
    ]
  },

  aiDoctrine:{
    id:'acw-regimental-brigade-doctrine',
    name:'ACW Regimental Brigade Doctrine',
    summary:'Fight the brigade; maneuver the regiments. Defenders spread to use frontage and firepower with support behind the line; assaults preserve successive echelons; advancing commands balance frontage, depth, and command cohesion. Prefer sustained fire over unsupported frontal charges, use sharpshooters as a screen, support attacks with artillery, and keep commanders behind the useful center of their command.',
    brigadeCentric:true,
    firstLineFraction:.67,
    defendFrontageFraction:.80,
    advanceFrontageFraction:.67,
    assaultFrontageFraction:.55,
    reserveFrontageFraction:.45,
    supportDepthBases:1.5,
    commandCohesionWeight:18,
    fireBeforeCharge:true,
    unsupportedChargePenalty:34,
    favorableChargeBonus:24,
    enfiladePreference:18,
    flankSecurity:true,
    skirmisherScreen:true,
    artillerySupport:true,
    artilleryPreservation:true,
    cavalryDismount:true,
    commanderFrictionByRating:true,
    frontageSlots:true,
    successiveWaves:true,
    reserveDepth:true,
    progressiveCohesion:true,
    tacticalStates:['March','Deploy','Probe','Engage','Assault','Hold','Recover','Withdraw','Pursue']
  },

  profileMatchers:[
    ['Sharpshooters',/sharpshooter|sharpshooters|marksmen|riflemen|skirmishers/i],
    ['Cannons',/artillery|battery|batteries|cannon|guns?\b/i],
    ['Cavalry',/cavalry|mounted|horse(?:men)?/i],
    ['Infantry',/infantry|regiment|regimental|foot\b/i]
  ],

  unitLibrary:[
    {profile:'Infantry',category:'Infantry',role:'infantry',icon:'▰',m:2,c:2,a:5,pts:1,traits:['Muskets'],armies:['Union','Confederate'],source:'American Civil War Supplement'},
    {profile:'Sharpshooters',category:'Infantry',role:'skirmisher',icon:'⌁',m:2,c:2,a:5,pts:2,traits:['Rifles'],armies:['Union','Confederate'],source:'American Civil War Supplement'},
    {profile:'Cavalry',category:'Cavalry',role:'cavalry',icon:'♞',m:4,c:2,a:4,pts:1,traits:['Cavalry'],armies:['Union','Confederate'],source:'American Civil War Supplement',initialState:{mounted:true}},
    {profile:'Cannons',category:'Artillery',role:'artillery',icon:'●',m:1,c:1,a:5,pts:2,traits:['Artillery'],armies:['Union','Confederate'],source:'American Civil War Supplement'}
  ],

  ruleProvenance:{
    'Commander Competency':'American Civil War Supplement',
    'Command Tests':'American Civil War Supplement',
    'Forced Back':'American Civil War Supplement',
    'Enfilade Fire':'American Civil War Supplement',
    'Rebel Yell':'American Civil War Supplement',
    'Refusal to Receive':'American Civil War Supplement',
    'Muskets':'American Civil War Supplement',
    'Rifles':'American Civil War Supplement',
    'Cavalry':'American Civil War Supplement',
    'Artillery':'American Civil War Supplement',
    'Brigade Organization':'American Civil War Supplement'
  }
});
