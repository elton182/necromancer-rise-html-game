import test from 'node:test';
import assert from 'node:assert/strict';
import EQ from '../scripts/shared-equipment.mjs';
import {expeditionArena,PALETTES} from '../scripts/expedition-map.mjs';
import {launchExpedition,tickExpedition,portalAction,BIOME_NAMES} from '../scripts/expedition.mjs';
import {createSession,snapshot,stepSession,useProfile} from '../scripts/session.mjs';
import {normalizeCampaign} from '../scripts/campaign-model.mjs';
import {startCampaign,nextStory,enterVillage,returnAdventure} from '../scripts/campaign.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {overlaps,lineClear} from '../scripts/terrain.mjs';
import Expedition from '../scripts/shared-expedition.mjs';
import {tickSleep} from '../scripts/enemies.mjs';
import {equipGroup,TEST_PROFILE} from '../scripts/horde.mjs';
import {CAPACITY} from '../scripts/gear.mjs';
import {spawnDrop} from '../scripts/drops.mjs';

const village=(group=false)=>{const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1,3:1,4:1}});startCampaign(s);for(let i=0;i<200&&s.world.story;i++)nextStory(s);assert.ok(enterVillage(s));if(group){assert.ok(useProfile(s,TEST_PROFILE).ok);assert.ok(equipGroup(s.world,1,'skeleton',{preparation:true}).ok);}return s;};
const foes=s=>s.world.actors.filter(a=>a.team==='enemy');
const killBoss=s=>{s.world.player.hp=s.world.player.maxHp=1e8;s.world.boss.hp=Math.min(s.world.boss.hp,1);dealDamage(s.world,s.world.boss,1e9,s.world.player);tickExpedition(s);};

