/* Blender-rendered modular village. Retains game coordinates, depth sorting and interactions. */
(function(){
 'use strict';
 const data=window.VillageKitData,images={},failures=[];
 if(!data)return;
 const meta=data.meta;
 const ready=name=>Boolean(images[name]?.complete&&images[name].naturalWidth);
 const load=name=>new Promise(resolve=>{
  const img=new Image();images[name]=img;img.onload=()=>resolve();img.onerror=()=>{failures.push(name);resolve();};img.src='assets/village/'+name+'.webp';
 });
 const api=window.VillageEnvironment={ready,images,failures,data,loaded:false};
 const originalGround=buildVillageArena;
 buildVillageArena=function(){
  if(!ready('ground'))return originalGround();
  const size=Math.ceil(HUB_R*2*S),canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const painter=canvas.getContext('2d');painter.save();painter.beginPath();painter.arc(size/2,size/2,size/2-1,0,Math.PI*2);painter.clip();painter.drawImage(images.ground,0,0,size,size);painter.restore();
  return canvas;
 };
 const originalScene=buildHubScene;
 function decorate(){
  hubProps=hubProps.filter(p=>!p.villageKit&&!['pine','bush'].includes(p.type));
  for(const item of data.placements){
   if(!['flowers','rock','fence','anvil','oak','pine','bush'].includes(item.asset))continue;
   hubProps.push({type:'village-kit',asset:item.asset,x:item.x,y:item.y,sc:item.scale,seed:item.x*.17+item.y*.13,villageKit:true});
  }
 }
 buildHubScene=function(){const value=originalScene.apply(this,arguments);if(VILLAGE())decorate();return value;};
 function drawAsset(name,p,scale=1,fade=1){
  if(!ready(name))return false;
  ctx.save();ctx.globalAlpha*=fade;
  const factor=S/meta.ppu*scale;
  ctx.drawImage(images[name],sx(p.x)-meta.anchorX*factor,sy(p.y)-meta.anchorY*factor,meta.cell*factor,meta.cell*factor);
  ctx.restore();return true;
 }
 function icon(p,height){ctx.save();ctx.textAlign='center';ctx.font='20px serif';ctx.fillStyle='#fff';ctx.fillText(p.icon,sx(p.x),sy(p.y)-height*S+Math.sin(time*2+(p.seed||0))*3);ctx.restore();}
 const originalProp=drawHubProp;
 drawHubProp=function(p){
  if(!VILLAGE()||!api.loaded)return originalProp(p);
  if(p.type==='village-kit'){drawAsset(p.asset,p,p.sc||1,['oak','pine'].includes(p.asset)?behindFade(p,1.8,5.5):1);return;}
  if(p.type==='npc'&&p.kind==='board'){
   if(drawAsset('board',p)){icon(p,3.3);return;}
  }
  if(p.type==='npc'&&p.kind==='merchant'&&ready('stall')){
   const ref=p.mref||(p.mref={x:p.x,y:p.y-.9,face:1,phase:0,amp:0,hit:0,swing:0});
   if(SPR.ready('merch'))drawSprite('merch',ref,{scale:1.1,shadow:.4,face:Math.PI*.25,attacking:VIL.open==='merchant',prog:(time*.65)%1});
   drawAsset('stall',p);icon(p,3.7);return;
  }
  let name=p.type;
  if(name==='house')name=p.x<-8&&p.y<0?'smithy':'house'+((p.v||0)%3);
  if(['house0','house1','house2','smithy','well','lamp','pine','oak','bush','rock','barrel','crate'].includes(name)){
   const fade=name.startsWith('house')||name==='smithy'?behindFade(p,3,6):name==='oak'||name==='pine'?behindFade(p,1.8,5.5):1;
   if(drawAsset(name,p,p.sc||1,fade)){
    if(name==='lamp'){
     ctx.save();ctx.globalCompositeOperation='lighter';glow(sx(p.x)+.26*S,sy(p.y)-1.7*S,1.25*S,`rgba(255,183,66,${.14+.025*Math.sin(time*3+(p.seed||0))})`);ctx.restore();
    }
    return;
   }
  }
  return originalProp(p);
 };
 const originalHubGround=drawHubGround;
 drawHubGround=function(){
  if(!VILLAGE()||!api.loaded)return originalHubGround();
  ctx.fillStyle='#18291b';ctx.fillRect(0,0,W,H);ctx.drawImage(hubArena,sx(-HUB_R),sy(-HUB_R));
 };
 api.promise=Promise.all(['ground',...meta.assets].map(load)).then(()=>{
  api.loaded=ready('ground');
  if(!api.loaded)return;
  VIL.arena=buildVillageArena();
  if(sceneMode==='hub'&&VILLAGE()){hubArena=VIL.arena;decorate();}
 });
})();
