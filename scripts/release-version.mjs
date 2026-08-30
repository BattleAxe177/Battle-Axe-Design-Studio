export function normalizeReleaseVersion(value){
  const version=String(value??'').trim().match(/^\d+\.\d+\.\d+\.\d+/)?.[0];
  if(!version)throw new Error(`Invalid Battle Axe VERSION: ${String(value??'').trim()||'(empty)'}`);
  return version;
}

export function injectReleaseVersion(html,value){
  const version=normalizeReleaseVersion(value);
  let out=String(html??'');
  out=out.replace(/(<span id="runtimeVersion">)v\d+\.\d+\.\d+\.\d+(<\/span>)/,`$1v${version}$2`);
  out=out.replace(/Battle Axe v\d+\.\d+\.\d+\.\d+/g,`Battle Axe v${version}`);
  out=out.replace(/(src="\.\/src\/main\.js\?v=)\d+\.\d+\.\d+\.\d+("\s*>)/,`$1${version}$2`);
  return out;
}
