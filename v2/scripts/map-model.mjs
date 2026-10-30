// Mapas personalizados: dados puros (sem DOM nem Three.js). Um mapa é um documento JSON com objetos posicionados,
// ponto de início e pontos de inimigos. Pode ter um mapa base (`base`): herda dele os objetos, o bioma, o tamanho,
// o início e os inimigos, e só guarda o que mudou (objetos novos, objetos da base ocultos e campos substituídos).
// `resolveMap` achata a herança; `toArena` converte para a arena da v2 (colisores em `solids`, enfeites em `decor`).
import {PALETTES} from './expedition-map.mjs';
import {TRAINING_ARENA,overlaps} from './terrain.mjs';
import {forestArena} from './forest-map.mjs';

export const MAP_FORMAT='necromancer-rise-map',BUNDLE_FORMAT='necromancer-rise-maps',MAP_VERSION=1,STORAGE_KEY='necromancer_v2_maps';
export const LIMITS={minSize:12,maxSize:120,maxObjects:600,maxSpawns:24,maxCount:30,maxMaps:60,maxName:40,maxDepth:5,maxLevel:60,maxBytes:2e6};
export const ENEMY_TYPE_COUNT=11;
export const BIOMES={grave:'Cemitério',forest:'Floresta',desert:'Deserto',snow:'Tundra',village:'Vila',swamp:'Pântano',river:'Rio',mountain:'Montanha'};
export const DEFAULT_BIOME='forest';
// `dims`: campos editáveis (r raio, w largura, d profundidade, h altura, s escala). `solid`: vira colisor; os demais são só visuais.
// `look`: nome visual já entendido pelas cenas da floresta/expedição; sem `look`, o renderizador desenha um bloco liso.
export const PROPS={
 wall:{label:'Muro',group:'Colisores',shape:'box',solid:true,dims:['w','d','h'],w:4,d:.65,h:.9,color:'#8c9a8e'},
 pillar:{label:'Pilar',group:'Colisores',shape:'circle',solid:true,dims:['r','h'],r:.6,h:1.2,color:'#a3a79b'},
 log:{label:'Tronco caído',group:'Colisores',shape:'box',solid:true,look:'log',dims:['w','d','h'],w:3.6,d:.7,h:.7,color:'#8a6a45'},
 oak:{label:'Carvalho',group:'Colisores',shape:'circle',solid:true,look:'oak',dims:['r','h'],r:.5,h:5.2,color:'#4f9a45'},
 pine:{label:'Pinheiro',group:'Colisores',shape:'circle',solid:true,look:'pine',dims:['r','h'],r:.45,h:6,color:'#2f7a4a'},
 rock:{label:'Pedra',group:'Colisores',shape:'circle',solid:true,look:'rock',dims:['r','h'],r:.8,h:1.2,color:'#8b9086'},
 stump:{label:'Toco',group:'Colisores',shape:'circle',solid:true,look:'stump',dims:['r','h'],r:.4,h:.55,color:'#9a7248'},
 cactus:{label:'Cacto',group:'Colisores',shape:'circle',solid:true,look:'cactus',dims:['r','h'],r:.55,h:2.4,color:'#5fa04f'},
 column:{label:'Coluna',group:'Colisores',shape:'circle',solid:true,look:'column',dims:['r','h'],r:.55,h:3.2,color:'#d1c9b4'},
 ice:{label:'Gelo',group:'Colisores',shape:'circle',solid:true,look:'ice',dims:['r','h'],r:.55,h:1.6,color:'#a8d6ee'},
 ruin:{label:'Ruína',group:'Colisores',shape:'circle',solid:true,look:'ruin',dims:['r','h'],r:.55,h:1.8,color:'#a49e86'},
 house:{label:'Casa',group:'Colisores',shape:'circle',solid:true,look:'house',dims:['h'],r:2,h:3,color:'#b8805a'},
 bush:{label:'Arbusto',group:'Enfeites',shape:'circle',decor:'bushes',dims:['r'],r:.6,color:'#4d8a4a'},
 tomb:{label:'Lápide',group:'Enfeites',shape:'circle',decor:'misc',dims:['s'],r:.4,s:1,color:'#8d8d97'},
 skulls:{label:'Caveiras',group:'Enfeites',shape:'circle',decor:'misc',dims:['s'],r:.3,s:1,color:'#ece6d0'},
 barrel:{label:'Barril',group:'Enfeites',shape:'circle',decor:'misc',dims:['s'],r:.35,s:1,color:'#7a5632'},
 crate:{label:'Caixa',group:'Enfeites',shape:'circle',decor:'misc',dims:['s'],r:.4,s:1,color:'#a07a45'},
 brazier:{label:'Brasa',group:'Enfeites',shape:'circle',decor:'braziers',dims:[],r:.3,color:'#ffa94d'},
 water:{label:'Água',group:'Chão',shape:'circle',decor:'water',dims:['r'],r:3,color:'#487d87'},
 path:{label:'Trilha',group:'Chão',shape:'circle',decor:'path',dims:['r'],r:1.5,color:'#8a7650'}
};
export const PROP_TYPES=Object.keys(PROPS);
export const BUILTIN_BASES={'builtin:training':'Campo de treino','builtin:forest':'Floresta de Eldrin'};
export const isBuiltin=ref=>typeof ref==='string'&&ref.startsWith('builtin:');
export const mapRef=id=>'map:'+id;

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=(v,d)=>Number.isFinite(+v)&&v!==null&&v!==''?+v:d;
const round=v=>Math.round(v*20)/20;
const text=(v,n)=>String(v??'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,n);
export function makeId(prefix='m',random=Math.random){return prefix+Date.now().toString(36).slice(-4)+Math.floor(random()*36**4).toString(36).padStart(4,'0');}

// --- Normalização ---
export const centered=size=>({minX:-size.w/2,maxX:size.w/2,minY:-size.h/2,maxY:size.h/2});
function normalizeSize(v,fallback){
 if(v==null)return fallback;
 return {w:clamp(round(num(v.w,fallback?.w??40)),LIMITS.minSize,LIMITS.maxSize),h:clamp(round(num(v.h,fallback?.h??40)),LIMITS.minSize,LIMITS.maxSize)};
}
const point=(v,fallback)=>v==null?fallback:{x:round(num(v.x,0)),y:round(num(v.y,0))};
// Corrige um objeto sem lançar erro; devolve null para tipo desconhecido.
export function normalizeObject(raw,taken=new Set()){
 const def=PROPS[raw?.type];if(!def)return null;
 let id=text(raw.id,32);if(!id||taken.has(id))do id=makeId('o');while(taken.has(id));taken.add(id);
 const o={id,type:raw.type,x:round(num(raw.x,0)),y:round(num(raw.y,0))};
 if(def.shape==='box'){o.w=clamp(round(num(raw.w,def.w)),.2,60);o.d=clamp(round(num(raw.d,def.d)),.2,60);}else o.r=clamp(round(num(raw.r,def.r)),.1,12);
 if(def.dims.includes('h'))o.h=clamp(round(num(raw.h,def.h)),.1,12);
 if(def.dims.includes('s'))o.s=clamp(round(num(raw.s,def.s)),.4,3);
 return o;
}
export function normalizeSpawn(raw,taken=new Set()){
 let id=text(raw?.id,32);if(!id||taken.has(id))do id=makeId('s');while(taken.has(id));taken.add(id);
 return {id,x:round(num(raw?.x,0)),y:round(num(raw?.y,0)),count:clamp(Math.floor(num(raw?.count,4)),1,LIMITS.maxCount),type:clamp(Math.floor(num(raw?.type,0)),0,ENEMY_TYPE_COUNT-1)};
}
// Aceita qualquer valor; nunca lança. `problems` lista o que foi descartado ou corrigido.
export function normalizeMap(raw){
 const problems=[];
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return {map:null,problems:['O arquivo não contém um mapa.']};
 if(raw.version!==undefined&&num(raw.version,1)>MAP_VERSION)problems.push('Mapa de uma versão mais nova do jogo; alguns campos podem ser ignorados.');
 const base=typeof raw.base==='string'&&(isBuiltin(raw.base)?raw.base in BUILTIN_BASES:raw.base.startsWith('map:')&&raw.base.length>4)?raw.base:null;
 if(raw.base&&!base)problems.push('Mapa base desconhecido: ignorado.');
 const taken=new Set(),objects=[];
 for(const item of Array.isArray(raw.objects)?raw.objects:[]){
  if(objects.length>=LIMITS.maxObjects){problems.push('Limite de '+LIMITS.maxObjects+' objetos: o excedente foi descartado.');break;}
  const o=normalizeObject(item,taken);if(o)objects.push(o);else problems.push('Objeto de tipo desconhecido descartado.');
 }
 const spawnIds=new Set(),spawns=raw.spawns==null?(base?null:[]):(Array.isArray(raw.spawns)?raw.spawns:[]).slice(0,LIMITS.maxSpawns).map(s=>normalizeSpawn(s,spawnIds));
 const size=normalizeSize(raw.size,base?null:{w:40,h:40}),biome=raw.biome in BIOMES?raw.biome:(raw.biome==null&&base?null:DEFAULT_BIOME);
 const map={
  format:MAP_FORMAT,version:MAP_VERSION,id:text(raw.id,40)||makeId(),name:text(raw.name,LIMITS.maxName)||'Mapa sem nome',
  base,hidden:base?[...new Set((Array.isArray(raw.hidden)?raw.hidden:[]).map(v=>text(v,32)).filter(Boolean))]:[],
  biome,size,start:point(raw.start,base?null:{x:0,y:round((size?.h??40)/2-5)}),spawns,
  level:clamp(Math.floor(num(raw.level,1)),1,LIMITS.maxLevel),objects,updated:Number.isFinite(+raw.updated)?+raw.updated:0
 };
 return {map,problems};
}
export function blankMap(name='Novo mapa',{biome=DEFAULT_BIOME,size={w:40,h:40},base=null}={}){
 return normalizeMap({name,biome:base?null:biome,size:base?null:size,base,start:null,spawns:base?null:[],objects:[]}).map;
}

// --- Mapas embutidos (usados como base) ---
const FOREST_LOOKS={oak:'oak',pine:'pine',rock:'rock',stump:'stump',log:'log'};
function fromSolids(prefix,solids){
 return solids.map((s,i)=>{
  const circle=s.kind==='circle',type=FOREST_LOOKS[s.look]||(circle?'pillar':'wall');
  return normalizeObject(circle?{id:prefix+'-'+i,type,x:s.x,y:s.y,r:s.r,h:s.height}:{id:prefix+'-'+i,type,x:s.x,y:s.y,w:s.width,d:s.depth,h:s.height})
 }).filter(Boolean).map((o,i)=>({...o,id:prefix+'-'+i}));
}
export function builtinMap(ref){
 if(ref==='builtin:training')return {...normalizeMap({id:ref,name:BUILTIN_BASES[ref],biome:'grave',size:{w:30,h:30},start:{x:0,y:10},spawns:[{x:0,y:-8,count:4,type:0}]}).map,objects:fromSolids('training',TRAINING_ARENA.solids)};
 if(ref==='builtin:forest')return {...normalizeMap({id:ref,name:BUILTIN_BASES[ref],biome:'forest',size:{w:40,h:40},start:{x:0,y:10},spawns:[{x:0,y:-5,count:6,type:0}]}).map,objects:fromSolids('forest',forestArena().solids)};
 return null;
}

// --- Herança ---
// `lookup(id)` devolve o mapa guardado (ou null). Resultado: mapa achatado com `inherited` por objeto e `chain` (ids da base ao filho).
export function resolveMap(map,lookup=()=>null,seen=new Set(),depth=0){
 const warnings=[];
 let parent=null;
 if(map.base){
  const key=map.base;
  if(seen.has(map.id)||depth>=LIMITS.maxDepth)warnings.push(seen.has(map.id)?'Herança circular: a base foi ignorada.':'Cadeia de bases muito longa: a base foi ignorada.');
  else if(isBuiltin(key)){const doc=builtinMap(key);if(doc)parent={map:doc,warnings:[],chain:[key]};}
  else{const doc=lookup(key.slice(4));if(doc)parent=resolveMap(doc,lookup,new Set([...seen,map.id]),depth+1);else warnings.push('O mapa base não existe mais: o mapa foi tratado como independente.');}
 }
 const hidden=new Set(map.hidden||[]),inherited=parent?parent.map.objects.filter(o=>!hidden.has(o.id)).map(o=>({...o,inherited:true})):[];
 const size=map.size||parent?.map.size||{w:40,h:40},biome=map.biome||parent?.map.biome||DEFAULT_BIOME;
 const start=map.start||parent?.map.start||{x:0,y:round(size.h/2-5)},spawns=map.spawns||parent?.map.spawns||[];
 return {map:{...map,size,biome,start,spawns,objects:[...inherited,...map.objects.map(o=>({...o,inherited:false}))],baseObjects:parent?parent.map.objects:[],hasBase:!!parent},warnings:[...(parent?.warnings||[]),...warnings],chain:[...(parent?.chain||[]),mapRef(map.id)]};
}
// Copia tudo da base para o próprio mapa e remove o vínculo.
export function detach(map,lookup){
 const {map:flat}=resolveMap(map,lookup),taken=new Set();
 return {...map,base:null,hidden:[],size:flat.size,biome:flat.biome,start:flat.start,spawns:flat.spawns.map(s=>normalizeSpawn(s,taken)),objects:flat.objects.map(o=>{const {inherited,...rest}=o;return rest;})};
}
// Ids de mapas que dependem (direta ou indiretamente) de `id`.
export function dependents(id,maps){
 const out=new Set(),visit=ref=>{for(const m of maps)if(m.base===ref&&!out.has(m.id)){out.add(m.id);visit(mapRef(m.id));}};visit(mapRef(id));return [...out];
}

// --- Arena ---
function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const GREEN=new Set(['forest','village','swamp']);
// Converte um mapa já resolvido. O cenário usa o tema `expedition` (paleta do bioma + peças por `look`).
export function toArena(map){
 const bounds=centered(map.size),solids=[],decor={trees:[],bushes:[],grass:[],flowers:[],mushrooms:[],patches:[],path:[],misc:[],braziers:[],water:[]};
 const random=rng(hash(map.id)),rnd=(a,b)=>a+(b-a)*random(),tone=()=>+random().toFixed(2);
 for(const o of map.objects){
  const def=PROPS[o.type];if(!def)continue;
  if(def.solid){
   const s=def.shape==='box'?{kind:'box',x:o.x,y:o.y,width:o.w,depth:o.d,height:o.h}:{kind:'circle',x:o.x,y:o.y,r:o.r,height:o.h};
   if(def.look)s.look=def.look;if(def.look!=='log')s.tone=tone();solids.push(s);
  }else if(def.decor==='bushes')decor.bushes.push({x:o.x,y:o.y,size:o.r,tone:tone()});
  else if(def.decor==='misc')decor.misc.push({look:o.type,x:o.x,y:o.y,size:o.s??1,tone:tone(),tilt:+rnd(-.5,.5).toFixed(2),w:+rnd(.7,1.1).toFixed(2),v:Math.floor(random()*3)});
  else if(def.decor==='braziers')decor.braziers.push({x:o.x,y:o.y});
  else if(def.decor==='water')decor.water.push({x:o.x,y:o.y,r:o.r});
  else if(def.decor==='path')decor.path.push({x:o.x,y:o.y,r:o.r});
 }
 // Cobertura do chão: sorteada de forma determinística pelo id; não nasce sobre colisores nem sobre a trilha.
 const area=map.size.w*map.size.h,free=(x,y,r)=>!solids.some(s=>s.kind==='circle'?Math.hypot(x-s.x,y-s.y)<s.r+r:Math.abs(x-s.x)<s.width/2+r&&Math.abs(y-s.y)<s.depth/2+r)&&!decor.path.some(p=>Math.hypot(x-p.x,y-p.y)<p.r)&&!decor.water.some(p=>Math.hypot(x-p.x,y-p.y)<p.r);
 const scatter=(list,count,make,pad)=>{for(let n=0,t=0;n<count&&t<count*6;t++){const x=rnd(bounds.minX+pad,bounds.maxX-pad),y=rnd(bounds.minY+pad,bounds.maxY-pad);if(!free(x,y,.1))continue;list.push(make(+x.toFixed(2),+y.toFixed(2)));n++;}};
 if(GREEN.has(map.biome)){
  scatter(decor.grass,Math.min(900,Math.round(area*.05)),(x,y)=>({x,y,height:+rnd(.2,.5).toFixed(2),tone:tone()}),1);
  scatter(decor.patches,Math.min(60,Math.round(area*.0035)),(x,y)=>({x,y,r:+rnd(1.2,3.2).toFixed(2),tone:tone()}),2);
  if(map.biome==='forest')scatter(decor.flowers,Math.min(160,Math.round(area*.012)),(x,y)=>({x,y,tone:tone()}),1);
 }
 return {id:'custom-'+map.id,theme:'expedition',custom:true,name:map.name,palette:PALETTES[map.biome],biome:map.biome,bounds,solids,decor};
}

// --- Verificação ---
// Varredura em grade a partir do início: quais pontos o personagem (raio 0,45) consegue alcançar.
export function reachable(arena,start,{radius=.45,step=.5}={}){
 const b=arena.bounds,key=(i,j)=>i+','+j,seen=new Set(),pos=(i,j)=>({x:b.minX+radius+i*step,y:b.minY+radius+j*step});
 const si=Math.max(0,Math.round((start.x-b.minX-radius)/step)),sj=Math.max(0,Math.round((start.y-b.minY-radius)/step)),queue=[[si,sj]];
 if(overlaps(pos(si,sj),radius,arena))return {seen,step,radius,origin:pos(0,0),blocked:true};
 seen.add(key(si,sj));
 for(let k=0;k<queue.length;k++){
  const [i,j]=queue[k];
  for(const [di,dj]of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj,id=key(ni,nj);if(seen.has(id))continue;const p=pos(ni,nj);if(p.x>b.maxX-radius||p.y>b.maxY-radius||p.x<b.minX+radius||p.y<b.minY+radius||overlaps(p,radius,arena))continue;seen.add(id);queue.push([ni,nj]);}
 }
 return {seen,step,radius,origin:pos(0,0),blocked:false};
}
export function canReach(r,p){
 // Tolera o ponto cair em cima de um colisor: basta uma célula vizinha alcançável.
 const i=Math.round((p.x-r.origin.x)/r.step),j=Math.round((p.y-r.origin.y)/r.step);
 for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++)if(r.seen.has((i+di)+','+(j+dj)))return true;return false;
}
// Lista de avisos para o editor: {level:'erro'|'aviso'|'info',text}.
export function analyze(map,lookup=()=>null){
 const out=[],{map:flat,warnings}=resolveMap(map,lookup),b=centered(flat.size);
 for(const w of warnings)out.push({level:'aviso',text:w});
 const arena=toArena(flat),inside=p=>p.x>=b.minX&&p.x<=b.maxX&&p.y>=b.minY&&p.y<=b.maxY;
 const outside=flat.objects.filter(o=>!inside(o)).length;if(outside)out.push({level:'aviso',text:outside+' objeto(s) com o centro fora dos limites do mapa.'});
 if(!inside(flat.start))out.push({level:'erro',text:'O ponto de início está fora do mapa.'});
 else if(overlaps(flat.start,.45,arena))out.push({level:'aviso',text:'O início está sobre um colisor; o jogador será empurrado para o espaço livre mais próximo.'});
 if(!flat.spawns.length)out.push({level:'info',text:'Sem pontos de inimigos: o mapa será jogado vazio.'});
 else if(inside(flat.start)){
  const r=reachable(arena,flat.start),bad=flat.spawns.filter(s=>!canReach(r,s));
  if(r.blocked)out.push({level:'erro',text:'O jogador começa preso: não há espaço livre ao redor do início.'});
  else if(bad.length)out.push({level:'aviso',text:bad.length+' ponto(s) de inimigos parecem isolados do início por obstáculos.'});
 }
 if(flat.objects.length>LIMITS.maxObjects*.8)out.push({level:'aviso',text:'Muitos objetos: o limite é '+LIMITS.maxObjects+'.'});
 return out;
}

