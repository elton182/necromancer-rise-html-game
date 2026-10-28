import {createWorld,resetWorld,setPaused,step,cast} from './training-model.mjs';
import {freshSave,normalizeSave} from './save-model.mjs';

// A sessão persistida é separada da arena de treinamento e suas entidades.
export function createSession(saved=freshSave()){
 const session={save:normalizeSave(saved),scene:'menu',world:createWorld({horde:saved.settings?.horde??6})};
 setPaused(session.world,true);return session;
}
export function transition(s,scene){
 if(!['menu','training','dead'].includes(scene))throw Error('Cena indisponível: '+scene);
 if(scene==='dead'&&s.world.player.hp>0)throw Error('O personagem ainda está vivo.');
 if(scene==='menu'||scene==='training')resetWorld(s.world,{horde:s.save.settings.horde});
 else {s.world.effects=[];s.world.castCooldown=0;for(const a of s.world.actors){a.timer=0;a.pose=null;a.animationTime=0;a.navPath=null;a.navGoal=null;a.navRetry=0;if(a.hp<=0)a.animation='death';else a.animation='idle';}}
 s.scene=scene;setPaused(s.world,scene!=='training');
}
export function pauseSession(s,paused){if(s.scene==='training')setPaused(s.world,paused);}
export function castSession(s){return s.scene==='training'&&cast(s.world);}
export function stepSession(s,dt,input){if(s.scene!=='training')return;step(s.world,dt,input);if(s.world.player.hp<=0)transition(s,'dead');}
export function applySave(s,value){
 const saved=normalizeSave(value);s.save=saved;transition(s,'menu');
}
export function updateSettings(s,settings){
 s.save=normalizeSave({...s.save,settings:{...s.save.settings,...settings}});
}
export function snapshot(s,now=Date.now()){return normalizeSave({...s.save,savedAt:now});}
