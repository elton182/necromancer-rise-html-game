import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const htmlFile=new URL('../necromancer-3d.html',import.meta.url);
test('distribuição cabe no GitHub e preserva todos os GLBs sem perdas',()=>{
 assert.ok(statSync(htmlFile).size<100*1024*1024,'HTML deve ficar abaixo de 100 MiB');
 const html=readFileSync(htmlFile,'utf8');
 const packed=html.match(/<script id="assets" type="application\/octet-stream" data-encoding="gzip">([^<]+)<\/script>/);
 assert.ok(packed,'catálogo deve estar comprimido no próprio HTML');
 const assets=JSON.parse(gunzipSync(Buffer.from(packed[1],'base64')));
 const definitions=JSON.parse(readFileSync(new URL('../assets/models.json',import.meta.url),'utf8'));
 assert.deepEqual(Object.keys(assets),Object.keys(definitions));
 for(const [key,entry] of Object.entries(definitions)){
  const {data,...metadata}=assets[key];
  assert.deepEqual(metadata,entry,key+': metadados preservados');
  assert.deepEqual(Buffer.from(data,'base64'),readFileSync(new URL('../../'+entry.path,import.meta.url)),key+': GLB idêntico à fonte');
 }
});
