'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(){
 const c=vm.createContext({console,setTimeout:()=>{}});vm.runInContext(`
 let S=36,DPR=1,draws=[],crops=[];
 const ctx={drawImage:(...a)=>draws.push(a)};
 function bitmap(w,h){return {width:w,height:h,close(){this.closed=true;}};}
 function createImageBitmap(src,...a){if(a.length){crops.push(a);return Promise.resolve(bitmap(a[4].resizeWidth,a[4].resizeHeight));}return Promise.resolve(bitmap(src.naturalWidth,src.naturalHeight));}
 const sheet={ok:true,img:{naturalWidth:2240,naturalHeight:7168,complete:true},meta:{cell:224,ppu:56,anims:{idle:{row:0}}}};
 const SPR={on:true,sheets:{necro:sheet}};
 `,c);vm.runInContext(fs.readFileSync(path.join(__dirname,'sprite-cache.js'),'utf8'),c);
 return s=>{const v=vm.runInContext(s,c);return v&&typeof v==='object'&&typeof v.then!=='function'?JSON.parse(JSON.stringify(v)):v;};
}
test('draws from the full sheet until strips exist, then from the cell inside the row strip',async()=>{
 const run=fixture();
 run('draws=[];spriteDraw(sheet,3,5,10,20,151)');
 assert.deepEqual(run('[draws[0].slice(1,5),draws[0][0]===sheet.img]'),[[672,1120,224,224],true]);
 await run('sheet.stripBuild');
 assert.equal(run('sheet.strips.length'),32);assert.equal(run('sheet.stripCell'),161);
 assert.deepEqual(run('crops[5].slice(0,4)'),[0,1120,2240,224]);assert.equal(run('crops[5][4].resizeWidth'),1610);
 run('draws=[];spriteDraw(sheet,3,5,10,20,151)');
 assert.deepEqual(run('[draws[0].slice(1,9),draws[0][0]===sheet.strips[5]]'),[[483,0,161,161,10,20,151,151],true]);
});
test('rebuilds only when the screen needs clearly more detail',async()=>{
 const run=fixture();run('spriteStrips(sheet)');await run('sheet.stripBuild');
 run('S=40;spriteStrips(sheet)');assert.equal(run('!!sheet.stripBuild'),false);
 run('S=72;spriteStrips(sheet)');assert.equal(run('!!sheet.stripBuild'),true);await run('sheet.stripBuild');
 assert.equal(run('sheet.stripCell'),224);
});
