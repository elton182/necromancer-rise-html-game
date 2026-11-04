'use strict';
// Passo lateral: com a mira fixa, andar em cada direção precisa escolher o clipe certo, com os pés plantados e sem erros de página.
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const out=path.resolve(__dirname,'../../review/v2/strafe');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await legacy.click(page,'#enter');
 await page.addStyleTag({content:"#pause-dialog{display:none!important}#pause-dialog::backdrop{background:transparent!important;backdrop-filter:none!important}"});
 await page.evaluate(async()=>{const n=NecromancerV2,w=n.world,{step}=await import('v2-model'),T=await import('three');n.pause(true,false);w.actors=[w.player];w.effects=[];w.projectiles=[];w.arena={...w.arena,solids:[]};w.player.hp=w.player.maxHp=1e6;
  // Entrada da tela: mx=x+y, my=y-x. Mira sempre em +Y a partir do jogador, logo a frente é +Y e a esquerda do modelo é +X.
  const toInput=(dx,dy)=>({x:(dx-dy)/2,y:(dx+dy)/2});
  window.walkCheck=(dx,dy,frames=90,model=w.player.model)=>{const p=w.player;p.model=model;p.x=0;p.y=0;w.paused=false;n.view.render(w,0);
   const rows=[],pos=new T.Vector3();let o,phase0,walked0;
   for(let i=0;i<frames;i++){w.aim={x:p.x,y:p.y+6};step(w,1/60,toInput(dx,dy));n.view.render(w,1/60);o=n.view.actors.get(p.id);if(i===29){phase0=o.gaitPhase;walked0=p.walkDistance;}
    if(i>=30){const feet={};o.body.updateMatrixWorld(true);o.body.traverse(b=>{if(b.isBone&&/(Left|Right)Foot$/.test(b.name))feet[/Left/.test(b.name)?'L':'R']=b.getWorldPosition(pos).toArray();});rows.push({feet,phase:o.gaitPhase});}}
   w.paused=true;const a=o.actions,weight=c=>a[c]?a[c].weight:null;
   return{animation:p.animation,state:o.state,walk:weight('walk'),left:weight('strafe_left'),right:weight('strafe_right'),reverse:o.gait?.reverse,phase0,walked:p.walkDistance-walked0,angle:p.angle,rows};};
 });
 const run=(...args)=>page.evaluate(a=>walkCheck(...a),args),near=(a,b,tol,label)=>assert.ok(Math.abs(a-b)<tol,label+': '+a+' ≠ '+b);
 // Avanço total da fase, respeitando a volta do ciclo.
 const travel=r=>{let sum=0,last=r.phase0;for(const row of r.rows){let d=row.phase-last;if(d>.5)d-=1;if(d<-.5)d+=1;sum+=d;last=row.phase;}return sum;};
 const result={};
 const fwd=result.forward=await run(0,1);assert.equal(fwd.state,'walk');near(fwd.walk,1,.01,'frente: walk');near(fwd.left+fwd.right,0,.01,'frente: lados');near(travel(fwd),fwd.walked/1.5,.01,'frente: fase');
 const back=result.back=await run(0,-1);near(back.walk,1,.01,'ré: walk');assert.equal(back.reverse,true);near(travel(back),-back.walked/1.5,.01,'ré: fase');
 const left=result.left=await run(1,0);near(left.left,1,.01,'esquerda');near(left.walk+left.right,0,.01,'esquerda: resto');near(travel(left),left.walked/1.1,.01,'esquerda: fase');
 const right=result.right=await run(-1,0);near(right.right,1,.01,'direita');near(right.walk+right.left,0,.01,'direita: resto');near(travel(right),right.walked/1.1,.01,'direita: fase');
 const diagonal=result.diagonal=await run(1,1);near(diagonal.walk,.5,.03,'diagonal: walk');near(diagonal.left,.5,.03,'diagonal: lado');
 const backDiagonal=result.backDiagonal=await run(1,-1);assert.equal(backDiagonal.reverse,true);near(backDiagonal.right,.5,.03,'ré diagonal usa o lado invertido');
 // Pé de apoio não escorrega: no chão, ele fica parado no mundo enquanto o corpo passa.
 const slip={};for(const [name,r] of [['left',left],['right',right],['forward',fwd]]){const heights=r.rows.flatMap(x=>[x.feet.L[1],x.feet.R[1]]),ground=Math.min(...heights);slip[name]={};for(const side of ['L','R']){let worst=0,start=null;for(const x of r.rows){const q=x.feet[side];if(q[1]<ground+.012){start=start||q;worst=Math.max(worst,Math.hypot(q[0]-start[0],q[2]-start[2]));}else start=null;}slip[name][side]=+worst.toFixed(3);}}
 result.slip=slip;for(const name of ['left','right'])for(const side of ['L','R'])assert.ok(slip[name][side]<.1,'pé escorrega em '+name+'/'+side+': '+slip[name][side]);
 // As outras formas do jogador; um modelo sem os clipes continua só no walk.
 const lich=result.lich=await run(1,0,60,'lich');near(lich.left,1,.01,'Lich: lado');
 const warrior=result.warrior=await run(1,0,90,'warrior');near(warrior.left,1,.01,'Guerreiro: lado');near(travel(warrior),warrior.walked/1.8,.01,'Guerreiro: fase');
 const warriorBack=result.warriorBack=await run(-1,-1,90,'warrior');assert.equal(warriorBack.reverse,true);near(warriorBack.left,.5,.03,'Guerreiro: ré diagonal');
 const heights=warrior.rows.flatMap(x=>[x.feet.L[1],x.feet.R[1]]),ground=Math.min(...heights);for(const side of ['L','R']){let worst=0,start=null;for(const x of warrior.rows){const q=x.feet[side];if(q[1]<ground+.012){start=start||q;worst=Math.max(worst,Math.hypot(q[0]-start[0],q[2]-start[2]));}else start=null;}slip['warrior'+side]=+worst.toFixed(3);assert.ok(worst<.1,'Guerreiro: pé escorrega '+side+': '+worst);}
 const plain=result.plain=await run(1,0,30,'zombie');assert.equal(plain.left,null);assert.equal(plain.walk,1);assert.equal(plain.state,'walk');
 for(const k of Object.keys(result))if(result[k].rows)delete result[k].rows;
 // Evidência no tamanho real do jogo, em chão claro e escuro e qualidade baixa.
 await legacy.select(page,'#quality','low');
 for(const ground of ['dark','light']){await legacy.select(page,'#ground',ground);for(const model of ['necromancer','warrior','lich'])for(const [name,dx,dy] of [['esquerda',1,0],['direita',-1,0],['re',0,-1]]){await run(dx,dy,41,model);await page.screenshot({path:path.join(out,`${ground}-${model}-${name}.png`)});}}
 await page.evaluate(()=>{const n=NecromancerV2;n.world.player.model='necromancer';n.view.render(n.world,0);});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-result.json'),JSON.stringify({...result,errors},null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
