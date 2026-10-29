import test from 'node:test';
import assert from 'node:assert/strict';
import EQ from '../scripts/shared-equipment.mjs';
import Endgame from '../scripts/shared-endgame.mjs';
import {launchConquest,tickExpedition,portalAction} from '../scripts/expedition.mjs';
import {expeditionArena} from '../scripts/expedition-map.mjs';
import {createSession,snapshot,stepSession,useProfile,applySave} from '../scripts/session.mjs';
import {normalizeCampaign} from '../scripts/campaign-model.mjs';
import {startCampaign,nextStory,enterVillage,returnAdventure} from '../scripts/campaign.mjs';
import {dealDamage,addRot,tickRot,hasRot,ROT} from '../scripts/combat.mjs';
import {freshSave,normalizeSave,importSave} from '../scripts/save-model.mjs';
import {step} from '../scripts/training-model.mjs';
import {equipGroup,TEST_PROFILE} from '../scripts/horde.mjs';
import R from '../scripts/enemy-rules.mjs';

const village=(group=false)=>{const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1,3:1,4:1}});startCampaign(s);for(let i=0;i<200&&s.world.story;i++)nextStory(s);assert.ok(enterVillage(s));if(group){assert.ok(useProfile(s,TEST_PROFILE).ok);assert.ok(equipGroup(s.world,1,'skeleton',{preparation:true}).ok);}return s;};
const foes=s=>s.world.actors.filter(a=>a.team==='enemy');
const select=(s,ids)=>{const c=s.save.character,d=c.conquest.difficulty,offer=Endgame.offer(c.conquest.seed,c.conquest.offers[d].cycle,d);c.conquest=Endgame.normalize({...c.conquest,offers:{...c.conquest.offers,[d]:{cycle:c.conquest.offers[d].cycle,selected:ids.map(i=>offer[i])}}});return ids.map(i=>offer[i]);};
const killBoss=s=>{s.world.player.hp=s.world.player.maxHp=1e8;s.world.boss.hp=1;dealDamage(s.world,s.world.boss,1e9,s.world.player);tickExpedition(s);};

