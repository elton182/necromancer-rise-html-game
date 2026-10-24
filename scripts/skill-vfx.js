// Shared by the standalone game and the development comparison arena.
(function(root){
  'use strict';
  const palette={ivory:'#f1e5c4',light:'#fff7df',shade:'#9caa9d',edge:'#697b80',soul:'#8bd4bd'};
  function emit(effects,kind,x,y,dx,dy){
    const max=kind==='boneLaunch'?.14:kind==='dashLand'?.10:.22;
    // A bounded visual queue; never remove another skill's gameplay effects.
    const own=effects.filter(f=>f.kind==='boneLaunch'||f.kind==='boneImpact'||f.kind==='dashLand');
    if(own.length>=48)effects.splice(effects.indexOf(own[0]),1);
    effects.push({kind,x,y,angle:Math.atan2(dy,dx),life:max,max});
  }
  // Expects ctx already at the projectile, rotated to its flight direction.
  function trail(ctx,u,tail,low){
    if(tail<=0)return;
    ctx.globalAlpha=.34;ctx.fillStyle=palette.soul;
    ctx.beginPath();ctx.moveTo(-u*(.25+tail),0);ctx.lineTo(-u*.18,-u*.065);
    ctx.lineTo(u*.12,0);ctx.lineTo(-u*.18,u*.065);ctx.closePath();ctx.fill();
    if(!low){ctx.globalAlpha=.6;ctx.strokeStyle=palette.soul;ctx.lineWidth=Math.max(.7,u*.022);
      ctx.beginPath();ctx.moveTo(-u*(.22+tail*.65),0);ctx.lineTo(-u*.12,0);ctx.stroke();}
  }
  function projectile(ctx,{x,y,angle,scale,travel=1,low=false}){
    const u=scale;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.lineCap='round';
    trail(ctx,u,Math.min(.85,Math.max(0,travel)),low);
    ctx.globalAlpha=1;ctx.fillStyle=palette.ivory;ctx.strokeStyle=palette.edge;ctx.lineWidth=Math.max(.6,u*.019);
    // One readable tapered bone, with two broad knuckles rather than tiny shards.
    ctx.beginPath();ctx.moveTo(u*.42,0);ctx.lineTo(u*.10,-u*.095);
    ctx.lineTo(-u*.19,-u*.065);ctx.quadraticCurveTo(-u*.36,-u*.19,-u*.37,-u*.045);
    ctx.quadraticCurveTo(-u*.34,0,-u*.28,0);ctx.quadraticCurveTo(-u*.40,u*.10,-u*.28,u*.12);
    ctx.lineTo(-u*.12,u*.06);ctx.lineTo(u*.10,u*.065);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle=palette.light;ctx.lineWidth=Math.max(.8,u*.035);
    ctx.beginPath();ctx.moveTo(-u*.20,-u*.025);ctx.lineTo(u*.21,-u*.02);ctx.stroke();
    ctx.restore();
  }
  // Estilhaços: Blender sheet (blender/render_bone_shard.py) with 16 screen directions
  // and a spin around the bone axis; the nearest direction is turned to the exact aim.
  function shard(ctx,{x,y,angle,scale,travel=1,time=0,low=false,sheet=null}){
    if(!sheet)return projectile(ctx,{x,y,angle,scale:scale*.8,travel,low});
    const m=sheet.meta,u=scale,step=Math.PI*2/m.dirs,turn=((angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
    const di=Math.round(turn/step)%m.dirs,f=low?0:Math.floor(time*m.fps)%m.frames,k=u/m.ppu*1.15;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.lineCap='round';
    trail(ctx,u*.8,Math.min(.6,Math.max(0,travel)),low);
    ctx.rotate(-di*step);ctx.globalAlpha=1;
    ctx.drawImage(sheet.img,f*m.cell,di*m.cell,m.cell,m.cell,-m.anchorX*k,-m.anchorY*k,m.cell*k,m.cell*k);
    ctx.restore();
  }
  function accent(ctx,{kind,x,y,angle,scale,progress,low=false}){
    const k=Math.max(0,Math.min(1,progress)),u=scale;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=(1-k)*.9;
    ctx.lineCap='round';ctx.strokeStyle=palette.soul;ctx.lineWidth=Math.max(.8,u*.035);
    if(kind==='boneLaunch'){
      ctx.beginPath();ctx.arc(0,0,u*(.12+k*.18),-.9,.9);ctx.stroke();
      ctx.strokeStyle=palette.ivory;ctx.beginPath();ctx.moveTo(u*.07,0);ctx.lineTo(u*(.22+k*.2),0);ctx.stroke();
    }else{
      const n=low?3:5;
      for(let i=0;i<n;i++){
        const a=(i-(n-1)/2)*.85,d=u*(.10+k*.38);
        ctx.save();ctx.translate(Math.cos(a)*d,Math.sin(a)*d);ctx.rotate(a);
        ctx.fillStyle=i%2?palette.soul:palette.ivory;
        ctx.beginPath();ctx.moveTo(-u*.055,-u*.035);ctx.lineTo(u*.10,0);ctx.lineTo(-u*.055,u*.035);ctx.closePath();ctx.fill();ctx.restore();
      }
    }
    ctx.restore();
  }
  function beginDash(x,y){return {x,y,elapsed:0};}
  function dash(ctx,{x,y,originX,originY,angle,scale,elapsed,low=false}){
    // Draw only while gameplay says the dash is active. The tail never leads it.
    if(elapsed>=.18)return;
    const u=scale,travel=Math.hypot(x-originX,y-originY),tail=Math.min(u*1.25,travel);
    ctx.save();ctx.lineCap='round';
    if(elapsed<.065){
      ctx.save();ctx.translate(originX,originY);ctx.rotate(angle);
      ctx.globalAlpha=.7*(1-elapsed/.065);ctx.strokeStyle=palette.soul;ctx.lineWidth=Math.max(1,u*.035);
      ctx.beginPath();ctx.ellipse(0,0,u*(.14+elapsed*2),u*.4,0,1.05,5.23);ctx.stroke();ctx.restore();
    }
    ctx.translate(x,y);ctx.rotate(angle);
    if(tail>0){
      ctx.globalAlpha=.26;ctx.fillStyle=palette.soul;ctx.beginPath();
      ctx.moveTo(-tail,0);ctx.quadraticCurveTo(-tail*.4,-u*.32,u*.12,-u*.2);
      ctx.lineTo(u*.12,u*.2);ctx.quadraticCurveTo(-tail*.4,u*.32,-tail,0);ctx.fill();
      ctx.globalAlpha=.85;ctx.strokeStyle=palette.soul;ctx.lineWidth=Math.max(.8,u*.035);
      for(const sign of (low?[1]:[-1,1])){
        ctx.beginPath();ctx.moveTo(-tail,sign*u*.12);ctx.quadraticCurveTo(-tail*.3,sign*u*.26,0,sign*u*.25);ctx.stroke();
      }
    }
    // Small forward crescent indicates motion rather than a protective bubble.
    ctx.globalAlpha=.9;ctx.strokeStyle=palette.light;ctx.lineWidth=Math.max(1,u*.035);
    ctx.beginPath();ctx.ellipse(u*.2,0,u*.10,u*.32,0,-1.1,1.1);ctx.stroke();ctx.restore();
  }
  function dashLanding(ctx,{x,y,angle,scale,progress,low=false}){
    const k=Math.max(0,Math.min(1,progress)),u=scale;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=(1-k)*.7;
    ctx.strokeStyle=palette.soul;ctx.lineWidth=Math.max(.8,u*.025);ctx.lineCap='round';
    for(const sign of [-1,1]){
      ctx.beginPath();ctx.moveTo(-u*.12,sign*u*(.12+k*.1));
      ctx.lineTo(u*(.23+k*.12),sign*u*(.20+k*.12));ctx.stroke();
    }
    if(!low){ctx.fillStyle=palette.ivory;ctx.fillRect(u*.15,-u*.025,u*.12*(1-k),u*.05);}
    ctx.restore();
  }
  const api={palette,emit,projectile,shard,accent,beginDash,dash,dashLanding};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.BoneBoltVFX=api;
})(globalThis);
