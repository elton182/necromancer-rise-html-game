// Aba Waves do Relicário: escolha da wave liberada e do modelo, na Pedra do Infinito (vila).
import EQ from './shared-equipment.mjs';
import {reward,selectWave} from './arena-model.mjs';
export function createWavesPanel(s,{enter,mode,changed,valdoria=()=>{},available={}}){
 const host=document.getElementById('waves-content');
 const node=(tag,text,parent=host,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;parent.append(e);return e;};
 function render(){
  const p=s.save.character.waveProgress,village=s.scene==='village',stats=EQ.waveStats(p.selected),r=reward(p.selected);host.replaceChildren();
  const head=node('div',undefined,host,'gear-header');const title=node('div',undefined,head);node('small','PEDRA DO INFINITO',title);node('h2','Waves',title);node('span','Recorde concluído: '+p.best,head);
  node('p','Escolha uma wave desbloqueada. Repetir waves anteriores mantém seu recorde e reduz a dificuldade e o nível do loot.',host);
  const box=node('div',undefined,host,'gear-wave-info waves-mode'),label=node('label','Modelo de waves ',box),select=node('select',undefined,label);select.setAttribute('aria-label','Modelo de waves');
  for(const [value,name] of [['expedition','Expedição'],['classic','Arena clássica']]){const o=node('option',name+(available[value]?'':' (indisponível nesta versão)'),select);o.value=value;o.disabled=!available[value];}
  select.value=available[s.save.settings.waveMode]?s.save.settings.waveMode:'classic';select.disabled=!village;select.onchange=()=>mode(select.value);
  node('p','Expedição: mapa amplo por bioma, com encontros comuns, mágicos e raros e um boss ao final. Arena clássica: ondas de inimigos no campo aberto.',box);
  const picker=node('div',undefined,host,'waves-picker');picker.setAttribute('role','group');picker.setAttribute('aria-label','Waves liberadas');
  for(let n=1;n<=p.unlocked;n++){const b=node('button',String(n),picker,'btn');b.type='button';b.disabled=!village;b.dataset.wave=n;b.setAttribute('aria-label','Selecionar wave '+n);b.setAttribute('aria-pressed',String(p.selected===n));b.onclick=()=>{const next=selectWave(p,n);if(next){s.save.character.waveProgress=next;changed();render();}};}
  const info=node('div',undefined,host,'gear-wave-info waves-info');node('h3','Wave '+p.selected,info);
  node('p','Vida dos monstros ×'+stats.hp.toFixed(2)+' · dano ×'+stats.damage.toFixed(2)+' · loot nível '+stats.itemLevel,info);
  node('p','Conclusão: +'+r.xp+' XP e +'+r.gold+' ouro, além dos monstros. Loja: peças nível '+p.unlocked+'.',info);
  const go=node('button','Entrar na wave '+p.selected,info,'btn waves-enter');go.type='button';go.id='waves-enter';go.disabled=!village;go.onclick=()=>enter();
  const val=node('button','Conquistar Valdoria · Pântano',info,'btn waves-valdoria');val.type='button';val.disabled=!village;val.onclick=()=>valdoria();
  if(!village)node('p','As waves só podem ser iniciadas na Vila de Eldrin, pela Pedra do Infinito.',info,'section-note');
 }
 return {render};
}
