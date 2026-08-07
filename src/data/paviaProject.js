export const paviaProject = {
  id: 'pavia-1525',
  name: 'Battle of Pavia',
  version: 'studio-sample-0.3.2',
  playSpace: { width: 48, height: 48, units: 'inches', origin: 'northwest' },
  historicalContext: `The Battle of Pavia was fought across the northern approaches to the city within the great Visconti Park, a walled ducal hunting preserve. The landscape mixed broad open meadows with irregular woodland, orchards, cultivated fields, wet ground, farmsteads and formal gardens. A substantial wall enclosed the park, while roads and tree-lined avenues linked its gates, Mirabello and Pavia. The narrow winding Vernavola crossed the center of the park with wet margins and scattered crossings.`,
  mapNotes: `Treat the imported map as immutable. Salmon linework generally represents substantial walls. Blue/cyan lines or long thin polygons may represent streams or wet channels. Roads tend to be tan/brown and straighter than watercourses. Gray compact features that cross water may be bridges. Gatehouses/openings interrupt walls. Decorative buildings may be classified as no-effect if the scenario designer chooses.`,
  features: [
    {id:'water-vernavola',name:'Vernavola — central reach',category:'Hydrology',proposal:'Stream / watercourse',confidence:94,cls:'Stream',effects:['Difficult'],box:[44,10,13,68],reason:'Long narrow cyan geometry with strong sinuosity; consistent with central watercourse.'},
    {id:'water-west',name:'Western watercourse',category:'Hydrology',proposal:'Stream / drainage reach',confidence:86,cls:'Stream',effects:['Difficult'],box:[0.5,2,17,91],reason:'Long thin blue/cyan feature with meandering geometry.'},
    {id:'water-south',name:'Southern wet channel',category:'Hydrology',proposal:'Wet channel',confidence:81,cls:'Wet Ground',effects:['Difficult'],box:[27,53,20,40],reason:'Elongated cyan polygon associated with wet ground.'},
    {id:'wall-northwest',name:'Northwestern park wall',category:'Walls & Fortifications',proposal:'Masonry wall',confidence:95,cls:'Masonry Wall',effects:['Impassable','Tall'],box:[2,3,44,13],reason:'Salmon linear enclosure geometry with fortified context.'},
    {id:'wall-north',name:'Northern park wall',category:'Walls & Fortifications',proposal:'Masonry wall',confidence:95,cls:'Masonry Wall',effects:['Impassable','Tall'],box:[42,2,50,15],reason:'Long salmon boundary segment forming park enclosure.'},
    {id:'wall-east',name:'Eastern park wall',category:'Walls & Fortifications',proposal:'Masonry wall',confidence:93,cls:'Masonry Wall',effects:['Impassable','Tall'],box:[77,10,21,74],reason:'Connected salmon barrier line on eastern perimeter.'},
    {id:'wall-south',name:'Southern park wall / city approach',category:'Walls & Fortifications',proposal:'Masonry wall',confidence:88,cls:'Masonry Wall',effects:['Impassable','Tall'],box:[32,78,63,17],reason:'Barrier geometry separating park and southern urban edge.'},
    {id:'breach',name:'Imperial breach',category:'Crossings & Openings',proposal:'Rubble breach through wall',confidence:90,cls:'Breach',effects:['Difficult'],box:[58,3,11,9],reason:'Named opening in wall; derived movement corridor should remain separate from source geometry.'},
    {id:'gate-pescarina',name:'Porta Pescarina',category:'Crossings & Openings',proposal:'Fortified gatehouse / wall opening',confidence:89,cls:'Gatehouse',effects:['Difficult'],box:[70,8,9,10],reason:'Compact structure located directly on wall at route connection.'},
    {id:'gate-repentita',name:'Porta Repentita',category:'Crossings & Openings',proposal:'Fortified gatehouse / wall opening',confidence:84,cls:'Gatehouse',effects:['Difficult'],box:[17,4,10,10],reason:'Named wall opening associated with road.'},
    {id:'gate-riazzo',name:'Porta Riazzo',category:'Crossings & Openings',proposal:'Gatehouse / wall opening',confidence:80,cls:'Gatehouse',effects:['Difficult'],box:[38,7,10,10],reason:'Named opening intersecting wall line.'},
    {id:'bridge-mirabello',name:'Mirabello stream crossing',category:'Crossings & Openings',proposal:'Bridge crossing',confidence:78,cls:'Bridge',effects:[],box:[48,28,11,8],reason:'Short compact geometry spans a watercourse near route alignment.'},
    {id:'road-corso',name:'Corso avenue',category:'Roads & Avenues',proposal:'Tree-lined avenue',confidence:92,cls:'Road',effects:[],box:[38,36,22,50],reason:'Broad, comparatively straight route linking Mirabello toward Pavia.'},
    {id:'road-north',name:'Northern approach road',category:'Roads & Avenues',proposal:'Earth road / track',confidence:84,cls:'Road',effects:[],box:[56,3,28,31],reason:'Straighter tan route connecting northern wall sector toward interior.'},
    {id:'avenue-corso',name:'Corso roadside tree lines',category:'Vegetation Lines',proposal:'Tree-lined avenue vegetation',confidence:82,cls:'Open Grove',effects:['Obscuring'],box:[33,35,30,49],reason:'Repeated linear tree symbols parallel the Corso rather than forming a woodland polygon.'},
    {id:'wood-west',name:'Western woodland block',category:'Woods & Groves',proposal:'Dense woodland',confidence:91,cls:'Dense Wood',effects:['Difficult','Obscuring'],box:[7,17,30,51],reason:'Large irregular dark-green polygon with dense woodland texture.'},
    {id:'wood-east',name:'Eastern woodland block',category:'Woods & Groves',proposal:'Dense woodland',confidence:88,cls:'Dense Wood',effects:['Difficult','Obscuring'],box:[62,17,33,48],reason:'Large irregular green polygon with woodland texture.'},
    {id:'mirabello',name:'Castello Mirabello complex',category:'Structures',proposal:'Major structure / castle complex',confidence:87,cls:'Building',effects:['Impassable','Tall','Defensive'],box:[45,21,18,20],reason:'Named central complex with compact building geometry.'}
  ],
  candidates: [
    {id:'candidate-bridge-south',name:'Possible southern bridge',kind:'compact crossing geometry',confidence:57,box:[43,70,9,8],reason:'Short gray feature intersects a blue/cyan channel but route continuity is uncertain.'},
    {id:'candidate-wall-segment',name:'Possible internal wall segment',kind:'linear barrier',confidence:52,box:[25,13,20,10],reason:'Salmon/brown line could be wall, garden boundary, or decorative edge.'},
    {id:'candidate-ditch',name:'Possible drainage ditch',kind:'thin linear hydrology',confidence:49,box:[50,42,18,24],reason:'Thin curving line has water-like geometry but weak color/topology evidence.'},
    {id:'candidate-avenue',name:'Possible secondary tree avenue',kind:'vegetation line',confidence:54,box:[55,49,23,22],reason:'Repeated tree symbols may be route-side vegetation or decorative planting.'},
    {id:'candidate-gate',name:'Possible eastern gate opening',kind:'wall opening',confidence:46,box:[87,38,9,10],reason:'Compact feature touches wall, but no clear route continuation is detected.'},
    {id:'candidate-structure',name:'Possible gameplay structure',kind:'building / compound',confidence:43,box:[19,57,11,11],reason:'Building-shaped geometry may be decorative; map-author notes should decide whether it enters gameplay.'}
  ]
};
