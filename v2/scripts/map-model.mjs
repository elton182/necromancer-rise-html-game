import {prologueMapData} from './prologue-map-data.mjs';
import {campaignWorldMap} from './campaign-world-map.mjs';
import {itaunaMap,fortMap,caveMap} from './itauna-map.mjs';
// Mapas personalizados: dados puros (sem DOM nem Three.js). Um mapa é um documento JSON com objetos posicionados,
// ponto de início e pontos de inimigos. Pode ter um mapa base (`base`): herda dele os objetos, o bioma, o tamanho,
// o início e os inimigos, e só guarda o que mudou (objetos novos, objetos da base ocultos e campos substituídos).
// `resolveMap` achata a herança; `toArena` converte para a arena da v2 (colisores em `solids`, enfeites em `decor`).
import {PALETTES} from './expedition-map.mjs';
import {TRAINING_ARENA,overlaps,solidDistance} from './terrain.mjs';
import {forestArena} from './forest-map.mjs';
import {normalizeTerrain,bakeTerrain,heightAt,TERRAIN_RULES} from './map-terrain.mjs';

export const MAP_FORMAT='necromancer-rise-map',BUNDLE_FORMAT='necromancer-rise-maps',MAP_VERSION=1,STORAGE_KEY='necromancer_v2_maps';
export const LIMITS={minSize:12,maxSize:360,maxObjects:2000,maxSpawns:40,maxCount:30,maxMaps:60,maxName:40,maxDepth:5,maxLevel:60,maxBytes:4e6};
export const ENEMY_TYPE_COUNT=11;
export const BIOMES={cave:'Caverna',grave:'Cemitério',forest:'Floresta',desert:'Deserto',snow:'Tundra',village:'Vila',swamp:'Pântano',river:'Rio',mountain:'Montanha'};
export const DEFAULT_BIOME='forest';
// `dims`: campos editáveis (r raio, w largura, d profundidade, h altura, s escala). `solid`: vira colisor; os demais são só visuais.
// `look`: nome visual já entendido pelas cenas da floresta/expedição; sem `look`, o renderizador desenha um bloco liso.
export const PROPS={
 caravan:{label:'Carroça da caravana',group:'Caravana',shape:'box',solid:true,look:'caravan',dims:['w','d','h'],w:2.8,d:5.2,h:2,color:'#b98b58'},
 road_block:{label:'Bloqueio da estrada',group:'Caravana',shape:'circle',decor:'misc',dims:[],r:3.5,color:'#875738'},
 cave_wall:{label:'Parede rochosa da caverna',group:'Caverna',shape:'box',solid:true,look:'cave-boundary',dims:['w','d','h'],w:5,d:8,h:2.6,color:'#82796a'},
 hideout_table:{label:'Mesa de ordens dos salteadores',group:'Caverna',shape:'box',solid:true,look:'hideout-table',dims:['w','d','h'],w:1.8,d:1.1,h:1,color:'#b89362'},
 hideout_cargo:{label:'Depósito de carga roubada',group:'Caverna',shape:'box',solid:true,look:'hideout-cargo',dims:['w','d','h'],w:2,d:1.5,h:1.6,color:'#a08b63'},
 hideout_bedroll:{label:'Leito improvisado',group:'Caverna',shape:'circle',decor:'misc',dims:['s'],r:.8,s:1,color:'#79735d'},
 cave_support:{label:'Escoramento da galeria',group:'Caverna',shape:'circle',decor:'misc',dims:['s'],r:1,s:1,color:'#79664c'},
 cave_spire:{label:'Formação rochosa da caverna',group:'Caverna',shape:'circle',solid:true,look:'cave-spire',dims:['r','h'],r:.55,h:1.8,color:'#68665f'},
 fall_debris:{label:'Destroços da queda',group:'Caverna',shape:'circle',decor:'misc',dims:[],r:1.3,color:'#827568'},
 capture_note:{label:'Lista de captura',group:'Caverna',shape:'circle',decor:'misc',dims:[],r:.45,color:'#e2c899'},
 cave_exit:{label:'Marco da saída da caverna',group:'Caverna',shape:'circle',decor:'misc',dims:[],r:1.6,color:'#a9ddc9'},
 crypt_floor:{label:'Piso de lajes da cripta',group:'Cripta',shape:'circle',decor:'misc',dims:['s'],r:.5,s:1,color:'#898495'},
 sarcophagus:{label:'Sarcófago aberto',group:'Cripta',shape:'circle',decor:'misc',dims:['s'],r:.5,s:1,color:'#898495'},
 crypt_bench:{label:'Banco funerário',group:'Cripta',shape:'circle',decor:'misc',dims:['s'],r:.5,s:1,color:'#898495'},
 crypt_altar:{label:'Altar com velas',group:'Cripta',shape:'circle',decor:'misc',dims:['s'],r:.5,s:1,color:'#898495'},
 crypt_shelf:{label:'Estante de arquivos',group:'Cripta',shape:'circle',decor:'misc',dims:['s'],r:.5,s:1,color:'#898495'},

 cryptwall:{label:'Muro de cripta com vitral',group:'Colisores',shape:'box',solid:true,look:'cryptwall',dims:['w','d','h'],w:4,d:.7,h:8,color:'#7c7793'},
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
 path:{label:'Trilha',group:'Chão',shape:'circle',decor:'path',dims:['r'],r:1.5,color:'#8a7650'},
 path_square:{label:'Trilha de cantos retos',group:'Chão',shape:'box',decor:'pathBox',dims:['w','d'],w:4,d:4,rotates:true,pickH:.05,color:'#8a7650'}
};
// Peças de kit: `kit` nomeia modelo e peça; as medidas padrão são as da peça no GLB, e o objeto escala em relação a elas.
const kitProp=(model,part,label,group,extra)=>({label,group,kit:{model,part},dims:[],color:'#9a9486',shape:'circle',r:.5,...extra});
const solidCircle=(r,h)=>({solid:true,shape:'circle',dims:['r','h'],r,h}),solidBox=(w,d,h)=>({solid:true,shape:'box',dims:['w','d','h'],w,d,h}),decor=(r=.5)=>({shape:'circle',dims:['s'],r,s:1});
Object.assign(PROPS,{
 bridge:kitProp('mapKit','bridge','Ponte de madeira','Água',{shape:'box',dims:['w','d'],pickH:1.4,w:10,d:3.2,bridge:true,float:true,color:'#a07a45'}),
 stone_bridge:kitProp('mapKit','stone_bridge','Ponte de pedra','Água',{shape:'box',dims:['w','d'],pickH:1.4,w:12,d:4,bridge:true,float:true,color:'#8b8d86'}),
 dock:kitProp('mapKit','dock','Píer','Água',{shape:'box',dims:['w','d'],pickH:.8,w:7,d:2.6,bridge:true,flat:true,float:true,color:'#8a6a45'}),
 reeds:kitProp('mapKit','reeds','Juncos','Água',{...decor(.7),pickH:1.3,color:'#6d8a48'}),
 lily:kitProp('mapKit','lily','Nenúfares','Água',{...decor(.9),float:true,color:'#4f9a55'}),
 stepping:kitProp('mapKit','stepping','Pedras de travessia','Água',{...decor(1.2),color:'#8b8d86'}),
 shore_rock:kitProp('mapKit','shore_rock','Pedra de margem','Água',{...solidCircle(.8,.7),color:'#7c8079'}),
 cliff:kitProp('mapKit','cliff','Rochedo','Relevo',{...solidCircle(2,3.6),color:'#6e6c66'}),
 boulder:kitProp('mapKit','boulder','Matacão','Relevo',{...solidCircle(1.1,1.5),color:'#7d7f78'}),
 cairn:kitProp('mapKit','cairn','Pilha de pedras','Relevo',{...solidCircle(.5,.9),color:'#8d8f88'}),
 tent:kitProp('mapKit','tent','Tenda','Acampamento',{...solidCircle(1.6,2.2),color:'#b39a6c'}),
 campfire:kitProp('mapKit','campfire','Fogueira','Acampamento',{...solidCircle(.55,.6),color:'#d9843a'}),
 palisade:kitProp('mapKit','palisade','Paliçada','Acampamento',{...solidBox(4,.5,2.4),color:'#7a5a38'}),
 watchtower:kitProp('mapKit','watchtower','Torre de vigia','Acampamento',{...solidCircle(1.4,6),color:'#7a5a38'}),
 hay:kitProp('mapKit','hay','Fardo de feno','Acampamento',{...solidCircle(.6,.9),color:'#c9a94f'}),
 log_pile:kitProp('mapKit','log_pile','Pilha de toras','Acampamento',{...solidBox(3,1.4,1.2),color:'#7a5a38'}),
 stone_wall:kitProp('mapKit','stone_wall','Muro de pedra','Ruínas',{...solidBox(4,.8,1.6),color:'#85857c'}),
 arch:kitProp('mapKit','arch','Arco de pedra','Ruínas',{...decor(2.2),pickH:3.6,color:'#9b9a90'}),
 broken_column:kitProp('mapKit','broken_column','Coluna partida','Ruínas',{...solidCircle(.7,1.8),color:'#b3ac98'}),
 statue:kitProp('mapKit','statue','Estátua velada','Ruínas',{...solidCircle(.8,3.4),color:'#8f8e88'}),
 obelisk:kitProp('mapKit','obelisk','Obelisco rúnico','Ruínas',{...solidCircle(.7,4.4),color:'#5e5a6e'}),
 grave_cross:kitProp('mapKit','grave_cross','Cruz de sepultura','Ruínas',{...decor(.4),color:'#8d8d97'}),
 dead_tree:kitProp('mapKit','dead_tree','Árvore morta','Natureza',{...solidCircle(.4,4.5),color:'#5c4a3a'}),
 fern:kitProp('mapKit','fern','Samambaia','Natureza',{...decor(.6),color:'#4f8a3f'}),
 mushrooms:kitProp('mapKit','mushrooms','Cogumelos','Natureza',{...decor(.4),color:'#b8574a'}),
 signpost:kitProp('mapKit','signpost','Placa de caminho','Povoado',{...solidCircle(.2,2),color:'#8a6a45'}),
 market_stall:kitProp('mapKit','market_stall','Barraca de feira','Povoado',{...solidBox(3,2,2.4),color:'#a8563f'}),
 bench:kitProp('mapKit','bench','Banco de madeira','Povoado',{...decor(.7),color:'#8a6a45'}),
 well:kitProp('villageKit','well','Poço','Povoado',{...solidCircle(1,2.7),color:'#8d8f88'}),
 lamp:kitProp('villageKit','lamp','Poste com lanterna','Povoado',{...solidCircle(.18,2.7),color:'#c9a94f'}),
 fence:kitProp('mapKit','fence','Cerca','Povoado',{...solidBox(3,.2,1),color:'#8a6a45'}),
 ruined_well:kitProp('ruinedVillageKit','well','Poço abandonado','Ruínas',{...solidCircle(1,2.7),color:'#7d7f78'}),
 ruined_lamp:kitProp('ruinedVillageKit','lamp','Poste apagado','Ruínas',{...solidCircle(.18,2.7),color:'#6e6c66'}),
 open_cart:kitProp('caravanKit','caravan_open','Carroça aberta','Povoado',{...solidBox(3,5.3,1.5),color:'#b98b58'}),
 wheel:kitProp('caravanKit','caravan_wheel','Roda solta','Povoado',{...decor(.65),color:'#7a5632'}),
 banner:kitProp('caravanKit','bandit_banner','Estandarte','Acampamento',{...decor(.4),pickH:2.8,color:'#a8423a'}),
 flowers:kitProp('natureKit','flowers','Flores','Natureza',{...decor(.5),scale:2.5,color:'#d9a0c0'}),
 grass_tuft:kitProp('natureKit','grass','Tufo de grama','Natureza',{...decor(.4),color:'#6d9a48'}),
 mossy_tomb_a:kitProp('swampKit','tomb_0','Lápide musgosa','Ruínas',{...decor(.5),color:'#6f7a68'}),
 mossy_tomb_b:kitProp('swampKit','tomb_1','Lápide caída','Ruínas',{...decor(.5),color:'#6f7a68'}),
 mossy_tomb_c:kitProp('swampKit','tomb_2','Lápide partida','Ruínas',{...decor(.5),color:'#6f7a68'}),
 rubble:kitProp('caveFallKit','collapse_chunk','Escombro','Caverna',{...decor(.8),scale:1.6,color:'#827568'}),
 fort_wall:kitProp('fortKit','fort_wall','Muralha','Forte',{...solidBox(6,1.4,5),color:'#85827a'}),
 fort_tower:kitProp('fortKit','fort_tower','Torre da muralha','Forte',{...solidCircle(3,9),color:'#85827a'}),
 fort_gatehouse:kitProp('fortKit','fort_gatehouse','Portaria (vão livre)','Forte',{...decor(3),pickH:7,color:'#a09c90'}),
 fort_keep:kitProp('fortKit','fort_keep','Torre de menagem','Forte',{...solidBox(30,18,12),color:'#6f6d66'}),
 fort_rack:kitProp('fortKit','fort_rack','Armeiro','Forte',{...solidBox(2.4,.6,1.8),color:'#5a4029'}),
 fort_dummy:kitProp('fortKit','fort_dummy','Boneco de treino','Forte',{...solidCircle(.35,1.9),color:'#b89c54'}),
 cave_mouth:kitProp('fortKit','cave_mouth','Boca de caverna','Caverna',{...decor(3.5),pickH:6,color:'#6c6a62'}),
 spider_web:kitProp('fortKit','spider_web','Teia','Caverna',{...decor(1.6),pickH:2.8,color:'#e2dfd4'}),
 egg_sac:kitProp('fortKit','egg_sac','Ninho de ovos','Caverna',{...decor(.9),color:'#d8d0ac'}),
 bone_pile:kitProp('fortKit','bone_pile','Restos de presa','Caverna',{...decor(.9),color:'#d8ceb0'})
});
PROPS.water.label='Poça (só visual)';
export const PROP_TYPES=Object.keys(PROPS);
// Toda peça gira, menos as manchas redondas de chão. Peças desenhadas em conjunto com a caverna e a caravana.
export const canRotate=def=>!!def&&(def.group!=='Chão'||!!def.rotates);
export const SCENE_PROPS=new Set(['caravan','road_block','cave_wall','hideout_table','hideout_cargo','hideout_bedroll','cave_support','cave_spire','fall_debris','capture_note','cave_exit']);
export const PROP_GROUPS=[...new Set(PROP_TYPES.map(t=>PROPS[t].group))];
// Estilo de cada mapa: céu, luz, névoa, chão, água e densidade da vegetação. `null` em um campo mantém o padrão do bioma.
export const GROUND_STYLES={grass:'Grama',dirt:'Terra batida',sand:'Areia',snow:'Neve',stone:'Pedra',ash:'Cinzas',moss:'Musgo'};
export const STYLE_PRESETS={
 dawn:{name:'Amanhecer',sky:'#6d6a7c',sun:2.4,sunColor:'#ffd9b8',ambient:1.6,fog:.2,tint:'#f4ece0'},
 noon:{name:'Meio-dia',sky:'#7fa3b8',sun:3.8,sunColor:'#fff2d8',ambient:2,fog:0,tint:'#ffffff'},
 dusk:{name:'Entardecer',sky:'#5a4048',sun:2.6,sunColor:'#ffb98a',ambient:1.3,fog:.25,tint:'#f4e8d8'},
 night:{name:'Noite',sky:'#0b1120',sun:1.2,sunColor:'#a4bae8',ambient:1,fog:.3,tint:'#a8b4d0'},
 mist:{name:'Névoa',sky:'#7c8a88',sun:1.4,sunColor:'#d8e0dc',ambient:2,fog:1,tint:'#c8d0c8'},
 winter:{name:'Inverno',sky:'#a8b6c4',sun:2.4,sunColor:'#e8f0ff',ambient:2,fog:.35,tint:'#ffffff',ground:'snow',water:'#7fa8c0',grass:0,flowers:0},
 drought:{name:'Seca',sky:'#b09a70',sun:3.8,sunColor:'#ffe0a0',ambient:1.6,fog:.1,tint:'#e8d8a8',ground:'sand',water:'#7c8a70',grass:.15,flowers:0},
 marsh:{name:'Charco',sky:'#2a3324',sun:1.6,sunColor:'#c8d8a0',ambient:1.2,fog:.6,tint:'#b0b890',ground:'moss',water:'#3f5a42',grass:1.4,flowers:.2},
 ash:{name:'Terra arrasada',sky:'#2c2626',sun:1.8,sunColor:'#ff9a6a',ambient:1,fog:.4,tint:'#b8a8a0',ground:'ash',water:'#3a3a40',grass:0,flowers:0}
};
const color=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():null;
export function normalizeStyle(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const range=(v,a,b)=>v==null||v===''||!Number.isFinite(+v)?null:clamp(+v,a,b),out={sky:color(raw.sky),sun:range(raw.sun,0,6),sunColor:color(raw.sunColor),ambient:range(raw.ambient,0,4),fog:range(raw.fog,0,1),tint:color(raw.tint),ground:raw.ground in GROUND_STYLES?raw.ground:null,water:color(raw.water),grass:range(raw.grass,0,2),flowers:range(raw.flowers,0,2)};
 return Object.values(out).some(v=>v!==null)?out:null;
}
export const BUILTIN_BASES={'builtin:arandu-caravan':'ARANDU · Desembarque da caravana','builtin:arandu-cave':'ARANDU · Caverna dos bandidos','builtin:arandu-travel':'ARANDU · Estrada de Itavera','builtin:arandu-trail':'ARANDU · Caminho de Jacarandá','builtin:campaign-world':'Campanha integrada · Cripta–Floresta–Vila','builtin:training':'Campo de treino','builtin:forest':'Floresta de Eldrin','builtin:itauna':'Várzea de Itaúna','builtin:itauna-fort':'Forte da Pedra Negra','builtin:itauna-cave':'Gruta das Tecelãs'};
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
 if(def.dims.includes('s'))o.s=clamp(round(num(raw.s,def.s)),.2,6);
 if(canRotate(def)){const rot=((Math.round(num(raw.rot,0))%360)+360)%360;if(rot)o.rot=rot;}
 return o;
}
export function normalizeSpawn(raw,taken=new Set()){
 let id=text(raw?.id,32);if(!id||taken.has(id))do id=makeId('s');while(taken.has(id));taken.add(id);
 const validType=v=>clamp(Math.floor(num(v,0)),0,ENEMY_TYPE_COUNT-1),mix=Array.isArray(raw?.mix)&&raw.mix.length?raw.mix.slice(0,LIMITS.maxCount).map(validType):null;
 return {id,x:round(num(raw?.x,0)),y:round(num(raw?.y,0)),count:mix?mix.length:clamp(Math.floor(num(raw?.count,4)),1,LIMITS.maxCount),type:mix?mix[0]:validType(raw?.type),mix,
  level:raw?.level==null||raw.level===''?null:clamp(Math.floor(num(raw.level,1)),1,LIMITS.maxLevel),leader:['magic','rare'].includes(raw?.leader)?raw.leader:null,
  trigger:['start','near','timer'].includes(raw?.trigger)?raw.trigger:'start',radius:clamp(round(num(raw?.radius,18)),2,80),delay:clamp(round(num(raw?.delay,0)),0,600),
  waves:clamp(Math.floor(num(raw?.waves,1)),1,20),interval:clamp(round(num(raw?.interval,6)),0,120),respawn:clamp(round(num(raw?.respawn,0)),0,600),idle:!!raw?.idle,spread:clamp(round(num(raw?.spread,0)),0,20),quest:!!raw?.quest};
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
  level:clamp(Math.floor(num(raw.level,1)),1,LIMITS.maxLevel),enemyHp:enemyScale(raw.enemyHp),enemyXp:enemyScale(raw.enemyXp),objects,terrain:normalizeTerrain(raw.terrain),style:normalizeStyle(raw.style),campaign:typeof raw.campaign==='string'?text(raw.campaign,24):null,updated:Number.isFinite(+raw.updated)?+raw.updated:0
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
// Plantas embutidas não mudam durante a sessão: montar a do mundo é caro e o editor resolve a herança a cada alteração.
const builtinCache=new Map();
export function builtinMap(ref){
 if(!builtinCache.has(ref))builtinCache.set(ref,buildBuiltin(ref));
 return builtinCache.get(ref);
}
function buildBuiltin(ref){
 const stage={'builtin:arandu-caravan':'ambush','builtin:arandu-cave':'cave','builtin:arandu-travel':'travel','builtin:arandu-trail':'trail'}[ref];
 if(stage)return normalizeMap({...prologueMapData(stage),id:ref}).map;
 if(ref==='builtin:campaign-world')return normalizeMap({...campaignWorldMap(),id:ref}).map;
 if(ref==='builtin:itauna')return normalizeMap({...itaunaMap(),id:ref}).map;
 if(ref==='builtin:itauna-fort')return normalizeMap({...fortMap(),id:ref}).map;
 if(ref==='builtin:itauna-cave')return normalizeMap({...caveMap(),id:ref}).map;
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
 const start=map.start||parent?.map.start||{x:0,y:round(size.h/2-5)},spawns=map.spawns||parent?.map.spawns||[],terrain=map.terrain||parent?.map.terrain||null,style=map.style||parent?.map.style||null;
 return {map:{...map,size,biome,start,spawns,terrain,style,objects:[...inherited,...map.objects.map(o=>({...o,inherited:false}))],baseObjects:parent?parent.map.objects:[],hasBase:!!parent},warnings:[...(parent?.warnings||[]),...warnings],chain:[...(parent?.chain||[]),mapRef(map.id)]};
}
// Multiplicador de vida ou experiência dos inimigos de um mapa. Mapas antigos valem 1.
function enemyScale(value){return Math.round(clamp(num(value,1),.1,10)*100)/100;}
// Copia tudo da base para o próprio mapa e remove o vínculo.
export function detach(map,lookup){
 const {map:flat}=resolveMap(map,lookup),taken=new Set();
 return {...map,base:null,hidden:[],size:flat.size,biome:flat.biome,start:flat.start,terrain:flat.terrain,style:flat.style,spawns:flat.spawns.map(s=>normalizeSpawn(s,taken)),objects:flat.objects.map(o=>{const {inherited,...rest}=o;return rest;})};
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
// Assar o terreno é o passo mais caro: a última resposta fica guardada, e o editor pede várias arenas do mesmo mapa.
let lastBake=null;
function bakeOnce(terrain,bounds,bridges){
 const key=JSON.stringify([terrain,bounds,bridges]);
 if(lastBake?.key!==key)lastBake={key,value:bakeTerrain(terrain,bounds,bridges)};
 return lastBake.value;
}
// `cover`: sorteia grama e flores. `stableTone`: tom de cada peça pelo próprio id, para o editor refazer um tipo sem mudar a cor dos outros.
export function toArena(map,{cover=true,stableTone=false}={}){
 const bounds=centered(map.size),solids=[],kitProps=[],decor={trees:[],bushes:[],grass:[],flowers:[],mushrooms:[],patches:[],path:[],pathBoxes:[],misc:[],braziers:[],water:[]};
 const bridges=map.objects.filter(o=>PROPS[o.type]?.bridge).map(o=>({x:o.x,y:o.y,w:o.w,d:o.d,...(o.rot?{angle:o.rot*Math.PI/180}:{}),...(PROPS[o.type].flat?{flat:true}:{})}));
 // Peça girada que não é do catálogo: é desenhada sozinha e girada em volta do próprio centro, sem precisar de um caminho de giro em cada desenho.
 const rotatedParts=[];
 const terrain=map.terrain?bakeOnce(map.terrain,bounds,bridges):null;
 let random=rng(hash(map.id));const rnd=(a,b)=>a+(b-a)*random(),tone=()=>+random().toFixed(2);
 for(const o of map.objects){
  const def=PROPS[o.type];if(!def)continue;
  if(stableTone)random=rng(hash(o.id));
  if(def.kit){
   const along=def.shape==='box'&&(def.w>=def.d)===(o.w>=o.d),base=(o.rot||0)*Math.PI/180;
   const k=def.scale||1,flatScale=def.dims.includes('r')?o.r/def.r:o.s??1;
   kitProps.push({model:def.kit.model,part:def.kit.part,float:!!def.float,x:o.x,y:o.y,ry:def.shape==='box'&&!along?base+Math.PI/2:base,
    sx:k*(def.shape==='box'?(along?o.w/def.w:o.d/def.w):flatScale),sy:k*(def.dims.includes('h')?o.h/def.h:def.shape==='box'?1:o.s??1),sz:k*(def.shape==='box'?(along?o.d/def.d:o.w/def.d):flatScale)});
  }
  const drawnApart=!!o.rot&&!def.kit&&def.decor!=='pathBox'&&(!def.solid||!!def.look);
  if(drawnApart)rotatedParts.push({angle:o.rot*Math.PI/180,x:o.x,y:o.y,scene:SCENE_PROPS.has(o.type),arena:{...toArena({...map,objects:[{...o,rot:0}],terrain:null},{cover:false,stableTone:true}),part:true}});
  if(def.solid){
   const s=def.shape==='box'?{kind:'box',x:o.x,y:o.y,width:o.w,depth:o.d,height:o.h}:{kind:'circle',x:o.x,y:o.y,r:o.r,height:o.h};
   if(o.rot&&def.shape==='box')s.angle=o.rot*Math.PI/180;
   if(def.kit)s.look='kit-prop';else if(drawnApart)s.look='rotated-part';else if(def.look)s.look=def.look;if(def.look!=='log')s.tone=tone();solids.push(s);
  }else if(def.kit||drawnApart)continue;
  else if(def.decor==='bushes')decor.bushes.push({x:o.x,y:o.y,size:o.r,tone:tone()});
  else if(def.decor==='misc')decor.misc.push({look:o.type,x:o.x,y:o.y,size:o.s??1,tone:tone(),tilt:+rnd(-.5,.5).toFixed(2),w:+rnd(.7,1.1).toFixed(2),v:Math.floor(random()*3)});
  else if(def.decor==='braziers')decor.braziers.push({x:o.x,y:o.y});
  else if(def.decor==='water')decor.water.push({x:o.x,y:o.y,r:o.r});
  else if(def.decor==='path')decor.path.push({x:o.x,y:o.y,r:o.r});
  else if(def.decor==='pathBox')decor.pathBoxes.push({x:o.x,y:o.y,w:o.w,d:o.d,angle:(o.rot||0)*Math.PI/180});
 }
 // Cobertura do chão: sorteada de forma determinística pelo id; não nasce sobre colisores nem sobre a trilha.
 if(terrain)solids.push(...terrain.blocks);
 const area=map.size.w*map.size.h,arenaProbe={terrain},free=(x,y,r)=>!(terrain&&heightAt(arenaProbe,x,y)<TERRAIN_RULES.wet)&&!solids.some(s=>s.angle?solidDistance({x,y},s)<r:s.kind==='circle'?Math.hypot(x-s.x,y-s.y)<s.r+r:Math.abs(x-s.x)<s.width/2+r&&Math.abs(y-s.y)<s.depth/2+r)&&!decor.pathBoxes.some(q=>solidDistance({x,y},{kind:'box',x:q.x,y:q.y,width:q.w,depth:q.d,angle:q.angle})<=0)&&!decor.path.some(p=>Math.hypot(x-p.x,y-p.y)<p.r)&&!decor.water.some(p=>Math.hypot(x-p.x,y-p.y)<p.r);
 const scatter=(list,count,make,pad)=>{for(let n=0,t=0;n<count&&t<count*6;t++){const x=rnd(bounds.minX+pad,bounds.maxX-pad),y=rnd(bounds.minY+pad,bounds.maxY-pad);if(!free(x,y,.1))continue;list.push(make(+x.toFixed(2),+y.toFixed(2)));n++;}};
 if(cover&&GREEN.has(map.biome)){
  // Tetos fixos até 240 × 240; mapas maiores mantêm a mesma densidade por área.
  const cap=n=>Math.round(n*Math.max(1,area/57600)),grassDensity=map.style?.grass??1,flowerDensity=map.style?.flowers??1;
  scatter(decor.grass,Math.round(Math.min(cap(900),Math.round(area*.05))*grassDensity),(x,y)=>({x,y,height:+rnd(.2,.5).toFixed(2),tone:tone()}),1);
  scatter(decor.patches,Math.min(cap(60),Math.round(area*.0035)),(x,y)=>({x,y,r:+rnd(1.2,3.2).toFixed(2),tone:tone()}),2);
  if(map.biome==='forest')scatter(decor.flowers,Math.round(Math.min(cap(160),Math.round(area*.012))*flowerDensity),(x,y)=>({x,y,tone:tone()}),1);
 }
 return {enemyHp:map.enemyHp??1,enemyXp:map.enemyXp??1,cave:map.biome==='cave',prologue:map.biome==='cave'||solids.some(s=>s.look==='caravan')||decor.misc.some(m=>m.look==='road_block'),caravans:solids.filter(s=>s.look==='caravan').map(s=>({x:s.x,y:s.y,sx:s.width/2.8,sy:s.height/2,sz:s.depth/5.2})),roadBlocks:decor.misc.filter(m=>m.look==='road_block'),id:'custom-'+map.id,theme:'expedition',custom:true,name:map.name,palette:PALETTES[map.biome],biome:map.biome,bounds,solids,decor,kitProps,rotatedParts,terrain,style:map.style||null};
}

// --- Verificação ---
// Varredura em grade a partir do início: quais pontos o personagem (raio 0,45) consegue alcançar.
export function reachable(arena,start,{radius=.45,step=.5}={}){
 const b=arena.bounds,w=Math.max(1,Math.floor((b.maxX-b.minX-2*radius)/step)+1),h=Math.max(1,Math.floor((b.maxY-b.minY-2*radius)/step)+1),origin={x:b.minX+radius,y:b.minY+radius},blocked=new Uint8Array(w*h),seen=new Uint8Array(w*h);
 // Cada colisor marca só as células que alcança; em 360 u, testar célula por célula contra todos travava a verificação.
 for(const s of arena.solids){
  const far=s.angle?Math.hypot(s.width,s.depth)/2:0,q=s.kind==='circle'?{x0:s.x-s.r,x1:s.x+s.r,y0:s.y-s.r,y1:s.y+s.r}:s.angle?{x0:s.x-far,x1:s.x+far,y0:s.y-far,y1:s.y+far}:{x0:s.x-s.width/2,x1:s.x+s.width/2,y0:s.y-s.depth/2,y1:s.y+s.depth/2};
  const i0=Math.max(0,Math.ceil((q.x0-radius-origin.x)/step)),i1=Math.min(w-1,Math.floor((q.x1+radius-origin.x)/step)),j0=Math.max(0,Math.ceil((q.y0-radius-origin.y)/step)),j1=Math.min(h-1,Math.floor((q.y1+radius-origin.y)/step));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
   const x=origin.x+i*step,y=origin.y+j*step,d=s.angle?solidDistance({x,y},s):s.kind==='circle'?Math.hypot(x-s.x,y-s.y)-s.r:Math.hypot(x-clamp(x,q.x0,q.x1),y-clamp(y,q.y0,q.y1));
   if(d<radius-1e-6)blocked[j*w+i]=1;
  }
 }
 const si=clamp(Math.round((start.x-origin.x)/step),0,w-1),sj=clamp(Math.round((start.y-origin.y)/step),0,h-1),result={seen,w,h,step,radius,origin};
 if(blocked[sj*w+si])return {...result,blocked:true};
 const stack=[sj*w+si];seen[stack[0]]=1;
 while(stack.length){
  const k=stack.pop(),i=k%w,j=(k-i)/w;
  for(const [ni,nj]of [[i+1,j],[i-1,j],[i,j+1],[i,j-1]]){if(ni<0||nj<0||ni>=w||nj>=h)continue;const n=nj*w+ni;if(seen[n]||blocked[n])continue;seen[n]=1;stack.push(n);}
 }
 return {...result,blocked:false};
}
export function canReach(r,p){
 // Tolera o ponto cair em cima de um colisor: basta uma célula vizinha alcançável.
 const i=Math.round((p.x-r.origin.x)/r.step),j=Math.round((p.y-r.origin.y)/r.step);
 for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){const x=i+di,y=j+dj;if(x>=0&&y>=0&&x<r.w&&y<r.h&&r.seen[y*r.w+x])return true;}return false;
}
const overlapsWater=(arena,p)=>arena.terrain.blocks.some(s=>Math.abs(p.x-s.x)<=s.width/2&&Math.abs(p.y-s.y)<=s.depth/2);
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
 if(flat.terrain&&overlapsWater(arena,flat.start))out.push({level:'aviso',text:'O início está em água funda ou penhasco; o jogador será empurrado para a margem.'});
 if(flat.objects.length>LIMITS.maxObjects*.8)out.push({level:'aviso',text:'Muitos objetos: o limite é '+LIMITS.maxObjects+'.'});
 return out;
}