test('save: semente por personagem, padrão determinístico, validação e importação do arquivo antigo',()=>{
 const a=freshSave(),b=freshSave();assert.ok(a.character.conquest.seed>0);assert.notEqual(a.character.conquest.seed,b.character.conquest.seed);
 assert.equal(normalizeSave({format:'necromancer-rise-3d',version:1}).character.conquest.seed,170117);
 assert.throws(()=>normalizeSave({...a,character:{conquest:[]}}),/Valdoria/);
 const old=importSave(JSON.stringify({level:9,maxHp:200,learnedSkills:[],conquest:{seed:77,influence:35,highest:2,fragment:true,lieutenants:{apothecary:true}}}));
 assert.equal(old.character.conquest.seed,77);assert.equal(old.character.conquest.influence,35);assert.equal(old.character.conquest.highest,2);assert.equal(old.character.conquest.lieutenants.apothecary,true);
 const s=village();s.save.character.conquest=Endgame.normalize({...s.save.character.conquest,influence:45});const again=createSession(snapshot(s));assert.equal(again.save.character.conquest.influence,45);
});
test('acesso: só pela vila; fortaleza bloqueada devolve mensagem e não consome tentativa',()=>{
 const fresh=createSession();assert.equal(launchConquest(fresh,'expedition').ok,false);
 const s=village(),before=s.save.character.conquest.attempts,r=launchConquest(s,'fortress');assert.equal(r.ok,false);assert.match(r.message,/Falta/);assert.equal(s.save.character.conquest.attempts,before);assert.equal(s.scene,'village');
 assert.equal(launchConquest(s,'apothecary').ok,false);
});
test('rota: bioma da rota, no máximo 8 grupos, escala regional, infectados e poças da expedição',()=>{
 const s=village();const r=launchConquest(s,'expedition');assert.ok(r.ok);const w=s.world,run=r.run;
 assert.equal(s.scene,'training');assert.equal(w.arena.biome,run.biome);assert.equal(w.arena.plan.groups.length,8);assert.equal(s.save.character.conquest.attempts,1);
 const scale=Endgame.combatScale(1);assert.equal(w.boss.maxHp,Math.round(R.boss.hp*scale.hp*Endgame.encounters.expedition.hp));assert.equal(w.boss.gearWave,run.reward.itemLevel);assert.equal(w.gearLevel,run.reward.itemLevel);
 const mobs=foes(s).filter(e=>!e.isBoss);assert.equal(mobs.length,w.arena.plan.groups.reduce((n,g)=>n+g.mobs.length,0));assert.equal(mobs.filter(e=>e.infected).length,Math.ceil(mobs.length/5));
 assert.ok(mobs.every(e=>e.home&&!e.alert&&e.gearWave===run.reward.itemLevel));assert.equal(w.hostileZones.length,4);assert.ok(w.hostileZones.every(z=>z.delay>0&&z.life>1e6));
 for(const biome of ['swamp','river','mountain'])assert.ok(expeditionArena(1,{biome,groups:4}).solids.length>5);assert.ok(expeditionArena(1,{biome:'river'}).decor.water.length>10);
});
test('maldições: multiplicam atributos, dano e horda só na tentativa e somem ao voltar',()=>{
 const base=village(true);launchConquest(base,'expedition');const b=base.world,baseHp=b.player.maxHp,baseMp=b.player.mpRegen,baseMove=b.player.moveSpeed,baseAlly=b.actors.find(a=>a.team==='ally').maxHp;
 let found=null;for(let pick=0;pick<4&&!found;pick++)for(let other=pick+1;other<4&&!found;other++){const t=village(true);const ids=select(t,[pick,other]),m=Endgame.modifiers(ids);if(!found&&(m.hp<1||m.move<1||m.hordeHp<1||m.mpRegen<1||m.damage<1))found={t,ids,m};}
 const {t,ids,m}=found;assert.ok(launchConquest(t,'expedition').ok);const w=t.world;assert.equal(t.save.character.conquest.offers[1].selected.length,2);
 assert.equal(w.player.maxHp,Math.max(1,Math.round(baseHp*m.hp)));assert.ok(Math.abs(w.player.mpRegen-baseMp*m.mpRegen)<1e-9);assert.ok(Math.abs(w.player.moveSpeed-baseMove*m.move)<1e-9);
 assert.equal(w.actors.find(a=>a.team==='ally').maxHp,Math.max(1,Math.round(baseAlly*m.hordeHp)));
 const e=foes(t).find(x=>!x.isBoss);e.hp=e.maxHp=1e6;dealDamage(w,e,1000,w.player);assert.equal(1e6-e.hp,Math.floor(1000*m.damage));
 w.player.hp=w.player.maxHp;returnAdventure(t);assert.equal(t.scene,'village');assert.equal(t.world.curses,null);assert.equal(t.world.player.maxHp,baseHp);assert.equal(t.world.actors.find(a=>a.team==='ally').maxHp,baseAlly);assert.ok(ids.length===2);
});
test('conclusão: influência, rota e recompensa uma vez; recorde da Arena intacto; portal final volta ao mapa',()=>{
 const s=village();s.save.character.waveProgress=EQ.progress({best:6,selected:7});select(s,[0,1]);const gold0=s.save.character.gold,r=launchConquest(s,'expedition');assert.ok(r.ok);const w=s.world,run=r.run;
 killBoss(s);const c=s.save.character,rew=run.reward;
 assert.equal(w.adventure.cleared,true);assert.equal(c.conquest.influence,Math.min(100,20+rew.score*2));assert.ok(c.conquest.routes.completed.includes(run.routeId));assert.equal(c.gold,gold0+rew.gold);assert.equal(c.conquest.offers[1].cycle,1);assert.deepEqual(c.conquest.offers[1].selected,[]);
 assert.deepEqual(c.waveProgress,{best:6,unlocked:7,selected:7});assert.ok(w.exitPortal);assert.equal(w.hostileZones.length,0);
 tickExpedition(s);tickExpedition(s);assert.equal(c.gold,gold0+rew.gold,'sem pagamento duplicado');assert.equal(c.conquest.influence,Math.min(100,20+rew.score*2));
 Object.assign(w.player,{x:70,y:40});assert.equal(portalAction(s).leave,undefined);
 Object.assign(w.player,{x:w.adventure.exit.x,y:w.adventure.exit.y});const act=portalAction(s);assert.equal(act.leave,true);assert.equal(act.openMap,true);returnAdventure(s);assert.equal(s.scene,'village');assert.match(s.world.notice,/Vitória em Valdoria|concluído/);
 // A rota concluída abre a etapa seguinte; a mesma tentativa não pode ser repetida como nova (outra tentativa é uma nova corrida).
 assert.ok(launchConquest(s,'expedition').ok);
});
test('fortaleza: exige influência, tenentes e rota; vencer concede o fragmento uma vez e libera a dificuldade seguinte',()=>{
 const s=village();s.save.character.conquest=Endgame.normalize({seed:s.save.character.conquest.seed,influence:100,lieutenants:{apothecary:true,drowned:true}});
 const r=launchConquest(s,'fortress');assert.ok(r.ok,r.message);const w=s.world;assert.equal(w.arena.plan.groups.length,6);
 killBoss(s);const c=s.save.character.conquest;assert.equal(c.conquered,true);assert.equal(c.fragment,true);assert.equal(c.highest,1);assert.equal(c.unlocked,2);assert.equal(w.adventure.outcome.fragmentNow,true);
 returnAdventure(s);assert.ok(launchConquest(s,'fortress').ok);killBoss(s);assert.equal(s.world.adventure.outcome.fragmentNow,false);assert.equal(s.save.character.conquest.influence,100);
});
test('poças: avisam sem dano e depois ferem a cada segundo; infectado deixa poça ao morrer',()=>{
 const s=village();launchConquest(s,'expedition');const w=s.world;w.hostileZones=[];w.player.hp=w.player.maxHp=1e6;Object.assign(w.player,{x:5,y:40});
 w.hostileZones.push({id:9001,source:null,gearWave:1,x:5,y:40,radius:2,delay:.5,life:10,tick:0,damage:40});
 for(let i=0;i<20;i++)step(w,.02,{});assert.equal(w.player.hp,1e6,'durante o aviso não há dano');
 for(let i=0;i<20;i++)step(w,.02,{});assert.ok(w.player.hp<1e6);const hit=1e6-w.player.hp;for(let i=0;i<30;i++)step(w,.05,{});assert.ok(1e6-w.player.hp>hit,'continua ferindo');
 const e=foes(s).find(x=>x.infected);w.hostileZones=[];e.hp=1;dealDamage(w,e,10,w.player);const pool=w.hostileZones.at(-1);assert.ok(pool&&pool.delay===1.5&&pool.radius===2.3&&pool.life===3);
 const plain=foes(s).find(x=>!x.infected&&!x.isBoss);const n=w.hostileZones.length;plain.hp=1;dealDamage(w,plain,10,w.player);assert.equal(w.hostileZones.length,n);
});
test('loot regional: nível e raridade do chefe; cajado Osso Carcomido preservado no save',()=>{
 const s=village();const r=launchConquest(s,'expedition');const w=s.world;r.run.reward.specialChance=1;
 w.player.hp=w.player.maxHp=1e8;w.boss.hp=1;dealDamage(w,w.boss,1e9,w.player);const d=w.drops.find(x=>x.kind==='equipment');assert.ok(d);
 assert.equal(d.item.level,r.run.reward.itemLevel);assert.equal(d.item.type,'staff');assert.equal(d.item.special,'carcomido');assert.ok(['rare','epic'].includes(d.item.rarity));assert.equal(d.item.region,'valdoria');
 s.save.character.gearBag.push(d.item);const saved=normalizeSave(snapshot(s));assert.equal(saved.character.gearBag.find(i=>i.id===d.item.id).special,'carcomido');
});
test('Osso Carcomido: Podridão com 5 cargas, 12% do dano por carga a cada segundo, renova e expira',()=>{
 const s=village();const w=s.world;assert.equal(hasRot(w),false);w.equipment={staff:{type:'staff',special:'carcomido'}};assert.equal(hasRot(w),true);
 const e={id:777,team:'enemy',x:3,y:3,radius:.3,hp:1e6,maxHp:1e6,model:'warrior'};w.actors.push(e);
 for(let i=0;i<8;i++)addRot(e,100);assert.equal(e.rot.stacks,ROT.stacks);assert.equal(e.rot.power,12);
 tickRot(w,1);assert.equal(1e6-e.hp,60);tickRot(w,1);assert.equal(1e6-e.hp,120);addRot(e,50);assert.equal(e.rot.power,12,'usa o maior projétil');assert.equal(e.rot.ttl,ROT.ttl);
 for(let i=0;i<10;i++)tickRot(w,1);assert.equal(e.rot,undefined);const hp=e.hp;tickRot(w,5);assert.equal(e.hp,hp);
});
test('save/recarga: nada da tentativa é gravado e o progresso regional persiste',()=>{
 const s=village();select(s,[0]);launchConquest(s,'expedition');killBoss(s);const saved=snapshot(s);assert.equal(JSON.stringify(saved).includes('hostileZones'),false);assert.equal(saved.world,undefined);
 const n=createSession(saved);applySave(n,saved);assert.equal(n.save.character.conquest.influence,saved.character.conquest.influence);assert.equal(n.world.curses,null);assert.equal(n.world.adventure,null);
 const dead=village();launchConquest(dead,'expedition');dead.world.player.hp=0;stepSession(dead,.1,{});assert.equal(dead.scene,'dead');const inf=dead.save.character.conquest.influence;returnAdventure(dead);assert.equal(dead.scene,'village');assert.equal(dead.save.character.conquest.influence,inf);
});
