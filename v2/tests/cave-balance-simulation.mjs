// Executa o motor real, sem DOM, renderer ou armazenamento do jogador.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createSaveStore,CLASS_IDS} from '../scripts/save-model.mjs';
import {createSession,castSession,stepSession,dashSession,equipSession} from '../scripts/session.mjs';
import {tickAdventure,startCampaign} from '../scripts/campaign.mjs';
import {useCampaignMaps} from '../scripts/campaign-maps.mjs';
import {step} from '../scripts/training-model.mjs';
import {spawnEnemy} from '../scripts/enemies.mjs';
import {warriorAction} from '../scripts/warrior.mjs';
import {druidAction,toggleWolf} from '../scripts/druid.mjs';
import {marksmanAction} from '../scripts/marksman.mjs';
import {castSpell} from '../scripts/spells.mjs';
import {drinkPotion} from '../scripts/healing-potion.mjs';

const map=JSON.parse(fs.readFileSync(new URL('../assets/maps/campaign-cave.json',import.meta.url),'utf8'));
useCampaignMaps(null,{maps:[map]});
export const classes=[...CLASS_IDS,'druid-wolf'];
const seedRandom=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
export function caveSession(id,level=1,skills=false,seed=17){
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const result=createSaveStore(storage).createCharacter('Teste',id==='druid-wolf'?'druid':id);
 if(!result.ok)throw Error(result.message);
 const save=result.save;save.character.level=level;save.character.conquest.seed=170117;
 if(skills){
  if(id==='warrior')save.character.warriorRanks={thrust:1,bash:1};
  if(id==='druid')save.character.druidRanks={spark:1,chain:1,roots:1};
  if(id==='archer')save.character.marksmanRanks={shot:1,pierce:1};
  if(id==='mercenary')save.character.marksmanRanks={bomb:1,volley:1};
  if(id==='mage')save.character.marksmanRanks={fireball:1,frost:1};
 }
 if(id==='druid-wolf')save.character.druidRanks={wolf:1,leap:1};
 save.campaign.started=true;save.campaign.prologue={stage:'cave',introRead:true,caveHeard:true};
 const s=createSession(save);s.world.random=seedRandom(seed);startCampaign(s,{opening:false});
 if(id==='necromancer'&&skills)equipSession(s,1,'maos');
 s.world.adventure.dialogue=null;s.world.paused=false;
 if(id==='druid-wolf'){toggleWolf(s.world);for(let i=0;i<30;i++)step(s.world,1/60,{});}
 return s;
}
export function skill(s,id){
 const w=s.world;
 return id==='warrior'?warriorAction(w,1):id==='druid'||id==='druid-wolf'?druidAction(w,1):id==='necromancer'?castSpell(w,'maos'):marksmanAction(w,id==='mercenary'?2:1);
}
export function measure(id,{level=1,type=4,wave=1,tier='common',ability=false}={}){
 const s=caveSession(id,level,ability),w=s.world;
 // Sem aliados, XP, regeneração de alvo ou IA: mede acertos individuais, mantendo dano e tempo reais.
 w.actors=[w.player];w.onEnemyDeath=null;
 const e=spawnEnemy(w,type,w.player.x+2,w.player.y,{wave,tier});e.dummy=true;
 return {...resolveTarget(s,e,id,ability),id,level,type,wave,tier,ability};
}
export function resolveTarget(s,e,id,ability=false){
 const w=s.world;w.actors=[w.player,e];w.onEnemyDeath=null;e.dummy=true;e.home=null;
 // Isola o acerto mantendo o dano já calculado pelo modo; não deixa a IA mudar a distância.
 e.x=w.player.x+2;e.y=w.player.y;
 let casts=0,firstDamage=0,elapsed=0;
 for(let frame=0;frame<3600&&e.hp>0;frame++){
  w.aim={x:e.x,y:e.y};
  const ok=ability?skill(s,id):castSession(s);if(ok)casts++;
  const before=e.hp;step(w,1/60,{});elapsed+=1/60;
  if(!firstDamage&&e.hp<before)firstDamage=before-e.hp;
  // O alvo fica na frente, inclusive depois do avanço da Estocada/Salto.
  if(!w.warriorAction&&!w.druidAction){e.x=w.player.x+2;e.y=w.player.y;}
 }
 return {hp:e.maxHp,casts,firstDamage,seconds:+elapsed.toFixed(2),killed:e.hp<=0};
}
export function encounter(id,{skills=false,seed=17,groupId='opening-enemy-0',mobile=false}={}){
 const level=groupId==='opening-enemy-0'?1:groupId==='opening-enemy-3'?2:3;
 const s=caveSession(id,level,skills,seed),w=s.world,g=w.adventure.groups.find(g=>g.id===groupId);
 Object.assign(w.player,{x:g.x-5,y:g.y});tickAdventure(s,0);w.adventure.dialogue=null;w.paused=false;
 const initial=w.actors.filter(a=>a.team==='enemy'),hp=w.player.hp;let basics=0,abilities=0,potions=0,damage=0,frames=0;
 for(;frames<60*120&&w.player.hp>0;frames++){
  const enemies=w.actors.filter(a=>a.team==='enemy'&&a.hp>0);
  if(!enemies.length&&w.adventure.groups.filter(g=>initial.some(e=>e.worldGroup===g.id)).every(g=>g.state==='clear'))break;
  const target=enemies.sort((a,b)=>Math.hypot(a.x-w.player.x,a.y-w.player.y)-Math.hypot(b.x-w.player.x,b.y-w.player.y))[0];
  let input={};
  if(target){
   w.aim={x:target.x,y:target.y};if(skills&&skill(s,id))abilities++;else if(castSession(s))basics++;
   if(mobile){const dx=target.x-w.player.x,dy=target.y-w.player.y,d=Math.hypot(dx,dy)||1,melee=id==='warrior'||id==='druid-wolf',move=melee?(d>2?1:0):(d<5?-1:d>8?1:0);
    input={x:(dx-dy)/d*move/Math.SQRT2,y:(dx+dy)/d*move/Math.SQRT2};
    if(d<2.5&&w.dash.cooldown<=0)dashSession(s,{x:(dy-dx)/d/Math.SQRT2,y:-(dx+dy)/d/Math.SQRT2});
   }
  }
  if(w.player.hp<w.player.maxHp*.45&&drinkPotion(s))potions++;
  const before=w.player.hp;stepSession(s,1/60,input);damage+=Math.max(0,before-w.player.hp);
 }
 return {id,level,skills,mobile,seed,groupId,enemies:initial.length,seconds:+(frames/60).toFixed(2),survived:w.player.hp>0,cleared:!w.actors.some(a=>a.team==='enemy'&&a.hp>0),hpStart:hp,hpEnd:+w.player.hp.toFixed(1),damageTaken:+damage.toFixed(1),basics,abilities,potions};
}
export function report(){
 return {limits:'Acertos: alvo imóvel e sem horda/XP. Encontros independentes: bot com mira no alvo mais próximo e poção a 45%, parado ou mantendo distância e esquivando; IA, colisões, mana, XP e reforços reais. Cada encontro começa com recursos cheios, equipamento inicial e nível 1/2/3 conforme o grupo; não é uma partida contínua nem simula habilidade humana. Salto do lobo medido no nível 4, quando é liberado.',
  hits:classes.flatMap(id=>[1,3].flatMap(level=>[4,8,6,9].map(type=>measure(id,{level,type,wave:type===9?2:1})))),
  skills:classes.map(id=>measure(id,{ability:true,level:id==='druid-wolf'?4:1})),
  encounters:classes.flatMap(id=>[17,41,83].flatMap(seed=>[false,true].flatMap(skills=>[false,true].map(mobile=>encounter(id,{skills,seed,mobile}))))),
  rooms:classes.flatMap(id=>['opening-enemy-3','opening-enemy-10','opening-enemy-14'].flatMap(groupId=>[false,true].map(skills=>encounter(id,{skills,groupId,mobile:true}))))};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const r=report(),out=process.argv[2];if(out){fs.mkdirSync(new URL('../../review/v2/cave-balance/',import.meta.url),{recursive:true});fs.writeFileSync(out,JSON.stringify(r,null,2));}
 console.table(r.hits.filter(r=>r.level===1));console.table(r.skills);console.table(r.encounters.filter(r=>r.seed===17));
}

