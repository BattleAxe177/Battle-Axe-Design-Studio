const encoder = new TextEncoder();
const decoder = new TextDecoder();

function u16(v){return new Uint8Array([v&255,(v>>>8)&255]);}
function u32(v){return new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]);}
function readU16(view,offset){return view.getUint16(offset,true);}
function readU32(view,offset){return view.getUint32(offset,true);}
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}

export function storedZip(files){
  const entries=[],parts=[];let offset=0;
  for(const [name,text] of Object.entries(files)){
    const n=encoder.encode(name),d=encoder.encode(text),crc=crc32(d);
    const local=[u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(d.length),u32(d.length),u16(n.length),u16(0),n,d];
    const size=local.reduce((a,x)=>a+x.length,0);parts.push(...local);entries.push({n,d,crc,offset});offset+=size;
  }
  const cdStart=offset,central=[];
  for(const e of entries){central.push(u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(e.crc),u32(e.d.length),u32(e.d.length),u16(e.n.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(e.offset),e.n);}
  const cdSize=central.reduce((a,x)=>a+x.length,0),end=[u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(cdSize),u32(cdStart),u16(0)];
  return new Blob([...parts,...central,...end],{type:'application/zip'});
}

export function downloadBlob(blob,name){
  const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}

async function inflateRaw(bytes){
  if(typeof DecompressionStream!=='function')throw new Error('This browser cannot decompress a normal ZIP response. Use a JSON response file or paste the response instead.');
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzipEntries(arrayBuffer){
  const bytes=new Uint8Array(arrayBuffer),view=new DataView(arrayBuffer);let eocd=-1;
  const min=Math.max(0,bytes.length-65557);
  for(let i=bytes.length-22;i>=min;i--){if(readU32(view,i)===0x06054b50){eocd=i;break;}}
  if(eocd<0)throw new Error('ZIP end-of-directory record was not found.');
  const total=readU16(view,eocd+10),cdOffset=readU32(view,eocd+16),out={};let p=cdOffset;
  for(let i=0;i<total;i++){
    if(readU32(view,p)!==0x02014b50)throw new Error('ZIP central directory is malformed.');
    const method=readU16(view,p+10),compressed=readU32(view,p+20),nameLen=readU16(view,p+28),extraLen=readU16(view,p+30),commentLen=readU16(view,p+32),localOffset=readU32(view,p+42);
    const name=decoder.decode(bytes.slice(p+46,p+46+nameLen));
    if(readU32(view,localOffset)!==0x04034b50)throw new Error(`ZIP local header is malformed for ${name}.`);
    const localNameLen=readU16(view,localOffset+26),localExtraLen=readU16(view,localOffset+28),start=localOffset+30+localNameLen+localExtraLen,data=bytes.slice(start,start+compressed);
    let plain;if(method===0)plain=data;else if(method===8)plain=await inflateRaw(data);else throw new Error(`ZIP compression method ${method} is not supported. Use normal Deflate/Stored ZIP or JSON.`);
    out[name]=decoder.decode(plain);p+=46+nameLen+extraLen+commentLen;
  }
  return out;
}

export async function readExchangeFile(file,{preferred=['response.json','request.json']}={}){
  if(!file)throw new Error('No file selected.');
  const lower=String(file.name||'').toLowerCase();
  if(lower.endsWith('.json'))return{json:JSON.parse(await file.text()),entry:file.name,kind:'json'};
  if(!lower.endsWith('.zip'))throw new Error('Choose a .zip or .json Battle Axe AI package.');
  const entries=await unzipEntries(await file.arrayBuffer()),names=Object.keys(entries),pick=preferred.find(x=>Object.prototype.hasOwnProperty.call(entries,x))||names.find(x=>x.toLowerCase().endsWith('.json'));
  if(!pick)throw new Error('The ZIP does not contain response.json or another JSON file.');
  return{json:JSON.parse(entries[pick]),entry:pick,kind:'zip',entries:names};
}

export function downloadJsonZip(filename,entryName,data){
  downloadBlob(storedZip({[entryName]:JSON.stringify(data,null,2)}),filename);
}
