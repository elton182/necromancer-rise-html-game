// Character sheets are 2240×7168 (~64 MB decoded each). Drawn straight from the <img>, the browser keeps
// evicting and re-decoding them (100–200 ms per sheet), which froze busy fights for seconds. Each sheet is
// cut once, off the main thread, into one ImageBitmap per animation row at the resolution the screen uses.
function spriteStripScale(sheet){return Math.min(1,Math.max(.5,S/sheet.meta.ppu*1.12*DPR));}
function spriteStrips(sheet){
 const f=spriteStripScale(sheet);
 // Rebuild only when the screen needs clearly more detail than the cached strips hold.
 if(sheet.strips&&sheet.stripScale>=f*.85)return sheet.strips;
 if(sheet.stripBuild||sheet.stripFailed||typeof createImageBitmap!=='function'||!sheet.ok)return sheet.strips||null;
 const C=sheet.meta.cell,img=sheet.img,width=img.naturalWidth,rows=Math.round(img.naturalHeight/C),cell=Math.round(C*f);
 sheet.stripBuild=createImageBitmap(img).then(full=>Promise.all(Array.from({length:rows},(_,r)=>
  createImageBitmap(full,0,r*C,width,C,{resizeWidth:Math.round(width/C)*cell,resizeHeight:cell,resizeQuality:'high'}))).finally(()=>full.close()))
  .then(strips=>{sheet.strips?.forEach(b=>b.close());sheet.strips=strips;sheet.stripScale=f;sheet.stripCell=cell;})
  .catch(()=>{sheet.stripFailed=true;}).finally(()=>{sheet.stripBuild=null;});
 return sheet.strips||null;
}
function spriteDraw(sheet,col,row,dx,dy,size){
 const C=sheet.meta.cell,strip=spriteStrips(sheet)?.[row];
 // Until the strips exist the original sheet still draws, so a new creature never pops in invisible.
 if(strip){const cell=sheet.stripCell;ctx.drawImage(strip,col*cell,0,cell,cell,dx,dy,size,size);}
 else ctx.drawImage(sheet.img,col*C,row*C,C,C,dx,dy,size,size);
}
(function prewarmSpriteStrips(){
 // Combat sheets are cut one at a time after boot, so a creature's first appearance does not stall either.
 // Village NPC sheets stay lazy: they are only drawn in the hub.
 const queue=Object.values(SPR.sheets).filter(s=>s.meta.anims?.walk);
 (function next(){
  if(!SPR.on)return;
  const sheet=queue.find(s=>!s.strips&&!s.stripFailed);if(!sheet)return;
  if(!sheet.ok){if(sheet.img.complete&&!sheet.img.naturalWidth)sheet.stripFailed=true;setTimeout(next,300);return;}
  spriteStrips(sheet);(sheet.stripBuild||Promise.resolve()).then(()=>setTimeout(next,50));
 })();
})();
