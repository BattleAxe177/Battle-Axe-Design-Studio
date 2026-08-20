export const CORE_RULESET = Object.freeze({
  id:'battle-axe-core',name:'Battle Axe Core Rules',version:'1',source:'Battle Axe Rules',
  baseGeometry:{unitBaseMm:50,commanderBaseMm:25},
  movement:{moveWheelMaxDegrees:90,chargeWheelMaxDegrees:45,enemyExclusionInches:1,backwardSidewaysFraction:.5},
  command:{commandRangeInches:3,generalRangeInches:4,commanderMoveInches:4,commanderEnemyExclusionInches:1,escapeThreshold:4,commanderVictoryPoints:2,generalVictoryPoints:3,cannotBeShot:true,chargeOnlyIfNearestVisible:true},
  combat:{breakThreshold:6,generalRetreatOrRecoil:false,chargeConformFree:true},
  terrain:{defensiveArmor:6,dangerTestDestroyOn:1,difficultMoveFraction:.5,directionalLinearDefense:true},
  capabilities:{swissMutualRestriction:false,pikeShotTransit:false,campBaggageAssets:false,italianWarsTraits:false}
});
