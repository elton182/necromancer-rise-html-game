// Expedição (E10b) e rotas da Conquista de Valdoria (E10c): mapa amplo, encontros dormentes e boss ao fim da trilha.
// Fontes: scripts/expedition.js, scripts/expedition-model.js e scripts/endgame.js. O boss é o Rei Caído PROVISÓRIO: o jogo antigo usa o
// Guardião de Almas, que ainda não existe na v2. Vida, dano e XP seguem a escala da wave (Expedição) ou da dificuldade regional (Conquista).
import {clean} from './campaign.mjs';
import {expeditionArena} from './expedition-map.mjs';
import {spawnEnemy,withNewTypes} from './enemies.mjs';
import {completeWave,LAST_WAVE} from './arena-model.mjs';
import {grantExperience} from './rewards.mjs';
import {collectAll,CAPACITY} from './gear.mjs';
import {lootAllowed} from './drops.mjs';
import {clearSpells} from './spells.mjs';
import {syncSkills} from './grimoire.mjs';
import {recalculateHorde} from './horde.mjs';
import {resolvePosition} from './terrain.mjs';
import EQ from './shared-equipment.mjs';
import Endgame from './shared-endgame.mjs';
import R from './enemy-rules.mjs';
export const BIOME_NAMES={grave:'Cemitério',forest:'Floresta',desert:'Deserto',snow:'Tundra',village:'Vila'};
export const ENTRY_RANGE=3,EXIT_RANGE=4;
const GROUPS={expedition:8,fortress:6,apothecary:4,drowned:4};
const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
// Limpa o que pertence ao encontro anterior; recargas continuam correndo (não há reinício gratuito).
function wipe(w){const cooldowns=w.spellCooldowns;clearSpells(w);w.spellCooldowns=cooldowns;w.drops=[];w.effects=[];w.projectiles=[];w.allyShots=[];w.hostileShots=[];w.hostileZones=[];w.command=null;w.dash.remaining=0;}
// Mapa de uma rota da Conquista: wave de sorteio derivada da semente, do ciclo, da dificuldade e do tipo (como no jogo antigo).
const routeWave=(state,run)=>1+(state.seed+run.cycle*31+run.difficulty*7+Object.keys(Endgame.encounters).indexOf(run.kind)*13)%1000;
// Troca o mapa mantendo o jogador e a horda como estão: sem cura nem reanimação.
function load(s,wave){
 const w=s.world,r=w.adventure,run=r.conquest,state=s.save.character.conquest;
 const arena=run?expeditionArena(routeWave(state,run),{biome:run.biome,groups:GROUPS[run.kind],pilot:run.kind==='expedition'&&run.biome==='swamp'}):expeditionArena(wave),plan=arena.plan;
 w.actors=w.actors.filter(a=>a.team!=='enemy');wipe(w);
 w.arena=arena;w.sceneryRevision=(w.sceneryRevision||0)+1;w.paused=false;w.gearLevel=run?run.reward.itemLevel:wave;
 const start=resolvePosition({x:plan.entry.x+3,y:plan.entry.y+2},w.player.radius,arena);Object.assign(w.player,start);w.aim={x:start.x+1,y:start.y};
 w.actors.filter(a=>a.team==='ally').forEach((a,i)=>{const t=i*2.4;Object.assign(a,resolvePosition({x:start.x+Math.cos(t)*2,y:start.y+Math.sin(t)*2},a.radius,arena));Object.assign(a,{targetId:null,navPath:null,returning:false,leap:null,jumpZ:0,evade:null,ability:null});});
 // Conquista: escala pela dificuldade regional; um a cada cinco inimigos é infectado e deixa uma poça ao morrer.
 const scale=run?Endgame.combatScale(run.difficulty):null;let index=0;
 const level=run?8:wave+2;
 const types=withNewTypes(plan.groups.flatMap(g=>g.mobs.map(m=>m.type)),level);
 for(const group of plan.groups)for(const mob of group.mobs){
  const e=spawnEnemy(w,types[index],mob.x,mob.y,{wave:run?1:wave,tier:group.tier});Object.assign(e,{expedition:true,home:{x:e.x,y:e.y},alert:false});
  if(group.patrol)e.patrol=group.patrol.map(p=>({x:p.x+mob.x-group.x,y:p.y+mob.y-group.y}));
  if(run){Object.assign(e,{gearWave:run.reward.itemLevel,hp:Math.round(e.hp*scale.hp),maxHp:Math.round(e.maxHp*scale.hp),dmg:Math.round(e.dmg*scale.damage),xp:Math.round(e.xp*scale.xp)});if(index%5===0)e.infected=true;}
  index++;
 }
 const bs=run?{hp:scale.hp*Endgame.encounters[run.kind].hp,damage:scale.damage,xp:scale.xp}:EQ.waveStats(wave),hp=Math.round(R.boss.hp*bs.hp),pos=resolvePosition({x:plan.exit.x-4,y:plan.exit.y},.48,arena);
 const boss={id:w.nextId++,model:'fallenKing',team:'enemy',...pos,radius:.48,hp,maxHp:hp,angle:0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,phase:0,xp:Math.round(R.boss.xp*bs.xp),dmg:Math.round(R.boss.dmg*bs.damage),isBoss:true,gearWave:run?run.reward.itemLevel:wave,lootTier:'common',expedition:true,expeditionBoss:true,alert:false,home:{...pos}};
 w.boss=boss;w.actors.push(boss);w.spawnKingAdd=(p,owner)=>spawnEnemy(w,0,p.x,p.y,{wave:run?1:wave,owner:owner.id});
 // Poças permanentes junto aos primeiros grupos da expedição de Valdoria.
 if(run?.kind==='expedition')for(const g of plan.groups.slice(1,5))w.hostileZones.push({id:w.nextId++,source:null,gearWave:run.reward.itemLevel,x:g.x+3,y:g.y,radius:2.5,delay:1.5,life:1e9,tick:0,damage:Math.round(6*scale.damage)});
 Object.assign(r,{wave,cleared:false,exit:{...plan.exit},biome:plan.biome});w.portal={...plan.entry};w.exitPortal=null;
 w.notice=run?Endgame.encounters[run.kind].name+' · '+Endgame.routeBiomes[run.biome].name+' · dificuldade '+run.difficulty+' · intensidade '+run.reward.score+(plan.layout==='brejo-fork'?' · trilha direta: defesa; desvio: acampamento raro; patrulha na convergência':''):'Expedição · wave '+wave+' · '+BIOME_NAMES[plan.biome]+' · explore ou siga até o boss';
}
export function launchExpedition(s){
 if(!s.save.campaign.village)return false;const p=s.save.character.waveProgress;
 clean(s,expeditionArena(p.selected),{x:0,y:0});s.scene='training';
 s.world.adventure={kind:'expedition',n:0,done:false,start:p.selected,wave:p.selected,completed:0,cleared:false,queue:[],zones:[],mission:{label:'EXPEDIÇÃO',layout:'expedition'}};
 load(s,p.selected);return true;
}
// Conquista de Valdoria: o modelo valida acesso, rota, maldições e dificuldade; erros voltam como mensagem.
export function launchConquest(s,kind,routeId){
 if(!s.save.campaign.village)return {ok:false,message:'Valdoria só abre a partir da Vila de Eldrin.'};
 const c=s.save.character,state=c.conquest,d=state.difficulty;let next;
 try{next=Endgame.begin(state,kind,d,state.offers[d].selected,routeId);}catch(error){return {ok:false,message:error.message};}
 c.conquest=next.state;const run=next.run;
 run.xpMultiplier=(1+.25*(run.difficulty-1))*(1+.15*run.reward.score);
 run.reward={...run.reward,xp:Math.round(run.reward.xp*run.xpMultiplier)};
 clean(s,expeditionArena(1),{x:0,y:0});s.scene='training';const w=s.world;
 w.adventure={kind:'expedition',n:0,done:false,conquest:run,start:0,wave:0,completed:0,cleared:false,queue:[],zones:[],mission:{label:Endgame.encounters[kind].name.toUpperCase(),layout:'expedition'}};
 // Maldições valem só nesta tentativa; resetWorld as remove ao voltar à vila.
 w.curses=Endgame.modifiers(run.curses);w.infectedPool=true;
 w.lootConfig=(e,roll)=>{if(!e.expedition)return null;const r=run.reward,special=!!e.expeditionBoss&&w.random()<r.specialChance;return {level:r.itemLevel,type:special?'staff':roll.type,special,weights:e.expeditionBoss?{common:0,magic:0,rare:(1-r.epicChance)*100,epic:r.epicChance*100}:undefined};};
 syncSkills(w);if(w.armyMode==='groups')recalculateHorde(w);
 load(s,0);return {ok:true,run};
}
// Boss derrotado: a wave conta uma vez (recorde, ouro e XP da wave) e o portal final abre.
function finishWave(s){
 const w=s.world,r=w.adventure;r.cleared=true;r.completed++;const result=completeWave(s.save.character.waveProgress,r.wave);r.record=r.record||result.record;
 s.save.character.waveProgress=result.progress;s.save.character.gold+=result.reward.gold;grantExperience(s,result.reward.xp);w.progressChanged=true;w.exitPortal={...r.exit};
 w.notice='Boss derrotado · wave '+r.wave+' · +'+result.reward.gold+' ouro · +'+result.reward.xp+' XP · '+(r.wave>=LAST_WAVE?'G no portal para voltar':'explore ou use G no portal final');
}
// Conquista: influência, rotas, fragmento e dificuldade seguinte vêm do modelo; não mexe no recorde da Arena.
function finishConquest(s){
 const w=s.world,r=w.adventure,run=r.conquest;r.cleared=true;
 const result=Endgame.complete(s.save.character.conquest,run);
 if(!result.applied){w.notice='Este resultado já foi contabilizado.';return;}
 const c=s.save.character;c.conquest=result.state;c.gold+=result.reward.gold;grantExperience(s,result.reward.xp);w.progressChanged=true;w.hostileZones=[];w.exitPortal={...r.exit};r.outcome=result;
 const node=Endgame.routeGraph(c.conquest.seed).find(n=>n.id===run.routeId);
 r.result=result.conqueredNow?'Dificuldade '+run.difficulty+' conquistada · '+(result.fragmentNow?'Fragmento obtido · ':'')+'dificuldade '+c.conquest.unlocked+' liberada':node.label+' concluído · '+(result.newRoutes.length?'+'+result.newRoutes.length+' rota(s) liberada(s)':'área revisitada')+' · +'+result.reward.influence+'% influência';
 w.notice='Vitória em Valdoria · '+r.result+' · G no portal para voltar';
}
export function tickExpedition(s){
 const w=s.world,r=w.adventure;if(r?.kind!=='expedition'||r.cleared||w.paused||w.player.hp<=0||w.boss.hp>0)return;
 r.conquest?finishConquest(s):finishWave(s);
}
// G: no portal inicial encerra a corrida; no final, com o boss derrotado, avança (Expedição) ou volta ao mapa (Conquista).
export function portalAction(s){
 const w=s.world,r=w.adventure,p=w.player;if(r?.kind!=='expedition')return {handled:false};
 if(near(p,w.portal,ENTRY_RANGE))return {handled:true,leave:true};
 if(r.cleared&&near(p,r.exit,EXIT_RANGE)){
  if(r.conquest)return {handled:true,leave:true,openMap:true};
  if(r.wave>=LAST_WAVE)return {handled:true,leave:true};
  // Peças que o filtro permite precisam caber na mochila antes de trocar de mapa; o restante se perde.
  const need=w.drops.filter(d=>d.kind==='equipment'&&lootAllowed(d,w.lootFilter)).length;
  if(need>CAPACITY-s.save.character.gearBag.length){w.notice='Mochila cheia · I para liberar espaço antes de avançar';return {handled:true};}
  collectAll(s);load(s,r.wave+1);return {handled:true,advanced:true};
 }
 w.notice=r.cleared?'Use G perto de um portal':r.conquest?'Derrote o líder no final da trilha →':'O boss está no final da trilha →';return {handled:true};
}
