import test from 'node:test';
import assert from 'node:assert/strict';
import {cryptArena,CRYPT_ID} from '../scripts/crypt-map.mjs';
import {roomArena,D,normalizeCampaign} from '../scripts/campaign-model.mjs';
import {overlaps,findPath,moveCircle} from '../scripts/terrain.mjs';
import {createSession} from '../scripts/session.mjs';
import {startCampaign,launchStage,nextStory,tickAdventure} from '../scripts/campaign.mjs';

const rect=s=>s.kind==='box'?{x0:s.x-s.width/2,x1:s.x+s.width/2,y0:s.y-s.depth/2,y1:s.y+s.depth/2}:{x0:s.x-s.r,x1:s.x+s.r,y0:s.y-s.r,y1:s.y+s.r};
const touch=(a,b)=>!(a.x1<=b.x0||b.x1<=a.x0||a.y1<=b.y0||b.y1<=a.y0);
test('cripta mantém as paredes originais e acrescenta colisores só dentro das salas',()=>{
 const base=roomArena(),a=cryptArena(),b=cryptArena();assert.deepEqual(a,b);assert.equal(a.id,CRYPT_ID);assert.equal(a.theme,'crypt');
 const walls=a.solids.filter(s=>s.look==='wall');assert.equal(walls.length,base.solids.length);
 base.solids.forEach((s,i)=>{for(const k of ['kind','x','y','width','depth'])assert.equal(walls[i][k],s[k]);});
 const extra=a.solids.filter(s=>s.look!=='wall');assert.equal(extra.filter(s=>s.look==='pillar').length,12);assert.equal(extra.filter(s=>s.look==='sarcophagus').length,6);
 for(const s of extra)assert.ok(a.walk.some(r=>r.id&&rect(s).x0>=r.x0&&rect(s).x1<=r.x1&&rect(s).y0>=r.y0&&rect(s).y1<=r.y1),`${s.look}@${s.x},${s.y} fora das salas`);
 for(let i=0;i<extra.length;i++)for(let j=i+1;j<extra.length;j++)assert.ok(!touch(rect(extra[i]),rect(extra[j])));
 assert.ok(a.decor.tiles.length>300&&a.decor.torches.length>15);
});
test('sala A (treino) continua livre e os pontos de nascimento das ondas ficam em chão livre',()=>{
 const a=cryptArena();assert.ok(!a.solids.some(s=>s.look!=='wall'&&rect(s).x1<=10&&rect(s).x0>=-10));
 for(const room of D.rooms.slice(1)){const cx=(room.x0+room.x1)/2;
  for(let i=0;i<12;i++){const p={x:cx+(i%4-1.5)*2.5,y:(Math.floor(i/4)%3-1)*2};assert.ok(!overlaps(p,.45,a),`spawn bloqueado em ${room.id}: ${p.x},${p.y}`);}}
});
test('cada sala é atravessável a pé de uma entrada à outra, contornando pilares',()=>{
 const a=cryptArena();
 for(const room of D.rooms.slice(1)){const from={x:room.x0+.9,y:0},to={x:room.x1-.9,y:0},path=findPath(from,to,.55,a);assert.ok(path.length,`sem rota na sala ${room.id}`);}
 for(const room of D.rooms.slice(1)){const cx=(room.x0+room.x1)/2,corners=[[room.x0+1.2,room.y0+2.4],[room.x1-1.2,room.y0+2.4],[room.x0+1.2,room.y1-1.2],[room.x1-1.2,room.y1-1.2]];
  for(const [x,y]of corners)assert.ok(findPath({x:cx,y:0},{x,y},.55,a).length,`canto inalcançável ${room.id} ${x},${y}`);}
});
test('fase 1 usa a cripta; portas viram grades com colisão e abrem ao limpar a sala',()=>{
 const s=createSession();s.save.campaign=normalizeCampaign({started:true});startCampaign(s);for(let i=0;i<200&&s.world.story;i++)nextStory(s);
 launchStage(s,1);for(let i=0;i<200&&s.world.story;i++)nextStory(s);const w=s.world;
 assert.equal(w.arena.id,CRYPT_ID);assert.ok(w.arena.solids.filter(x=>x.door).every(x=>x.look==='gate'));assert.equal(w.arena.solids.filter(x=>x.door).length,3);
 assert.ok(!overlaps(w.player,w.player.radius,w.arena));assert.ok(w.actors.every(a=>!overlaps(a,a.radius,w.arena)));
 const wall=moveCircle({x:-6,y:0},{x:0,y:9},.45,w.arena);assert.ok(wall.y<6.5);
});
