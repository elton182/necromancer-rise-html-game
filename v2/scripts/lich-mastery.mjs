// Maestrias das habilidades da Morte: mesmas regras do modelo compartilhado (skill-mastery-model.js), estendido na v2.
// A Forma da Morte e as cinco habilidades da foice têm XP e pontos próprios; ficam ativas quando a Forma da Morte está equipada.
import Base from './shared-mastery.mjs';
const {define,branch}=Base;
export const LICH_ABILITIES=['ceifada','giratoria','colheita','arco','ciclone'];
export const LICH_MASTERY_IDS=['lich',...LICH_ABILITIES];
const rhythm=(a=2,b=3)=>branch('rhythm','Golpe Ágil','cooldown',a,'Fluxo Ceifador','cooldown',b);
export const LICH_SKILLS={
 lich:define('Forma da Morte',{souls:2},[
  branch('vessel','Recipiente Profundo','souls',4,'Alma Vasta','souls',6),
  branch('hunger','Fome Contida','drain',3,'Jejum Sepulcral','drain',4),
  branch('thirst','Sede de Vida','lifesteal',.5,'Banquete das Almas','lifesteal',.75)]),
 ceifada:define('Ceifada',{damage:3},[
  branch('power','Lâmina Afiada','damage',4,'Ceifa Brutal','damage',6),
  branch('reach','Alcance Sombrio','area',3,'Arco Ampliado','area',4),
  rhythm()]),
 giratoria:define('Foice Giratória',{damage:3},[
  branch('power','Lâmina Voraz','damage',4,'Giro Mortal','damage',6),
  branch('reach','Voo Longo','reach',4,'Rota Distante','reach',5),
  rhythm()]),
 colheita:define('Colheita Tripla',{damage:3},[
  branch('power','Golpes Pesados','damage',4,'Colheita Brutal','damage',6),
  branch('mark','Marca Persistente','duration',8,'Ceifado Eterno','duration',10),
  branch('rhythm','Golpe Ágil','speed',2,'Fluxo Ceifador','speed',3)]),
 arco:define('Gancho do Túmulo',{damage:3},[
  branch('power','Gancho Afiado','damage',4,'Arrasto Mortal','damage',6),
  branch('area','Gancho Longo','area',5,'Arrasto Distante','area',6),
  rhythm()]),
 ciclone:define('Ciclone da Morte',{damage:3},[
  branch('power','Giro Violento','damage',4,'Tormenta Afiada','damage',6),
  branch('area','Redemoinho','area',5,'Olho da Tempestade','area',6),
  rhythm()]),
};
export const LICH_LABELS={souls:'almas máximas',drain:'menos drenagem de almas',lifesteal:'de roubo de vida (pontos percentuais)',reach:'alcance'};
