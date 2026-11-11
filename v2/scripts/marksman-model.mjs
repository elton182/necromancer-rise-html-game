import {schoolSynergy} from './skill-synergy.mjs';
// Arqueira e Mercenário (atiradores): árvore, atributos, ações e catálogo. Regras puras, sem DOM nem Three.js.
// Guia: docs/v2-arqueira-mercenario.md. Valores iniciais, ainda sem balanceamento de campanha completa.
import WarriorGear from './warrior-equipment.mjs';
import {marksmanGear,MARKSMAN_ARMOR} from './marksman-equipment.mjs';
import {treeNodes,normalizeRanks,spentRanks,fitRanks,canLearnNode} from './skill-tree.mjs';

// Base por nível, antes dos itens. O recurso usa o campo de mana do save (foco / vigor).
export const MARKSMAN_BASE={
 archer:{hp:[95,14],mp:[70,4],damage:[22,5.5],regen:6,move:6.4},
 mercenary:{hp:[110,16],mp:[80,4],damage:[26,6.5],regen:5,move:5.8},
};

// Árvores: nome, texto, pontos, nível e pré-requisitos vêm de docs/habilidades/arvores.json (skill-tree.mjs).
export const MARKSMAN_NODES={archer:treeNodes('archer'),mage:treeNodes('mage'),mercenary:treeNodes('mercenary')};
const nodesOf=classId=>MARKSMAN_NODES[classId]||MARKSMAN_NODES.archer;
export const normalizeMarksman=(classId,value={})=>normalizeRanks(nodesOf(classId),value);
export const marksmanBudget=level=>3*Math.max(1,Math.floor(level));
export const marksmanSpent=(classId,ranks)=>spentRanks(nodesOf(classId),ranks);
export const marksmanRanks=(classId,value,level)=>fitRanks(nodesOf(classId),value,level,marksmanBudget(level));
export const canLearnMarksman=(classId,ranks,id,level)=>canLearnNode(nodesOf(classId),ranks,id,level,marksmanBudget(level));