test('mapa: determinístico, limites 156×80, 12 grupos, trilha livre e sem sólidos sobre os encontros',()=>{
 for(const wave of [1,2,3,4,5,6,50]){
  const a=expeditionArena(wave),b=expeditionArena(wave),plan=a.plan;assert.deepEqual(a,b);
  assert.deepEqual(a.bounds,{minX:0,maxX:156,minY:0,maxY:80});assert.equal(plan.groups.length,12);assert.ok(PALETTES[plan.biome]&&BIOME_NAMES[plan.biome]);assert.equal(a.palette,PALETTES[plan.biome]);
  assert.ok(a.solids.length>10&&a.solids.every(s=>s.look&&s.height>0&&s.r>0));
  assert.ok(plan.groups.every(g=>g.mobs.every(m=>!overlaps(m,.3,a))),'mob dentro de sólido na wave '+wave);
  const route=[];for(let x=1;x<plan.width-1;x+=1.5)route.push({x,y:Expedition.routeY(plan.route,x)});
  for(let i=1;i<route.length;i++)assert.ok(lineClear(route[i-1],route[i],.45,a),'trilha bloqueada na wave '+wave+' x='+route[i].x);
 }
 assert.notDeepEqual(expeditionArena(1).solids,expeditionArena(2).solids);
});
test('lançar: só depois da vila; 84 encontros dormentes e boss longe; nada vivo nasce alerta',()=>{
 const fresh=createSession();assert.equal(launchExpedition(fresh),false);
 const s=village();assert.ok(launchExpedition(s));const w=s.world,r=w.adventure;
 assert.equal(s.scene,'training');assert.equal(r.kind,'expedition');assert.equal(w.arena.theme,'expedition');assert.equal(foes(s).length,85);
 assert.ok(foes(s).every(e=>e.home&&e.alert===false&&e.expedition));assert.equal(foes(s).filter(e=>e.isBoss).length,1);assert.equal(w.boss.expeditionBoss,true);
 assert.ok(Math.hypot(w.boss.x-w.player.x,w.boss.y-w.player.y)>100);assert.ok(w.portal&&!w.exitPortal);assert.equal(w.gearLevel,1);
 const tiers=new Set(foes(s).map(e=>e.lootTier));assert.ok(tiers.has('rare')&&tiers.has('magic')&&tiers.has('common'));
 assert.equal(w.actors.filter(a=>a.team==='enemy'&&a.hp<=0).length,0);
});
test('sono: acorda por proximidade, aliado, dano e perde o alerta a mais de 30 u',()=>{
 const s=village();launchExpedition(s);const w=s.world,e=foes(s).find(x=>!x.isBoss);const far=()=>{Object.assign(w.player,{x:e.home.x+60,y:e.home.y});};
 far();assert.equal(tickSleep(w,e,.1),false);assert.equal(e.alert,false);
 w.player.x=e.home.x+10.9;w.player.y=e.home.y;assert.equal(tickSleep(w,e,.1),true);
 far();assert.equal(tickSleep(w,e,.1),false,'perdeu o alerta fora de 30 u');assert.equal(e.alert,false);
 const hit=foes(s).find(x=>!x.isBoss&&x!==e);Object.assign(w.player,{x:hit.home.x+20,y:hit.home.y});hit.hp-=1;tickSleep(w,hit,.1);assert.equal(hit.alert,true);
 const ally=w.actors.find(a=>a.team==='ally');if(ally){const sleeper=foes(s).find(x=>!x.isBoss&&!x.alert&&x!==e&&x!==hit);Object.assign(ally,{x:sleeper.x+6,y:sleeper.y});far();tickSleep(w,sleeper,.1);assert.equal(sleeper.alert,true,'aliado a 7 u acorda');}
 // Dormentes não agem: nenhum dano ao jogador distante após tempo corrido.
 // Em uma sessão nova, longe de todos: o tempo passa e ninguém age.
 const q=village();launchExpedition(q);const qw=q.world;let spot=null;for(let x=4;x<152&&!spot;x+=6)for(let y=4;y<76&&!spot;y+=6)if(!overlaps({x,y},.45,qw.arena)&&foes(q).every(f=>Math.hypot(f.x-x,f.y-y)>14))spot={x,y};assert.ok(spot);Object.assign(qw.player,spot);const hp=qw.player.hp,before=foes(q).map(f=>[f.x,f.y].join());
 for(let i=0;i<120;i++)stepSession(q,.1,{});assert.ok(qw.player.hp>=hp,'dormentes não ferem');assert.ok(foes(q).every(f=>!f.alert));assert.deepEqual(foes(q).map(f=>[f.x,f.y].join()),before);
});
test('dormente voltando ao ponto de origem após perder o alerta',()=>{
 const s=village();launchExpedition(s);const w=s.world,e=foes(s).find(x=>!x.isBoss);e.alert=true;e.x=e.home.x+4;e.y=e.home.y;
 w.player.x=e.home.x+60;w.player.y=e.home.y;tickSleep(w,e,.1);assert.equal(e.alert,false);
 for(let i=0;i<300;i++)tickSleep(w,e,.1);assert.ok(Math.hypot(e.x-e.home.x,e.y-e.home.y)<.5);
});
test('boss derrotado: a wave conta uma vez; portal final avança com a horda como estava',()=>{
 const s=village(true);s.save.character.gold=0;launchExpedition(s);const w=s.world,r=w.adventure;
 const ally=w.actors.find(a=>a.team==='ally');assert.ok(ally);dealDamage(w,ally,ally.maxHp/2,null);assert.ok(ally.hp<ally.maxHp);
 killBoss(s);assert.equal(r.cleared,true);assert.equal(s.save.character.waveProgress.best,1);assert.equal(s.save.character.waveProgress.selected,2);assert.ok(w.exitPortal);
 const gold=s.save.character.gold;tickExpedition(s);tickExpedition(s);assert.equal(s.save.character.gold,gold,'sem pagamento duplicado');
 // Longe dos portais: nada acontece.
 Object.assign(w.player,{x:70,y:40});assert.equal(portalAction(s).advanced,undefined);assert.equal(r.wave,1);
 Object.assign(w.player,{x:r.exit.x,y:r.exit.y});const old=w.arena.id,bossId=w.boss.id,ratio=ally.hp/ally.maxHp;const res=portalAction(s);assert.equal(res.advanced,true);
 assert.equal(r.wave,2);assert.notEqual(w.arena.id,old);assert.equal(r.cleared,false);assert.equal(w.exitPortal,null);assert.equal(w.gearLevel,2);assert.notEqual(w.boss.id,bossId);assert.equal(foes(s).length,85);
 assert.ok(foes(s).every(e=>e.gearWave===2));assert.equal(ally.hp/ally.maxHp,ratio,'a transição não cura a horda');assert.ok(ratio<1);assert.ok(Math.hypot(w.player.x-w.portal.x,w.player.y-w.portal.y)<5);
 assert.equal(w.hostileShots.length+w.hostileZones.length,0);
});
test('mochila cheia bloqueia o avanço; peças abaixo do filtro não bloqueiam',()=>{
 const s=village();launchExpedition(s);const w=s.world,r=w.adventure;killBoss(s);Object.assign(w.player,{x:r.exit.x,y:r.exit.y});
 const full=()=>{s.save.character.gearBag.length=0;for(let i=0;i<CAPACITY;i++)s.save.character.gearBag.push({id:'x'+i,type:'staff',rarity:'common',level:1});};
 const drop=rarity=>spawnDrop(w,'equipment',w.player.x,w.player.y,{item:{id:'d-'+rarity,type:'staff',rarity,level:1}});
 full();w.lootFilter='common';drop('common');const blocked=portalAction(s);assert.equal(blocked.advanced,undefined);assert.equal(r.wave,1);assert.match(w.notice,/Mochila cheia/);
 w.drops=[];w.lootFilter='rare';drop('common');assert.equal(portalAction(s).advanced,true);assert.equal(r.wave,2);
});
test('sair pelo portal inicial ou morrer encerra a corrida e limpa o campo; recorde permanece',()=>{
 const s=village();launchExpedition(s);const w=s.world,r=w.adventure;killBoss(s);Object.assign(w.player,{x:r.exit.x,y:r.exit.y});assert.equal(portalAction(s).advanced,true);
 Object.assign(w.player,{x:w.portal.x+1,y:w.portal.y});assert.equal(portalAction(s).leave,true);returnAdventure(s);
 assert.equal(s.scene,'village');assert.equal(w.adventure,null);assert.equal(w.exitPortal,null);assert.equal(foes(s).length,0);assert.match(w.notice,/Expedição/);assert.equal(s.save.character.waveProgress.best,1);
 launchExpedition(s);s.world.player.hp=0;stepSession(s,.1,{});assert.equal(s.scene,'dead');returnAdventure(s);assert.equal(s.scene,'village');assert.equal(s.save.character.waveProgress.best,1);
 const saved=snapshot(s);assert.equal(saved.world,undefined);assert.equal(JSON.stringify(saved).includes('exitPortal'),false);
});
test('na wave 1000 o portal final devolve à vila em vez de avançar',()=>{
 const s=village();s.save.character.waveProgress=EQ.progress({best:999,selected:1000});launchExpedition(s);const w=s.world,r=w.adventure;assert.equal(r.wave,1000);killBoss(s);
 Object.assign(w.player,{x:r.exit.x,y:r.exit.y});assert.equal(portalAction(s).leave,true);assert.equal(s.save.character.waveProgress.best,1000);
});
test('boss de expedição garante peça rara ou épica e o dormente não aparece como encontro ativo',()=>{
 const s=village();s.save.settings.lootFilter='common';launchExpedition(s);const w=s.world;
 let rare=0;for(let i=0;i<40;i++){const t=village();launchExpedition(t);t.world.player.hp=t.world.player.maxHp=1e8;t.world.boss.hp=1;dealDamage(t.world,t.world.boss,1e9,t.world.player);const d=t.world.drops.find(x=>x.kind==='equipment');assert.ok(d,'boss deve largar equipamento');assert.ok(['rare','epic'].includes(d.item.rarity));rare++;}
 assert.equal(rare,40);assert.equal(!!(w.boss.home&&!w.boss.alert),true);
});
test('Expedição apresenta os novos inimigos conforme a onda',()=>{
 const types=wave=>{const s=village();s.save.character.waveProgress=EQ.progress({best:wave-1,selected:wave});launchExpedition(s);return new Set(foes(s).map(a=>a.typeIndex));};
 for(const index of [6,7,8])assert.ok(!types(1).has(index));
 assert.ok(types(2).has(6));assert.ok(!types(2).has(7));assert.ok(types(6).has(8));
});
