'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'..');
const read=p=>fs.readFileSync(p,'utf8');
function data(source){return 'data:text/javascript;base64,'+Buffer.from(source).toString('base64');}
function one(source,marker,value){if(source.split(marker).length!==2)throw Error('Marcador ausente ou duplicado: '+marker);return source.replace(marker,()=>value);}
const vendor=path.join(repo,'tools/3d-lab/vendor');
const imports={},provenance=[];
const uiAdapter=path.join(__dirname,'ui-source.cjs');{const ui=require('./ui-source.cjs');fs.writeFileSync(path.join(root,'scripts/shared-hud.css'),ui.readHudStyle(repo));fs.writeFileSync(path.join(root,'scripts/shared-title.css'),ui.readTitleStyle(repo));fs.writeFileSync(path.join(root,'scripts/shared-equipment.css'),ui.readEquipmentStyle(repo));fs.writeFileSync(path.join(root,'scripts/shared-menu.css'),ui.readMenuStyle(repo));fs.writeFileSync(path.join(root,'scripts/shared-skills.css'),ui.readSkillStyle(repo));fs.writeFileSync(path.join(root,'scripts/shared-portrait.mjs'),ui.readPortrait(repo));}
const campaignAdapter=path.join(__dirname,'campaign-source.cjs');
const campaignRules=require('./campaign-source.cjs').readCampaign(repo);
fs.writeFileSync(path.join(root,'scripts/campaign-rules.mjs'),'// Gerado das fontes atuais; não editar.\nexport default '+JSON.stringify(campaignRules,null,2)+';\nexport function stageScale(stage,level){const CAMP={stage},player={level};'+campaignRules.stageBody+'}\nexport function waveCount(wave,mult){return '+campaignRules.waveCountExpression+';}\n');
const kingFile=path.join(repo,'scripts/fallen-king-model.js');
fs.writeFileSync(path.join(root,'scripts/shared-fallen-king.mjs'),'// Gerado do modelo canônico; não editar.\nconst module={exports:{}};\n'+read(kingFile)+'\nexport default module.exports;\n');
function record(file,buffer){provenance.push({path:path.relative(repo,file).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(buffer).digest('hex')});}
record(uiAdapter,fs.readFileSync(uiAdapter));
record(campaignAdapter,fs.readFileSync(campaignAdapter));
record(kingFile,fs.readFileSync(kingFile));
for(const name of ['crypt-hound','war-acolyte','expedition','endgame']){const file=path.join(repo,'scripts',name+'-model.js');record(file,fs.readFileSync(file));fs.writeFileSync(path.join(root,'scripts/shared-'+name+'.mjs'),'// Gerado da fonte canônica.\nconst module={exports:{}};\n'+read(file)+'\nexport default module.exports;\n');}
fs.writeFileSync(path.join(root,'scripts/enemy-rules.mjs'),'// Gerado das fontes atuais.\nexport default '+JSON.stringify(require('./enemy-source.cjs').readEnemyRules(repo),null,2)+';\n');
for(const name of ['crypt-hound','war-acolyte']){const file=path.join(repo,'scripts',name+'.js');record(file,fs.readFileSync(file));}
const enemyAdapter=path.join(__dirname,'enemy-source.cjs');record(enemyAdapter,fs.readFileSync(enemyAdapter));
fs.writeFileSync(path.join(root,'scripts/enemy-types.mjs'),'// Gerado de ENEMY_TYPES; preservar índices.\nexport default '+JSON.stringify(require('./enemy-source.cjs').readEnemyTypes(repo),null,2)+';\n');
// Fontes canônicas são empacotadas sem executar o runtime do jogo antigo.
const {readCombatRules}=require('./combat-source.cjs');
for(const file of ['necromancer-canvas.html','scripts/skill-trees.js','scripts/equipment-model.js','v2/tools/combat-source.cjs']){const p=path.join(repo,file);record(p,fs.readFileSync(p));}
const rulesSource='// Gerado por tools/build.cjs; editar o adaptador/fontes canônicas.\nexport default '+JSON.stringify(readCombatRules(repo),null,2)+';\n';
// O modelo busca as maestrias por require() no Node; no navegador recebe o módulo compartilhado.
const equipmentSource=one(read(path.join(repo,'scripts/equipment-model.js')),"require('./skill-mastery-model.js')",'MasteryModel');
const sharedSource='// Gerado a partir de scripts/equipment-model.js.\nimport MasteryModel from \'./shared-mastery.mjs\';\nconst module={exports:{}};\n'+equipmentSource+'\nexport const {defenseReduction,spellDamage,moveSpeed}=module.exports;\nexport default module.exports;\n';
fs.writeFileSync(path.join(root,'scripts/combat-rules.mjs'),rulesSource);fs.writeFileSync(path.join(root,'scripts/shared-equipment.mjs'),sharedSource);
const {readProgression}=require('./progression-source.cjs');
for(const f of ['v2/tools/progression-source.cjs','scripts/equipment.js'])record(path.join(repo,f),fs.readFileSync(path.join(repo,f)));
fs.writeFileSync(path.join(root,'scripts/progression-rules.mjs'),'// Gerado das fontes atuais por tools/build.cjs.\nexport default '+JSON.stringify(readProgression(repo),null,2)+';\n');
const {readSpellRules}=require('./spell-source.cjs');record(path.join(__dirname,'spell-source.cjs'),fs.readFileSync(path.join(__dirname,'spell-source.cjs')));
fs.writeFileSync(path.join(root,'scripts/spell-rules.mjs'),'// Gerado das fontes atuais por tools/build.cjs.\nexport default '+JSON.stringify(readSpellRules(repo),null,2)+';\n');
const {readHorde}=require('./horde-source.cjs'),horde=readHorde(repo);
for(const f of ['v2/tools/horde-source.cjs','scripts/minion-abilities.js','build-simulator/model.js'])record(path.join(repo,f),fs.readFileSync(path.join(repo,f)));
fs.writeFileSync(path.join(root,'scripts/horde-rules.mjs'),'// Gerado; fontes canônicas em scripts e HTML atual.\nexport default '+JSON.stringify(horde.data,null,2)+';\n');
fs.writeFileSync(path.join(root,'scripts/shared-build.mjs'),'// Gerado do modelo canônico do Grimório.\nconst module={exports:{}};\n'+read(path.join(repo,'build-simulator/model.js'))+'\nexport default module.exports;\n');
const masteryFile=path.join(repo,'scripts/skill-mastery-model.js');record(masteryFile,fs.readFileSync(masteryFile));
fs.writeFileSync(path.join(root,'scripts/shared-mastery.mjs'),'// Gerado do modelo canônico de maestrias.\nconst module={exports:{}};\n'+read(masteryFile)+'\nexport default module.exports;\n');
fs.writeFileSync(path.join(root,'scripts/horde-stats.mjs'),"// Gerado; a fórmula pertence a scripts/skill-trees.js.\nimport R from './horde-rules.mjs';\nexport function statsFor(type,level,effects={},gear={}){const MINION_DEFS=R.defs,COMBAT_TUNING=R.tuning,player={level};const skillEffects=()=>effects,skillGearStat=k=>gear[k]||0;"+horde.stats+';return skillMinionStats(type);}\nexport const capacity='+horde.capacity+';\n');
for(const [name,key]of Object.entries({'three.core':'three-core','three.module':'three',BufferGeometryUtils:'geometry-utils',GLTFLoader:'gltf-loader',SkeletonUtils:'skeleton-utils'})){
 const file=path.join(vendor,name+'.js'),source=read(file);record(file,source);
 imports[key]=data(source.replaceAll("'./three.core.js'","'three-core'").replaceAll("'../utils/BufferGeometryUtils.js'","'geometry-utils'"));
}
const modules={'siege-model':'v2-siege-model','siege-combat':'v2-siege-combat',siege:'v2-siege','siege-panel':'v2-siege-panel','siege-scene':'v2-siege-scene','shared-portrait':'v2-portrait',loading:'v2-loading',title:'v2-title','game-ui':'v2-game-ui',campaign:'v2-campaign','arena-model':'v2-arena-model','shared-endgame':'v2-endgame-model','conquest-panel':'v2-conquest-panel','expedition-map':'v2-expedition-map','map-model':'v2-map-model','map-play':'v2-map-play','map-preview':'v2-map-preview','map-editor':'v2-map-editor','map-panel':'v2-map-panel','expedition-scene':'v2-expedition-scene',expedition:'v2-expedition','waves-panel':'v2-waves-panel','campaign-panel':'v2-campaign-panel','campaign-atlas':'v2-campaign-atlas','campaign-rules':'v2-campaign-rules','campaign-model':'v2-campaign-model',enemies:'v2-enemies','enemy-tactics':'v2-enemy-tactics','enemy-rules':'v2-enemy-rules','shared-crypt-hound':'v2-hound-model','shared-war-acolyte':'v2-acolyte-model','shared-expedition':'v2-expedition-model','fallen-king':'v2-king','shared-fallen-king':'v2-king-model','enemy-types':'v2-enemy-types',actions:'v2-actions','spell-rules':'v2-spell-rules',spells:'v2-spells','death-tree':'v2-death-tree','lich-mastery':'v2-lich-mastery','full-build':'v2-full-build','lich-model':'v2-lich-model',terrain:'v2-terrain','forest-map':'v2-forest-map','forest-scene':'v2-forest-scene','village-map':'v2-village-map','scenery-fx':'v2-scenery-fx','nature-kit':'v2-nature-kit','village-kit':'v2-village-kit','village-ground':'v2-village-ground','village-scene':'v2-village-scene','crypt-map':'v2-crypt-map','crypt-scene':'v2-crypt-scene','trail-map':'v2-trail-map','trail-scene':'v2-trail-scene','camp-parts':'v2-camp-parts','outpost-map':'v2-outpost-map','outpost-scene':'v2-outpost-scene',gamepad:'v2-gamepad','combat-rules':'v2-rules','shared-equipment':'v2-equipment','shared-build':'v2-build','shared-mastery':'v2-mastery-model',mastery:'v2-mastery','progression-rules':'v2-progression-rules',progression:'v2-progression',drops:'v2-drops',consumables:'v2-consumables',gear:'v2-gear','gear-panel':'v2-gear-panel',rewards:'v2-rewards',grimoire:'v2-grimoire','grimoire-panel':'v2-grimoire-panel','horde-rules':'v2-horde-rules','horde-stats':'v2-horde-stats',horde:'v2-horde','horde-panel':'v2-horde-panel',combat:'v2-combat','training-model':'v2-model',audio:'v2-audio','sound-events':'v2-sound-events','lab-model':'v2-lab-model',lab:'v2-lab','lab-panel':'v2-lab-panel','vfx-events':'v2-vfx-events',vfx:'v2-vfx',renderer:'v2-renderer',input:'v2-input','save-model':'v2-save',session:'v2-session',app:'v2-app'};
for(const [name,key]of Object.entries(modules)){
 const file=path.join(root,'scripts',name+'.mjs'),source=read(file);record(file,source);let embedded=source;for(const [n,k]of Object.entries(modules))embedded=embedded.replaceAll("'./"+n+".mjs'","'"+k+"'");imports[key]=data(embedded);
}
const manifestPath=path.join(root,'assets/models.json'),definitions=JSON.parse(read(manifestPath)),assets={};record(manifestPath,read(manifestPath));
for(const [key,entry]of Object.entries(definitions)){
 const file=path.resolve(repo,entry.path),relative=path.relative(repo,file);
 if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Asset fora do repositório: '+entry.path);
 const buffer=fs.readFileSync(file);if(buffer.subarray(0,4).toString()!=='glTF'||buffer.readUInt32LE(4)!==2)throw Error('GLB inválido: '+entry.path);
 const gltf=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());
 for(const section of ['buffers','images'])for(const resource of gltf[section]||[])if(resource.uri&&!resource.uri.startsWith('data:'))throw Error('GLB depende de recurso externo: '+entry.path);
 for(const animation of entry.requiredAnimations)if(!gltf.animations?.some(a=>a.name===animation))throw Error('Animação ausente: '+key+'/'+animation);
 record(file,buffer);assets[key]={...entry,data:buffer.toString('base64')};
}
// Músicas e efeitos em arquivo; o HTML segue autocontido, com MP3/WAV em base64.
const musicManifest=path.join(root,'assets/music.json'),musicDefs=JSON.parse(read(musicManifest)),music={};record(musicManifest,read(musicManifest));
for(const [key,entry]of Object.entries(musicDefs)){
 const file=path.resolve(repo,entry.path),relative=path.relative(repo,file);
 if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Música fora do repositório: '+entry.path);
 const buffer=fs.readFileSync(file);if(buffer.subarray(0,3).toString()!=='ID3'&&buffer[0]!==0xff&&!(buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WAVE'))throw Error('Áudio MP3/WAV inválido: '+entry.path);
 record(file,buffer);music[key]={title:entry.title,kind:entry.kind||'music',data:buffer.toString('base64')};
}
let html=read(path.join(__dirname,'template.html'));
record(path.join(__dirname,'template.html'),html);const css=['game.css','save.css','horde.css','grimoire.css','gear.css','waves.css','conquest.css','lab.css','maps.css','shared-hud.css','loading.css','shared-equipment.css','shared-menu.css','shared-skills.css','shared-title.css','ui.css'].map(name=>{const file=path.join(root,'scripts',name),source=read(file);record(file,source);return source;}).join('\n');
const uiLayout=path.join(__dirname,'ui-layout.html');record(uiLayout,fs.readFileSync(uiLayout));html=one(html,'<!--GAME_UI-->',read(uiLayout));
html=one(html,'/*STYLES*/',css);html=one(html,'<!--IMPORTS-->','<script type="importmap">'+JSON.stringify({imports})+'</script>');
html=one(html,'<!--ASSETS-->','<script id="assets" type="application/json">'+JSON.stringify(assets).replaceAll('<','\\u003c')+'</script>');
html=one(html,'<!--MUSIC-->','<script id="music" type="application/json">'+JSON.stringify(music)+'</script>');
fs.writeFileSync(path.join(root,'necromancer-3d.html'),html);
fs.writeFileSync(path.join(root,'assets/build-manifest.json'),JSON.stringify({stage:'E9',threeVersion:'0.180.0',inputs:provenance},null,2)+'\n');
// Licença acompanha a distribuição e as fontes da v2; biblioteca continua canônica no laboratório.
fs.copyFileSync(path.join(vendor,'LICENSE'),path.join(root,'assets/three-license.txt'));
console.log('v2/necromancer-3d.html gerado: '+Object.keys(assets).length+' GLBs, '+Object.keys(music).length+' trilha(s), regras atuais e módulos locais incorporados.');
