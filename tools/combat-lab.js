'use strict';
const $=id=>document.getElementById(id),atlases={},samples=[];
const canvases=[$('before'),$('after')];
let ready=false,clock=0,last=performance.now();
const settings=()=>({skill:$('skill').value,enemy:$('enemy').value,crowd:Number($('crowd').value),light:$('background').value==='light',u:Number($('zoom').value),low:$('quality').value==='baixa'});
async function loadSprites(){
  if(location.protocol==='file:')throw Error('Inicie com node tools/combat-lab-server.js e abra http://127.0.0.1:4173/tools/combat-lab.html');
  const response=await fetch('../necromancer-canvas.html');if(!response.ok)throw Error('Não foi possível carregar o HTML do jogo.');
  const html=await response.text(),wanted=new Set(['necro','zombie','archer','specter','soldier','earcher','brute','mage','cryptHound']);
  const jobs=[];
  for(const match of html.matchAll(/SPR\.load\('([^']+)',(\{[^\n]+?\}),\s*'([^']+)'\);/g)){
    const [,key,raw,b64]=match;if(!wanted.has(key))continue;
    const img=new Image(),meta=JSON.parse(raw);
    jobs.push(new Promise((resolve,reject)=>{img.onload=()=>{atlases[key]={img,meta};resolve();};img.onerror=()=>reject(Error('Sprite inválido: '+key));img.src='data:image/webp;base64,'+b64;}));
  }
  await Promise.all(jobs);
  for(const key of wanted)if(!atlases[key])throw Error('Sprite não encontrado: '+key);
  ready=true;$('fire').disabled=false;$('status').textContent='Sprites reais carregados. Mesma cena e mesmo tempo nas duas versões.';
}
function sprite(ctx,key,x,y,u,t,anim='idle',dir=2){
  const {img,meta}=atlases[key],a=meta.anims[anim]||meta.anims.idle,c=meta.cell,k=u/meta.ppu;
  const frame=a.loop?Math.floor(t*a.fps)%a.n:Math.min(a.n-1,Math.floor(t*a.fps));
  ctx.fillStyle='rgba(25,40,43,.16)';ctx.beginPath();ctx.ellipse(x,y,u*.37,u*.12,0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(img,frame*c,(a.row+dir)*c,c,c,x-meta.anchorX*k,y-meta.anchorY*k,c*k,c*k);
}
function glow(ctx,x,y,r,alpha){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(0,255,204,${alpha})`);g.addColorStop(1,'rgba(0,255,204,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
}
function legacy(ctx,x,y,u,travel){
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<12;i++)glow(ctx,x-Math.min(travel*u,(11-i)*14*u/60),y,4+i*.9,(i/12)*.6);
  glow(ctx,x,y,26,.9);ctx.globalCompositeOperation='source-over';ctx.fillStyle='#eafff9';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawScene(ctx,version,t,config){
  const {u,light,crowd,enemy,low}=config,w=ctx.canvas.width,h=ctx.canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle=light?'#bfc5ba':'#26343b';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=light?'#aeb8ae':'#30434a';ctx.lineWidth=1;
  for(let x=w/2%u;x<w;x+=u){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=h/2%u;y<h;y+=u){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  const y=h*.61,start=w/2-u*3.4,target=w/2+u*3.4,distance=6.8,flight=(distance-1.095)/14;
  if(crowd){
    for(let i=0;i<crowd;i++){
      const x=w/2+Math.sin(i*2.399)*u*(2.5+i%4),py=y+Math.cos(i*2.399)*u*(1+i%3)*.58;
      const family=config.hounds===false?['soldier','earcher','brute','mage']:['soldier','earcher','brute','mage','cryptHound'];
      sprite(ctx,family[i%family.length],x,py,u*.85,t+i*.17,'walk',i%8);
    }
    for(let i=0;i<6;i++)sprite(ctx,['zombie','archer','specter'][i%3],start+u*(i%3-.6),y+u*(i<3?1.4:-1.3),u,t+i,'walk',0);
  }
  if(config.skill==='hound'){drawHoundScene(ctx,version,t,config,start,y);return;}
  sprite(ctx,'necro',start,y,u,t,t<.35?'cast':'idle',0);
  sprite(ctx,enemy,target,y,u,t,'idle',4);
  const py=y-u*.6;
  if(version==='new'&&t<.14)BoneBoltVFX.accent(ctx,{kind:'boneLaunch',x:start,y:py,angle:0,scale:u,progress:t/.14,low});
  if(t<flight){
    const travel=t*14,x=start+travel*u;
    if(version==='old')legacy(ctx,x,py,u,travel);
    else BoneBoltVFX.projectile(ctx,{x,y:py,angle:0,scale:u,travel,low});
  }else if(t<flight+.22){
    const k=(t-flight)/.22;
    if(version==='new')BoneBoltVFX.accent(ctx,{kind:'boneImpact',x:target,y:py,angle:0,scale:u,progress:k,low});
    else {ctx.save();ctx.globalAlpha=1-k;ctx.strokeStyle='#00ffcc';ctx.lineWidth=3;ctx.beginPath();ctx.arc(target,py,u*(.15+k*.8),0,Math.PI*2);ctx.stroke();glow(ctx,target,py,32,.7);ctx.restore();}
  }
  ctx.fillStyle=light?'#34494b':'#d3dfdb';ctx.font='12px system-ui';ctx.fillText(t<flight?'TRAJETÓRIA':t<flight+.22?'IMPACTO':'DISSIPAÇÃO',18,h-18);
}
function drawHoundScene(ctx,version,t,config,start,y){
  const {u,light}=config,dog={x:0,y:0,dmg:7,abilityCd:0},target={x:6,y:0};
  let damage=0;
  const env={target:()=>target,sweep:(ax,ay,bx,by)=>CryptHoundModel.sweep(ax,ay,bx,by,[],[],[target]),bound:(x,y)=>({x,y}),damage:()=>damage++};
  for(let elapsed=0;elapsed<t;){const step=Math.min(1/120,t-elapsed);if(version==='new'&&elapsed>.5)target.y=Math.min(2,(elapsed-.5)*7);CryptHoundModel.update(dog,step,env);elapsed+=step;}
  const a=dog.ability;
  if(a&&a.phase!=='recover'){
    ctx.fillStyle='rgba(228,173,100,.16)';ctx.strokeStyle='#e4ad64';ctx.lineWidth=2;
    ctx.fillRect(start,y-u*.5*.6,a.distance*u,u*.6);ctx.strokeRect(start,y-u*.5*.6,a.distance*u,u*.6);
    ctx.fillStyle='#e4ad64';ctx.font='20px system-ui';ctx.fillText('›',start+a.distance*u-14,y+5);
  }
  sprite(ctx,'necro',start+target.x*u,y+target.y*u*.6,u,t,'idle',4);
  const anim=a?(a.phase==='windup'?'windup':a.phase==='charge'?'charge':'recover'):'idle';
  sprite(ctx,'cryptHound',start+dog.x*u,y+dog.y*u*.6,u*.85,a?.time||t,anim,0);
  ctx.fillStyle=light?'#34494b':'#d3dfdb';ctx.font='12px system-ui';ctx.fillText((a?.phase==='windup'?'PREPARAÇÃO':a?.phase==='charge'?'INVESTIDA':a?'RECUPERAÇÃO':'PRONTO')+(damage?' · ACERTO':''),18,ctx.canvas.height-18);
}
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(ready){
    const begin=performance.now(),config=settings();
    const duration=config.skill==='hound'?2.7:1.2;
    if($('repeat').checked){clock=(clock+dt)%duration;$('scrub').value=clock/duration;}
    const t=Number($('scrub').value)*duration;
    drawScene(canvases[0].getContext('2d'),'old',t,config);drawScene(canvases[1].getContext('2d'),'new',t,config);
    for(const cv of document.querySelectorAll('[data-size]')){
      const ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);
      if(config.skill==='hound'||config.enemy==='cryptHound')sprite(ctx,'cryptHound',cv.width/2,cv.height*.8,Number(cv.dataset.size)*.6,t,'walk',1);
      else BoneBoltVFX.projectile(ctx,{x:cv.width*.60,y:cv.height/2,angle:0,scale:Number(cv.dataset.size)*.7,travel:.6,low:config.low});
    }
    samples.push(performance.now()-begin);if(samples.length>120)samples.shift();
    if(samples.length%20===0){const sorted=[...samples].sort((a,b)=>a-b);$('metrics').textContent=`Desenho P95: ${sorted[Math.floor((sorted.length-1)*.95)].toFixed(2)} ms · ${config.crowd+2+(config.crowd?6:0)} personagens / painel · ${samples.length} amostras`;}
  }
  requestAnimationFrame(frame);
}
$('fire').onclick=()=>{$('repeat').checked=true;clock=0;};
$('scrub').oninput=()=>{$('repeat').checked=false;clock=Number($('scrub').value)*1.2;};
for(const el of document.querySelectorAll('select'))el.onchange=()=>{
 samples.length=0;clock=0;
 const hound=$('skill').value==='hound',titles=document.querySelectorAll('.panel-title');
 titles[0].innerHTML=hound?'<b>Alvo parado</b><span>Investida com direção fixa</span>':'<b>Antes</b><span>Esfera, brilho e rastro verde</span>';
 titles[1].innerHTML=hound?'<b>Esquiva lateral</b><span>Saia do corredor e puna a recuperação</span>':'<b>Redesenho</b><span>Osso, rastro curto e impacto localizado</span>';
};
window.CombatLab={settings,drawScene,get ready(){return ready;},get samples(){return [...samples];}};
loadSprites().catch(e=>{$('error').textContent=e.message;$('status').textContent='Prévia indisponível.';});
requestAnimationFrame(frame);
