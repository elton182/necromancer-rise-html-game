'use strict';
// Controles de configuração/teste vivem dentro do Relicário (diálogo fechado durante o jogo).
// Estes ajudantes agem direto no DOM, sem abrir o menu nem pausar a simulação; a visibilidade
// real do menu é conferida em ui-browser-check.cjs.
const select=(page,selector,value)=>page.$eval(selector,(e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},value);
const fill=select;
const click=(page,selector)=>page.$eval(selector,e=>e.click());
const check=(page,selector)=>page.$eval(selector,e=>{if(!e.checked){e.checked=true;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}});
module.exports={select,fill,click,check};
