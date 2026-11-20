import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {classes,caveSession,resolveTarget} from './cave-balance-simulation.mjs';
import {normalizeCampaign} from '../scripts/campaign-model.mjs';
import {startCampaign,nextStory,enterVillage,launchArena,tickAdventure,launchStage} from '../scripts/campaign.mjs';
import {launchWorld,tickWorld} from '../scripts/campaign-world.mjs';
import {launchExpedition,launchConquest} from '../scripts/expedition.mjs';
import {launchSiege,startSiegeWave,tickSiege} from '../scripts/siege.mjs';
import {equipSession} from '../scripts/session.mjs';
import {toggleWolf} from '../scripts/druid.mjs';
import {step} from '../scripts/training-model.mjs';
import {readV2Balance} from '../../balance-simulator/v2-source.mjs';

export const scenarios=[
 {mode:'prologue',level:1},
 {mode:'world',level:4},{mode:'itauna',level:7},{mode:'itauna-cave',level:9},{mode:'itauna-fort',level:11},{mode:'cedro',level:13},
 {mode:'stage',level:3},
 {mode:'arena',level:1,wave:1},{mode:'arena',level:8,wave:5},{mode:'arena',level:20,wave:15},
 {mode:'expedition',level:1,wave:1},{mode:'expedition',level:8,wave:5},{mode:'expedition',level:20,wave:15},
 {mode:'conquest',level:15},{mode:'siege',level:11}
];
export function modeSession(id,scenario,skills=false){
 const {mode,level,wave=1}=scenario,s=caveSession(id,level,skills);
 if(mode==='prologue')return s;
 if(['world','itauna','itauna-cave','itauna-fort','cedro'].includes(mode)){
  s.save.campaign.prologue={stage:'done'};s.save.campaign.world={stage:'complete',...(mode==='world'?{}:{area:mode,entry:mode==='itauna'?'west':mode==='itauna-cave'?'mouth':'gate'}),nilo:{stage:'cedro'}};
  launchWorld(s);const w=s.world,g=w.adventure.groups.find(g=>!g.leader&&g.state==='dormant');assert.ok(g,mode);
  Object.assign(w.player,{x:g.x,y:g.y});tickWorld(s,0);
 }else{
  s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1,3:1,4:1}});startCampaign(s);
  for(let i=0;i<200&&s.world.story;i++)nextStory(s);assert.ok(enterVillage(s));
  s.save.character.waveProgress={best:wave-1,unlocked:wave,selected:wave};
  if(mode==='arena'){assert.ok(launchArena(s));for(let i=0;i<20;i++)tickAdventure(s,.25);}
  if(mode==='expedition')assert.ok(launchExpedition(s));
  if(mode==='conquest')assert.ok(launchConquest(s,'expedition').ok);
  if(mode==='siege'){assert.ok(launchSiege(s).ok);startSiegeWave(s);tickSiege(s,.25);}
  if(mode==='stage'){launchStage(s,1);s.world.story=null;s.world.tutorial=null;s.world.paused=false;for(let i=0;i<20;i++)tickAdventure(s,.25);}
 }
 const w=s.world;w.paused=false;
 if(skills&&id==='necromancer')equipSession(s,1,'maos');
 if(id==='druid-wolf'&&w.druidForm!=='wolf'){toggleWolf(w);for(let i=0;i<30;i++)step(w,1/60,{});}
 return s;
}
export function measureMode(id,scenario,skills=false){
 const s=modeSession(id,scenario,skills),w=s.world;
 if(scenario.mode==='prologue'){const g=w.adventure.groups[0];Object.assign(w.player,{x:g.x,y:g.y});tickAdventure(s,0);w.adventure.dialogue=null;w.paused=false;}
 const enemies=w.actors.filter(a=>a.team==='enemy'&&a.hp>0&&!a.isBoss),e=enemies.find(e=>e.lootTier==='common')||enemies[0];assert.ok(e,scenario.mode);
 const type=e.typeIndex,name=e.type?.name||e.model,sceneEnemies=enemies.length;
 // Mede só um alvo após o modo aplicar wave, raridade, dificuldade e modificadores.
 // Move ambos para uma posição válida sem cobertura entre eles.
 Object.assign(w.player,{x:e.x-2,y:e.y});
 return {id,...scenario,skills,type,name,sceneEnemies,...resolveTarget(s,e,id,skills)};
}
export function report(){return {source:readV2Balance(),limits:'Motor real; alvo individual imóvel criado por cada modo. Equipamento inicial mantido, níveis 1–20 e waves 1/5/15; habilidades com poucos pontos válidos. Sem horda, cobertura, esquiva ou adversários simultâneos nesta medição. Não representa uma conclusão das rotas, todas as builds, nem o endgame até wave 100.',samples:classes.flatMap(id=>scenarios.map(scenario=>measureMode(id,scenario)))};}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const result=report(),dir=new URL('../../review/v2/cave-balance/',import.meta.url);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(new URL('global.json',dir),JSON.stringify(result,null,2));console.table(result.samples.map(({id,mode,level,wave,type,hp,casts,killed})=>({id,mode,level,wave,type,hp,casts,killed})));
}
