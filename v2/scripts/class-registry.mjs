// Registro das classes jogáveis da v2: nomes, modelo, recurso e catálogo de equipamentos.
// Regras de combate continuam nos módulos de cada classe; aqui ficam só os dados que telas,
// saves e o mundo consultam para saber "que classe é esta". Ordem = ordem do Novo Jogo.
// gear: 'arcane' usa o catálogo compartilhado do Necromante; 'martial', o catálogo de warrior-equipment.
// marksman: usa o motor de ações de marksman.mjs (barra fixa, tiros com projétil, atirar andando).
export const CLASSES={
 necromancer:{id:'necromancer',name:'Necromante',model:'necromancer',resource:'mana',gear:'arcane',horde:true,icon:'skull',crest:'PACTO DOS MORTOS',rim:0x69d9bf,quote:'A morte não é o fim, mas apenas outro começo.'},
 warrior:{id:'warrior',name:'Guerreiro',model:'warrior',resource:'vigor',gear:'martial',icon:'swords',crest:'ESPADA E ESCUDO',rim:0xffc77a,quote:'O aço não hesita; quem o empunha também não.'},
 druid:{id:'druid',name:'Druida',model:'druid',resource:'mana',gear:'arcane',icon:'leaf',crest:'RAIO E RAIZ',rim:0xb6e07a,quote:'A floresta não esquece. Ela espera, e então responde.'},
 archer:{id:'archer',name:'Arqueira',model:'archerHero',resource:'foco',gear:'martial',icon:'bow',crest:'ARCO E FLECHA',rim:0x9ed46a,quote:'Antes que o inimigo veja, a flecha já escolheu onde cair.',marksman:true},
 mercenary:{id:'mercenary',name:'Mercenário',model:'mercenary',resource:'vigor',gear:'martial',icon:'crossbow',crest:'BESTA E PÓLVORA',rim:0xe0a060,quote:'Todo contrato tem preço. O meu vem em virotes.',marksman:true},
 mage:{id:'mage',name:'Mago',model:'mageHero',resource:'mana',gear:'arcane',icon:'staff',crest:'FOGO, GELO E ARCANO',rim:0x7aa8ff,quote:'Todo feitiço é uma pergunta. O fogo responde rápido; o gelo, devagar.',marksman:true},
};
export const CLASS_IDS=Object.keys(CLASSES);
export const classInfo=id=>CLASSES[id]||CLASSES.necromancer;
export const isMartial=id=>classInfo(id).gear==='martial';
export const isMarksman=id=>!!CLASSES[id]?.marksman;
export const resourceName=id=>classInfo(id).resource;