// --- Biblioteca (armazenamento injetável; separado do save, como o áudio) ---
export function createLibrary(storage,key=STORAGE_KEY,{maxBytes=LIMITS.maxBytes}={}){
 const fail=message=>({ok:false,message});
 function load(){
  let raw;try{raw=storage.getItem(key);}catch{return {maps:[],status:'unavailable'};}
  if(!raw)return {maps:[],status:'ok'};
  try{const data=JSON.parse(raw),taken=new Set(),maps=[];for(const item of Array.isArray(data?.maps)?data.maps:[]){const {map}=normalizeMap(item);if(map&&!taken.has(map.id)){taken.add(map.id);maps.push(map);}}return {maps,status:'ok'};}
  catch{return {maps:[],status:'invalid'};}
 }
 function persist(maps){
  const body=JSON.stringify({version:MAP_VERSION,maps});if(body.length>maxBytes)return fail('A biblioteca de mapas ficou grande demais. Exclua ou exporte mapas antigos.');
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
  // Edições da campanha: arquivo que pode ser levado a outro navegador ou embutido no jogo (v2/assets/campaign-maps.json).
  exportCampaign(){const maps=load().maps.filter(m=>m.campaign);return maps.length?JSON.stringify({format:BUNDLE_FORMAT,version:MAP_VERSION,maps},null,1):null;},
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
    // Edições da campanha têm id fixo: importar substitui a edição anterior do mesmo mapa.
    if(map.campaign){const i=maps.findIndex(m=>m.id===map.id);if(i>=0)maps.splice(i,1);}
    else if(used.has(map.id)){const id=makeId();rename.set(map.id,id);map.id=id;}used.add(map.id);imported.push(map);
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
 {id:'arandu-caravan',name:'ARANDU · Desembarque da caravana',make:()=>normalizeMap(prologueMapData('ambush')).map},
 {id:'arandu-cave',name:'ARANDU · Caverna dos bandidos',make:()=>normalizeMap(prologueMapData('cave')).map},
 {id:'campaign-world',name:'Campanha integrada · Cripta–Floresta–Vila',make:()=>normalizeMap(campaignWorldMap()).map},
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
