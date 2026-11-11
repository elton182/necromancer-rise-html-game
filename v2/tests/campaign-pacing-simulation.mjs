// Diagnóstico com o motor real: ataques básicos e recuo simples, sem dano/HP injetados.
import fs from 'node:fs';
import {createSession,stepSession,castSession} from '../scripts/session.mjs';
import {warriorAction} from '../scripts/warrior.mjs';
import WarriorGear from '../scripts/warrior-equipment.mjs';
import {freshSave} from '../scripts/save-model.mjs';
import {launchWorld} from '../scripts/campaign-world.mjs';
import {useCampaignMaps} from '../scripts/campaign-maps.mjs';
import {resolvePosition} from '../scripts/terrain.mjs';
const maps=['world','itauna','itaunaCave','itaunaFort'].map(slot=>JSON.parse(fs.readFileSync(new URL('../assets/maps/campaign-'+slot+'.json',import.meta.url))));useCampaignMaps(null,{maps});
let seed=83419;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const results=[];
for(const profile of ['necromancer','warrior','mage','warrior-prepared'])for(const [area,level,id] of [[null,5,'forest-b'],['itauna',7,'road-west'],['itauna-cave',9,'fork-spiders'],['itauna-fort',11,'fort-captain']]){
 if(profile==='warrior-prepared'&&area!=='itauna-fort')continue;const classId=profile==='warrior-prepared'?'warrior':profile;
 seed=83419;const save=freshSave();save.character.classId=classId;save.character.level=level;save.horde.profile.level=level;
 if(profile==='warrior-prepared'){save.character.warriorRanks={strength:3,armor:3,vitality:3,thrust:1,bash:1};save.character.equipment=Object.fromEntries(['sword','shield','body'].map(type=>[type,WarriorGear.generate(8,null,()=>.2,type,false,'pacing-'+type)]));}
 save.campaign.started=true;save.campaign.prologue={stage:'done'};save.campaign.world={stage:'complete',smith:'done',lumber:'done',...(area?{area,entry:'gate'}:{})};
 const s=createSession(save);launchWorld(s);const w=s.world;w.random=random;const g=w.adventure.groups.find(g=>g.id===id);if(!g)throw Error(id);
 w.adventure.groups=[g];Object.assign(w.player,resolvePosition({x:g.x,y:g.y+10},w.player.radius,w.arena));
 const startHp=w.player.hp,startLevel=w.player.level;let elapsed=0,shots=0,minHp=w.player.hp;
 while(elapsed<90&&s.scene!=='dead'&&g.state!=='clear'){
  const enemies=w.actors.filter(a=>a.team==='enemy'&&a.hp>0).sort((a,b)=>{const score=e=>Math.hypot(e.x-w.player.x,e.y-w.player.y)-(profile==='warrior-prepared'&&[1,3,9].includes(e.typeIndex)?8:0);return score(a)-score(b);}),e=enemies[0];let input={x:0,y:0};
  if(e){const dx=e.x-w.player.x,dy=e.y-w.player.y,d=Math.hypot(dx,dy);w.aim={x:e.x,y:e.y};if(profile==='warrior-prepared'){if(d>2.4&&d<8)warriorAction(w,1);else if(d<1.8)warriorAction(w,2);}
   if((classId!=='warrior'||d<2.5)&&castSession(s))shots++;
   const dir=classId==='warrior'?(d>1.6?1:0):(d<5?-1:d>8?1:0);
   if(dir&&d>0)input={x:dir*(dx-dy)/d/Math.SQRT2,y:dir*(dx+dy)/d/Math.SQRT2};
  }
  stepSession(s,.05,input);elapsed+=.05;minHp=Math.min(minHp,w.player.hp);
 }
 results.push({profile,classId,area:area||'world',level,group:id,mobs:g.count*g.waves,enemyLevel:g.level,seconds:+elapsed.toFixed(1),outcome:s.scene==='dead'?'dead':g.state==='clear'?'cleared':'timeout',hpStart:startHp,hpEnd:Math.round(w.player.hp),hpMin:Math.round(minHp),casts:shots});
}
fs.mkdirSync('review/v2/campaign-pacing',{recursive:true});fs.writeFileSync('review/v2/campaign-pacing/engine-samples.json',JSON.stringify({results,limitations:['amostras isoladas, não uma partida completa','apenas ataque básico e movimento simples; sem poções; perfis básicos não investem talentos nem trocam o equipamento inicial','warrior-prepared usa força, armadura e vitalidade 3, investida e golpe de escudo 1, equipamento de nível 8 e prioriza inimigos de distância','não usa a simulação matemática da campanha legada']},null,2));console.log(JSON.stringify(results));
