'use strict';
// Golpes novos do Rei Caído na v2 (Giro da Coroa e Rastro de Brasas) e a Queda mirando Zephyr, renderizados no arquivo gerado.
// Uso: node v2/tests/king-attacks-browser-check.cjs (Playwright + Edge; armazenamento isolado do navegador headless).
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{const dir=path.resolve(__dirname,'../../review/v2/king-balance/browser');fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[],results=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});await legacy.click(page,'#enter');
 for(const [ground,quality] of [['dark','high'],['light','low']]){
  await legacy.select(page,'#ground',ground);await legacy.select(page,'#quality',quality);
  // Cada cena: quadros da simulação real até o ponto pedido (preparação ou impacto), depois pausa e desenha.
  for(const kind of ['spin-windup','spin-hit','embers-windup','embers-hit','leap-player']){
   const state=await page.evaluate(async kind=>{
    const n=NecromancerV2,{createWorld,step}=await import('v2-model');Object.assign(n.world,createWorld({horde:16}));const w=n.world,p=w.player,e=w.boss;
    w.arena={...w.arena,solids:[]};Object.assign(p,{x:0,y:6,hp:1e5,maxHp:1e5});const allies=w.actors.filter(a=>a.team==='ally');
    w.actors=[p,e,...allies];Object.assign(e,{x:0,y:-4,hp:12000,maxHp:12000,kingGap:0,kingCd:{slash:99,leap:99,summon:99},kingV2Cd:{spin:99,embers:99},kingPhase2:false,king:null,kingV2:null});
    if(kind.startsWith('spin')){e.kingV2Cd.spin=0;allies.forEach((a,i)=>{const t=i*2.4;a.x=e.x+Math.cos(t)*(1.2+i%3*.6);a.y=e.y+Math.sin(t)*(1.2+i%3*.6);});}
    else if(kind.startsWith('embers')){e.y=-6;p.y=5;allies.forEach(a=>{a.x+=8;});e.kingV2Cd.embers=0;}
    else{e.kingCd.leap=0;p.y=2;allies.slice(0,4).forEach((a,i)=>{a.x=e.x+(i-1.5)*.7;a.y=e.y+.6;});}
    const steps={'spin-windup':40,'spin-hit':76,'embers-windup':35,'embers-hit':62,'leap-player':50}[kind];
    let action=null;for(let i=0;i<steps;i++){step(w,1/60);action=e.kingV2?.kind||e.king?.kind||action;}
    w.paused=true;n.view.render(w,0);
    const warn=w.effects.filter(f=>f.kingWarning===e.id);
    return {kind,action,v2:e.kingV2?.kind||null,shared:e.king?.kind||null,warnings:warn.map(f=>f.fx),zones:w.hostileZones.filter(z=>z.source===e.id).length,
     hurtAllies:allies.filter(a=>a.hp<a.maxHp).length,leapTarget:e.king?.kind==='leap'?Math.round(Math.hypot(e.king.tx-p.x,e.king.ty-p.y)*10)/10:null,anim:e.animation};
   },kind);
   if(kind==='spin-windup'){assert.equal(state.v2,'spin');assert.ok(state.warnings.includes('dangerRune'));}
   if(kind==='spin-hit')assert.ok(state.hurtAllies>=3,'o giro atinge a horda em volta');
   if(kind==='embers-windup'){assert.equal(state.v2,'embers');assert.ok(state.warnings.includes('dangerLine'));}
   if(kind==='embers-hit')assert.equal(state.zones,3);
   if(kind==='leap-player'){assert.equal(state.shared,'leap');assert.ok(state.leapTarget<1);}
   results.push({ground,quality,...state});await page.screenshot({path:path.join(dir,`${kind}-${ground}.png`)});
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 fs.writeFileSync(path.join(dir,'king-attacks-browser-result.json'),JSON.stringify({results,errors,remote,limits:'Cenas controladas avançam a simulação real; o enquadramento da câmera é o do treino.'},null,2));
 console.log('Rei v2 navegador OK: Giro, Brasas e Queda em Zephyr, chão escuro/alto e claro/baixo, sem erros nem requisições externas.');
 }finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
