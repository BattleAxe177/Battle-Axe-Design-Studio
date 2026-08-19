import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const VERSION='0.5.2.3';

test('HTML module entry point uses current release cache buster', async()=>{
  const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,new RegExp(`src="\\./src/main\\.js\\?v=${VERSION.replaceAll('.','\\.')}"`));
  assert.doesNotMatch(html,/v=0\.5\.0-ui-preview/);
});

test('source module imports do not retain stale cache busters', async()=>{
  const root=new URL('../src/',import.meta.url);
  async function walk(dir){
    const entries=await fs.readdir(dir,{withFileTypes:true}),out=[];
    for(const e of entries){
      const p=path.join(dir,e.name);
      if(e.isDirectory())out.push(...await walk(p));
      else if(e.name.endsWith('.js'))out.push(p);
    }
    return out;
  }
  for(const file of await walk(root.pathname)){
    const text=await fs.readFile(file,'utf8');
    for(const m of text.matchAll(/\?v=([A-Za-z0-9._-]+)/g))assert.equal(m[1],VERSION,`${file} has stale ${m[0]}`);
  }
});
