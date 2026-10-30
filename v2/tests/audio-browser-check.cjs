'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),dir=path.resolve(__dirname,'../../review/v2/audio');fs.mkdirSync(dir,{recursive:true});
 try{
  const page=await browser.newPage(),errors=[],warnings=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});await page.click('body',{position:{x:5,y:5}});
  const result=await page.evaluate(async()=>{
   const {createAudio,base64Bytes}=await import('v2-audio'),catalog=JSON.parse(document.getElementById('music').textContent),context=new AudioContext(),decoded={};
   for(const id of ['crypt','village','portal','waveStart','levelUp']){
    const b=await context.decodeAudioData(base64Bytes(catalog[id].data));decoded[id]={duration:b.duration,channels:b.numberOfChannels};
   }
   const sources=[],original=context.createBufferSource.bind(context);context.createBufferSource=()=>{const s=original();sources.push(s);return s;};
   const loaders=kind=>Object.fromEntries(Object.entries(catalog).filter(([,e])=>(e.kind||'music')===kind).map(([id,e])=>[id,()=>base64Bytes(e.data)]));
   const audio=createAudio({createContext:()=>context,tracks:loaders('music'),effects:loaders('sfx')});audio.unlock();audio.setMusic('crypt');
   for(const id of ['portal','waveStart','levelUp'])audio.play(id);
   for(let i=0;i<100&&sources.length<4;i++)await new Promise(r=>setTimeout(r,50));
   const playback=sources.map(s=>({loop:s.loop,duration:s.buffer?.duration}));
   audio.setMusic('village');
   for(let i=0;i<100&&sources.length<5;i++)await new Promise(r=>setTimeout(r,50));
   const village=sources.at(-1);const villagePlayback={loop:village.loop,duration:village.buffer?.duration};audio.dispose();
   for(const id of ['portal','waveStart','levelUp'])NecromancerV2.audio.play(id);
   return {decoded,playback,villagePlayback};
  });
  assert.equal(result.playback.length,4);assert.equal(result.playback.filter(s=>s.loop).length,1);
  assert.equal(result.villagePlayback.loop,true);assert.equal(result.villagePlayback.duration,result.decoded.village.duration);
  assert.ok(Object.values(result.decoded).every(b=>b.duration>0));assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);assert.deepEqual(warnings,[]);
  fs.writeFileSync(path.join(dir,'audio-result.json'),JSON.stringify({result,errors,warnings,remote},null,2));console.log('Áudios embutidos decodificados e reproduzidos offline no Edge.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
