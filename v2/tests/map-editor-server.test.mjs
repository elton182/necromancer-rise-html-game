import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createDiskStore} from '../scripts/map-disk-store.mjs';
import {createLibrary,normalizeMap} from '../scripts/map-model.mjs';

const {createEditorServer,readCampaignBundle,formatMap,gameWithMaps}=createRequire(import.meta.url)('../tools/map-editor-server.cjs');
const GAME='<html><head><script id="campaign-maps" type="application/json">{"maps":[]}</script></head><body>JOGO</body></html>';
async function serve(t,extra=()=>({})){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nr-maps-')),gameFile=path.join(dir,'game.html'),mapsDir=path.join(dir,'maps');fs.writeFileSync(gameFile,GAME);
 const instance=createEditorServer({mapsDir,gameFile,...extra({mapsDir,gameFile})}),port=await instance.listen(0);
 t.after(async()=>{await instance.close();fs.rmSync(dir,{recursive:true,force:true});});
 const call=(method,url,body,headers={'X-Map-Editor':'1'})=>fetch('http://127.0.0.1:'+port+url,{method,headers,body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)});
 return {port,mapsDir,call};
}
const doc=(id,extra={})=>({id,name:'Mapa '+id,objects:[{id:'a',type:'rock',x:1,y:2}],spawns:[],...extra});

