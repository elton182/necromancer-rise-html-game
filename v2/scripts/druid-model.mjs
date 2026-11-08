// Druida (Flora): árvore, atributos, barra e formas. Regras puras, sem DOM nem Three.js.
// Guia: docs/v2-druida.md. Valores iniciais, ainda sem balanceamento de campanha completa.
// Nós novos entram sempre no fim: druidRanks distribui o orçamento na ordem desta tabela.
export const DRUID_NODES={
 spark:{name:'Faísca',description:'Raio instantâneo no primeiro inimigo da linha. O ataque básico já está disponível. +6% de dano por ponto.',max:5,branch:'storm'},
 chain:{name:'Corrente de Raios',description:'Libera a Corrente (botão direito / 2): o raio salta entre inimigos próximos. Cada ponto acrescenta um salto.',max:3,branch:'storm'},
 storm:{name:'Tempestade',description:'R/5: nuvem fixa no ponto mirado que derruba raios nos inimigos dentro da área por 4 s. Saia da área ou fique nela: os raios só caem ali.',max:1,branch:'storm',level:6,requires:'chain'},
 roots:{name:'Raízes',description:'Libera as Raízes (3 / Q): espinhos brotam no ponto mirado e prendem os inimigos no lugar. Presos ainda atacam quem estiver ao alcance. +10% de dano e +0,3 s de prisão por ponto.',max:3,branch:'nature'},
 thornbind:{name:'Casca de Espinhos',description:'Inimigos presos pelas Raízes recebem +10% de dano por ponto, de qualquer fonte.',max:3,branch:'nature',level:4,requires:'roots'},
 rejuvenate:{name:'Rejuvenescer',description:'T/6: brotos curam 30% da vida máxima ao longo de 5 s. Só na forma humana; transformar-se não interrompe a cura.',max:1,branch:'nature',level:6,requires:'roots'},
 wolf:{name:'Forma de Lobo',description:'F: transforma em lobisomem. Garras corpo a corpo, 20% menos dano recebido e 35% mais movimento, mas sem magias. A forma consome mana e cada golpe de garra devolve 3. +8% de dano das garras por ponto.',max:3,branch:'wild'},
 leap:{name:'Salto Feroz',description:'Na forma de lobo (botão direito / 2): salta até 6 u e atinge a área de pouso.',max:1,branch:'wild',level:4,requires:'wolf'},
 wildHeart:{name:'Coração Selvagem',description:'A forma de lobo consome 1 mana por segundo a menos por ponto (de 4/s para até 1/s).',max:3,branch:'wild',level:6,requires:'wolf'},
 howl:{name:'Uivo',description:'Na forma de lobo (3 / Q): inimigos em 6 u ficam 35% mais lentos por 3 s e as garras causam +25% de dano por 6 s.',max:1,branch:'wild',level:8,requires:'wolf'},
 vitality:{name:'Vigor da floresta',description:'+10% de vida máxima por ponto.',max:5,branch:'passives'},
 wisdom:{name:'Sabedoria antiga',description:'+10% de mana máxima por ponto.',max:5,branch:'passives'},
 sap:{name:'Seiva',description:'+0,4 de vida por segundo por ponto.',max:5,branch:'passives'},
 attunement:{name:'Afinidade',description:'+8% de dano de magias e garras por ponto.',max:5,branch:'passives'},
};
export function normalizeDruid(value={}){const out={};for(const [id,node]of Object.entries(DRUID_NODES))out[id]=Math.min(node.max,Math.max(0,Math.floor(Number(value?.[id])||0)));return out;}
export const druidBudget=level=>3*Math.max(1,Math.floor(level));
export const druidSpent=ranks=>Object.values(normalizeDruid(ranks)).reduce((a,b)=>a+b,0);
export function druidRanks(value,level){const r=normalizeDruid(value);let left=druidBudget(level);for(const [id,node]of Object.entries(DRUID_NODES)){r[id]=Math.min(r[id],left);if((node.level||1)>level||node.requires&&!r[node.requires])r[id]=0;left-=r[id];}return r;}
export function canLearnDruid(ranks,id,level){const n=DRUID_NODES[id];return !!n&&(ranks[id]||0)<n.max&&level>=(n.level||1)&&(!n.requires||ranks[n.requires]>0)&&druidSpent(ranks)<druidBudget(level);}

// A base mágica vem do mesmo modelo do Necromante (nível e itens); a Druida anda um pouco mais rápido e é mais resistente.
export const DRUID_BASE={hp:1.1,move:1.125};
export function druidAttributes(a,ranks){const r=normalizeDruid(ranks);return {...a,hp:Math.round(a.hp*DRUID_BASE.hp*(1+r.vitality*.1)),mp:Math.round(a.mp*(1+r.wisdom*.1)),spell:a.spell*(1+r.attunement*.08),move:a.move*DRUID_BASE.move,hpRegen:(a.hpRegen||0)+r.sap*.4,hordeDps:0,hordeHp:0,hordeRegen:0};}

// Ações por forma. Índices fixos: a barra da Druida não é personalizável nesta versão.
// Humana: 0 Faísca, 1 Corrente, 2 Raízes, 3 Esquiva, 4 Tempestade, 5 Rejuvenescer.
// Lobo: 0 Garras, 1 Salto, 2 Uivo, 3 Esquiva.
export const HUMAN_NODES={1:'chain',2:'roots',4:'storm',5:'rejuvenate'};
export const WOLF_NODES={1:'leap',2:'howl'};
export const druidActionLearned=(form,index,ranks)=>{const node=(form==='wolf'?WOLF_NODES:HUMAN_NODES)[index];return !node||(ranks?.[node]||0)>0;};
export const WOLF={drain:4,hitRestore:3,taken:.8,move:1.35,toggleCooldown:2,exhaustedCooldown:4,shift:.35,damagePerRank:.08};
export const wolfDrain=ranks=>Math.max(1,WOLF.drain-(ranks?.wildHeart||0));
export const isWolf=w=>w?.classId==='druid'&&w.druidForm==='wolf';
// Raízes: presos recebem dano extra pela Casca de Espinhos.
export const rootedBonus=(w,target)=>w?.classId==='druid'&&target?.druidRoot>w.time?1+(w.druidRanks?.thornbind||0)*.1:1;
