'use strict';
const fs=require('node:fs'),path=require('node:path');
const canonical=repo=>fs.readFileSync(path.join(repo,'necromancer-canvas.html'),'utf8');
function readHudStyle(repo=path.resolve(__dirname,'../..')){
 const html=canonical(repo),start=html.indexOf('/* The Reliquary —'),end=html.indexOf('`; document.head.appendChild(st); }',start);
 if(start<0||end<0)throw Error('HUD canônico mudou; revisar adaptador de UI.');
 return '/* Gerado do Relicário em necromancer-canvas.html; não editar. */\n'+html.slice(start,end).trim()+'\n';
}
// Tela inicial: estilo (com a arte embutida em #tl.art) e posições dos botões sobre a arte.
function readTitleStyle(repo=path.resolve(__dirname,'../..')){
 const html=canonical(repo),start=html.indexOf('#tl{position:fixed;inset:0;z-index:60'),end=html.indexOf('`;\n  document.head.appendChild(st);\n  const root=document.createElement(\'div\'); root.id=\'tl\';',start);
 if(start<0||end<0||!html.slice(start,end).includes('#tl.art{background:#05000a url(data:image/webp'))throw Error('Tela inicial canônica mudou; revisar adaptador de UI.');
 return '/* Gerado da tela inicial em necromancer-canvas.html; não editar. */\n'+html.slice(start,end).trim()+'\n';
}
// Estilos do inventário (boneco, mochila, comparação) compartilhados com o jogo anterior.
function readEquipmentStyle(repo=path.resolve(__dirname,'../..')){
 return '/* Copiado de scripts/equipment.css; não editar. */\n'+fs.readFileSync(path.join(repo,'scripts','equipment.css'),'utf8');
}
module.exports={readHudStyle,readTitleStyle,readEquipmentStyle};
// Regras do menu do jogo anterior (scripts/menu.css) reaproveitadas no Relicário da v2:
// o invólucro `#tl.pz .pm.menu-standard` vira `#pause-dialog`; regras presas ao invólucro antigo são descartadas.
function readMenuStyle(repo=path.resolve(__dirname,'../..')){
 const source=fs.readFileSync(path.join(repo,'scripts','menu.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/#tl\.pz \.pm\.menu-standard /g,'#pause-dialog ');
 function keep(css){
  let out='',i=0;
  while(i<css.length){
   const open=css.indexOf('{',i);if(open<0)break;
   let depth=1,j=open+1;while(j<css.length&&depth){if(css[j]==='{')depth++;else if(css[j]==='}')depth--;j++;}
   const selector=css.slice(i,open).trim(),body=css.slice(open+1,j-1);
   if(selector.startsWith('@')){const inner=keep(body);if(inner)out+=selector+'{'+inner+'}\n';}
   else if(!selector.includes('#tl'))out+=selector+'{'+body+'}\n';
   i=j;
  }
  return out;
 }
 return '/* Derivado de scripts/menu.css; não editar. */\n'+keep(source);
}
module.exports.readMenuStyle=readMenuStyle;
// Retrato de Zephyr embutido no jogo anterior (PORT['zt']).
function readPortrait(repo=path.resolve(__dirname,'../..')){
 const m=/i\.src='(data:image\/webp;base64,[A-Za-z0-9+\/=]+)';\s*PORT\['zt'\]/.exec(canonical(repo));
 if(!m)throw Error('Retrato de Zephyr não encontrado no jogo canônico.');
 return '// Gerado de necromancer-canvas.html; não editar.\nexport default '+JSON.stringify(m[1])+';\n';
}
module.exports.readPortrait=readPortrait;
// Árvore de habilidades e maestrias do jogo anterior (scripts/skill-trees.css e skill-mastery.css).
// Regras presas ao invólucro antigo (`#tl`) ou aos tutoriais do jogo anterior são descartadas.
function readSkillStyle(repo=path.resolve(__dirname,'../..')){
 const read=name=>fs.readFileSync(path.join(repo,'scripts',name),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 const source=(read('skill-trees.css')+'\n'+read('skill-mastery.css')).replace(/#skill-tree\b/g,'#grimoire-content');
 function keep(css){
  let out='',i=0;
  while(i<css.length){
   const open=css.indexOf('{',i);if(open<0)break;
   let depth=1,j=open+1;while(j<css.length&&depth){if(css[j]==='{')depth++;else if(css[j]==='}')depth--;j++;}
   const selector=css.slice(i,open).trim(),body=css.slice(open+1,j-1);
   if(selector.startsWith('@')){const inner=keep(body);if(inner)out+=selector+'{'+inner+'}\n';}
   else if(!/#tl|#skill-level-tutorial|#skill-equip-tutorial|#hub-overlay|\.pm[a-z]*\b/.test(selector))out+=selector+'{'+body+'}\n';
   i=j;
  }
  return out;
 }
 return '/* Derivado de scripts/skill-trees.css e skill-mastery.css; não editar. */\n'+keep(source);
}
module.exports.readSkillStyle=readSkillStyle;
