import fs from 'node:fs';
import path from 'node:path';
import {createSession,stepSession,useProfile,castSession} from '../scripts/session.mjs';
import {TEST_PROFILE,equipGroup} from '../scripts/horde.mjs';
import {launchSiege,buildTower,upgradeTower,startSiegeWave} from '../scripts/siege.mjs';
const reports=[];
for(const profile of ['towers-only','hero-horde'])for(const modifier of ['none','armored','haste']){
 const s=createSession();s.scene='village';Object.assign(s.save.campaign,{started:true,village:true,cleared:{1:1,2:1,3:1,4:1}});if(profile==='hero-horde'){useProfile(s,TEST_PROFILE);for(const [i,id]of ['raio','skeleton','zombie','abom','archer','dash'].entries())equipGroup(s.world,i,id,{preparation:true});}let seed=31;s.world.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);launchSiege(s,1,modifier);const r=s.world.adventure;Object.assign(s.world.player,profile==='hero-horde'?{x:0,y:4}:{x:22,y:16});
 const orders=[[1,'bone'],[2,'frost'],[7,'crypt'],[1,'upgrade'],[3,'bone'],[6,'plague'],[5,'frost'],[4,'plague'],[8,'crypt'],[1,'upgrade'],[3,'upgrade'],[6,'upgrade'],[4,'upgrade'],[2,'upgrade'],[5,'upgrade'],[3,'upgrade'],[6,'upgrade'],[4,'upgrade']];let next=0,time=0;
 while(!r.done&&time<900){
  if(!r.active){while(next<orders.length){const [pad,kind]=orders[next],result=kind==='upgrade'?upgradeTower(s,pad):buildTower(s,pad,kind);if(!result.ok)break;next++;}startSiegeWave(s);}
  if(profile==='hero-horde'){const e=s.world.actors.filter(a=>a.siegeLane!==undefined&&a.hp>0&&Math.hypot(a.x-s.world.player.x,a.y-s.world.player.y)<16).sort((a,b)=>Math.hypot(a.x,a.y-4)-Math.hypot(b.x,b.y-4))[0];if(e){s.world.aim={x:e.x,y:e.y};castSession(s);}}stepSession(s,.25,{});time+=.25;if(s.scene==='dead')break;
 }
 reports.push({profile,modifier,won:r.won,done:r.done,wave:r.wave,integrity:r.integrity,seconds:time,essence:r.essence,towers:r.towers.map(t=>({pad:t.pad,kind:t.kind,rank:t.rank})),limits:profile==='hero-horde'?'Motor real: build fixa Nv.24, horda e Tiro de Osso automático, sem movimentação ou esquiva; não representa todas as builds.':'Motor real: sem ataque de Zephyr nem horda equipada; estratégia fixa, não representa todas as builds.'});
}
const out=path.resolve('review/v2/siege');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'simulation-result.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports.map(({towers,...r})=>r),null,2));
