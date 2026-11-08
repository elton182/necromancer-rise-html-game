// Arqueira e Mercenário (atiradores): árvore, atributos, ações e catálogo. Regras puras, sem DOM nem Three.js.
// Guia: docs/v2-arqueira-mercenario.md. Valores iniciais, ainda sem balanceamento de campanha completa.
import WarriorGear from './warrior-equipment.mjs';
import {marksmanGear,MARKSMAN_ARMOR} from './marksman-equipment.mjs';

// Base por nível, antes dos itens. O recurso usa o campo de mana do save (foco / vigor).
export const MARKSMAN_BASE={
 archer:{hp:[95,14],mp:[70,4],damage:[22,5.5],regen:6,move:6.4},
 mercenary:{hp:[110,16],mp:[80,4],damage:[26,6.5],regen:5,move:5.8},
};

// Árvores. Nós novos entram sempre no fim: marksmanRanks distribui o orçamento na ordem destas tabelas.
export const MARKSMAN_NODES={
 archer:{
  shot:{name:'Disparo',description:'+6% de dano do Disparo por ponto. O ataque básico já está disponível.',max:5,branch:'bow'},
  pierce:{name:'Flecha Perfurante',description:'Libera a Flecha Perfurante (botão direito / 2): carrega 0,55 s, andando a metade da velocidade, e atravessa todos os inimigos da linha, com 200% do dano. +10% de dano por ponto.',max:3,branch:'bow'},
  fan:{name:'Leque',description:'T/6: cinco flechas em cone de 50°, com 70% do dano cada. Bom contra quem chega perto em grupo.',max:1,branch:'bow',level:4,requires:'shot'},
  rain:{name:'Chuva de Flechas',description:'R/5: marca uma área de raio 3 no ponto mirado, até 12 u. Depois de 0,7 s caem cinco ondas, uma a cada 0,4 s, com 45% do dano em quem estiver dentro.',max:1,branch:'bow',level:6,requires:'pierce'},
  leap:{name:'Recuo',description:'Libera o Recuo (3 / Q): salto de 5 u para trás, de frente para a mira. Inimigos a até 2,5 u do ponto de partida ficam 35% mais lentos por 2 s. −0,5 s de recarga por ponto.',max:3,branch:'hunt'},
  ambush:{name:'Tiro de Emboscada',description:'Depois do Recuo, o próximo Disparo, Flecha Perfurante ou Leque em até 3 s causa +15% de dano por ponto.',max:3,branch:'hunt',level:4,requires:'leap'},
  precision:{name:'Precisão',description:'+8% de dano por ponto.',max:5,branch:'passives'},
  vitality:{name:'Vitalidade',description:'+10% de vida máxima por ponto.',max:5,branch:'passives'},
  focus:{name:'Concentração',description:'+10% de foco máximo por ponto.',max:5,branch:'passives'},
  swift:{name:'Passo leve',description:'+3% de movimento por ponto.',max:5,branch:'passives'},
  regeneration:{name:'Fôlego',description:'+0,4 de vida por segundo por ponto.',max:5,branch:'passives'},
  falcon:{name:'Falcão',description:'Um falcão acompanha a Arqueira. A cada 2,5 s ele mergulha no inimigo mais próximo dela, até 8 u, com 35% do dano. F: manda o falcão ao inimigo mais perto da mira (até 3,5 u da mira e 14 u de você), com 120% do dano; o alvo fica marcado por 4 s e recebe +15% de dano das flechas. Recarga de 8 s, 10 foco. +10% de dano do falcão por ponto.',max:3,branch:'hunt',level:2},
 },
 mage:{
  bolt:{name:'Seta Arcana',description:'+6% de dano da Seta Arcana por ponto. O ataque básico já está disponível.',max:5,branch:'arcane'},
  fireball:{name:'Bola de Fogo',description:'Libera a Bola de Fogo (botão direito / 2): explode ao tocar o primeiro inimigo, uma parede ou o fim do alcance, em raio 2,2, com 140% do dano. +10% de dano por ponto.',max:3,branch:'fire'},
  frost:{name:'Rajada de Gelo',description:'Libera a Rajada de Gelo (3 / Q): cone de 70° e 6 u à frente, com 110% do dano, que deixa os inimigos 40% mais lentos por 3 s. +10% de dano por ponto.',max:3,branch:'frost'},
  blink:{name:'Teleporte',description:'Libera o Teleporte (R / 5): salta até 7 u na direção da mira, sem atravessar paredes, e deixa no ponto de partida um eco arcano de raio 2,2 com 50% do dano. −1 s de recarga por ponto.',max:3,branch:'arcane'},
  combustion:{name:'Combustão',description:'A Bola de Fogo deixa o chão em chamas por 1 s por ponto, com 25% do dano a cada 0,5 s.',max:3,branch:'fire',level:4,requires:'fireball'},
  shatter:{name:'Estilhaçar',description:'Inimigos lentos pela Rajada de Gelo recebem +10% de dano por ponto do fogo e do arcano.',max:3,branch:'frost',level:4,requires:'frost'},
  echo:{name:'Eco Arcano',description:'+25% de dano do eco do Teleporte por ponto.',max:3,branch:'arcane',level:4,requires:'blink'},
  meteor:{name:'Meteoro',description:'T/6: marca uma área de raio 2,8 no ponto mirado, até 12 u. Depois de 1 s o meteoro cai e causa 320% do dano em quem estiver dentro.',max:1,branch:'fire',level:6,requires:'fireball'},
  intellect:{name:'Intelecto',description:'+8% de dano mágico por ponto.',max:5,branch:'passives'},
  vitality:{name:'Vitalidade',description:'+10% de vida máxima por ponto.',max:5,branch:'passives'},
  wisdom:{name:'Sabedoria',description:'+10% de mana máxima por ponto.',max:5,branch:'passives'},
  meditation:{name:'Meditação',description:'+15% de regeneração de mana por ponto.',max:5,branch:'passives'},
  regeneration:{name:'Fôlego',description:'+0,4 de vida por segundo por ponto.',max:5,branch:'passives'},
 },
 mercenary:{
  quarrel:{name:'Virote pesado',description:'+6% de dano do Virote pesado por ponto. O ataque básico já está disponível.',max:5,branch:'crossbow'},
  volley:{name:'Rajada',description:'Libera a Rajada (botão direito / 2): três virotes em sequência, a cada 0,15 s, com 70% do dano cada e atravessando um inimigo. +10% de dano por ponto.',max:3,branch:'crossbow'},
  breach:{name:'Perfuração',description:'O Virote pesado atravessa +1 inimigo por ponto, ainda perdendo 25% a cada um.',max:2,branch:'crossbow',level:4,requires:'quarrel'},
  bomb:{name:'Bomba de fragmentação',description:'Libera a Bomba (3 / Q): arremesso em arco até 9 u. O ponto de queda fica marcado no chão durante o voo; ao cair, explode em raio 2,6 com 160% do dano e empurra 1 u. +10% de dano por ponto.',max:3,branch:'powder'},
  shrapnel:{name:'Estilhaços',description:'+12% de raio da Bomba e da Mina por ponto.',max:3,branch:'powder',level:4,requires:'bomb'},
  mine:{name:'Mina de pólvora',description:'R/5: assenta uma mina aos seus pés. Arma em 1 s e explode quando um inimigo chega a 1,4 u: raio 3 e 220% do dano. Até duas minas; cada uma dura 25 s.',max:1,branch:'powder',level:6,requires:'bomb'},
  firebomb:{name:'Garrafa incendiária',description:'T/6: arremesso em arco até 9 u que incendeia o chão em raio 2,4 por 4 s. A cada 0,5 s, 30% do dano em quem estiver dentro.',max:1,branch:'powder',level:6,requires:'bomb'},
  caliber:{name:'Calibre',description:'+8% de dano por ponto.',max:5,branch:'passives'},
  vitality:{name:'Couro curtido',description:'+10% de vida máxima por ponto.',max:5,branch:'passives'},
  armor:{name:'Gibão reforçado',description:'+4 de armadura por ponto.',max:5,branch:'passives'},
  stamina:{name:'Resistência',description:'+10% de vigor máximo por ponto.',max:5,branch:'passives'},
  regeneration:{name:'Fôlego',description:'+0,4 de vida por segundo por ponto.',max:5,branch:'passives'},
 },
};
const nodesOf=classId=>MARKSMAN_NODES[classId]||MARKSMAN_NODES.archer;
export function normalizeMarksman(classId,value={}){const out={};for(const [id,node]of Object.entries(nodesOf(classId)))out[id]=Math.min(node.max,Math.max(0,Math.floor(Number(value?.[id])||0)));return out;}
export const marksmanBudget=level=>3*Math.max(1,Math.floor(level));
export const marksmanSpent=(classId,ranks)=>Object.values(normalizeMarksman(classId,ranks)).reduce((a,b)=>a+b,0);
export function marksmanRanks(classId,value,level){const r=normalizeMarksman(classId,value);let left=marksmanBudget(level);for(const [id,node]of Object.entries(nodesOf(classId))){r[id]=Math.min(r[id],left);if((node.level||1)>level||node.requires&&!r[node.requires])r[id]=0;left-=r[id];}return r;}
export function canLearnMarksman(classId,ranks,id,level){const n=nodesOf(classId)[id];return !!n&&(ranks[id]||0)<n.max&&level>=(n.level||1)&&(!n.requires||ranks[n.requires]>0)&&marksmanSpent(classId,ranks)<marksmanBudget(level);}