test('grava, lista e apaga mapas em arquivos legíveis',async t=>{
 const {mapsDir,call}=await serve(t);
 assert.deepEqual((await (await call('GET','/api/maps')).json()).maps,[]);
 assert.equal((await call('PUT','/api/maps/campaign-world',doc('campaign-world',{campaign:'world'}))).status,200);
 assert.equal((await call('PUT','/api/maps/m123',doc('m123'))).status,200);
 assert.ok(fs.existsSync(path.join(mapsDir,'campaign-world.json')),'campanha na pasta principal');assert.ok(fs.existsSync(path.join(mapsDir,'custom/m123.json')),'pessoal em custom/');
 const text=fs.readFileSync(path.join(mapsDir,'campaign-world.json'),'utf8');assert.ok(text.split('\n').some(l=>l.includes('"type":"rock"')&&!l.includes('"name"')),'uma peça por linha');
 assert.deepEqual(JSON.parse(text),doc('campaign-world',{campaign:'world'}));
 const listed=await (await call('GET','/api/maps')).json();assert.deepEqual(listed.maps.map(m=>m.id).sort(),['campaign-world','m123']);
 assert.deepEqual(readCampaignBundle(mapsDir).maps.map(m=>m.id),['campaign-world'],'só a campanha vai para o jogo');
 assert.equal((await call('DELETE','/api/maps/m123')).status,200);assert.ok(!fs.existsSync(path.join(mapsDir,'custom/m123.json')));
 assert.equal(fs.readdirSync(mapsDir).filter(n=>n.endsWith('.tmp')).length,0,'sem arquivos temporários');
});
test('recusa ids, corpo e origem inválidos, sem escapar da pasta',async t=>{
 const {port,mapsDir,call}=await serve(t);
 for(const id of ['..%2F..%2Fevil','a%2Fb','..','%00x'])assert.notEqual((await call('PUT','/api/maps/'+id,doc('x'))).status,200,id);
 assert.equal((await call('PUT','/api/maps/abc',doc('outro'))).status,400,'id do corpo diferente');
 assert.equal((await call('PUT','/api/maps/abc','{quebrado')).status,400);
 assert.equal((await call('PUT','/api/maps/abc',doc('abc'),{})).status,403,'sem a marca do editor');
 assert.equal((await call('PUT','/api/maps/abc',doc('abc'),{'X-Map-Editor':'1',Origin:'https://site-qualquer.example'})).status,403,'origem de fora');
 assert.equal((await call('DELETE','/api/maps/abc',undefined,{Origin:'https://site-qualquer.example'})).status,403);
 const http=await import('node:http');
 const status=await new Promise((resolve,reject)=>{http.get({host:'127.0.0.1',port,path:'/api/maps',headers:{Host:'evil.example'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject);});
 assert.equal(status,403,'nome de host de fora');
 assert.ok(!fs.existsSync(path.join(mapsDir,'abc.json')));assert.ok(!fs.existsSync(path.join(mapsDir,'custom/abc.json')));
});
test('só entrega o que o editor usa',async t=>{
 const {call}=await serve(t);
 for(const ok of ['/v2/map-editor.html','/v2/scripts/map-model.mjs','/v2/assets/models.json','/tools/3d-lab/vendor/three.module.js'])assert.equal((await call('GET',ok)).status,200,ok);
 const redirect=await call('GET','/');assert.ok(redirect.url.endsWith('/v2/map-editor.html'));
 for(const no of ['/package.json','/.git/config','/AGENTS.md','/v2/necromancer-3d.html','/v2/tools/build.cjs','/v2/scripts/..%2F..%2FAGENTS.md','/v2/scripts/%2e%2e/%2e%2e/AGENTS.md'])assert.equal((await call('GET',no)).status,404,no);
});
test('Testar entrega o jogo com os mapas do disco e entra no mapa',async t=>{
 const {call}=await serve(t);
 await call('PUT','/api/maps/campaign-cave',doc('campaign-cave',{campaign:'cave',name:'</script><b>'}));await call('PUT','/api/maps/pessoal',doc('pessoal'));
 const plain=await (await call('GET','/play')).text();assert.ok(plain.includes('campaign-cave'));assert.ok(!plain.includes('"id":"pessoal"'),'mapa pessoal não entra na campanha');assert.ok(!plain.includes('__mapTest'));assert.ok(!plain.includes('</script><b>'),'texto do mapa não fecha o bloco');
 const answer=await (await call('POST','/api/play',{doc:doc('tmp')})).json();assert.ok(answer.ok);
 const page=await (await call('GET',answer.url)).text();assert.ok(page.includes('__mapTest'));assert.ok(page.includes('"id":"tmp"'));assert.ok(page.indexOf('__mapTest')<page.indexOf('</body>'));
 assert.equal((await call('GET','/play/abcdef')).status,404);assert.equal((await call('POST','/api/play',{doc:{id:'x'}})).status,400);
 assert.throws(()=>gameWithMaps('<html></html>',{maps:[]}),/build/);
 assert.deepEqual(JSON.parse(formatMap({a:1,b:[{c:1},{c:2}],d:[],e:'x'})),{a:1,b:[{c:1},{c:2}],d:[],e:'x'});
});
test('arquivo de campanha inválido interrompe o build, em vez de publicar menos',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nr-maps-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 assert.deepEqual(readCampaignBundle(path.join(dir,'nao-existe')),{maps:[]});
 fs.writeFileSync(path.join(dir,'campaign-x.json'),'{quebrado');assert.throws(()=>readCampaignBundle(dir),/inválido/);
});
test('Publicar compara o disco com o jogo e roda um build por vez',async t=>{
 const builds=[];let answer={ok:true};
 const {mapsDir,call}=await serve(t,({mapsDir,gameFile})=>({publish:()=>new Promise(resolve=>{builds.push(()=>{if(answer.ok)fs.writeFileSync(gameFile,gameWithMaps(GAME,readCampaignBundle(mapsDir)));resolve(answer);});})}));
 const status=async()=>(await call('GET','/api/publish')).json(),ids=s=>s.changed.map(m=>m.id);
 const started=async n=>{const end=Date.now()+5000;while(builds.length<n&&Date.now()<end)await new Promise(r=>setTimeout(r,5));assert.equal(builds.length,n);};
 assert.deepEqual(ids(await status()),[],'sem edições, nada a publicar');assert.equal((await status()).available,true);
 await call('PUT','/api/maps/campaign-cave',doc('campaign-cave',{campaign:'cave'}));await call('PUT','/api/maps/pessoal',doc('pessoal'));
 assert.deepEqual(ids(await status()),['campaign-cave'],'mapa pessoal não conta');
 assert.equal((await call('POST','/api/publish',undefined,{})).status,403,'sem a marca do editor');
 assert.equal((await call('POST','/api/publish',undefined,{'X-Map-Editor':'1',Origin:'https://site-qualquer.example'})).status,403,'origem de fora');assert.equal(builds.length,0);
 const first=call('POST','/api/publish'),second=call('POST','/api/publish');await started(1);
 assert.equal((await status()).publishing,true);
 const waitingGame=call('GET','/play');await new Promise(r=>setTimeout(r,20));
 builds[0]();const answers=await Promise.all([first,second]);assert.deepEqual(answers.map(r=>r.status),[200,200]);assert.equal(builds.length,1,'dois cliques, um build');
 assert.deepEqual(ids(await answers[0].json()),[],'depois de publicar, em dia');assert.ok((await (await waitingGame).text()).includes('campaign-cave'),'o jogo só é entregue depois do build');
 await call('PUT','/api/maps/campaign-cave',doc('campaign-cave',{campaign:'cave',name:'Outro nome'}));assert.deepEqual(ids(await status()),['campaign-cave'],'edição nova volta a faltar');
 answer={ok:false,message:'build quebrou'};const failing=call('POST','/api/publish');await started(2);builds[1]();const failed=await failing;
 assert.equal(failed.status,500);assert.match((await failed.json()).message,/build quebrou/);assert.equal((await status()).publishing,undefined,'a falha libera o próximo');assert.deepEqual(ids(await status()),['campaign-cave'],'o que falhou continua pendente');
 answer={ok:true};const again=call('POST','/api/publish');await started(3);builds[2]();assert.equal((await again).status,200);assert.deepEqual(ids(await status()),[]);
 await call('DELETE','/api/maps/campaign-cave');const removed=await status();assert.deepEqual(ids(removed),['campaign-cave'],'Restaurar também precisa chegar ao jogo');assert.equal(removed.changed[0].removed,true);
 fs.writeFileSync(path.join(mapsDir,'campaign-x.json'),'{quebrado');assert.match((await status()).invalid,/inválido/);
 const blocked=await call('POST','/api/publish');assert.equal(blocked.status,409);assert.match((await blocked.json()).message,/inválido/);assert.equal(builds.length,3,'arquivo inválido nem começa o build');
});
test('Publicar com pastas de teste nunca roda o build real',async t=>{
 const {call}=await serve(t);
 assert.equal((await (await call('GET','/api/publish')).json()).available,false);
 const answer=await call('POST','/api/publish');assert.equal(answer.status,409);assert.match((await answer.json()).message,/só funciona/);
});

const fakeServer=()=>{const calls=[],gate={fail:false};return {calls,gate,request:async(method,url,body)=>{if(gate.fail)throw Error('disco cheio');calls.push([method,url,body?.name]);}};};
test('disco: a biblioteca lê na hora e grava só o que mudou',async()=>{
 const net=fakeServer(),a=normalizeMap({id:'a',name:'A',objects:[]}).map,b=normalizeMap({id:'b',name:'B',objects:[]}).map,store=createDiskStore([a,b],{request:net.request}),library=createLibrary(store,undefined,{maxBytes:Infinity});
 assert.deepEqual(library.list().map(m=>m.id),['a','b']);
 assert.ok(library.save({...library.get('a'),name:'A2'}).ok);assert.equal(library.get('a').name,'A2','leitura vê a edição antes do disco');
 assert.ok((await store.flush()).ok);assert.deepEqual(net.calls,[['PUT','/api/maps/a','A2']],'b não é regravado');
 assert.ok(library.remove('b').ok);await store.flush();assert.deepEqual(net.calls[1],['DELETE','/api/maps/b',undefined]);assert.equal(store.pending(),false);
});
test('disco: várias edições seguidas gravam a última; falha avisa e tenta de novo',async()=>{
 const net=fakeServer(),timers=[],states=[],store=createDiskStore([],{request:net.request,onState:s=>states.push(s),setTimer:fn=>{timers.push(fn);return 1;}});
 const body=name=>JSON.stringify({version:1,maps:[{id:'a',name}]});
 net.gate.fail=true;store.setItem('k',body('v1'));const failed=await store.flush();assert.equal(failed.ok,false);assert.match(failed.message,/disco cheio/);assert.ok(states.some(s=>s.error));assert.equal(store.pending(),true,'a edição continua na fila');
 store.setItem('k',body('v2'));store.setItem('k',body('v3'));assert.equal((await store.flush()).ok,false,'o disco segue falhando');net.gate.fail=false;assert.equal(timers.length,1);timers[0]();const ok=await store.flush();assert.ok(ok.ok);
 assert.equal(net.calls.at(-1)[2],'v3');assert.ok(!net.calls.some(c=>c[2]==='v1'),'versão velha não chega ao disco');assert.equal(store.pending(),false);assert.equal(states.at(-1).error,null);
});
