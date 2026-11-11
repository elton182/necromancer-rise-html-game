// Resumo de uma jornada salva para a tela "Suas jornadas": classe, atributos, XP, local e tempo de jogo.
// Regras puras sobre um save normalizado; sem DOM, armazenamento ou Three.js.
import {snapshotFor,xpNext,MAX_LEVEL} from './progression.mjs';
import {AREAS,isArea,areaObjectives} from './itauna-model.mjs';
import {worldObjective} from './campaign-world-model.mjs';
import {prologueObjective,caveTitle} from './prologue-model.mjs';
import {freshSave,normalizeSave} from './save-model.mjs';

import {CLASSES,isMartial,isMarksman,resourceName} from './class-registry.mjs';
export {CLASSES};
// Integrantes da horda que aparecem ao lado do Necromante, na ordem do loadout; só tipos com modelo próprio.
export const HORDE_MODELS=['skeleton','zombie','archer','specter','abom'];
export function hordeCompanions(save,limit=3){
 if((save.character.classId||'necromancer')!=='necromancer')return [];
 const types=(save.horde?.loadout||[]).filter(id=>HORDE_MODELS.includes(id));
 return (types.length?types:['skeleton','zombie']).slice(0,limit);
}
// Tempo de jogo em segundos → "45h 12min"; abaixo de um minuto, "menos de 1min".
export function formatPlayTime(seconds){
 if(!(seconds>=60))return 'menos de 1min';
 const minutes=Math.floor(seconds/60),h=Math.floor(minutes/60),m=minutes%60;
 return h?`${h}h ${String(m).padStart(2,'0')}min`:`${m}min`;
}
const PROLOGUE_PLACES={travel:'Estrada de Jacarandá',ambush:'Estrada de Jacarandá',farewell:'Estrada de Jacarandá',fall:'Encosta da estrada',trail:'Trilha da encosta',defense:'Vila de Jacarandá',reunion:'Vila de Jacarandá'};
// Onde o personagem retoma: prólogo, mundo de Jacarandá (com as áreas ligadas), Ato I de Eldrin ou modo livre.
export function journeyLocation(save){
 const c=save.campaign||{},p=c.prologue,w=c.world;
 if(p&&p.stage!=='done')return {name:p.stage==='cave'?caveTitle(p):PROLOGUE_PLACES[p.stage]||'Estrada de Jacarandá',detail:'Prólogo · '+prologueObjective(p)[0]};
 if(w){
  if(isArea(w.area))return {name:AREAS[w.area].name,detail:w.area==='itavera'?areaObjectives(w.area,w)[0].title:w.area==='itauna'?'Arredores de Jacarandá':'Várzea de Itaúna'};
  return {name:w.checkpoint==='crypt'?'Cripta Esquecida':'Vila de Jacarandá',detail:worldObjective(w).title};
 }
 if(c.village)return {name:'Vila de Eldrin',detail:'Campanha · Ato I'};
 if(c.started)return {name:'Mapa de Valdoria',detail:'Campanha · Fase '+c.unlocked};
 return {name:'Modo livre',detail:'Arena de treino'};
}
// Atributos com o mesmo modelo do Relicário; o save guarda os máximos, então vida e mana aparecem cheias.
export function journeyStats(save){
 const ch=save.character,classId=ch.classId||'necromancer',warrior=classId==='warrior',martial=isMartial(classId);
 const w=warrior?{classId,level:ch.level,warriorRanks:ch.warriorRanks,equipment:ch.equipment}:classId==='druid'?{classId,level:ch.level,druidRanks:ch.druidRanks,equipment:ch.equipment}:martial||isMarksman(classId)?{classId,level:ch.level,marksmanRanks:ch.marksmanRanks,equipment:ch.equipment}:{classId,level:ch.level,equipment:ch.equipment,army:{profile:save.horde.profile,loadout:save.horde.loadout,mastery:save.horde.mastery}};
 const a=snapshotFor(w,ch.equipment||{},ch.level).attributes;
 const fmt=n=>Number(n||0).toLocaleString('pt-BR',{maximumFractionDigits:2});
 return [
  {id:'hp',label:'Vida',value:fmt(a.hp)},
  {id:'mp',label:resourceName(classId).replace(/^./,c=>c.toUpperCase()),value:fmt(a.mp)},
  {id:'damage',label:martial?'Dano':classId==='druid'?'Poder natural':'Dano mágico',value:fmt(martial?a.damage:a.spell)},
  {id:'defense',label:'Defesa',value:fmt(a.defense)}
 ];
}
export function journeySummary(id,save){
 const ch=save.character,classId=ch.classId||'necromancer',cls=CLASSES[classId]||CLASSES.necromancer,level=ch.level,next=level>=MAX_LEVEL?0:xpNext(level);
 return {id,classId,className:cls.name,quote:cls.quote,model:cls.model,name:ch.name||'Zephyr',level,
  exp:ch.exp||0,next,progress:next?Math.min(1,(ch.exp||0)/next):1,
  playTime:ch.playTime||0,time:ch.playTime>=60?formatPlayTime(ch.playTime):save.savedAt?new Date(save.savedAt).toLocaleDateString('pt-BR'):'Jornada recém-iniciada',
  location:journeyLocation(save),stats:journeyStats(save),companions:hordeCompanions(save)};
}
// Prévia de uma classe para a tela de Novo Personagem: o mesmo resumo de um save novo daquela classe
// (o Guerreiro recebe espada e escudo iniciais na normalização, como ao criar o personagem).
export function classPreview(classId){
 const s=freshSave();s.character.classId=classId;return journeySummary('new',normalizeSave(s));
}