// Ações por índice fixo de barra: 0 tiro básico, 1 botão direito / 2, 2 tecla 3 / Q, 3 esquiva, 4 R / 5, 5 T / 6.
// Tempos em segundos; `release` é o instante do efeito; `node` é o selo que libera a ação.
// hit: distância máxima entre o centro do inimigo e a linha do projétil para acertar (o Tiro de Osso usa 1,1);
// inimigos maiores que o raio padrão (0,3) somam a diferença.
// move: fração da velocidade enquanto a ação dura. Com move > 0 o clipe toca só no tronco e as pernas
// seguem a passada; com 0 (Recuo, Mina) a pose é de corpo inteiro e o personagem fica parado.
export const MARKSMAN_ACTIONS={
 archer:[
  {id:'arrow',hit:0.95,move:0.85,name:'Disparo',kind:'shot',cost:0,cooldown:.5,duration:.5,release:.26,clip:'shoot',speed:24,range:13,radius:.18,multiplier:.85,pierce:0,color:'#b8f07a',rank:'shot',perRank:.06,ambush:true},
  {id:'pierce',hit:1,move:0.5,name:'Flecha Perfurante',kind:'shot',node:'pierce',cost:20,cooldown:5,duration:.75,release:.55,clip:'shoot',speed:34,range:16,radius:.24,multiplier:2,pierce:99,falloff:1,color:'#e2ff9a',rank:'pierce',perRank:.1,ambush:true,warn:true},
  {id:'leap',move:0,name:'Recuo',kind:'leap',node:'leap',cost:15,cooldown:6,duration:.4,release:.05,clip:'leap_back',distance:5,advance:[.05,.35],slowRadius:2.5,slow:.35,slowTime:2,cooldownPerRank:.5},
  {id:'dodge',name:'Esquiva',kind:'dodge',cost:0},
  {id:'rain',move:0.6,name:'Chuva de Flechas',kind:'rain',node:'rain',cost:35,cooldown:12,duration:.6,release:.35,clip:'shoot_up',range:12,radius:3,delay:.7,waves:5,interval:.4,multiplier:.45,color:'#b8f07a'},
  {id:'fan',hit:0.85,move:0.75,name:'Leque',kind:'fan',node:'fan',cost:22,cooldown:7,duration:.5,release:.26,clip:'shoot',count:5,spread:50*Math.PI/180,speed:24,range:10,radius:.18,multiplier:.7,pierce:0,color:'#b8f07a',ambush:true},
 ],
 mage:[
  {id:'arcane',hit:.95,move:.85,name:'Seta Arcana',kind:'shot',cost:0,cooldown:.45,duration:.45,release:.2,clip:'cast',speed:22,range:12,radius:.2,multiplier:.6,pierce:0,color:'#b78cff',size:.4,rank:'bolt',perRank:.06,element:'arcane'},
  {id:'fireball',hit:1,move:.6,name:'Bola de Fogo',kind:'shot',node:'fireball',cost:18,cooldown:4,duration:.6,release:.3,clip:'cast',speed:16,range:12,radius:.3,multiplier:1.4,pierce:0,explode:2.2,color:'#ff8a3a',size:.75,rank:'fireball',perRank:.1,element:'fire'},
  {id:'frost',move:.6,name:'Rajada de Gelo',kind:'cone',node:'frost',cost:20,cooldown:7,duration:.5,release:.22,clip:'cast',range:6,arc:70*Math.PI/180,multiplier:1.1,slow:.4,slowTime:3,color:'#9fe0ff',rank:'frost',perRank:.1,element:'frost'},
  {id:'dodge',name:'Esquiva',kind:'dodge',cost:0},
  {id:'blink',move:0,name:'Teleporte',kind:'blink',node:'blink',cost:15,cooldown:8,cooldownPerRank:1,duration:.35,release:.15,clip:'cast',distance:7,radius:2.2,multiplier:.5,rank:'echo',perRank:.25,color:'#b78cff',element:'arcane'},
  {id:'meteor',move:.5,name:'Meteoro',kind:'rain',node:'meteor',cost:40,cooldown:14,duration:.7,release:.45,clip:'cast_up',range:12,radius:2.8,delay:1,waves:1,interval:1,multiplier:3.2,color:'#ff6a2a',fx:'meteor',element:'fire'},
 ],
 mercenary:[
  {id:'quarrel',hit:1,move:0.7,name:'Virote pesado',kind:'shot',cost:0,cooldown:.8,duration:.8,release:.36,clip:'shoot',speed:28,range:12,radius:.22,multiplier:1.5,pierce:2,falloff:.75,knockback:.35,color:'#ffb35a',rank:'quarrel',perRank:.06,pierceRank:'breach'},
  {id:'volley',hit:0.95,move:0.7,name:'Rajada',kind:'volley',node:'volley',cost:24,cooldown:7,duration:.8,release:.25,clip:'shoot',shots:3,gap:.15,speed:28,range:12,radius:.2,multiplier:.7,pierce:1,falloff:.75,color:'#ffb35a',rank:'volley',perRank:.1},
  {id:'bomb',move:0.8,name:'Bomba de fragmentação',kind:'lob',node:'bomb',cost:20,cooldown:6,duration:.6,release:.3,clip:'throw',range:9,minRange:1.5,flight:.6,radius:2.6,multiplier:1.6,knockback:1,color:'#ff9a3a',rank:'bomb',perRank:.1,blast:true},
  {id:'dodge',name:'Esquiva',kind:'dodge',cost:0},
  {id:'mine',move:0,name:'Mina de pólvora',kind:'mine',node:'mine',cost:25,cooldown:9,duration:.6,release:.4,clip:'plant',arm:1,trigger:1.4,radius:3,multiplier:2.2,max:2,life:25,knockback:1,color:'#ffb35a',blast:true},
  {id:'firebomb',move:0.8,name:'Garrafa incendiária',kind:'lob',node:'firebomb',cost:30,cooldown:12,duration:.6,release:.3,clip:'throw',range:9,minRange:1.5,flight:.55,radius:2.4,fireTime:4,interval:.5,multiplier:.3,color:'#ff7a2a',fire:true},
 ],
};
export const marksmanActions=classId=>MARKSMAN_ACTIONS[classId]||MARKSMAN_ACTIONS.archer;
// Compatibilidade com a etapa 1: o tiro básico de cada classe.
export const SHOTS={archer:MARKSMAN_ACTIONS.archer[0],mercenary:MARKSMAN_ACTIONS.mercenary[0]};
export const marksmanLearned=(classId,index,ranks)=>{const def=marksmanActions(classId)[index];return !!def&&(!def.node||(ranks?.[def.node]||0)>0);};
// Recarga: o tiro básico mantém o ritmo autoral; as demais aceitam a redução dos itens (até 50%).
export function actionCooldown(def,ranks,gearCooldown=0){
 if(!def?.cooldown)return 0;const base=def.cooldown-(def.cooldownPerRank||0)*(ranks?.[def.node]||0);
 return def.rank&&!def.node?base:base*(1-Math.min(50,Math.max(0,gearCooldown))/100);
}
// Dano por uso antes de defesa: dano físico × multiplicador × selo da ação.
export function actionDamage(def,damage,ranks){return Math.max(1,Math.floor(damage*def.multiplier*(1+(ranks?.[def.rank]||0)*(def.perRank||0))));}
export const shotDamage=(classId,damage,ranks)=>actionDamage(SHOTS[classId]||SHOTS.archer,damage,ranks);
export const actionPierce=(def,ranks)=>(def.pierce||0)+(def.pierceRank?ranks?.[def.pierceRank]||0:0);
export const blastRadius=(def,ranks)=>def.radius*(def.blast?1+(ranks?.shrapnel||0)*.12:1);
export const AMBUSH={time:3,perRank:.15};
// Mago: Combustão (chão em chamas depois da Bola de Fogo) e Estilhaçar (lentos pelo gelo recebem mais fogo e arcano).
export const MAGE={combustion:{time:1,interval:.5,multiplier:.25,radius:2},shatter:.1};
// Atributos do Mago: a base mágica vem do mesmo modelo do Necromante (nível e itens), sem horda nem Grimório.
export function mageAttributes(a,ranks){const r=normalizeMarksman('mage',ranks);return {...a,hp:Math.round(a.hp*(1+r.vitality*.1)),mp:Math.round(a.mp*(1+r.wisdom*.1)),spell:a.spell*(1+r.intellect*.08),regen:a.regen*(1+r.meditation*.15),hpRegen:(a.hpRegen||0)+r.regeneration*.4,hordeDps:0,hordeHp:0,hordeRegen:0};}
// Falcão da Arqueira: companheiro sem vida própria, que não pode ser atingido. Altura e órbita só visuais.
export const FALCON={range:8,interval:2.5,multiplier:.35,perRank:.1,speed:15,orbit:1.5,height:2.2,strikeHeight:.9,diveClip:.5,
 command:{cost:10,cooldown:8,pick:3.5,range:14,multiplier:1.2},mark:{time:4,bonus:.15}};
