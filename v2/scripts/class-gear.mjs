// Catálogo de equipamentos de cada classe (mercador, loot, forja, mochila e atributos).
import SharedEQ from './shared-equipment.mjs';
import WarriorEQ from './warrior-equipment.mjs';
import {marksmanGear} from './marksman-equipment.mjs';
import {isMartial,isMarksman} from './class-registry.mjs';
export const gearCatalog=classId=>!isMartial(classId)?SharedEQ:isMarksman(classId)?marksmanGear(classId):WarriorEQ;
