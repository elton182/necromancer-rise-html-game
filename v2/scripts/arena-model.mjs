// Arena Infinita (Arena clássica): regras calculáveis, sem mundo, DOM ou armazenamento.
// Fontes: startWave/endWave e o bloco "Modo Infinito" de necromancer-canvas.html, EquipmentModel.waveStats.
import EQ from './shared-equipment.mjs';
import {waveCount} from './campaign-rules.mjs';
export const LAST_WAVE=EQ.MAX_WAVE,FIRST_WAIT=3,BETWEEN_WAVES=5,SPAWN_RING=16,SAFE_DISTANCE=9;
export const MODES=['expedition','classic'];
// Recompensa por wave concluída, além do que os monstros deixam: ouro 3+2w, XP 20+8w.
export const reward=wave=>({gold:3+2*wave,xp:20+8*wave});
// Quantidade de inimigos: fórmula das ondas, limitada pelo máximo da wave.
export const waveSize=wave=>Math.min(waveCount(wave,1),EQ.waveStats(wave).maxEnemies);
// Instante de cada nascimento: de 0,6 a 1,2 s entre inimigos, como no jogo anterior.
export function spawnTimes(count,random){let t=0;return Array.from({length:count},()=>{const at=t;t+=.6+random()*.6;return at;});}
// Ponto na borda do campo, longe do jogador quando possível.
export function spawnPoint(random,avoid=null){
 let p;for(let i=0;i<12;i++){const a=random()*Math.PI*2;p={x:Math.cos(a)*SPAWN_RING,y:Math.sin(a)*SPAWN_RING};if(!avoid||Math.hypot(p.x-avoid.x,p.y-avoid.y)>=SAFE_DISTANCE)return p;}
 return p;
}
export const newRun=(progress)=>({kind:'arena',n:0,done:false,start:progress.selected,wave:progress.selected-1,completed:0,active:false,queue:[],wait:FIRST_WAIT,zones:[],mission:{label:'ARENA INFINITA',layout:'arena'}});
// Escolha da wave inicial: só entre as liberadas.
export function selectWave(progress,n){n=Math.floor(Number(n));return Number.isFinite(n)&&n>=1&&n<=progress.unlocked?EQ.progress({...progress,selected:n}):null;}
// Conclusão de uma wave: nova marca de recorde, próxima wave e recompensa fixa.
export function completeWave(progress,wave){
 const next=EQ.complete(progress,wave);return {progress:next,record:next.best>progress.best,reward:reward(wave)};
}
// Resumo mostrado ao sair: o recorde já foi gravado a cada wave concluída.
export function summary(run,progress){
 const done=run.completed,last=done?run.start+done-1:null;
 const name=run.kind==='expedition'?'Expedição':'Arena Infinita';
 if(!done)return name+' encerrada antes de concluir uma wave · recorde '+progress.best;
 return name+': waves '+run.start+'–'+last+' concluídas'+(last>=progress.best&&run.record?' — NOVO RECORDE!':' · recorde '+progress.best);
}
