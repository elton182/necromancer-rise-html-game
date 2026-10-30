// Traduz o estado da simulação em sons e trilhas. Só lê o mundo: regras de combate não conhecem o áudio.
import {levelOf} from './progression.mjs';
// Efeitos visuais duram frações de segundo e podem expirar dentro de um quadro longo; por isso só habilidades de aliados
// vêm deles. Tiro, Dash e acertos são lidos de recargas e contadores, que sobrevivem a quadros lentos.
export const EFFECT_SOUNDS={allyAbility:'hit'};
// Sons de magia seguem o jogo anterior: Muralha e Escudo de Carne usam o timbre de reanimação.
export const SPELL_SOUNDS={explosao:'explosao',chuva:'chuva',maos:'revive',barreira:'revive',maldicao:'summon'};
export const PICKUP_SOUNDS={hp:'pickupHp',mp:'pickupMp',gold:'pickupMp',equipment:'pickupMp'};
export const CONSUMABLE_SOUNDS={potion_hp:'pickupHp',potion_mp:'pickupMp',bone_shield:'revive',recall_scroll:'portal',soul_bomb:'explosao'};
const LIVE_SCENES=['training','village'];
const count=(list,test)=>list.reduce((n,x)=>n+(test(x)?1:0),0);
const sum=(list,pick)=>list.reduce((n,x)=>n+(pick(x)||0),0);

// Marcos do encontro da campanha: ondas, salas seladas, emboscadas e chefe.
function milestones(w){
 const r=w.adventure;if(!r)return null;
 const rooms=r.rooms||[],zones=r.zones||[];
 return {ref:r,waves:(r.wave||0)+sum(rooms,x=>x.wi)+sum(zones,x=>x.wi),active:count(rooms,x=>x.state==='active')+count(zones,x=>x.active),cleared:count(rooms,x=>x.state==='clear')+count(zones,x=>x.done)+(r.done?1:0),boss:w.actors.includes(w.boss)&&w.boss.hp>0};
}
function snapshot(s){
 const w=s.world,groups=new Map();
 for(const a of w.actors)if(a.groupType)groups.set(a.id,a.dead===true);
 return {scene:s.scene,world:w,level:levelOf(w),hp:w.player.hp,barrier:w.player.barrier||0,hits:w.hits,cast:w.castCooldown,dash:w.dash.cooldown,cooldowns:{...w.spellCooldowns},groups,events:w.combatEvents,cursor:w.combatEvents.length,seen:new WeakSet(w.effects),marks:milestones(w)};
}
// Cada chamada compara o quadro atual com o anterior e devolve os nomes de som a tocar.
// Pausa, menus e trocas de cena apenas atualizam a referência, para não soar por mudanças de carga.
export function createSoundObserver(){
 let prev=null;
 return {
  reset(){prev=null;},
  observe(s){
   const w=s.world,out=[];
   if(!prev||prev.world!==w){prev=snapshot(s);return out;}
   if(prev.scene!==s.scene){
    if(s.scene==='dead')out.push('gameOver');else if(prev.scene!=='menu'&&s.scene!=='menu'&&prev.scene!=='dead')out.push('portal');
    prev=snapshot(s);return out;
   }
   if(!LIVE_SCENES.includes(s.scene)||w.paused||prev.events!==w.combatEvents){prev=snapshot(s);return out;}
   const now=snapshot(s);
   for(const e of w.effects)if(!prev.seen.has(e)&&EFFECT_SOUNDS[e.kind])out.push(EFFECT_SOUNDS[e.kind]);
   if(now.cast>prev.cast+1e-9||now.dash>prev.dash+1e-9)out.push('raio');
   // Na Forma da Morte o som do golpe é o vento da foice (scytheWind); o ruído de impacto do Tiro de Osso soaria por cima.
   if(now.hits>prev.hits&&!(w.lich&&w.lich.form!=='none'))out.push('hit');
   for(const [id,t] of Object.entries(now.cooldowns))if(t>(prev.cooldowns[id]||0)+1e-9&&SPELL_SOUNDS[id])out.push(SPELL_SOUNDS[id]);
   for(const e of w.combatEvents.slice(prev.cursor))if(({soldierCut:'swordSlash',orcSlam:'heavySlam',wolfHowl:'wolfHowl',orcCry:'battleCry',scytheWind:'windCut'})[e.kind])out.push(({soldierCut:'swordSlash',orcSlam:'heavySlam',wolfHowl:'wolfHowl',orcCry:'battleCry',scytheWind:'windCut'})[e.kind]);
   for(const e of w.combatEvents.slice(prev.cursor))if(e.kind==='death'&&e.team==='enemy')out.push(w.boss&&e.target===w.boss.id?'explosao':'enemyDeath');
   for(const [id,dead] of now.groups){const was=prev.groups.get(id);if(was===undefined||was===dead)continue;out.push(dead?'minionDeath':'revive');}
   if(now.level>prev.level)out.push('levelUp');
   if(now.hp<prev.hp-1e-9)out.push('playerHurt');
   else if(now.barrier<prev.barrier-1e-9)out.push('hit');
   const a=prev.marks,b=now.marks;
   if(a&&b&&a.ref===b.ref){
    if(b.waves>a.waves||b.active>a.active||b.boss&&!a.boss)out.push('waveStart');
    if(b.cleared>a.cleared)out.push('levelUp');
   }
   prev=now;return out;
  }
 };
}
export const pickupSound=drop=>PICKUP_SOUNDS[drop?.kind]||null;
// Qual trilha toca agora. null mantém a atual (morte, por exemplo), como no jogo anterior.
export function musicTheme(s,{title=false}={}){
 const w=s.world;
 if(title)return 'title';
 if(w.story)return 'story';
 if(s.scene==='map')return 'map';
 if(s.scene==='village')return 'village';
 if(s.scene==='menu')return 'hub';
 if(s.scene!=='training')return null;
 const a=w.adventure;if(!a)return 'field';
 if(w.actors.includes(w.boss)&&w.boss.hp>0&&!(w.boss.home&&!w.boss.alert))return 'boss';
 if(a.kind==='stage')return {1:'crypt',2:'forest',3:'strip',4:'boss'}[a.n]||'forest';
 return a.mission?.layout==='strip'?'strip':'forest';
}