export const falconDamage=(damage,ranks,command=false)=>Math.max(1,Math.floor(damage*(command?FALCON.command.multiplier:FALCON.multiplier)*(1+(ranks?.falcon||0)*FALCON.perRank)));

// Peças do catálogo marcial que servem a quem atira (sem espada nem escudo); a arma própria fica em marksman-equipment.mjs.
export const MARKSMAN_SLOTS=MARKSMAN_ARMOR;
const pick=(base,level)=>base[0]+base[1]*(Math.max(1,level)-1);
export function marksmanAttributes(classId,level,equipment={},ranks={}){
 const B=MARKSMAN_BASE[classId]||MARKSMAN_BASE.archer,b=marksmanGear(classId).bonuses({equipment}),r=normalizeMarksman(classId,ranks);
 const a={hp:Math.round((pick(B.hp,level)+(b.hp||0))*(1+(r.vitality||0)*.1)),mp:Math.round((pick(B.mp,level)+(b.mp||0))*(1+((r.focus||0)+(r.stamina||0))*.1)),damage:(pick(B.damage,level)+(b.damageFlat||0))*(1+(b.damagePercent||0)/100)*(1+((r.precision||0)+(r.caliber||0))*.08),spell:0,defense:(b.defense||0)+(r.armor||0)*4,blockChance:0,hpRegen:(b.hpRegen||0)+(r.regeneration||0)*.4,regen:B.regen+(b.regen||0),move:(B.move+(b.moveFlat||0))*(1+Math.min(30,b.move||0)/100)*(1+(r.swift||0)*.03),cooldown:Math.min(50,b.cooldown||0)};
 a.defenseMitigation=WarriorGear.defenseReduction(a.defense,level)*100;
 return a;
}
