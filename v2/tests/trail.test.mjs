import test from 'node:test';
import assert from 'node:assert/strict';
import {trailArena,TRAIL_ID,TRAIL_START} from '../scripts/trail-map.mjs';
import {D,normalizeCampaign} from '../scripts/campaign-model.mjs';
import {overlaps,findPath,moveCircle} from '../scripts/terrain.mjs';
import {createSession} from '../scripts/session.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {startCampaign,launchStage,nextStory,tickAdventure} from '../scripts/campaign.mjs';

const skip=s=>{for(let i=0;i<200&&s.world.story;i++)nextStory(s);};
const start=()=>{const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1}});startCampaign(s);skip(s);launchStage(s,3);skip(s);return s;};
const clear=s=>{for(const e of [...s.world.actors])if(e.team==='enemy'&&e.hp>0)dealDamage(s.world,e,1e9,s.world.player);};
test('mapa da trilha mantém limites originais e obstáculos fora da faixa central',()=>{
 const a=trailArena(),b=trailArena();assert.deepEqual(a,b);assert.equal(a.id,TRAIL_ID);assert.equal(a.theme,'trail');
 assert.deepEqual(a.bounds,{minX:0,maxX:150,minY:-3.4,maxY:3});
 assert.ok(a.solids.length>=15&&a.solids.every(s=>s.look&&Math.abs(s.y)>=2.3&&s.x>0&&s.x<150));
 assert.ok(a.decor.trees.length>200&&a.decor.towers.length===5&&a.decor.tents.length>=4);
 assert.ok(a.decor.trees.filter(t=>t.y>3.4&&t.y<9).every(t=>t.height<=3.3),'árvores altas ao sul escondem a trilha');
});
test('pontos de nascimento das emboscadas, partida e pista ficam livres e a trilha é atravessável',()=>{
 const a=trailArena();assert.ok(!overlaps(TRAIL_START,.55,a));
 for(const z of D.strip)for(let i=0;i<12;i++){const p={x:z.x+6+(i%4-1.5)*2.5,y:(Math.floor(i/4)%3-1)*2};assert.ok(!overlaps(p,.45,a),`nascimento bloqueado em ${p.x},${p.y}`);}
 let from=TRAIL_START;for(let x=20;x<=148;x+=14){const to={x,y:0},path=findPath(from,to,.55,a);assert.ok(path.length,`sem rota até x=${x}`);from=to;}
});
test('fase 3 usa a trilha; barricadas surgem na emboscada e as rochas permanecem depois',()=>{
 const s=start(),w=s.world;assert.equal(w.arena.id,TRAIL_ID);const base=w.arena.solids.length;assert.ok(base>=15);
 assert.ok(!overlaps(w.player,w.player.radius,w.arena));
 const z=w.adventure.zones[0];w.player.x=z.x;tickAdventure(s,.25);
 const locks=w.arena.solids.filter(x=>x.lock);assert.equal(locks.length,2);assert.ok(locks.every(x=>x.look==='barricade'));assert.equal(w.arena.solids.length,base+2);
 const wall=moveCircle({x:z.x+10,y:0},{x:6,y:0},.45,w.arena);assert.ok(wall.x<z.x+12-.5-.45+1e-3,'barricada leste não bloqueou');
 for(let i=0;i<40&&!z.done;i++){clear(s);tickAdventure(s,4);}
 assert.ok(z.done);assert.equal(w.arena.solids.length,base,'barricadas deveriam sair e obstáculos ficar');assert.ok(w.arena.solids.every(x=>!x.lock));
});
test('fase 3 completa: todas as emboscadas e o fim da trilha concluem a fase',()=>{
 const s=start(),w=s.world;for(const z of w.adventure.zones){w.player.x=z.x;for(let k=0;k<100&&!z.done;k++){clear(s);tickAdventure(s,4);}}
 w.player.x=146;tickAdventure(s,1);assert.equal(w.adventure.done,true);
});