// Ações por índice na tabela. As seis primeiras formam a barra padrão (0 tiro básico, 1 botão direito / 2,
// 2 tecla 3 / Q, 3 esquiva, 4 R / 5, 5 T / 6); a barra montável (skill-loadout.mjs) troca as demais.
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
  {id:'rain',rank:'rain',perRank:.1,rankFrom:1,move:0.6,name:'Chuva de Flechas',kind:'rain',node:'rain',cost:35,cooldown:12,duration:.6,release:.35,clip:'shoot_up',range:12,radius:3,delay:.7,waves:5,interval:.4,multiplier:.45,color:'#b8f07a'},
  {id:'fan',rank:'fan',perRank:.1,rankFrom:1,hit:0.85,move:0.75,name:'Tiro Seguidor',kind:'fan',node:'fan',cost:22,cooldown:7,duration:.5,release:.26,clip:'shoot',count:5,spread:50*Math.PI/180,speed:24,range:10,radius:.18,multiplier:.7,pierce:0,color:'#b8f07a',ambush:true,homing:{turn:4,seek:6}},
  // Ações novas entram no fim da lista: a barra montável guarda ids, e os índices antigos continuam válidos.
  // homing: cada flecha vira até `turn` rad/s em direção ao inimigo mais próximo à frente, até `seek` u.
  {id:'saraivadaSeguidora',rank:'saraivadaSeguidora',perRank:.1,rankFrom:1,hit:.95,move:.5,name:'Saraivada Seguidora',kind:'volley',node:'saraivadaSeguidora',cost:25,cooldown:9,duration:.8,release:.2,clip:'shoot',shots:5,gap:.12,speed:22,range:14,radius:.16,multiplier:.45,pierce:0,color:'#ffe08a',lock:{pick:3.5,range:13},homing:{turn:9,seek:8}},
  {id:'impactoCeleste',rank:'impactoCeleste',perRank:.1,rankFrom:1,move:.4,name:'Impacto Celeste',kind:'falconStrike',node:'impactoCeleste',cost:25,cooldown:12,duration:.6,release:.3,clip:'shoot_up',range:12,radius:4.5,delay:.9,multiplier:1.5,knockback:1,color:'#f2d17a'},
  {id:'penasVoadoras',rank:'penasVoadoras',perRank:.1,rankFrom:1,passive:true,hit:.7,move:.6,name:'Penas Voadoras',kind:'feathers',node:'penasVoadoras',cost:0,cooldown:7,duration:.5,release:.3,clip:'shoot_up',count:6,pick:8,speed:20,range:10,radius:.14,multiplier:.4,pierce:0,color:'#f4ecd6',homing:{turn:6,seek:4}},
  {id:'fechadefogo',rank:'fechadefogo',perRank:.1,rankFrom:1,hit:.95,move:.75,name:'Flecha de Fogo',kind:'shot',node:'fechadefogo',cost:15,cooldown:4,duration:.5,release:.26,clip:'shoot',speed:24,range:13,radius:.18,multiplier:1,pierce:0,color:'#ff8a3a',element:'fire',burn:{time:4,interval:.5,multiplier:.15}},
  {id:'flechaExplosiva',rank:'flechaExplosiva',perRank:.1,rankFrom:1,hit:.95,move:.6,name:'Flecha Explosiva',kind:'shot',node:'flechaExplosiva',cost:25,cooldown:7,duration:.65,release:.35,clip:'shoot',speed:22,range:13,radius:.22,multiplier:1.6,explode:2.5,pierce:0,color:'#ff9a3a',element:'fire'},
  {id:'disparoPreciso',rank:'disparoPreciso',perRank:.1,rankFrom:1,hit:.65,move:.2,name:'Disparo Preciso',kind:'shot',node:'disparoPreciso',cost:35,cooldown:20,duration:1.45,release:1.2,clip:'shoot',speed:65,range:24,radius:.16,multiplier:5,pierce:0,color:'#faffd0',warn:true},
  {id:'rasanteRelampago',rank:'rasanteRelampago',perRank:.1,rankFrom:1,move:.6,name:'Rasante Relâmpago',kind:'falconRush',node:'rasanteRelampago',cost:30,cooldown:16,duration:.5,release:.25,clip:'shoot_up',range:12,radius:4.5,count:6,gap:.25,multiplier:.65,color:'#f2d17a'},
  {id:'saraivadaMultipla',shares:'saraivadaSeguidora',rank:'saraivadaSeguidora',perRank:.1,rankFrom:1,hit:.55,move:.5,name:'Saraivada Múltipla',kind:'volley',node:'saraivadaMultipla',cost:40,cooldown:12,duration:.8,release:.2,clip:'shoot',shots:5,gap:.12,speed:22,range:14,radius:.16,multiplier:.45,pierce:0,color:'#ffe08a',lock:{pick:5,range:13},targets:5,homing:{turn:9,seek:8}},
  {id:'chuvaDeFlechasExplosivas',shares:'rain',rank:'rain',perRank:.1,rankFrom:1,move:.6,name:'Chuva de Flechas Explosivas',kind:'rain',node:'chuvaDeFlechasExplosivas',cost:45,cooldown:16,duration:.6,release:.35,clip:'shoot_up',range:12,radius:3.6,delay:.7,waves:5,interval:.4,multiplier:.55,color:'#ff9a3a',element:'fire',explosiveRain:true},
 ],
 mage:[
  {id:'arcane',hit:.95,move:.85,name:'Seta Arcana',kind:'shot',cost:0,cooldown:.45,duration:.45,release:.2,clip:'cast',speed:22,range:12,radius:.2,multiplier:.6,pierce:0,color:'#b78cff',size:.4,rank:'bolt',perRank:.06,element:'arcane'},
  {id:'fireball',hit:1,move:.6,name:'Bola de Fogo',kind:'shot',node:'fireball',cost:18,cooldown:4,duration:.6,release:.3,clip:'cast',speed:16,range:12,radius:.3,multiplier:1.4,pierce:0,explode:2.2,color:'#ff8a3a',size:.75,rank:'fireball',perRank:.1,element:'fire'},
  {id:'frost',move:.6,name:'Rajada de Gelo',kind:'cone',node:'frost',cost:20,cooldown:7,duration:.5,release:.22,clip:'cast',range:6,arc:70*Math.PI/180,multiplier:1.1,slow:.4,slowTime:3,color:'#9fe0ff',rank:'frost',perRank:.1,element:'frost'},
  {id:'dodge',name:'Esquiva',kind:'dodge',cost:0},
  {id:'blink',move:0,name:'Teleporte',kind:'blink',node:'blink',cost:15,cooldown:8,cooldownPerRank:1,duration:.35,release:.15,clip:'cast',distance:7,radius:2.2,multiplier:.5,rank:'echo',perRank:.25,color:'#b78cff',element:'arcane'},
  {id:'meteor',move:.5,name:'Meteoro',kind:'rain',node:'meteor',cost:40,cooldown:4,duration:.7,release:.45,clip:'cast_up',range:12,radius:2.8,delay:1,waves:1,interval:1,multiplier:3.2,color:'#ff6a2a',fx:'meteor',element:'fire',rank:'meteor',perRank:.1,rankFrom:1,
   // Depois do impacto o chão queima: 20% do dano a cada 0,5 s por 3 s em quem estiver dentro (o selo também vale aqui).
   burn:{radius:2.4,time:3,interval:.5,multiplier:.2}},
  // Mago, habilidades novas (docs/habilidades/arvores.json). A esfera solta cristais (shard) e o familiar lança
  // bolas de fogo (bolt): definições próprias de projétil, que o runtime usa direto.
  {id:'setasPerseguidoras',hit:.9,move:.7,name:'Setas Perseguidoras',kind:'fan',node:'setasPerseguidoras',cost:20,cooldown:6,duration:.45,release:.2,clip:'cast',count:5,spread:70*Math.PI/180,speed:18,range:12,radius:.18,multiplier:.4,pierce:0,color:'#b78cff',size:.35,element:'arcane',rank:'setasPerseguidoras',perRank:.1,rankFrom:1,homing:{turn:6,seek:7}},
  // Esfera de Gelo: um pequeno planeta com anéis que atravessa o campo bem devagar (2 u/s por 10 u) e, girando,
  // solta cristais em espiral: dois opostos a cada 0,15 s, que curvam para inimigos a até 3 u.
  {id:'esferaDeGelo',move:.6,name:'Esfera de Gelo',kind:'orb',node:'esferaDeGelo',cost:30,cooldown:4,duration:.5,release:.25,clip:'cast',speed:2,range:10,radius:1.1,multiplier:.5,color:'#9fe0ff',size:1,element:'frost',rank:'esferaDeGelo',perRank:.1,rankFrom:1,
   shard:{name:'Cristal de Gelo',interval:.15,count:2,step:.55,speed:14,range:5,radius:.12,hit:.45,multiplier:.2,pierce:0,chill:true,slow:.2,slowTime:1,color:'#cff4ff',size:.25,element:'frost',rank:'esferaDeGelo',perRank:.1,rankFrom:1,homing:{turn:5,seek:3}}},
  {id:'familiarDeFogo',move:.6,name:'Familiar de Fogo',kind:'familiar',node:'familiarDeFogo',cost:35,cooldown:25,duration:.6,release:.35,clip:'cast_up',life:20,interval:1.2,pick:9,orbit:1.3,color:'#ff7a2a',
   bolt:{name:'Familiar de Fogo',speed:14,range:10,radius:.25,hit:.5,multiplier:.4,pierce:0,explode:1.2,color:'#ff8a3a',size:.5,element:'fire',rank:'familiarDeFogo',perRank:.1,rankFrom:1}},
  {id:'golemDeGelo',move:.5,name:'Golem de Gelo',kind:'summon',node:'golemDeGelo',cost:40,cooldown:30,duration:.6,release:.35,clip:'cast_up',companion:'iceGolem',color:'#9fd8ff'},
  // Mago, segunda leva (09/11/2026, docs/habilidades/arvores.json). `shares`: variante que divide a recarga com a
  // ação de origem e usa os pontos dela para o dano. `burn`: queimadura no inimigo (dano a cada intervalo, sem acumular).
  // Muralha de Fogo: segmento de chamas atravessado na mira, no ponto mirado; arma depois de `arm` s.
  {id:'firewall',move:.6,name:'Muralha de Fogo',kind:'wall',node:'firewall',cost:30,cooldown:12,duration:.6,release:.4,clip:'cast',range:10,length:6,width:.5,arm:.3,time:5,timePerRank:.5,interval:.5,multiplier:.3,rank:'firewall',perRank:.1,rankFrom:1,color:'#ff7a2a',element:'fire',burn:{time:2,interval:.5,multiplier:.1}},
  // Imbuir: por `time` s a Seta Arcana soma `bonus` do próprio dano e aplica o efeito do elemento. Um encerra o outro.
  {id:'imbuirFogo',move:.8,name:'Imbuir Fogo',kind:'imbue',node:'imbuirFogo',cost:25,cooldown:20,duration:.5,release:.3,clip:'cast_up',element:'fire',time:12,timePerRank:1,bonus:.2,bonusPerRank:.05,color:'#ff8a3a',burn:{time:2,interval:.5,multiplier:.1}},
  {id:'imbuirGelo',move:.8,name:'Imbuir Gelo',kind:'imbue',node:'imbuirGelo',cost:25,cooldown:20,duration:.5,release:.3,clip:'cast_up',element:'frost',time:12,timePerRank:1,bonus:.15,bonusPerRank:.05,slow:.25,slowTime:1.5,color:'#9fe0ff'},
  // Nova de Gelo: variante da Rajada em volta do Mago.
  {id:'icenova',move:.6,name:'Nova de Gelo',kind:'nova',node:'icenova',shares:'frost',cost:25,cooldown:8,duration:.5,release:.22,clip:'cast',radius:4.5,multiplier:.9,slow:.4,slowTime:3,color:'#9fe0ff',rank:'frost',perRank:.1,element:'frost'},
  // Chuva de Fogo (variante do Meteoro) e Avalanche: quedas em pontos aleatórios da área marcada, cada uma com aviso
  // (sombra crescendo por `fall` s) e dano em raio `drop`. A primeira chega `fall` s depois da liberação.
  {id:'chuvaDeFogo',move:.5,name:'Chuva de Fogo',kind:'shower',node:'chuvaDeFogo',shares:'meteor',cost:55,cooldown:8,duration:.7,release:.45,clip:'cast_up',range:12,radius:4.5,count:5,gap:.3,fall:1,drop:1.8,multiplier:1.3,rank:'meteor',perRank:.1,rankFrom:1,color:'#ff6a2a',element:'fire',
   burn:{radius:1.4,time:1.5,interval:.5,multiplier:.2}},
  {id:'avalanche',move:.5,name:'Avalanche',kind:'shower',node:'avalanche',cost:60,cooldown:24,duration:.9,release:.6,clip:'cast_up',range:12,radius:5,count:10,countPerRank:1,span:3,fall:.8,drop:1.4,multiplier:.8,color:'#dff4ff',element:'frost',snow:true,slow:.3,slowTime:2},
  // Raio Arcano: canalizado enquanto a tecla fica pressionada (até duration − release s), com custo por segundo;
  // a recarga começa ao soltar. A direção acompanha a mira.
  {id:'lazerArcano',move:.3,name:'Raio Arcano',kind:'beam',node:'lazerArcano',cost:10,drain:12,cooldown:8,duration:4.25,release:.25,clip:'cast',range:12,width:.3,tick:.2,multiplier:.3,rank:'lazerArcano',perRank:.1,rankFrom:1,color:'#b78cff',element:'arcane'},
  // Clone Arcano: aliado parado que repete os feitiços do Mago da própria posição com `copy` do dano.
  {id:'clone',move:0,name:'Clone Arcano',kind:'clone',node:'clone',cost:50,cooldown:40,duration:.6,release:.35,clip:'cast_up',range:7,companion:'arcaneClone',copy:.5,copyPerRank:.1,color:'#b78cff'},
  {id:'bigBang',hit:1,move:.3,name:'Big Bang',kind:'shot',node:'bigBang',cost:50,cooldown:12,duration:.9,release:.5,clip:'cast_up',speed:7,range:14,radius:.6,size:1.8,multiplier:3.6,explode:4,pierce:0,element:'arcane',color:'#bd91ff',rank:'bigBang',perRank:.1,rankFrom:1},
  {id:'escudoArcano',move:.7,name:'Escudo Arcano',kind:'manaShield',node:'escudoArcano',cost:0,cooldown:20,duration:.6,release:.3,clip:'cast_up',time:12,color:'#bd91ff'},
 ],
 mercenary:[
  {id:'quarrel',hit:1,move:0.7,name:'Virote pesado',kind:'shot',cost:0,cooldown:.8,duration:.8,release:.36,clip:'shoot',speed:28,range:12,radius:.22,multiplier:1.5,pierce:2,falloff:.75,knockback:.35,color:'#ffb35a',rank:'quarrel',perRank:.06,pierceRank:'breach'},
  {id:'volley',hit:0.95,move:0.7,name:'Rajada',kind:'volley',node:'volley',cost:24,cooldown:7,duration:.8,release:.25,clip:'shoot',shots:3,gap:.15,speed:28,range:12,radius:.2,multiplier:.7,pierce:1,falloff:.75,color:'#ffb35a',rank:'volley',perRank:.1},
  {id:'bomb',move:0.8,name:'Bomba de fragmentação',kind:'lob',node:'bomb',cost:20,cooldown:6,duration:.6,release:.3,clip:'throw',range:9,minRange:1.5,flight:.6,radius:2.6,multiplier:1.6,knockback:1,color:'#ff9a3a',rank:'bomb',perRank:.1,blast:true},
  {id:'dodge',name:'Esquiva',kind:'dodge',cost:0},
  {id:'mine',rank:'mine',perRank:.1,rankFrom:1,move:0,name:'Mina de pólvora',kind:'mine',node:'mine',cost:25,cooldown:9,duration:.6,release:.4,clip:'plant',arm:1,trigger:1.4,radius:6,multiplier:2.2,max:2,life:25,knockback:1,color:'#ffb35a',blast:true},
  {id:'firebomb',rank:'firebomb',perRank:.1,rankFrom:1,move:0.8,name:'Molotov',kind:'lob',node:'firebomb',cost:30,cooldown:12,duration:.6,release:.3,clip:'throw',range:9,minRange:1.5,flight:.55,radius:2.4,fireTime:4,interval:.5,multiplier:.3,color:'#ff7a2a',fire:true},
  // Rede: lentidão de 3 s (+0,5 s por ponto depois do primeiro); chefes só recebem o dano.
  {id:'redeDeCaca',move:0.8,name:'Rede de Caça',kind:'lob',node:'redeDeCaca',net:true,cost:15,cooldown:9,duration:.6,release:.3,clip:'throw',range:9,minRange:1.5,flight:.55,radius:2.4,multiplier:.3,slow:.5,slowTime:3,slowPerRank:.5,color:'#d8c9a0'},
  // Armadilha: prende quem pisa (chefes ficam 50% mais lentos); até duas no chão.
  {id:'armadilhaDeUrso',rank:'armadilhaDeUrso',perRank:.1,rankFrom:1,move:0,name:'Armadilha de Urso',kind:'trap',node:'armadilhaDeUrso',cost:20,cooldown:10,duration:.6,release:.4,clip:'plant',arm:.6,trigger:.9,root:2,bossSlow:.5,multiplier:1.2,max:2,life:30,color:'#c8c4b8'},
 ],
};
// A identidade da classe acompanha subprojéteis e cópias da definição.
for(const [classId,list] of Object.entries(MARKSMAN_ACTIONS))for(const def of list){def.classId=classId;if(def.bolt)def.bolt.classId=classId;if(def.shard)def.shard.classId=classId;}
export const marksmanActions=classId=>MARKSMAN_ACTIONS[classId]||MARKSMAN_ACTIONS.archer;
// Compatibilidade com a etapa 1: o tiro básico de cada classe.
export const SHOTS={archer:MARKSMAN_ACTIONS.archer[0],mercenary:MARKSMAN_ACTIONS.mercenary[0]};
export const marksmanLearned=(classId,index,ranks)=>{const def=marksmanActions(classId)[index];return !!def&&!def.passive&&(!def.node||(ranks?.[def.node]||0)>0);};
// Recarga: o tiro básico mantém o ritmo autoral; as demais aceitam a redução dos itens (até 50%).
export function actionCooldown(def,ranks,gearCooldown=0){
 if(!def?.cooldown)return 0;const base=def.cooldown-(def.cooldownPerRank||0)*(ranks?.[def.node]||0);
 return def.rank&&!def.node?base:base*(1-Math.min(50,Math.max(0,gearCooldown))/100);
}
// Dano por uso antes de defesa: dano físico × multiplicador × selo da ação. `rankFrom` desconta os pontos que só
// liberam a ação (1 nas habilidades do Mago que passaram a 5 pontos em 09/11/2026: o primeiro ponto mantém o número antigo).
export const ownRankFactor=(def,ranks)=>1+Math.max(0,(ranks?.[def.rank]||0)-(def.rankFrom||0))*(def.perRank||0);
export const rankFactor=(def,ranks)=>ownRankFactor(def,ranks)+schoolSynergy(def.classId,ranks,def.node||def.rank);
export const summonDamageFactor=(def,ranks)=>1+Math.max(0,(ranks?.[def.node]||0)-1)*MAGE.golemPerRank+schoolSynergy(def.classId,ranks,def.node);
export function actionDamage(def,damage,ranks){return Math.max(1,Math.floor(damage*def.multiplier*rankFactor(def,ranks)+1e-9));}
export const shotDamage=(classId,damage,ranks)=>actionDamage(SHOTS[classId]||SHOTS.archer,damage,ranks);
export const actionPierce=(def,ranks)=>(def.pierce||0)+(def.pierceRank?ranks?.[def.pierceRank]||0:0);
export const blastRadius=(def,ranks)=>def.radius*(def.blast?1+(ranks?.shrapnel||0)*.12:1);
export const rainRadius=(def,ranks)=>def.radius+(['rain','chuvaDeFlechasExplosivas'].includes(def.id)?.3*Math.max(0,(ranks?.rain||0)-1):0);
export const AMBUSH={time:3,perRank:.15};
// Mago: Combustão (chão em chamas depois da Bola de Fogo: 1 s com 1 ponto, +0,5 s por ponto seguinte, até 3 s com 5),
// Estilhaçar (lentos pelo gelo recebem +6% por ponto de fogo e arcano, até 30% com 5) e Golem de Gelo
// (+10% de vida e de dano por ponto depois do primeiro). Rebalanceados para 5 pontos em 09/11/2026.
export const MAGE={combustion:{time:1,timePerRank:.5,interval:.5,multiplier:.25,radius:2},shatter:.06,golemPerRank:.1};
export const combustionTime=rank=>rank>0?MAGE.combustion.time+MAGE.combustion.timePerRank*(rank-1):0;
// Pontos depois do primeiro (os que não só liberam a ação).
const extra=(ranks,id)=>Math.max(0,(ranks?.[id]||0)-1);
// Duração da Muralha e do Imbuir; bônus do Imbuir; quedas da Avalanche; fração copiada pelo Clone.
export const actionTime=(def,ranks)=>def.time+(def.timePerRank||0)*extra(ranks,def.node);
export const imbueBonus=(def,ranks)=>def.bonus+(def.bonusPerRank||0)*extra(ranks,def.node)+def.bonus*schoolSynergy(def.classId,ranks,def.node);
export const showerCount=(def,ranks)=>def.count+(def.countPerRank||0)*extra(ranks,def.node);
export const cloneCopy=(def,ranks)=>def.copy+(def.copyPerRank||0)*extra(ranks,def.node)+def.copy*schoolSynergy(def.classId,ranks,def.node);
// Recarga compartilhada: a variante usa a chave da ação de origem.
export const cooldownKey=def=>def?.shares||def?.id;
// Evocações do Mago: frações da vida máxima e do dano mágico de quem invoca (companions.mjs usa as mesmas).
export const MAGE_SUMMONS={iceGolem:{hp:1.2,damage:.7},arcaneClone:{hp:.5,damage:0}};
const dec=n=>String(Math.round(n*100)/100).replace('.',',');
// Dano por uso de cada ação do Mago para a tabela do painel, com uma nota quando o número não é um acerto único.
export function mageSkillDamage(def,spell,ranks){
 const k=summonDamageFactor(def,ranks);
 switch(def.kind){
  case 'manaShield':return {damage:null,note:Math.min(50,(ranks?.escudoArcano||0)*10)+'% do dano desviado para mana por '+def.time+' s (1 MP por dano)'};
  case 'familiar':return {damage:actionDamage(def.bolt,spell,ranks),note:'por bola de fogo, a cada '+dec(def.interval)+' s por '+def.life+' s'};
  case 'summon':return {damage:Math.floor(spell*MAGE_SUMMONS.iceGolem.damage*k),note:'por golpe do golem'};
  case 'imbue':return {damage:Math.floor(actionDamage(MARKSMAN_ACTIONS.mage[0],spell,ranks)*imbueBonus(def,ranks)),note:'a mais por Seta, por '+dec(actionTime(def,ranks))+' s'};
  case 'clone':return {damage:null,note:Math.round(cloneCopy(def,ranks)*100)+'% do dano de cada feitiço repetido'};
  case 'wall':return {damage:actionDamage(def,spell,ranks),note:'a cada '+dec(def.interval)+' s por '+dec(actionTime(def,ranks))+' s, mais queimadura'};
  case 'shower':return {damage:actionDamage(def,spell,ranks),note:'por queda, '+showerCount(def,ranks)+' quedas'};
  case 'beam':return {damage:actionDamage(def,spell,ranks),note:'a cada '+dec(def.tick)+' s, até '+dec(def.duration-def.release)+' s'};
  case 'fan':return {damage:actionDamage(def,spell,ranks),note:'por seta, '+def.count+' setas'};
  case 'orb':return {damage:actionDamage(def,spell,ranks),note:'no contato; cristais de '+actionDamage(def.shard,spell,ranks)};
  default:return {damage:actionDamage(def,spell,ranks)};
 }
}
// Atributos do Mago: a base mágica vem do mesmo modelo do Necromante (nível e itens), sem horda nem Grimório.
export function mageAttributes(a,ranks){const r=normalizeMarksman('mage',ranks);return {...a,hp:Math.round(a.hp*(1+r.vitality*.1)),mp:Math.round(a.mp*(1+r.wisdom*.1)),spell:a.spell*(1+r.intellect*.08),regen:a.regen*(1+r.meditation*.15),hpRegen:(a.hpRegen||0)+r.regeneration*.4,hordeDps:0,hordeHp:0,hordeRegen:0};}
// Falcão da Arqueira: companheiro sem vida própria, que não pode ser atingido. Altura e órbita só visuais.
export const FALCON={range:8,interval:2.5,multiplier:.35,perRank:.1,speed:15,orbit:1.5,height:2.2,strikeHeight:.9,diveClip:.5,
 command:{cost:10,cooldown:8,pick:3.5,range:14,multiplier:1.2},mark:{time:4,bonus:.15}};
