// Ajustes manuais do personagem, disponíveis somente com o jogo parado.
import {MAX_LEVEL,levelOf,xpNext} from './progression.mjs';
import {grantExperience} from './rewards.mjs';
import {syncSkills} from './grimoire.mjs';
import {recalculateHorde} from './horde.mjs';
import Build from './full-build.mjs';
import {warriorRanks} from './warrior-model.mjs';
import {druidRanks} from './druid-model.mjs';
import {marksmanRanks} from './marksman-model.mjs';
import {isMarksman} from './class-registry.mjs';

export function testAction(s,action){
 const w=s.world,c=s.save.character,level=levelOf(w),p=w.player;
 if(!w.paused||p.hp<=0||w.adventure?.cinematic)return {ok:false,message:'Pause o jogo com o personagem vivo e fora de uma cena de história.'};
 let message;
 if(action==='level-up'){
  if(level>=MAX_LEVEL)return {ok:false,message:'Nível máximo atingido.'};
  grantExperience(s,xpNext(level)-c.exp);message='Nível '+levelOf(w)+' alcançado.';
 }else if(action==='level-down'){
  if(level<=1)return {ok:false,message:'O nível mínimo é 1.'};
  const next=level-1;
  try{
   if(w.classId==='necromancer'&&w.army)Build.validate({...w.army.profile,level:next});
   const ranks=w.classId==='warrior'?w.warriorRanks:w.classId==='druid'?w.druidRanks:isMarksman(w.classId)?w.marksmanRanks:null;
   const fitted=w.classId==='warrior'?warriorRanks(ranks,next):w.classId==='druid'?druidRanks(ranks,next):isMarksman(w.classId)?marksmanRanks(w.classId,ranks,next):null;
   if(ranks&&Object.keys(ranks).some(id=>(ranks[id]||0)!==(fitted[id]||0)))throw Error('Pontos incompatíveis.');
  }catch{return {ok:false,message:'Redistribua os pontos de habilidade antes de remover este nível.'};}
  c.level=next;c.exp=0;if(w.army)w.army.profile.level=next;else w.level=next;
  syncSkills(w);if(w.armyMode==='groups')recalculateHorde(w);
  message='Nível '+next+' · XP zerado.';
 }else if(action==='gold-up'){c.gold+=1000;message='+1.000 ouro.';
 }else if(action==='gold-down'){c.gold=Math.max(0,c.gold-1000);message='Ouro reduzido (mínimo: zero).';
 }else if(action==='restore'){p.hp=p.maxHp;p.mp=p.maxMp;message='Vida e recurso restaurados.';
 }else return {ok:false,message:'Ação de teste desconhecida.'};
 return {ok:true,message};
}
