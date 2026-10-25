// Rebuild the embedded skill-tree model, rules and style without introducing runtime dependencies.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),target=path.join(root,'necromancer-canvas.html');
let html=fs.readFileSync(target,'utf8');
const replace=(before,after)=>{if(html.includes(before))html=html.replace(before,after);else if(!html.includes(after))throw Error('Source patch no longer matches: '+before.slice(0,90));};
// Minimal bridges in the original engine; combat fixtures retain their isolated legacy defaults.
replace('const d=migrateSummonSlots(migrateAbilitySave(JSON.parse(raw)));','const d=skillMigrateSave(migrateSummonSlots(migrateAbilitySave(JSON.parse(raw))));');
if(!html.includes("SAVE_KEY+'_before_skill_trees'"))replace('const d=skillMigrateSave(migrateSummonSlots(migrateAbilitySave(JSON.parse(raw))));',"try{if(!JSON.parse(raw).skillTreeVersion&&!localStorage.getItem(SAVE_KEY+'_before_skill_trees'))localStorage.setItem(SAVE_KEY+'_before_skill_trees',raw);}catch(e){}\n    const d=skillMigrateSave(migrateSummonSlots(migrateAbilitySave(JSON.parse(raw))));");
if(!html.includes('skillTreeVersion:SKILL_TREE_VERSION,skillRanks:player.skillRanks'))replace('abilityVersion:ABILITY_VERSION,','abilityVersion:ABILITY_VERSION,\n    skillTreeVersion:SKILL_TREE_VERSION,skillRanks:player.skillRanks,skillGrants:player.skillGrants,');
if(!html.includes('skillTutorialState:player.skillTutorialState'))replace('skillGrants:player.skillGrants,','skillGrants:player.skillGrants,skillTutorialState:player.skillTutorialState,');
if(!html.includes('skillEquipTutorialSeen:player.skillEquipTutorialSeen'))replace('skillTutorialState:player.skillTutorialState,','skillTutorialState:player.skillTutorialState,skillEquipTutorialSeen:player.skillEquipTutorialSeen,skillEquipTutorialPending:player.skillEquipTutorialPending,');
if(!html.includes('level:d.level,souls:0,maxSp:'))replace('level:d.level,souls:d.souls,maxSp:', 'skillTreeVersion:d.skillTreeVersion,skillRanks:d.skillRanks,skillGrants:d.skillGrants,\n      level:d.level,souls:0,maxSp:');
if(!html.includes('skillTutorialState:d.skillTutorialState'))replace('skillGrants:d.skillGrants,','skillGrants:d.skillGrants,skillTutorialState:d.skillTutorialState,');
if(!html.includes('skillEquipTutorialSeen:d.skillEquipTutorialSeen'))replace('skillTutorialState:d.skillTutorialState,','skillTutorialState:d.skillTutorialState,skillEquipTutorialSeen:d.skillEquipTutorialSeen,skillEquipTutorialPending:d.skillEquipTutorialPending,');
if(!html.includes('skillMastery:player.skillMastery'))replace('skillTreeVersion:SKILL_TREE_VERSION,skillRanks:player.skillRanks,','skillMasteryVersion:SkillMasteryModel.VERSION,skillMastery:player.skillMastery,\n    skillTreeVersion:SKILL_TREE_VERSION,skillRanks:player.skillRanks,');
if(!html.includes('skillMastery:d.skillMastery'))replace('skillTreeVersion:d.skillTreeVersion,skillRanks:d.skillRanks,','skillMasteryVersion:d.skillMasteryVersion,skillMastery:d.skillMastery,\n      skillTreeVersion:d.skillTreeVersion,skillRanks:d.skillRanks,');
html=html.replace(/(?:skillSync\(false\); ){2,}/g,'skillSync(false); ');
if(!html.includes('skillSync(false); restoreSummonGroups(d); loadActionState(d);'))replace('restoreSummonGroups(d); loadActionState(d);','skillSync(false); restoreSummonGroups(d); loadActionState(d);');
replace("const cost=60, soulCost=40;","const cost=60;");
replace("  if(player.souls<soulCost){floatMsg('Almas insuficientes! (40)',innerWidth/2,innerHeight*.45,'#a855f7');return;}\r\n",'');
replace('player.mp-=cost; player.souls-=soulCost;','player.mp-=cost;');
replace("desc:'AoE massiva — consome 40 almas.'","desc:'60 MP · explosão necrótica em área.'");
replace('player.souls+=m.rewardSouls;','player.souls=0;');
replace('player.souls+=s.rew.souls; player.gold+=s.rew.gold; gainExp(s.rew.xp); player.skillPoints+=s.rew.sp||0;','player.gold+=s.rew.gold; gainExp(s.rew.xp);');
replace('player.souls+=s; player.gold+=g;','player.gold+=g;');
replace("body.innerHTML=pmStatusHtml()+'<h3 class=\"section-title\">MELHORIAS DO PERSONAGEM · ALMAS</h3>';\r\n      mountManagementPanel('upgrades',body); buildUpgradeGrid();","body.innerHTML=pmStatusHtml();");
replace('mountManagementPanel(\'summon\',body); mountManagementPanel(\'minions\',body);',"mountManagementPanel('summon',body);");
replace("Escolha uma habilidade para ver seu ramo. Melhorias usam pontos; evoluções adicionais usam almas.","Escolha Minions ou Profana. Cada nível concede 3 pontos para investir em bifurcações e sinergias.");
replace("resources.textContent=player.souls+' almas · '+player.gold+' ouro · '+player.skillPoints+' pontos';","resources.textContent=player.gold+' ouro · '+player.skillPoints+' pontos';");
replace('<div><span>Almas</span><b>💀 ${player.souls}</b></div>','');
replace("document.getElementById('hub-souls-disp').textContent=`💀 ${player.souls} almas  ·  ✨ ${player.skillPoints} pontos de habilidade`;","document.getElementById('hub-souls-disp').textContent=`✨ ${player.skillPoints} pontos de habilidade`;");
replace('💀 ${d.souls||0} · 🪙 ${d.gold||0}','🪙 ${d.gold||0}');
replace(' · 💀 ${player.souls} · 🪙',' · 🪙');
replace("label:'Altar dos Upgrades',icon:'⚗',  tab:'upgrades'","label:'Altar do Grimório',icon:'⚗',  tab:'skills'");
replace("hint:'[G] Upgrades & Habilidades'","hint:'[G] Minions & Profana'");
replace('lock=CAMP.on&&CAMP_GATE[id]&&!ok','lock=false');
replace('${s.rew.sp?\' · +\'+s.rew.sp+\' ponto de habilidade\':\'\'}','');
replace("// no Ato I da campanha só o zumbi pode ser invocado\r\n['skeleton','archer','specter'].forEach(k=>{ const d=MINION_DEFS[k], base=d.unlockLv; Object.defineProperty(d,'unlockLv',{get(){ return CAMP.on&&!CAMP.cleared[4]?99:base; },configurable:true,enumerable:true}); });\r\n(function(){ const _sm=spawnMinion; spawnMinion=function(type){ if(CAMP.on&&!CAMP.cleared[4]&&type!=='zombie'&&type!=='abom'){ floatMsg('Só o Zumbi responde ao chamado neste Ato',innerWidth/2,innerHeight*.4,'#a855f7'); return null; } return _sm.apply(this,arguments); }; })();",'// Tipos de evocação agora são desbloqueados pelas árvores.');
replace("const travel=(hasPassive('dash_distance')?6/.18:25)*", "const travel=(typeof skillPercent==='function'?4.5*skillPercent('Distância do Dash')/.18:(hasPassive('dash_distance')?6/.18:25))*");
replace("sh.life=0;burst(ax+(sh.x-ax)*wall,ay+(sh.y-ay)*wall,'#b6b896',5,1);return;", "sh.life=0;if(typeof skillWallAbsorb==='function')skillWallAbsorb(sh,ax+(sh.x-ax)*wall,ay+(sh.y-ay)*wall);burst(ax+(sh.x-ax)*wall,ay+(sh.y-ay)*wall,'#b6b896',5,1);return;");
html=html.replace(/(?:d\.type==='gold'\?'#e4be58':){2,}/g,"d.type==='gold'?'#e4be58':");
if(!html.includes("d.type==='gold'?'#e4be58':"))replace("d.type==='hp'?'#e74c3c':'#6c6cff'","d.type==='gold'?'#e4be58':d.type==='hp'?'#e74c3c':'#6c6cff'");
replace("ctx.fillStyle=c; ctx.beginPath(); ctx.arc(dx,y,5.5,0,6.283); ctx.fill();", "ctx.fillStyle=c; ctx.beginPath(); ctx.arc(dx,y,d.type==='gold'?7:5.5,0,6.283); ctx.fill();if(d.type==='gold'){ctx.strokeStyle='#fff1a0';ctx.lineWidth=1.5;ctx.stroke();}");
// Player-facing reward displays no longer advertise the removed resource.
html=html.replace(/\+\$\{(?:m\.rewardSouls|s\.rew\.souls|o\.rewardSouls|s)\} almas · /g,'').replace("+' MP · '+quote.soul+' almas'","+' MP'").replace("+' MP · ''sem custo de almas'","+' MP'");
html=html.replaceAll('Explosão de Almas','Explosão Necrótica').replaceAll('EXPLOSÃO DE ALMAS','EXPLOSÃO NECRÓTICA').replaceAll('Cada wave concluída rende almas, XP e ouro.','Cada wave concluída rende XP e ouro.').replaceAll('com recompensas de almas, XP e ouro.','com recompensas de XP e ouro.').replaceAll('sempre há mais almas a colher...','novos poderes aguardam nas árvores...');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const blocks=[
 ['SKILL_MASTERY_MODEL',`<script>\n${read('scripts/skill-mastery-model.js')}\n</script>`, '</head>'],
 ['SKILL_MASTERY_STYLE',`<style>\n${read('scripts/skill-mastery.css')}\n</style>`, '</head>'],
 ['SKILL_TREE_MODEL',`<script>\n${read('build-simulator/model.js')}\n</script>`, '</head>'],
 ['SKILL_TREE_STYLE',`<style>\n${read('scripts/skill-trees.css')}\n</style>`, '</head>'],
 ['SKILL_TREE_RULES',read('scripts/skill-trees.js'),'const hasSave=bootGame();']
];
for(const [name,content,anchor] of blocks){const start=`/* ${name}_BEGIN */`,end=`/* ${name}_END */`;const block=name==='SKILL_TREE_RULES'?`${start}\n${content}\n${end}\n`:`<!-- ${name}_BEGIN -->\n${content}\n<!-- ${name}_END -->\n`;const pattern=name==='SKILL_TREE_RULES'?/\/\* SKILL_TREE_RULES_BEGIN \*\/[\s\S]*?\/\* SKILL_TREE_RULES_END \*\/\r?\n/:new RegExp(`<!-- ${name}_BEGIN -->[\\s\\S]*?<!-- ${name}_END -->\\r?\\n`);if(pattern.test(html))html=html.replace(pattern,()=>block);else {if(!html.includes(anchor))throw Error('Missing anchor '+anchor);html=html.replace(anchor,()=>block+anchor);}}
if(fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n')!==html.replace(/\r\n/g,'\n')){const temporary=target+'.sync-'+process.pid+'.tmp';fs.writeFileSync(temporary,html);try{try{fs.renameSync(temporary,target);}catch(error){if(!['EPERM','EACCES'].includes(error.code))throw error;const fd=fs.openSync(target,'r+');try{fs.writeFileSync(fd,html);fs.ftruncateSync(fd,Buffer.byteLength(html));}finally{fs.closeSync(fd);}}}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}}console.log('Embedded skill trees updated.');
