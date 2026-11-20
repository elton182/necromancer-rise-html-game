// Adaptador da v2: lê o motor atual, sem espelhar números no simulador matemático da v1.
import {Types,ENEMY_RESILIENCE} from '../v2/scripts/enemies.mjs';
import {MARKSMAN_ACTIONS} from '../v2/scripts/marksman-model.mjs';
import {HUMAN_ACTIONS,WOLF_ACTIONS} from '../v2/scripts/druid.mjs';
import {WARRIOR_ACTIONS} from '../v2/scripts/warrior.mjs';
import {CONQUEST_MIN_HP_SCALE} from '../v2/scripts/expedition.mjs';
export function readV2Balance(){return {
 version:'v2',resilience:{...ENEMY_RESILIENCE},conquestMinHpScale:CONQUEST_MIN_HP_SCALE,
 enemies:Types.map(({id,name,hp,dmg})=>({id,name,hp,dmg})),
 basic:{warrior:[...WARRIOR_ACTIONS[0].multipliers],druid:HUMAN_ACTIONS[0].multiplier,wolf:WOLF_ACTIONS[0].multiplier,
  archer:MARKSMAN_ACTIONS.archer[0].multiplier,mercenary:MARKSMAN_ACTIONS.mercenary[0].multiplier,mage:MARKSMAN_ACTIONS.mage[0].multiplier},
 limits:'Este adaptador alimenta os checks do motor em v2/tests. run.js continua simulando a v1; seus relatórios não validam a v2.'
};}
