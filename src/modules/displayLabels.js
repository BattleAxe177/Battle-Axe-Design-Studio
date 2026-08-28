const UNIT_REPLACEMENTS=[
  [/Pennsylvania Reserves/gi,'PA Res.'],[/New York State Militia/gi,'NYSM'],
  [/Pennsylvania/gi,'PA'],[/Massachusetts/gi,'MA'],[/Michigan/gi,'MI'],[/New York/gi,'NY'],[/Virginia/gi,'VA'],
  [/Alabama/gi,'AL'],[/Mississippi/gi,'MS'],[/South Carolina/gi,'SC'],[/North Carolina/gi,'NC'],[/Georgia/gi,'GA'],
  [/Tennessee/gi,'TN'],[/Louisiana/gi,'LA'],[/Minnesota/gi,'MN'],[/Arkansas/gi,'AR'],[/Maryland/gi,'MD'],
  [/Connecticut/gi,'CT'],[/Rhode Island/gi,'RI'],[/New Jersey/gi,'NJ'],[/Delaware/gi,'DE'],[/Ohio/gi,'OH'],[/Indiana/gi,'IN'],
  [/Illinois/gi,'IL'],[/Wisconsin/gi,'WI'],[/Maine/gi,'ME'],[/Vermont/gi,'VT'],[/New Hampshire/gi,'NH'],
  [/Reserves/gi,'Res.'],[/Sharpshooters/gi,'SS'],[/Sharpshooter/gi,'SS'],[/Infantry Battalion/gi,'Bn.'],
  [/Infantry Regiment/gi,''],[/Infantry/gi,''],[/Regiment/gi,'Regt.'],[/Battalion/gi,'Bn.'],[/Battery/gi,'Bty.'],[/Rifles/gi,'Rif.']
];

function clean(s){return String(s||'').replace(/\s+/g,' ').replace(/\s+([,.;])/g,'$1').replace(/\s+-\s*$/,'').trim();}
function ellipsize(s,max){const str=clean(s);if(str.length<=max)return str;return `${str.slice(0,Math.max(1,max-1)).trimEnd()}…`;}

/** Compact map label only. Full historical names remain authoritative elsewhere and in tooltips. */
export function compactUnitLabel(name,max=19){
  let s=clean(name);
  for(const [rx,to] of UNIT_REPLACEMENTS)s=s.replace(rx,to);
  s=clean(s).replace(/\bCompany\b/gi,'Co.').replace(/\bVolunteer(s)?\b/gi,'Vol.');
  if(s.length<=max)return s;
  // Keep ordinal/unit identity and collapse remaining descriptive words to initials.
  const parts=s.split(' ');
  if(parts.length>2){
    const first=parts.shift(),last=parts.pop();
    const middle=parts.map(w=>/^[A-Z]{2,5}\.?$/.test(w)?w:(w[0]?`${w[0].toUpperCase()}.`:''));
    s=clean([first,...middle,last].join(' '));
  }
  return ellipsize(s,max);
}

export function compactCommandLabel(name,max=20){
  let s=clean(name).split(/\s+[—–-]\s+/)[0];
  s=s.replace(/Reinforcement/gi,'').replace(/Brigade/gi,'Bde.').replace(/Division/gi,'Div.').replace(/Reserve/gi,'Res.').replace(/Artillery/gi,'Arty.');
  return ellipsize(clean(s),max);
}
