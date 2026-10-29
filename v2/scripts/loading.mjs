// Tela de carregamento da v2. A marcação (#loading) está no template e aparece antes dos módulos;
// aqui ficam o progresso, as dicas e o encerramento. Não conhece o motor nem o renderizador.
export const TIPS=[
 'Esc abre o Relicário: Grimório, horda e equipamentos.',
 'Shift + botão direito ordena a horda; V reanima os caídos.',
 'C usa o Dash e protege você durante o movimento.',
 'Perda de foco pausa o jogo; volte e continue de onde parou.',
 'A roda do mouse ajusta o zoom da câmera.',
 'Cada abate rende XP às habilidades equipadas antes do personagem.'
];
// Fração 0–1 do carregamento: etapas fixas antes e depois dos modelos, que ocupam o miolo.
export function progressOf(done,total,{start=.1,end=.9}={}){
 if(!(total>0))return start;
 return start+(end-start)*Math.max(0,Math.min(1,done/total));
}
export function createLoading(doc=document){
 const root=doc.getElementById('loading');
 if(!root)return {step(){},tip(){},done(){},fail(){}};
 const bar=root.querySelector('#loading-bar'),label=root.querySelector('#loading-label'),tipEl=root.querySelector('#loading-tip');
 let ended=false,timer=0,tipIndex=Math.floor(Math.random()*TIPS.length);
 function step(fraction,text){
  if(ended)return;
  const percent=Math.round(Math.max(0,Math.min(1,fraction))*100);
  bar.style.width=percent+'%';root.setAttribute('aria-valuenow',String(percent));
  if(text)label.textContent=text;
 }
 function tip(){tipEl.textContent=TIPS[tipIndex++%TIPS.length];}
 function close(){ended=true;clearInterval(timer);}
 function done(){
  if(ended)return;
  step(1,'Pronto');close();root.classList.add('done');
  const remove=()=>root.remove();root.addEventListener('transitionend',remove,{once:true});setTimeout(remove,900);
 }
 function fail(){close();root.remove();}
 tip();timer=setInterval(tip,4500);
 return {step,tip,done,fail};
}
