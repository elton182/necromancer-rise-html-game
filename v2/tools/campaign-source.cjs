'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function expression(source,start,context={}){const at=source.indexOf(start);if(at<0)throw Error('Fonte E9 ausente: '+start);const from=at+start.length;for(let end=source.indexOf(';',from);end>=0;end=source.indexOf(';',end+1)){const text=source.slice(from,end);try{new vm.Script('('+text+')');}catch{continue;}return vm.runInNewContext('('+text+')',context,{timeout:1000});}throw Error('Expressão E9 inválida: '+start);}
function readCampaign(repo=path.resolve(__dirname,'../..')){
 const html=fs.readFileSync(path.join(repo,'necromancer-canvas.html'),'utf8'),read=(start,ctx)=>expression(html,start,ctx);
 const stageBody=html.match(/function stageMul\(\)\{([^\n]+)\}/)?.[1],waveCountExpression=html.match(/let count = ([^;]+);/)?.[1];if(!stageBody||!waveCountExpression)throw Error('Escala E9 mudou; revisar adaptador');
 const rooms=read('DNG.rooms=',{R:(id,x0,x1,y0,y1,waves)=>({id,x0,x1,y0,y1,waves})});
 const context={R_:(...r)=>({r}),NECRO_STYLE:{},sc_:(bg,r,o)=>({...r,bg,...o})};for(const m of html.matchAll(/s:([A-Z][A-Z_]+)/g))context[m[1]]={};const storySource=html.slice(html.indexOf('Object.assign(STORY,{')+'Object.assign(STORY,'.length);let stories;
 for(let i=storySource.indexOf(');');i>=0;i=storySource.indexOf(');',i+2)){try{new vm.Script('('+storySource.slice(0,i)+')');}catch{continue;}stories=vm.runInNewContext('('+storySource.slice(0,i)+')',context,{timeout:1000});break;}
 if(!stories)throw Error('História E9 ausente');
 const tutorials=read('const TUT_DEFS=',{K:t=>t});
 const clean=t=>t.replace(/<[^>]*>/g,'');
 return JSON.parse(JSON.stringify({stageBody,waveCountExpression,stages:read('const CAMP_STAGES='),doors:read('DNG.doors='),rooms,corridors:read('DNG.corr='),strip:read('STRIP.zones='),route:expression(html.slice(html.indexOf('function startVillageRoute(')),'STRIP.zones='),captain:read('const CAPTAIN='),npcs:read('const VIL_NPC='),missions:read('const MISSION_TEMPLATES = '),stories:Object.fromEntries(Object.entries(stories).map(([id,pages])=>[id,pages.flatMap(page=>page.panels.flatMap(p=>[p.cap?.t,p.title?.t,p.title?.sub,...(p.bubbles||[]).map(b=>b.t)].filter(Boolean))).map(clean)])),tutorials:Object.fromEntries(Object.entries(tutorials).map(([id,steps])=>[id,steps.map(s=>clean(s.t))]))}));
}
module.exports={readCampaign};

