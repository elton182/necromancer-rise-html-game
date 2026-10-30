import {ACTIONS,available} from './actions.mjs';
import R from './horde-rules.mjs';
import Build from './full-build.mjs';
import EQ from './shared-equipment.mjs';
import {statsFor,capacity} from './horde-stats.mjs';
import {resolvePosition,navigate,moveCircle,lineClear} from './terrain.mjs';
import {dealDamage} from './combat.mjs';
import {normalizeMastery,masteryFactor,masteryCooldown,masteryBonus} from './mastery.mjs';
import {fx} from './vfx-events.mjs';
export const TYPES=R.types;
export const BASIC_PROFILE={version:1,level:1,ranks:{},act1:false};
export const TEST_PROFILE={version:1,level:24,act1:false,ranks:{zombie:2,vigor:2,abom:2,colossus:1,burst:1,skeleton:2,armor:2,archer:2,blades:2,shot:1,guard:1,specter:2,ethereal:2,step:1,drain:2,bond:1}};
const copy=o=>JSON.parse(JSON.stringify(o)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),alive=a=>a.hp>0&&!a.dead;
const baseLoadout=['raio','empty','dash','empty','empty','empty'];
export function normalizeHorde(raw={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Horda inválida.');
 const p=raw.profile??BASIC_PROFILE,v=Build.validate({version:1,level:p.level,ranks:p.ranks}),profile={...copy(p),...v,act1:!!p.act1};
 const loadout=raw.loadout??baseLoadout;if(!Array.isArray(loadout)||loadout.length!==6)throw Error('A horda precisa de seis slots.');
 const used=new Set();for(const id of loadout){if(!available({profile},id)||id!=='empty'&&used.has(id))throw Error('Slot de evocação inválido.');if(id!=='empty')used.add(id);}
 if(loadout.filter(t=>TYPES.includes(t)).length>Math.min(5,capacity(profile.level,profile.act1)))throw Error('Limite de grupos excedido.');
 const range=raw.range??16;if(![8,16,24].includes(range))throw Error('Região da horda inválida.');
 const groups=raw.groups??{},reserve=raw.reserve??{};for(const bag of [groups,reserve]){if(!bag||typeof bag!=='object'||Array.isArray(bag))throw Error('Grupos inválidos.');for(const [type,members]of Object.entries(bag)){if(!TYPES.includes(type)||!Array.isArray(members)||members.length>8)throw Error('Integrantes inválidos.');for(const m of members)if(!m||!Number.isFinite(m.hp)||m.hp<0||!Number.isFinite(m.maxHp)||m.maxHp<=0||!Number.isFinite(m.deadTimer??0)||(m.deadTimer??0)<0||typeof m.key!=='string')throw Error('Estado de aliado inválido.');}}
 const cooldowns=raw.cooldowns??{};for(const n of Object.values(cooldowns))if(!Number.isFinite(n)||n<0)throw Error('Recarga da horda inválida.');
 return {...copy(raw),profile,mastery:normalizeMastery(raw.mastery),loadout:[...loadout],range,groups:copy(groups),reserve:copy(reserve),cooldowns:copy(cooldowns)};
}
// Pontos de habilidade vêm da árvore e dos afixos de equipamento; estes só reforçam nós já investidos.
export function effects(w){return EQ.effects(Build,w.army.profile.ranks,w.equipment||{}).effects;}
export const gearBonuses=w=>EQ.bonuses({equipment:w.equipment||{}});
export function groupSize(w,type){const e=effects(w);return type==='zombie'?3+(e['Zumbis adicionais']||0):type==='skeleton'?3+(e['Guerreiros adicionais']||0):type==='archer'?2+(e['Arqueiros adicionais']||0):type==='specter'?2+(e['Espectros adicionais']||0):1;}
export function members(w,type){return w.actors.filter(a=>a.team==='ally'&&a.groupType===type);}
export function locked(w,type){return members(w,type).some(a=>a.sacrificed||a.exploded);}
const savedMember=a=>({key:a.memberKey,hp:a.hp,maxHp:a.maxHp,dead:!alive(a),deadTimer:a.deadTimer||0,sacrificed:!!a.sacrificed,exploded:!!a.exploded,abilityCooldown:a.abilityCooldown??0});
export function snapshotHorde(w){const out=normalizeHorde(w.army);out.groups={};for(const t of TYPES)if(out.loadout.includes(t))out.groups[t]=t==='specter'?[]:members(w,t).map(savedMember);return out;}
function memberStats(w,type){
 const stats=statsFor(type,w.army.profile.level,effects(w),gearBonuses(w));stats.hp=Math.max(1,Math.round(stats.hp*masteryFactor(w,type,'hp')*(w.curses?.hordeHp??1)));stats.baseDmg*=masteryFactor(w,type,'damage');stats.dmg=Math.round(stats.baseDmg*(1+stats.damageBonus/100));stats.spd*=masteryFactor(w,type,'speed');stats.regen=stats.hp*R.tuning.minionRegen*masteryFactor(w,type,'regen');
 return stats;
}
export function recalculateHorde(w){for(const m of w.actors.filter(a=>a.groupType&&!a.possessed)){const s=memberStats(w,m.groupType),ratio=m.hp/m.maxHp;Object.assign(m,{hp:m.dead?0:Math.max(1,Math.round(s.hp*ratio)),maxHp:s.hp,dmg:s.dmg,baseDmg:s.baseDmg,damageBonus:s.damageBonus,spd:s.spd,regen:s.regen,atkR:s.rng});}}
// Círculo de runas na cor da habilidade do grupo, sempre que um integrante é invocado ou levantado de novo.
function summonFx(w,m){fx(w,'summonRune',{x:m.x,y:m.y,radius:m.groupType==='abom'?2.3:1.7,color:R.abilities[m.groupType].color,duration:1.2});}
export function spawnMember(w,type,index,saved){
 const stats=memberStats(w,type);
 const radius=type==='abom'?.55:.35,a=index*2.399,r=2+Math.floor(index/8)*.8,pos=resolvePosition({x:w.player.x+Math.sin(a)*r,y:w.player.y+Math.cos(a)*r},radius,w.arena),ratio=saved?saved.hp/saved.maxHp:1;
 const m={id:w.nextId++,model:type,team:'ally',groupType:type,memberKey:saved?.key??type+'-'+w.nextId,radius,...pos,hp:saved?.dead?0:Math.max(1,Math.min(stats.hp,Math.round(stats.hp*ratio))),maxHp:stats.hp,dmg:stats.dmg,baseDmg:stats.baseDmg,damageBonus:stats.damageBonus,spd:stats.spd,regen:stats.regen,atkR:stats.rng,atkRate:R.defs[type].atkRate,angle:0,animation:saved?.dead?'death':'spawn',animationTime:0,walkDistance:0,actionId:0,timer:0,attackCooldown:0,dead:!!saved?.dead,deathHandled:!!saved?.dead,deadTimer:saved?.deadTimer||0,sacrificed:!!saved?.sacrificed,exploded:!!saved?.exploded,abilityCooldown:saved?.abilityCooldown??R.abilities[type].cooldown*(.3+.15*(index%4)),phase:a};w.actors.push(m);return m;
}
export function initializeHorde(w,state){w.army=normalizeHorde(state);w.command=null;w.allyShots=[];w.onAllyDeath=m=>killMember(w,m);let i=0;for(const t of w.army.loadout)if(TYPES.includes(t)&&t!=='specter'){const saved=w.army.groups[t]||w.army.reserve[t]||[];for(let n=0;n<groupSize(w,t);n++)spawnMember(w,t,i++,saved[n]);delete w.army.reserve[t];}}
export function equipGroup(w,index,id,{preparation=false}={}){
 if(!Number.isInteger(index)||index<0||index>5||!ACTIONS.includes(id))return {ok:false,message:'Slot inválido.'};
 if(!available(w.army,id))return {ok:false,message:'Aprenda esta evocação no Grimório. Use o perfil de teste para experimentar.'};
 const old=w.army.loadout[index],other=id==='empty'?-1:w.army.loadout.indexOf(id);
 if(other>=0){if(other!==index)[w.army.loadout[index],w.army.loadout[other]]=[w.army.loadout[other],w.army.loadout[index]];return {ok:true};}
 if(TYPES.includes(old)&&locked(w,old))return {ok:false,message:'Aguarde a recuperação do integrante sacrificado ou detonado.'};
 const next=[...w.army.loadout];next[index]=id;if(next.filter(t=>TYPES.includes(t)).length>Math.min(5,capacity(w.army.profile.level,w.army.profile.act1)))return {ok:false,message:'Limite de grupos atingido.'};
 const prior=w.army.reserve[id],count=TYPES.includes(id)&&id!=='specter'?Math.max(0,groupSize(w,id)-(prior?.length||0)):0,cost=preparation?0:count*(R.costs[id]||0);
 if(w.player.mp<cost)return {ok:false,message:'Mana insuficiente para equipar o grupo: '+cost+' MP.'};
 if(TYPES.includes(old)){w.army.reserve[old]=old==='specter'?[]:members(w,old).map(savedMember);w.actors=w.actors.filter(a=>a.groupType!==old);}
 w.army.loadout=next;w.player.mp-=cost;
 if(TYPES.includes(id)&&id!=='specter'){for(let i=0;i<groupSize(w,id);i++){const m=spawnMember(w,id,w.actors.filter(a=>a.team==='ally').length,prior?.[i]);if(!m.dead)summonFx(w,m);}delete w.army.reserve[id];}
 return {ok:true};
}
export function setProfile(w,p){if(TYPES.some(t=>locked(w,t)))return {ok:false,message:'Aguarde a recuperação antes de trocar o perfil.'};const state=normalizeHorde({...snapshotHorde(w),profile:p,loadout:baseLoadout,groups:{}});w.army=state;w.actors=w.actors.filter(a=>a.team!=='ally');w.command=null;return {ok:true};}
export function killMember(w,m,reason='normal'){
 if(m.possessed){m.hp=0;m.dead=true;m.deathHandled=true;m.animation='death';m.animationTime=0;m.corpseTime=0;return;}
 if(m.deathHandled)return;m.deathHandled=true;m.dead=true;m.hp=0;m.timer=0;m.pose=null;m.targetId=null;m.leap=null;m.jumpZ=0;m.sacrificed=reason==='sacrificed';m.exploded=reason==='exploded';
 const e=effects(w);m.deadTimer=m.sacrificed?20:Math.max(4,R.revive*(1-(m.groupType==='specter'?-(e['Tempo de renascimento dos Espectros']||0)/100:0)));
 m.animation='death';m.animationTime=0;
 if(reason==='normal'&&w.player.hp>0&&(e['Vida máxima recuperada por morte de aliado']||0)>0)w.player.hp=Math.min(w.player.maxHp,w.player.hp+w.player.maxHp*e['Vida máxima recuperada por morte de aliado']/100);
}
export function revive(w,target=null,{fromMenu=false}={}){
 if(w.paused&&!fromMenu||w.player.hp<=0)return false;const eligible=w.actors.filter(a=>a.groupType&&!a.possessed&&!alive(a)&&!a.sacrificed&&!a.exploded).sort((a,b)=>dist(a,w.player)-dist(b,w.player)),m=target?eligible.find(a=>a.id===target):eligible[0];if(!m||w.player.mp<30)return false;w.player.mp-=30;restore(w,m,R.tuning.manualReviveHealth);return true;
}
function restore(w,m,ratio){m.dead=false;m.deathHandled=false;m.hp=Math.max(1,Math.floor(m.maxHp*ratio));m.deadTimer=0;m.sacrificed=false;m.exploded=false;m.returning=false;m.evade=null;m.navPath=null;m.targetId=null;m.attackCooldown=0;m.animation='spawn';m.animationTime=0;m.actionId++;m.abilityCooldown=R.abilities[m.groupType].cooldown*(.3+.15*(m.id%4));const p=resolvePosition({x:w.player.x+Math.sin(m.phase)*1.8,y:w.player.y+Math.cos(m.phase)*1.8},m.radius,w.arena);m.x=p.x;m.y=p.y;summonFx(w,m);}
export function order(w,point){if(w.paused||!Number.isFinite(point.x)||!Number.isFinite(point.y))return false;const dx=point.x-w.player.x,dy=point.y-w.player.y,d=Math.hypot(dx,dy)||1,r=Math.min(d,w.army.range),p=resolvePosition({x:w.player.x+dx/d*r,y:w.player.y+dy/d*r},.35,w.arena);w.command={...p,type:w.actors.some(e=>e.team==='enemy'&&alive(e)&&dist(e,p)<=4)?'attack':'rally',remaining:14};return true;}
function strike(w,m,target,multiplier=1,bonus=0,drain=true){const e=effects(w),aura=dist(m,w.player)<=8?e['Dano da horda próxima']||0:0,damage=Math.max(1,Math.round(m.baseDmg*(1+(m.damageBonus+aura+bonus)/100)*multiplier)),result=dealDamage(w,target,damage,m);if(drain)drainLife(w,m,result.applied);return damage;}
function drainLife(w,m,applied){if(m.groupType!=='specter'||applied<=0)return;const e=effects(w),healed=Math.min(m.maxHp-m.hp,applied*(e['Roubo de vida dos Espectros']||0)/100);m.hp+=healed;if(w.player.hp>0)w.player.hp=Math.min(w.player.maxHp,w.player.hp+healed*(e['Cura compartilhada com Zephyr']||0)/100);}
function visual(w,m,radius,color='#9ac5ad',label=''){w.effects.push({id:w.nextId++,kind:'allyAbility',x:m.x,y:m.y,radius,time:0,duration:.5,visual:true,color,label});m.abilityLabel=label;m.labelTime=.9;m.animation='attack';m.animationTime=0;m.actionId++;m.timer=.4;}
function slow(e,seconds){if(e.model==='fallenKing')return;e.slowTime=Math.max(e.slowTime||0,seconds);e.slow=.35;}
function foes(w,p,r){return w.actors.filter(e=>e.team==='enemy'&&alive(e)&&dist(e,p)<=r);}
function arrow(w,m,t,mult=1,strong=false,bonus=0){const e=effects(w),aura=dist(m,w.player)<=8?e['Dano da horda próxima']||0:0,damage=Math.max(1,Math.round(m.baseDmg*(1+(m.damageBonus+aura+bonus)/100)*mult)),dx=t.x-m.x,dy=t.y-m.y,d=Math.hypot(dx,dy)||1;w.allyShots.push({id:w.nextId++,source:m.id,target:t.id,x:m.x,y:m.y,dx:dx/d,dy:dy/d,speed:strong?18:15,life:strong?1.3:1.6,damage,locked:strong});}
function automatic(w,m,target,d){if(m.possessed)return false;const t=m.groupType,reach=m.atkR+.3*(target.model==='fallenKing'?1.6:1)+.2;if(m.abilityCooldown>0)return false;
 if(t==='zombie'){if(d>reach)return false;const damage=strike(w,m,target,1.5);slow(target,3);const decay=masteryBonus(w,'zombie').decay||0;if(decay>0&&alive(target))target.minionDecay={damage:Math.max(Math.round(damage/1.5*decay/100),target.minionDecay?.damage||0),remaining:4,tick:target.minionDecay?.tick||0,source:m.id};}
 else if(t==='skeleton'){if(d>reach)return false;for(const e of foes(w,m,2.2))strike(w,m,e,1.3);}
 else if(t==='archer'){if(d>reach)return false;const others=foes(w,m,m.atkR+1).filter(e=>e!==target&&dist(e,w.player)<=w.army.range).sort((a,b)=>dist(a,m)-dist(b,m));[target,others[0]||target,others[1]||others[0]||target].forEach(e=>arrow(w,m,e,.9));}
 else if(t==='specter'){if(d>5)return false;const dx=target.x-m.x,dy=target.y-m.y,n=d||1,p=limited(w,{x:target.x+dx/n*1.2,y:target.y+dy/n*1.2},w.army.range-.5,m.radius);m.x=p.x;m.y=p.y;strike(w,m,target,2,0,false);}
 else {const near=foes(w,m,3);if(!near.length||near.length<2&&d>reach)return false;for(const e of near){strike(w,m,e);slow(e,2);}}
 m.abilityCooldown=R.abilities[t].cooldown*masteryCooldown(w,t);visual(w,m,t==='abom'?3:t==='skeleton'?2.2:.7,R.abilities[t].color,R.abilities[t].name);return true;
}
function limited(w,p,radius,r=.35){const dx=p.x-w.player.x,dy=p.y-w.player.y,d=Math.hypot(dx,dy)||1;return resolvePosition({x:w.player.x+dx/d*Math.min(d,radius),y:w.player.y+dy/d*Math.min(d,radius)},r,w.arena);}
export const POSSESSION={duration:60,cost:45,cooldown:8,aimRadius:4,corpseLifetime:12};
export function possess(w){
 if(w.paused||w.player.hp<=0||!w.army.loadout.includes('specter')||!available(w.army,'specter')||(w.army.cooldowns.specter||0)>1e-9||w.player.mp<POSSESSION.cost||members(w,'specter').filter(alive).length>=groupSize(w,'specter'))return false;
 const body=w.actors.filter(a=>a.team==='enemy'&&a.hp<=0&&!a.isBoss&&a!==w.boss&&a.model!=='fallenKing'&&!a.possessed&&(a.corpseTime||0)<POSSESSION.corpseLifetime&&dist(a,w.aim)<=POSSESSION.aimRadius&&dist(a,w.player)<=w.army.range&&lineClear(w.player,a,.05,w.arena)).sort((a,b)=>dist(a,w.aim)-dist(b,w.aim)||a.id-b.id)[0];
 if(!body)return false;
 const m=spawnMember(w,'specter',members(w,'specter').length);
 Object.assign(m,{model:body.model,x:body.x,y:body.y,radius:body.radius,hp:Math.round(body.maxHp*(1+(effects(w)['Vida dos Espectros']||0)/100)),maxHp:Math.round(body.maxHp*(1+(effects(w)['Vida dos Espectros']||0)/100)),baseDmg:body.dmg||m.baseDmg,dmg:body.dmg||m.dmg,spd:body.spd||m.spd,regen:0,atkR:['enemyArcher','livingMage'].includes(body.model)?9:1.4,atkRate:1.2,possessed:true,possessionRemaining:POSSESSION.duration,possessedName:body.type?.name||'Corpo possuído',ranged:['enemyArcher','enemyRogue','livingMage'].includes(body.model),abilityLabel:'Possuído · 60s',labelTime:1});
 w.actors=w.actors.filter(a=>a!==body);w.player.mp-=POSSESSION.cost;w.army.cooldowns.specter=POSSESSION.cooldown*(1+(effects(w)['Recarga do Passo Espectral']||0)/100)*(1+(effects(w)['Tempo de renascimento dos Espectros']||0)/100)*masteryCooldown(w,'specter');summonFx(w,m);return true;
}
export function special(w,type){
 if(type==='specter')return possess(w);
 if(w.paused||w.player.hp<=0||!w.army.loadout.includes(type))return false;const def=R.commands[type],passive=R.passives[def.passive]||def.passive;if(!w.army.profile.ranks[passive]||(w.army.cooldowns[type]||0)>1e-9)return false;
 const group=members(w,type).filter(alive);if(!group.length)return false;const e=effects(w),target=foes(w,w.aim,4).filter(a=>dist(a,w.player)<=w.army.range).sort((a,b)=>dist(a,w.aim)-dist(b,w.aim))[0];
 if(type==='zombie'){const m=group.sort((a,b)=>dist(a,w.aim)-dist(b,w.aim))[0];for(const f of foes(w,m,R.tuning.zombieBurstRadius))strike(w,m,f,R.tuning.zombieBurstMultiplier,(e['Dano da explosão de Zumbi']||0)+(e['Dano das explosões de Zumbi e Necrótica']||0));visual(w,m,R.tuning.zombieBurstRadius);killMember(w,m,'exploded');}
 else if(type==='archer'){if(!target)return false;for(const m of group){arrow(w,m,target,1.9,true,e['Dano do Tiro Sepulcral']||0);visual(w,m,.6);}}
 else if(type==='abom'){const m=group[0],p=limited(w,target||w.aim,w.army.range,m.radius),dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy)||1,q=resolvePosition({x:m.x+dx/d*Math.min(7,d),y:m.y+dy/d*Math.min(7,d)},m.radius,w.arena);m.leap={sx:m.x,sy:m.y,x:q.x,y:q.y,time:0};m.animation='attack';m.animationTime=0;m.actionId++;m.targetId=null;}
 else if(type==='specter'){const p=limited(w,w.aim,6);group.forEach((m,i)=>{const a=i*Math.PI*2/group.length,q=resolvePosition({x:p.x+Math.cos(a),y:p.y+Math.sin(a)},m.radius,w.arena);m.x=q.x;m.y=q.y;m.targetId=null;visual(w,m,.7);});}
 else {w.command={x:w.player.x,y:w.player.y,type:'rally',remaining:14};}
 w.army.cooldowns[type]=def.cooldown*(type==='specter'?1+(e['Recarga do Passo Espectral']||0)/100:1)*masteryCooldown(w,type);return true;
}
function move(w,m,goal,speed,dt){if(m.rootTime>0){m.animation='idle';return;}const p=navigate(m,goal,speed,dt,w.arena),dx=p.x-m.x,dy=p.y-m.y;m.x=p.x;m.y=p.y;m.walkDistance+=p.distance;if(p.distance>1e-5)m.angle=Math.atan2(dx,dy);if(m.timer<=0){const state=p.distance>1e-5?'walk':'idle';if(m.animation!==state){m.animation=state;m.animationTime=0;}}}
function evade(w,m,index,dt){
 if(!['zombie','skeleton','archer'].includes(m.groupType)||m.returning)return false;const hazards=w.effects.filter(e=>(e.kind==='danger'||e.kind==='kingWarning'&&!e.harmless||e.kind==='enemyWarning'&&!e.harmless||e.hostileZone)&&!e.hit&&(!e.source||alive(w.actors.find(a=>a.id===e.source)||{}))),danger=p=>hazards.reduce((s,h)=>s+Math.max(0,h.radius+.45-dist(p,h)),0);
 m.evadeCooldown=Math.max(0,(m.evadeCooldown||0)-dt);if(!m.evade&&danger(m)>0&&m.evadeCooldown<=0){m.reaction=(m.reaction||0)+dt;if(m.reaction<.12+(index%3)*.02)return false;let best=null,score=Infinity;for(const length of [2.2,3.5])for(let i=0;i<16;i++){const a=i*Math.PI/8+index*.7,p=limited(w,{x:m.x+Math.cos(a)*length,y:m.y+Math.sin(a)*length},w.army.range-.8,m.radius),value=danger(p)*1000+dist(m,p);if(value<score&&lineClear(m,p,m.radius,w.arena)){score=value;best=p;}}m.reaction=0;if(best&&danger(best)<danger(m)){m.evade={...best,remaining:.85};m.evadeCooldown=1.35;m.targetId=null;}}
 if(!m.evade)return false;m.evade.remaining-=dt;move(w,m,m.evade,m.spd*1.35,dt);if(dist(m,m.evade)<.15||m.evade.remaining<=0)m.evade=null;return true;
}
export function tickHorde(w,dt){
 for(const e of w.actors.filter(a=>a.minionDecay)){const d=e.minionDecay,t=Math.min(dt,d.remaining);d.remaining-=t;d.tick+=t;while(d.tick>=1&&alive(e)){d.tick-=1;dealDamage(w,e,d.damage,w.actors.find(m=>m.id===d.source));}if(d.remaining<=1e-9||!alive(e))delete e.minionDecay;}

 if(w.command){w.command.remaining-=dt;if(w.command.remaining<=1e-9)w.command=null;}
 for(const key of Object.keys(w.army.cooldowns))w.army.cooldowns[key]=Math.max(0,w.army.cooldowns[key]-dt);
 const group=w.actors.filter(m=>m.groupType);
 for(let index=0;index<group.length;index++){
  const m=group[index];
  if(m.possessed){if(!alive(m)){m.animationTime+=dt;m.corpseTime=(m.corpseTime||0)+dt;if(m.corpseTime>=2)w.actors=w.actors.filter(a=>a!==m);continue;}m.possessionRemaining=Math.max(0,m.possessionRemaining-dt);m.abilityLabel='Possuído · '+Math.ceil(m.possessionRemaining)+'s';m.labelTime=.2;if(m.possessionRemaining<=1e-9||w.player.hp<=0){killMember(w,m,'expired');continue;}}
  m.animationTime+=dt;m.timer=Math.max(0,m.timer-dt);m.attackCooldown=Math.max(0,m.attackCooldown-dt);m.abilityCooldown=Math.max(0,m.abilityCooldown-dt);m.labelTime=Math.max(0,(m.labelTime||0)-dt);m.pose=null;
  if(!alive(m)){if(!m.deathHandled)killMember(w,m,m.sacrificed?'sacrificed':m.exploded?'exploded':'normal');m.deadTimer=Math.max(0,m.deadTimer-dt);if(m.deadTimer<=1e-9)restore(w,m,R.tuning.autoReviveHealth);continue;}
  if(m.abilityCooldown<1e-9)m.abilityCooldown=0;m.hp=Math.min(m.maxHp,m.hp+m.regen*dt);
  if(m.leap){const a=m.leap;a.time+=dt;const k=Math.min(1,a.time/.45);m.x=a.sx+(a.x-a.sx)*k;m.y=a.sy+(a.y-a.sy)*k;m.jumpZ=Math.sin(k*Math.PI)*2.6;m.animation='attack';if(k>=1){m.jumpZ=0;m.leap=null;for(const target of foes(w,m,3))strike(w,m,target,2.2,effects(w)['Dano do Salto Devastador']||0);visual(w,m,3);}continue;}
  const far=dist(m,w.player);if(far>w.army.range)m.returning=true;
  const eligible=w.actors.filter(e=>e.team==='enemy'&&alive(e)&&dist(e,w.player)<=w.army.range&&!(e.id===m.ignoreId&&m.ignoreTime>0));m.ignoreTime=Math.max(0,(m.ignoreTime||0)-dt);
  if(m.returning){m.targetId=null;if(far>w.army.range*3){const q=limited(w,{x:w.player.x+Math.sin(index*2.4)*2,y:w.player.y+Math.cos(index*2.4)*2},w.army.range,m.radius);m.x=q.x;m.y=q.y;}else if(far>3&&!(far<=w.army.range*.7&&eligible.length)){move(w,m,w.player,Math.max(5,m.spd*1.5),dt);continue;}m.returning=false;}
  if(evade(w,m,index,dt))continue;
  if(w.command?.type==='rally'){m.targetId=null;const a=index*2.399,r=1.2+Math.floor(index/8)*.8,center=limited(w,w.command,w.army.range-1,m.radius);move(w,m,{x:center.x+Math.sin(a)*r,y:center.y+Math.cos(a)*r},m.spd,dt);continue;}
  m.scan=Math.max(0,(m.scan||0)-dt);let target=eligible.find(e=>e.id===m.targetId);
  if(!target||m.scan<=0||w.command?.type==='attack'){
   const origin=w.command?.type==='attack'?w.command:m,guards=['zombie','skeleton','abom'].includes(m.groupType)&&!w.command?eligible.filter(e=>dist(e,w.player)<=Math.min(6,w.army.range)):[],pool=guards.length?guards:eligible;pool.sort((a,b)=>dist(a,origin)-dist(b,origin));const next=pool[0];if(!target||guards.length&&!guards.includes(target)||next&&dist(next,m)<dist(target,m)-1.5||w.command?.type==='attack')target=next;m.scan=.3;if(target?.id!==m.targetId){m.chaseTime=0;m.chaseBest=Infinity;}m.targetId=target?.id??null;
  }
  if(target){const d=dist(m,target),reach=m.atkR+(target.model==='fallenKing'?.48:.3);if(d>reach||!lineClear(m,target,.05,w.arena)){move(w,m,target,m.spd,dt);if(d<(m.chaseBest??Infinity)-.5){m.chaseBest=d;m.chaseTime=0;}else m.chaseTime=(m.chaseTime||0)+dt;if(m.chaseTime>2.5&&!w.command){m.ignoreId=target.id;m.ignoreTime=3;m.targetId=null;}}else if(m.timer<=0&&lineClear(m,target,.05,w.arena)){m.chaseTime=0;m.angle=Math.atan2(target.x-m.x,target.y-m.y);if(!automatic(w,m,target,d)&&m.attackCooldown<=0){if(m.groupType==='archer'||m.ranged)arrow(w,m,target);else strike(w,m,target);visual(w,m,.5);m.attackCooldown=m.atkRate;}else if(m.attackCooldown>0&&m.timer<=0)m.animation='idle';}}
  else {const a=index*2.399+w.time*.08,r=2+Math.floor(index/8)*.8;move(w,m,limited(w,{x:w.player.x+Math.sin(a)*r,y:w.player.y+Math.cos(a)*r},w.army.range-1,m.radius),m.spd,dt);}
 }
 // Separação simétrica, limitada por dt e resolvida contra os sólidos novamente.
 for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){const a=group[i],b=group[j];if(!alive(a)||!alive(b)||a.leap||b.leap)continue;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.radius+b.radius+.08;if(d>=min)continue;if(d<1e-6){dx=Math.cos(i*2.399);dy=Math.sin(i*2.399);d=1;}const amount=Math.min(.08,(min-(d===1?0:d))*.5,dt*2);for(const [m,s]of [[a,-1],[b,1]]){const p=moveCircle(m,{x:dx/d*amount*s,y:dy/d*amount*s},m.radius,w.arena);m.x=p.x;m.y=p.y;}}
 for(let i=w.allyShots.length-1;i>=0;i--){const s=w.allyShots[i],m=w.actors.find(a=>a.id===s.source),target=w.actors.find(a=>a.id===s.target);s.life-=dt;if(!m||!alive(m)||!target||!alive(target)||s.life<=0){w.allyShots.splice(i,1);continue;}if(!s.locked){const d=dist(target,s)||1;s.dx=(target.x-s.x)/d;s.dy=(target.y-s.y)/d;}const dx=s.dx*s.speed*dt,dy=s.dy*s.speed*dt,len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((target.x-s.x)*dx+(target.y-s.y)*dy)/len)):0;if(Math.hypot(target.x-s.x-dx*t,target.y-s.y-dy*t)<.6){drainLife(w,m,dealDamage(w,target,s.damage,m).applied);w.allyShots.splice(i,1);}else{s.x+=dx;s.y+=dy;}}
}