// --- Biblioteca (armazenamento injetável; separado do save, como o áudio) ---
export function createLibrary(storage,key=STORAGE_KEY){
 const fail=message=>({ok:false,message});
 function load(){
  let raw;try{raw=storage.getItem(key);}catch{return {maps:[],status:'unavailable'};}
  if(!raw)return {maps:[],status:'ok'};
  try{const data=JSON.parse(raw),taken=new Set(),maps=[];for(const item of Array.isArray(data?.maps)?data.maps:[]){const {map}=normalizeMap(item);if(map&&!taken.has(map.id)){taken.add(map.id);maps.push(map);}}return {maps,status:'ok'};}
  catch{return {maps:[],status:'invalid'};}
 }
 function persist(maps){
  const body=JSON.stringify({version:MAP_VERSION,maps});if(body.length>LIMITS.maxBytes)return fail('A biblioteca de mapas ficou grande demais. Exclua ou exporte mapas antigos.');
  try{storage.setItem(key,body);return {ok:true};}catch{return fail('Não foi possível gravar os mapas neste navegador (armazenamento cheio ou bloqueado).');}
 }
 const api={
  status:()=>load().status,
  list:()=>load().maps,
  get:id=>load().maps.find(m=>m.id===id)||null,
  lookup:id=>api.get(id),
  save(map,now=Date.now()){
   const {map:clean}=normalizeMap(map);if(!clean)return fail('Mapa inválido.');
   const current=load();if(current.status==='invalid')return fail('A biblioteca guardada está corrompida; exporte ou limpe-a antes de salvar.');
   const maps=current.maps,i=maps.findIndex(m=>m.id===clean.id);if(i<0&&maps.length>=LIMITS.maxMaps)return fail('Limite de '+LIMITS.maxMaps+' mapas atingido.');
   if(clean.base===mapRef(clean.id)||dependents(clean.id,maps).some(id=>mapRef(id)===clean.base))return fail('Um mapa não pode usar a si mesmo (ou um mapa que depende dele) como base.');
   const saved={...clean,updated:now};if(i<0)maps.push(saved);else maps[i]=saved;
   const result=persist(maps);return result.ok?{ok:true,map:saved}:result;
  },
  remove(id){
   const maps=load().maps,users=maps.filter(m=>m.base===mapRef(id));
   if(users.length)return fail('Estes mapas usam este como base: '+users.map(m=>m.name).join(', ')+'. Abra-os no editor e escolha outra base, ou «Sem base» (copia a base para eles), antes de excluir.');
   return persist(maps.filter(m=>m.id!==id));
  },
  duplicate(id,now=Date.now()){
   const m=api.get(id);if(!m)return fail('Mapa não encontrado.');
   return api.save({...m,id:makeId(),name:text(m.name+' (cópia)',LIMITS.maxName)},now);
  },
  // Cria um mapa novo que herda deste (ligação viva).
  variant(id,now=Date.now()){
   const m=id.startsWith('builtin:')?builtinMap(id):api.get(id);if(!m)return fail('Mapa não encontrado.');
   return api.save(blankMap(text(m.name+' (variação)',LIMITS.maxName),{base:id.startsWith('builtin:')?id:mapRef(id)}),now);
  },
  // Exporta o mapa junto com as bases personalizadas de que ele depende.
  exportJson(id){
   const maps=load().maps,out=[];let m=maps.find(x=>x.id===id);
   while(m&&!out.some(x=>x.id===m.id)&&out.length<=LIMITS.maxDepth){out.unshift(m);m=m.base&&!isBuiltin(m.base)?maps.find(x=>mapRef(x.id)===m.base):null;}
   return out.length?JSON.stringify({format:BUNDLE_FORMAT,version:MAP_VERSION,maps:out},null,1):null;
  },
  // Importa um mapa ou pacote. Ids já usados ganham novo id e as referências do pacote são reescritas.
  importJson(textValue,now=Date.now()){
   let data;try{data=JSON.parse(textValue);}catch{return fail('O arquivo não é um JSON válido.');}
   const items=Array.isArray(data?.maps)?data.maps:data&&typeof data==='object'?[data]:[];if(!items.length)return fail('O arquivo não contém mapas.');
   const current=load();if(current.status==='invalid')return fail('A biblioteca guardada está corrompida; exporte ou limpe-a antes de importar.');
   const maps=current.maps,used=new Set(maps.map(m=>m.id)),rename=new Map(),imported=[],problems=[];
   for(const item of items.slice(0,LIMITS.maxDepth+1)){
    const {map,problems:p}=normalizeMap(item);if(!map)continue;problems.push(...p);
    if(used.has(map.id)){const id=makeId();rename.set(map.id,id);map.id=id;}used.add(map.id);imported.push(map);
   }
   if(!imported.length)return fail('O arquivo não contém mapas válidos.');
   if(maps.length+imported.length>LIMITS.maxMaps)return fail('Limite de '+LIMITS.maxMaps+' mapas atingido.');
   for(const m of imported){if(m.base&&!isBuiltin(m.base)){const to=rename.get(m.base.slice(4));if(to)m.base=mapRef(to);}maps.push({...m,updated:now});}
   const result=persist(maps);return result.ok?{ok:true,maps:imported,problems,message:imported.length+' mapa(s) importado(s).'}:result;
  }
 };
 return api;
}