export const falconDamage=(damage,ranks,command=false)=>Math.max(1,Math.floor(damage*(command?FALCON.command.multiplier:FALCON.multiplier)*(1+(ranks?.falcon||0)*FALCON.perRank+schoolSynergy('archer',ranks,'falcon'))));

// Peças do catálogo marcial que servem a quem atira (sem espada nem escudo); a arma própria fica em marksman-equipment.mjs.
export const MARKSMAN_SLOTS=MARKSMAN_ARMOR;
const pick=(base,level)=>base[0]+base[1]*(Math.max(1,level)-1);
export function marksmanAttributes(classId,level,equipment={},ranks={}){
 const B=MARKSMAN_BASE[classId]||MARKSMAN_BASE.archer,b=marksmanGear(classId).bonuses({equipment}),r=normalizeMarksman(classId,ranks);
 const a={hp:Math.round((pick(B.hp,level)+(b.hp||0))*(1+(r.vitality||0)*.1)),mp:Math.round((pick(B.mp,level)+(b.mp||0))*(1+((r.focus||0)+(r.stamina||0))*.1)),damage:(pick(B.damage,level)+(b.damageFlat||0))*(1+(b.damagePercent||0)/100)*(1+((r.precision||0)+(r.caliber||0))*.08),spell:0,defense:(b.defense||0)+(r.armor||0)*4,blockChance:0,hpRegen:(b.hpRegen||0)+(r.regeneration||0)*.4,regen:B.regen+(b.regen||0),move:(B.move+(b.moveFlat||0))*(1+Math.min(30,b.move||0)/100)*(1+(r.swift||0)*.03),cooldown:Math.min(50,b.cooldown||0)};
 a.defenseMitigation=WarriorGear.defenseReduction(a.defense,level)*100;
 return a;
}
