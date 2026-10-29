import {tickAdventure} from './campaign.mjs';
import {tickExpedition} from './expedition.mjs';
import {castSpell,clearSpells} from './spells.mjs';
import {createWorld,resetWorld,setPaused,step,cast,dash} from './training-model.mjs';
import {freshSave,normalizeSave} from './save-model.mjs';
import {TYPES,snapshotHorde,special,revive,order,equipGroup,setProfile,recalculateHorde} from './horde.mjs';
import {syncSkills} from './grimoire.mjs';
import {rewardKill,collect,levelOf} from './rewards.mjs';
import {clampExp} from './progression.mjs';
import {collectAll} from './gear.mjs';

// A sessão persistida é separada da arena de treinamento e suas entidades.
export function createSession(saved=freshSave()){
 const value=normalizeSave(saved);const session={save:value,scene:'menu',world:createWorld({horde:value.settings.horde,armyMode:value.settings.armyMode,army:value.horde,character:value.character,gearLevel:value.settings.gearLevel,lootFilter:value.settings.lootFilter,encounterWave:value.settings.encounterWave}),gearSerial:0};
 session.world.onEnemyDeath=enemy=>rewardKill(session,enemy);session.world.onPickup=drop=>collect(session,drop);
 syncSkills(session.world);setPaused(session.world,true);return session;
}
export function transition(s,scene){
 if(!['menu','training','dead'].includes(scene))throw Error('Cena indisponível: '+scene);
 if(scene==='dead'&&s.world.player.hp>0)throw Error('O personagem ainda está vivo.');
 if(scene==='menu'||scene==='training'){let note='';if(s.scene==='training'){const {collected,left}=collectAll(s);if(collected||left)note=collected+' equipamento(s) coletado(s)'+(left?'; '+left+' ficaram no chão por falta de espaço':'')+'.';}
  if(s.world.armyMode==='groups')s.save.horde=snapshotHorde(s.world);resetWorld(s.world,{horde:s.save.settings.horde,armyMode:s.save.settings.armyMode,army:s.save.horde,character:s.save.character,gearLevel:s.save.settings.gearLevel,lootFilter:s.save.settings.lootFilter,encounterWave:s.save.settings.encounterWave});if(note)s.world.notice=note;}
 else {const lost=s.world.drops.filter(d=>d.kind==='equipment').length;if(lost)s.world.notice=lost+' equipamento(s) no chão foram perdidos.';clearSpells(s.world);s.world.drops=[];s.world.effects=[];s.world.projectiles=[];s.world.allyShots=[];s.world.hostileShots=[];s.world.hostileZones=[];s.world.command=null;s.world.dash.remaining=0;s.world.dash.cooldown=0;s.world.player.veilTime=0;s.world.player.barrier=0;s.world.player.boneShield=false;s.world.castCooldown=0;for(const a of s.world.actors){a.timer=0;a.ability=null;a.king=null;a.pose=null;a.animationTime=0;a.navPath=null;a.navGoal=null;a.navRetry=0;a.leap=null;a.jumpZ=0;a.labelTime=0;a.evade=null;a.targetId=null;if(a.hp<=0)a.animation='death';else a.animation='idle';}}
 s.scene=scene;syncSkills(s.world);setPaused(s.world,scene!=='training');
}
export function pauseSession(s,paused){if(['training','village'].includes(s.scene))setPaused(s.world,paused);}
export function castSession(s){return s.scene==='training'&&(s.world.armyMode!=='groups'||s.world.army.loadout.includes('raio'))&&cast(s.world);}
export function dashSession(s,input){return s.scene==='training'&&(s.world.armyMode!=='groups'||s.world.army.loadout.includes('dash'))&&dash(s.world,input);}
export function activateSlot(s,index,input){if(s.scene!=='training')return false;const id=s.world.armyMode==='groups'?s.world.army.loadout[index]:index===0?'raio':index===2?'dash':'empty';return id==='raio'?castSession(s):id==='dash'?dashSession(s,input):s.world.armyMode==='groups'&&(TYPES.includes(id)?special(s.world,id):castSpell(s.world,id));}
export function reviveSession(s,target=null,options={}){return s.scene==='training'&&s.world.armyMode==='groups'&&revive(s.world,target,options);}
export function orderSession(s,point){return s.scene==='training'&&s.world.armyMode==='groups'&&order(s.world,point);}
export function equipSession(s,index,id){if(s.world.armyMode!=='groups'||s.scene==='dead')return {ok:false,message:'Ative os grupos reais no menu.'};const result=equipGroup(s.world,index,id,{preparation:s.scene==='menu'});if(result.ok)syncSkills(s.world);return result;}
export function stepSession(s,dt,input){if(!['training','village'].includes(s.scene))return;if(s.world.player.hp>0)step(s.world,dt,input);if(s.world.player.hp<=0)transition(s,'dead');else{tickAdventure(s,Math.min(.25,dt));tickExpedition(s);}}
export function applySave(s,value){
 const saved=normalizeSave(value);s.save=saved;s.world.armyMode='load';s.world.drops=[];transition(s,'menu');
}
export function updateSettings(s,settings){
 s.save=normalizeSave({...s.save,settings:{...s.save.settings,...settings}});
 Object.assign(s.world,{lootFilter:s.save.settings.lootFilter,gearLevel:s.save.settings.gearLevel,equipment:s.save.character.equipment});
}
// O nível efetivo pode estar à frente do resumo guardado (perfil de teste); o snapshot grava o que está em jogo.
export function snapshot(s,now=Date.now()){const level=levelOf(s.world);return normalizeSave({...s.save,character:{...s.save.character,level,exp:clampExp(level,s.save.character.exp)},...(s.world.armyMode==='groups'?{horde:snapshotHorde(s.world)}:{}),savedAt:now});}
// Perfis de teste substituem o nível em memória; o XP volta a zero e os atributos são recalculados sem curar.
export function useProfile(s,profile){
 const result=setProfile(s.world,profile);if(!result.ok)return result;
 s.save.character.level=profile.level;s.save.character.exp=0;syncSkills(s.world);recalculateHorde(s.world);return result;
}
