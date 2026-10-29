import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,stepSession,snapshot,applySave} from '../scripts/session.mjs';
import {D,normalizeCampaign,completeStage,roomArena} from '../scripts/campaign-model.mjs';
import {startCampaign,launchStage,nextStory,tickAdventure,returnAdventure,enterVillage,makeOffer,launchMission} from '../scripts/campaign.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {moveCircle} from '../scripts/terrain.mjs';
const skip=s=>{for(let i=0;i<200&&s.world.story;i++)nextStory(s);};
const advance=(s,n)=>{for(let i=0;i<n;i++)tickAdventure(s,.25);};
function clearWave(s){for(const e of [...s.world.actors])if(e.team==='enemy'&&e.hp>0)dealDamage(s.world,e,1e9,s.world.player);}
test('fontes preservam fases, recompensas e histórias da campanha',()=>{assert.equal(D.stages.length,5);assert.equal(D.rooms.length,4);assert.equal(D.strip.length,4);assert.equal(D.route.length,3);assert.equal(D.stages[4].rew.xp,520);assert.ok(D.stories.camp_end.length);});
test('normalização e conclusão: desbloqueio sequencial e prêmio único',()=>{let c=normalizeCampaign();assert.throws(()=>completeStage(c,2));const a=completeStage(c,1);assert.equal(a.gold,30);assert.equal(a.state.unlocked,2);assert.equal(completeStage(a.state,1).xp,0);assert.equal(normalizeCampaign({cleared:{4:0}}).village,false);});
test('portas e união dos corredores impedem atravessar paredes',()=>{const a=roomArena();const q=moveCircle({x:0,y:0},{x:0,y:30},.45,a);assert.ok(q.y<6.5);const s=createSession();startCampaign(s);skip(s);launchStage(s,1);skip(s);const p=moveCircle({x:15,y:0},{x:6,y:0},.45,s.world.arena);assert.ok(p.x<17);});
test('personagem novo percorre Ato I, revisita sem prêmio e volta à vila',()=>{
 const s=createSession();startCampaign(s);skip(s);
 for(let n=1;n<=4;n++){assert.ok(launchStage(s,n));skip(s);const w=s.world;w.player.hp=w.player.maxHp=1e8;
 if(n===1){for(let k=0;k<4;k++){const room=D.rooms[k];w.player.x=(room.x0+room.x1)/2;w.player.y=0;for(let tries=0;tries<160&&w.adventure.rooms[k].state!=='clear';tries++){clearWave(s);advance(s,4);}}}
 else if(n===3){for(const z of w.adventure.zones){w.player.x=z.x;w.player.y=0;for(let tries=0;tries<100&&!z.done;tries++){clearWave(s);advance(s,4);}}w.player.x=146;advance(s,1);}
 else{for(let tries=0;tries<200&&!w.adventure.done;tries++){clearWave(s);advance(s,4);}}
 assert.equal(w.adventure.done,true,'concluiu fase '+n);assert.equal(s.save.campaign.cleared[n],1);skip(s);returnAdventure(s);
 }
 assert.equal(s.scene,'village');assert.equal(s.save.campaign.village,true);assert.ok(s.world.landmarks.some(l=>l.id==='bram'));assert.equal(s.save.horde.profile.act1,true);
 const old=snapshot(s);applySave(s,old);assert.equal(s.save.campaign.cleared[4],1);assert.equal(s.world.hostileShots.length,0);
});
test('morte e recarga não completam fase nem restauram combate',()=>{const s=createSession();startCampaign(s);skip(s);launchStage(s,1);skip(s);s.world.player.hp=0;stepSession(s,.1,{});assert.equal(s.scene,'dead');returnAdventure(s);assert.equal(s.scene,'map');assert.deepEqual(s.save.campaign.cleared,{});assert.equal(snapshot(s).campaign.resume,'map');});
import {buyConsumable,useConsumable} from '../scripts/consumables.mjs';
test('ofertas e missões da vila: conclusão paga uma vez e retorno limpa o campo',()=>{
 const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1,3:1,4:1}});assert.ok(enterVillage(s));s.world.random=()=>.1;const m=makeOffer(s,'bram');assert.equal(m.layout,'strip');assert.ok(launchMission(s,m));const w=s.world;
 for(const z of w.adventure.zones){w.player.x=z.x;for(let k=0;k<100&&!z.done;k++){clearWave(s);advance(s,4);}}w.player.x=146;advance(s,1);assert.equal(w.adventure.done,true);const gold=s.save.character.gold;advance(s,20);assert.equal(s.save.character.gold,gold);returnAdventure(s);assert.equal(s.scene,'village');assert.equal(w.hostileZones.length,0);
 s.save.character.gold=100;assert.ok(buyConsumable(s,'recall_scroll').ok);launchStage(s,1);skip(s);w.player.x=30;assert.ok(useConsumable(s,0));assert.equal(w.player.x,w.portal.x);
});
test('save mantém histórias e prêmios mas não restaura entidades ou zonas',()=>{const s=createSession();startCampaign(s);skip(s);launchStage(s,1);skip(s);const saved=snapshot(s);assert.equal(saved.campaign.story.pre1,1);assert.equal(saved.world,undefined);const next=createSession(saved);assert.equal(next.world.adventure,null);assert.equal(next.save.campaign.story.pre1,1);});
test('grupos revivem entre fases sem duplicar integrantes',()=>{const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1}});startCampaign(s);skip(s);launchStage(s,2);skip(s);const w=s.world,allies=w.actors.filter(a=>a.team==='ally');assert.equal(allies.length,3);dealDamage(w,allies[0],1e9);assert.equal(allies[0].dead,true);launchStage(s,2);skip(s);assert.equal(w.actors.filter(a=>a.team==='ally'&&a.hp>0).length,3);});
test('missão em arena só conclui depois das ondas e do chefe',()=>{const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1,3:1,4:1}});enterVillage(s);s.world.random=()=>.9;const m=makeOffer(s,'lysa');assert.equal(m.layout,'arena');launchMission(s,m);const w=s.world;for(let i=0;i<200&&!w.adventure.done;i++){clearWave(s);advance(s,4);}assert.equal(w.adventure.bossSpawned,true);assert.equal(w.adventure.wave,m.wavesGoal);assert.equal(w.adventure.done,true);});
test('floresta usa wave de combate para vida e fase para nível dos itens',()=>{const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1}});launchStage(s,2);skip(s);s.world.random=()=>0;advance(s,20);const e=s.world.actors.find(a=>a.team==='enemy');assert.ok(e);assert.ok(Math.abs(e.hp-e.type.hp*1.36)<1e-8);assert.equal(e.gearWave,2);assert.equal(s.world.gearLevel,2);});
test('chefe da campanha e reforços preservam atributos e níveis do encontro',()=>{const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1,3:1}});launchStage(s,4);skip(s);advance(s,16);const e=s.world.boss;assert.equal(e.hp,D.captain.hp);assert.equal(e.spd,D.captain.spd);assert.equal(e.gearWave,4);const add=s.world.spawnKingAdd({x:2,y:0},e);assert.ok(Math.abs(add.hp-40*1.72)<1e-8);assert.equal(add.gearWave,4);});