// --- Modelos iniciais para "Novo mapa" ---
export const TEMPLATES=[
 {id:'open',name:'Campo aberto',make:()=>blankMap('Campo aberto')},
 {id:'pillars',name:'Arena de pilares',make(){
  const m=blankMap('Arena de pilares',{biome:'grave'}),objects=[];
  for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;objects.push({type:'pillar',x:Math.cos(a)*8,y:Math.sin(a)*8,r:.7,h:1.4});}
  objects.push({type:'wall',x:0,y:0,w:6,d:.65,h:.9},{type:'wall',x:0,y:0,w:.65,d:6,h:.9});
  return normalizeMap({...m,spawns:[{x:0,y:-12,count:6,type:0},{x:12,y:0,count:3,type:1}],objects}).map;
 }},
 {id:'corridor',name:'Corredor com obstáculos',make(){
  const m=blankMap('Corredor',{biome:'mountain',size:{w:80,h:24}}),objects=[{type:'wall',x:0,y:-8,w:80,d:.8,h:1.4},{type:'wall',x:0,y:8,w:80,d:.8,h:1.4}];
  for(let x=-24;x<=24;x+=12)objects.push({type:'rock',x,y:x%24?2.5:-2.5,r:1.1,h:1.4});
  return normalizeMap({...m,start:{x:-34,y:0},spawns:[{x:20,y:0,count:8,type:0},{x:34,y:0,count:2,type:2}],objects}).map;
 }}
];
