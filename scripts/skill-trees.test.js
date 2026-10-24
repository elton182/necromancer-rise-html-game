const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const BuildModel=require('../build-simulator/model.js');
const html=fs.readFileSync(require('node:path').join(__dirname,'../necromancer-canvas.html'),'utf8').replace(/\r\n/g,'\n');
const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
const integration=fs.readFileSync(require('node:path').join(__dirname,'skill-trees.js'),'utf8');
function fn(name){const start=source.indexOf('function '+name+'('),end=source.indexOf('\n}',start);assert.ok(start>=0,name);return source.slice(start,end+2);}
function fixture(){
 const c=vm.createContext({BuildModel,console,BoneBoltVFX:require('./skill-vfx.js')});
 vm.runInContext(`
 const player={level:1,hp:100,maxHp:100,mp:80,maxMp:80,exp:0,expNext:100,spellDmg:40,spellRadius:2.5,mpRegen:4,hpRegen:0,maxSp:60,minionSlots:30,souls:900,skillPoints:0,learnedSkills:new Set(['raio']),skillRanks:{},skillGrants:[],actionLoadout:['raio','zombie','dash','empty','empty','empty'],minionSkillCooldowns:{},spellCooldowns:{},barrierCd:0,summonLoadout:Array(7).fill(null),summonReserve:[],upgradeCount:{},minionUpgradeCount:{},spellUpgradeCount:{},inventory:[]};
 const MINION_DEFS={zombie:{hp:130,dmg:11,spd:3.4,atkR:1.5,atkRate:1.2,spCost:20,name:'Zumbi'},abom:{hp:400,dmg:30,spd:2.7,atkR:2.1,atkRate:1.25,spCost:40,name:'Abominação'},skeleton:{hp:50,dmg:14,spd:3.8,atkR:1.6,atkRate:.9,spCost:35},archer:{hp:40,dmg:13,spd:3.2,atkR:7.5,atkRate:1.1,spCost:30},specter:{hp:35,dmg:22,spd:4.6,atkR:2,atkRate:.7,spCost:55}};
 const ACTION_SKILLS={raio:{},maos:{},barreira:{},chuva:{},explosao:{},dash:{},empty:{},zombie:{summon:true,passive:'zombie_burst',cooldown:1.2,ability:'Explosão'},abom:{summon:true,passive:'abom_slam',cooldown:8},archer:{summon:true,passive:'archer_power',cooldown:7}};
 const DEFAULT_ACTION_LOADOUT=['raio','zombie','dash','empty','empty','empty'];
 const SW_COST={zombie:[0,20],skeleton:[15,30],archer:[15,30],specter:[30,45],abom:[0,25]},MANAGEMENT_INFO={upgrades:['',''],skills:['','']};
 const CAMP={on:false,map:false,cleared:{},summon:true},TITLE={active:false,paused:false},COMIC={active:false},P={x:0,y:0,face:1,deadT:0},playerDash={time:0,cd:0},PAD={},keys={},mouse={x:2,y:0},LEASH_DIST=8,MINION_REVIVE_TIME=12;
 let droppedItems=[],timers=[];const setTimeout=f=>timers.push(f);let gameState='field',minions=[],enemies=[],handsAreas=[],boltsFx=[],spellFx=[],eshots=[],minionHpBonus=0,minionDmgBonus=0,minionRegenBonus=0,actionSignature='',actionAvailabilitySignature='',summonSlotsSignature='',summonWheelOpen=false,mobZones=[],wave=0,shake=0,_mpSig='';
 const innerWidth=1200,innerHeight=800,scene={remove(){}},necroGroup={position:{x:0,z:0}};
 const document={getElementById:()=>({textContent:'',innerHTML:'',remove(){},classList:{remove(){}}})};
 const mkMesh2=(x=0,z=0)=>({position:{x,y:0,z,set(x,y,z){Object.assign(this,{x,y,z});}},traverse(){}}),bindXY=o=>{Object.defineProperties(o,{x:{get(){return this.mesh.position.x},set(v){this.mesh.position.x=v}},y:{get(){return this.mesh.position.z},set(v){this.mesh.position.z=v}}});return o;};
 const floatMsg=()=>{},playSound=()=>{},updateHUD=()=>{},updateMinionPanel=()=>{},showOverlay=()=>{},renderSummonSlots=()=>{},renderActionSlots=()=>{},reconcileActionSummons=()=>{},syncSummonProgress=()=>{},ring=()=>{},burst=()=>{},castAnim=()=>{},tutEvent=()=>{},spawnExplosaoFX=()=>{},gameOver=()=>{},worldToScreen=()=>({x:0,y:0}),updateEnemyHpBar=()=>{},screenToWorld=(x,y)=>({x,z:y}),setCommand=()=>{},clampMobLanding=(x,y)=>({x,y});
 let killEnemy=e=>{e.dead=true;},summonAvailable=()=>true,campSyncSlots=()=>{};
 const localMinionTarget=()=>enemies.find(e=>!e.dead),minionSpCost=t=>MINION_DEFS[t].spCost,unlockedSummonIndices=()=>[0,1,2],slotMembers=i=>minions.filter(m=>m.summonSlot===i),actionGroup=t=>minions.filter(m=>m.type===t);
 const stageOf=n=>({grant:n===2?'summon':n===3?'maos':n===4?'barreira':'raio'}),initializeDefaultSummonGroup=()=>{};
 let hasPassive=()=>false,minionBonus=()=>0,spellBonus=()=>0,swStats=()=>{},summonTypeAvailable=()=>true,summonGroupSize=()=>1,loadGame=()=>false,gainSouls=()=>{},spawnSoulOrb=()=>{},onLevelUp=()=>{},gainExp=()=>{},campNewChar=()=>{},activateActionSlot=()=>{},updateActionSystem=()=>{},buildUpgradeGrid=()=>{},buildMinionUpgradeGrid=()=>{},buildSpellUpgradesSection=()=>{},buyUpgrade=()=>{},buyMinionUpgrade=()=>{},buySpellUpgrade=()=>{},fuseZombies=()=>{},learnSkill=()=>{},unlearnSkill=()=>{},respecAllSkills=()=>{},actionSkillAvailable=()=>true,activateSummonSkill=()=>{},updateAllyLeap=()=>{},saveGame=()=>{},showHubOverlay=()=>{},showTab=()=>{};
 function setup(level,ranks){player.level=level;player.skillRanks={...ranks};skillSync();}
 function enemy(x=2){return {x,y:0,hp:1000,maxHp:1000,dmg:100,dead:false,isBoss:true,mesh:mkMesh2(x,0)};}
 `,c);
 for(const name of ['spawnMinion','killMinion','abilityReady','castHands','castRaio','castChuva','castExplosao','castBarrier','sacrificeCandidate','castDash','dealDamageToPlayer','dealDamageToEnemy','minionStrike','campGrant','checkPickups'])vm.runInContext(fn(name),c);
 vm.runInContext(integration,c);
 return code=>vm.runInContext(code,c);
}
test('Zumbi e Abominação fortalecem vida e dano um do outro e retiram bônus ao devolver pontos',()=>{
 const run=fixture();run('setup(30,{zombie:2,vigor:2,burst:2,abom:2,colossus:1});const z=skillMinionStats("zombie"),a=skillMinionStats("abom");player.skillRanks.abom=3;skillSync();');
 assert.ok(run('skillMinionStats("zombie").hp>z.hp'));assert.ok(run('skillMinionStats("zombie").dmg>z.dmg'));
 run('player.skillRanks.abom=2;player.skillRanks.zombie=3;skillSync();');
 assert.ok(run('skillMinionStats("abom").hp>a.hp'));assert.ok(run('skillMinionStats("abom").dmg>a.dmg'));
 run('player.skillRanks.zombie=2;skillSync();');assert.equal(run('skillMinionStats("zombie").hp'),run('z.hp'));assert.equal(run('skillMinionStats("abom").dmg'),run('a.dmg'));
});

test('migração redistribui exatamente o orçamento e remove souls e upgrades antigos',()=>{
 const run=fixture();run(`const old={level:12,mode:'campaign',hp:180,maxHp:300,mp:50,maxMp:150,souls:900,skillPoints:98,learnedSkills:['raio','maos','barreira','aura'],upgradeCount:{mhp:5},spellUpgradeCount:{raio_d:5},actionLoadout:['raio','maos','abom','archer','dash','barreira']};const migrated=skillMigrateSave(old);`);
 assert.equal(run('migrated.skillPoints'),33);assert.equal(run('migrated.souls'),0);assert.equal(run('Object.keys(migrated.upgradeCount).length'),0);assert.equal(run('migrated.maxHp'),210);assert.equal(run('migrated.actionLoadout[2]'),'empty');assert.equal(run('migrated.learnedSkills.includes("barreira")'),false);
 const first=run('JSON.stringify(migrated)');assert.equal(run('JSON.stringify(skillMigrateSave(migrated))'),first);
});
test('save novo conserva ranks e remove liberações narrativas antigas',()=>{
 const run=fixture();run(`const p=BuildModel.presets.tank;const saved=skillMigrateSave({level:30,mode:'free',skillTreeVersion:1,skillRanks:p.ranks,skillGrants:['raio','zombie','dash','maos'],hp:300,maxHp:390,mp:100,maxMp:225,learnedSkills:[],actionLoadout:['raio','zombie','abom','dash','maos','barreira']});`);
 assert.equal(run('saved.skillPoints'),53);assert.equal(run('saved.skillRanks.colossus'),1);assert.equal(run('saved.skillGrants.includes("maos")'),false);
});
test('uma subida dá 3 pontos sem bônus por alma ou marcos de campanha',()=>{
 const run=fixture();run('gainExp(100)');assert.equal(run('player.level'),2);assert.equal(run('player.skillPoints'),3);run('gainSouls(1000)');assert.equal(run('player.souls'),0);
});
test('Zumbi e Carne Reanimada modificam stats reais da Abominação',()=>{
 const run=fixture();run('setup(30,{zombie:5,vigor:5,abom:5,colossus:1}); const a=spawnMinion("abom");');
 assert.equal(run('a.maxHp'),1742);assert.equal(run('a.dmg'),100);assert.equal(run('summonTypeAvailable("archer")'),false);assert.equal(run('summonTypeAvailable("abom")'),true);assert.equal(run('a.hpRegen'),17.42);
});
test('Tiro e Chuva recebem sinergias e perfuração sem consumir souls',()=>{
 const run=fixture();run('setup(30,{bolt:5,pierce:3,rain:4,shards:2});castRaio(2,0);');
 assert.equal(run('boltsFx[0].maxPierce'),4);assert.ok(Math.abs(run('boltsFx[0].dmg')-138.84)<1e-8);run('player.mp=100;castChuva(2,0);');assert.ok(Math.abs(run('spellFx.find(f=>f.kind==="bone").dmg')-187.824)<1e-8);assert.equal(run('player.mp'),60);
});
test('Estilhaços liberam o leque de 3 ossos do Tiro de Osso',()=>{
 const run=fixture();run('setup(30,{bolt:2,pierce:2,shards:1});player.mp=80;castRaio(2,0);');
 assert.equal(run('boltsFx.length'),3);assert.equal(run('boltsFx.every(b=>b.shard)'),true);assert.equal(run('player.mp'),60);
 run('boltsFx=[];player.skillRanks={bolt:2};skillSync();player.spellCooldowns.raio=0;player.mp=80;castRaio(2,0);');assert.equal(run('boltsFx.length'),1);assert.equal(run('boltsFx[0].shard'),false);
});
test('Tiro sem equipamento exige dois acertos no guerreiro inicial e cinco no bruto',()=>{
 const run=fixture();run('setup(1,{});castRaio(2,0);');assert.equal(run('boltsFx[0].dmg'),20);assert.equal(Math.ceil(40/run('boltsFx[0].dmg')),2);assert.equal(Math.ceil(100/run('boltsFx[0].dmg')),5);
 run('setup(2,{bolt:3});player.spellCooldowns.raio=0;player.mp=80;castRaio(2,0)');assert.ok(Math.abs(run('boltsFx[1].dmg')-28.6)<1e-8);
});
test('explosão de zumbi usa dano ampliado e raio de 3,5, preservando sacrifício e recarga',()=>{
 const run=fixture();run('setup(12,{zombie:2,burst:2});const z=spawnMinion("zombie");z.x=z.y=0;enemies=[enemy(3.3),enemy(3.6)];activateSummonSkill("zombie",0,0);');
 assert.equal(run('enemies[0].hp'),898);assert.equal(run('enemies[1].hp'),1000);assert.equal(run('z.exploded'),true);assert.equal(run('z.dead'),true);assert.equal(run('player.minionSkillCooldowns.zombie'),1.2);
});
test('Explosão Necrótica só usa mana e soma sinergias de ambas as árvores',()=>{
 const run=fixture();run('setup(30,{shield:2,nova:2,ritual:3,zombie:2,burst:2,unstable:2}); player.mp=100;enemies=[enemy()];castExplosao(2,0);');
 assert.equal(run('player.mp'),40);assert.equal(run('player.souls'),0);assert.equal(run('enemies[0].hp'),361);assert.equal(run('player.spellCooldowns.explosao'),8);
});
test('Maldição altera dano do inimigo e restaura ao expirar',()=>{
 const run=fixture();run('setup(30,{dash:2,meditate:2,curse:5}); enemies=[enemy()];skillCastCurse(2,0);');assert.equal(run('enemies[0].dmg'),85);run('updateActionSystem(6.1)');assert.equal(run('enemies[0].dmg'),100);
});
test('Pacto cura morte comum, sem cura em detonação ou sacrifício',()=>{
 const run=fixture();run('setup(30,{zombie:2,shield:2,vitality:2,pact:3});player.hp=100;const z=spawnMinion("zombie");killMinion(z);');assert.equal(run('player.hp'),113.56);
 run('player.hp=100;const z2=spawnMinion("zombie");z2.exploded=true;killMinion(z2);');assert.equal(run('player.hp'),100);
});
test('Dash, defesa após Dash e muralha usam os ranks reais',()=>{
 const run=fixture();run('setup(30,{dash:5,stride:3,veil:2,walker:1,bolt:2,rain:2,wall:3});player.mp=100;castHands(2,0);castDash();');
 assert.equal(run('handsAreas[0].life'),6.5);assert.equal(run('handsAreas[0].hp'),208);assert.ok(Math.abs(run('playerDash.cd')-1.8)<1e-8);assert.ok(run('player.skillVeilT')>1);
 run('playerDash.time=0;player.hp=200;dealDamageToPlayer(100);');assert.equal(run('player.hp'),125);
});
test('arquivo final inclui exatamente o modelo e as regras atuais, com sintaxe válida',()=>{
 for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 assert.ok(html.includes(integration.replace(/\r\n/g,'\n')));assert.ok(html.includes(fs.readFileSync(require('node:path').join(__dirname,'../build-simulator/model.js'),'utf8').replace(/\r\n/g,'\n')));
});
test('Aura soma com a escola e com o comando, respeitando distância do personagem',()=>{
 const run=fixture();run('setup(30,{zombie:5,vigor:2,abom:3,dash:2,meditate:2,curse:2,aura:1});const m=spawnMinion("abom");m.x=1;m.y=0;');
 assert.ok(Math.abs(run('skillDamage(m)')-106.2)<1e-8);assert.ok(Math.abs(run('skillDamage(m,40)')-129.8)<1e-8);run('m.x=20;');assert.ok(Math.abs(run('skillDamage(m)')-88.5)<1e-8);
});
test('refund é bloqueado em combate e durante recuperação de sacrifício',()=>{
 const run=fixture();assert.equal(run('skillCanRefund()'),false);run('gameState="hub";setup(2,{zombie:1});');assert.equal(run('skillCanRefund()'),true);run('const m=spawnMinion("zombie");m.sacrificed=true;');assert.equal(run('skillCanRefund()'),false);
});
test('refund is available while paused between waves and explains gold or recovery restrictions',()=>{
 const run=fixture();run('TITLE.paused=true;gameState="field";enemies=[];setup(2,{bolt:1});player.gold=0;');assert.equal(run('skillCanRefund()'),true);
 run('skillRefresh=()=>skillSync();skillRefund("bolt")');assert.equal(run('skillRank("bolt")'),1);run('player.gold=20;skillRefund("bolt")');assert.equal(run('skillRank("bolt")'),0);assert.equal(run('player.gold'),0);
 run('enemies=[enemy()];');assert.equal(run('skillCanRefund()'),false);assert.match(run('skillRefundReason()'),/sem inimigos/);
 run('gameState="hub";minions=[{exploded:true}];');assert.equal(run('skillCanRefund()'),false);assert.match(run('skillRefundReason()'),/Feche a pausa/);
});
test('drenagem do Espectro cura a si mesmo e compartilha a cura efetiva com Zephyr',()=>{
 const run=fixture();run('setup(30,{specter:2,drain:5,bond:5,vampire:1});const m=spawnMinion("specter");m.hp=1;player.hp=100;const target=enemy();minionStrike(m,target);');
 assert.ok(run('m.hp')>1);assert.ok(run('player.hp')>100);assert.equal(run('m.lifeDrain'),false);
});
test('ouro cai uma vez por inimigo, fica no chão e só é creditado ao coletar',()=>{
 const run=fixture();run('player.gold=0;const mob=enemy(5);mob.isBoss=false;mob.xp=20;killEnemy(mob,5,0);killEnemy(mob,5,0);');assert.equal(run('droppedItems.length'),1);assert.equal(run('player.gold'),0);assert.equal(run('droppedItems[0].amount'),7);
 run('checkPickups(.1)');assert.equal(run('player.gold'),0);run('P.x=5;checkPickups(.1)');assert.equal(run('player.gold'),7);assert.equal(run('droppedItems.length'),0);run('checkPickups(.1)');assert.equal(run('player.gold'),7);
});
test('gold não restaura mana, chefes deixam mais e alvos de treino não deixam ouro',()=>{
 const run=fixture();run('player.gold=0;player.mp=1;const boss=enemy();boss.xp=20;killEnemy(boss,0,0);const dummy=enemy();dummy.dummy=true;killEnemy(dummy,0,0);checkPickups(.1);');assert.equal(run('player.gold'),21);assert.equal(run('player.mp'),1);
 run('const distant=enemy(10);killEnemy(distant,10,0);checkPickups(50);');assert.equal(run('droppedItems.length'),0);
});
test('reset cobra 20 ouro por ponto; saldo insuficiente não modifica a build',()=>{
 const run=fixture();run('setup(30,{zombie:2,vigor:2,abom:2,colossus:1});gameState="hub";player.gold=139;');assert.equal(run('skillResetCost()'),140);run('respecAllSkills()');assert.equal(run('skillResetCost()'),140);assert.equal(run('player.gold'),139);
 // Avoid rendering a fake DOM after a successful transaction.
 run('skillRefresh=()=>skillSync();player.gold=140;respecAllSkills();');assert.equal(run('player.gold'),0);assert.equal(run('skillResetCost()'),0);assert.equal(run('player.skillPoints'),87);
});
test('devolução parcial cobra os descendentes e não contorna o custo do reset',()=>{
 const run=fixture();run('setup(30,{zombie:2,vigor:2,abom:2,colossus:1});gameState="hub";player.gold=1000;skillRefresh=()=>skillSync();');assert.equal(run('skillRefundQuote("vigor").cost'),80);run('skillRefund("vigor")');assert.equal(run('player.gold'),920);assert.equal(run('skillRank("abom")'),0);assert.equal(run('skillRank("colossus")'),0);assert.equal(run('skillRank("vigor")'),1);
});
test('campanha não concede skills nem bloqueia invocações da árvore',()=>{
 const run=fixture();run('CAMP.on=true;CAMP.summon=false;setup(12,{skeleton:2,archer:1});campGrant(3);campGrant(4);');assert.equal(run('skillUnlocked("maos")'),false);assert.equal(run('skillUnlocked("barreira")'),false);assert.equal(run('summonTypeAvailable("archer")'),true);assert.equal(run('CAMP.summon'),true);
});
test('tutorial é agendado uma vez no nível 2 e termina após os três primeiros pontos',()=>{
 const run=fixture();run('gainExp(100);');assert.equal(run('player.skillTutorialState'),'pending');assert.equal(run('timers.length'),1);run('gainExp(140)');assert.equal(run('timers.length'),1);
 run('player.skillTutorialState="allocating";skillRefresh=()=>skillSync();skillInvest("zombie");skillInvest("bolt");');assert.equal(run('player.skillTutorialState'),'allocating');run('skillInvest("dash")');assert.equal(run('player.skillTutorialState'),'done');
});
test('personagem novo começa sem zumbis e precisa investir o primeiro ponto para equipar e evocar',()=>{
 const run=fixture();assert.equal(run('minions.length'),0);assert.equal(run('skillUnlocked("zombie")'),false);assert.equal(run('actionSkillAvailable("zombie")'),false);assert.equal(run('spawnMinion("zombie")'),null);assert.equal(run('player.summonLoadout.every(t=>t===null)'),true);assert.equal(run('player.actionLoadout.includes("zombie")'),false);
 run('gainExp(100);skillRefresh=()=>skillSync();skillInvest("zombie");');assert.equal(run('skillRank("zombie")'),1);assert.equal(run('player.skillPoints'),2);assert.equal(run('actionSkillAvailable("zombie")'),true);assert.ok(run('spawnMinion("zombie")'));assert.equal(run('minions.length'),1);
});
test('saves sem ponto em Zumbis perdem a liberação antiga e seus grupos gratuitos',()=>{
 const run=fixture();run('const old={level:1,mode:"free",skillTreeVersion:1,skillRanks:{},skillGrants:["raio","zombie","dash"],learnedSkills:["raio","zombie","dash"],actionLoadout:["raio","zombie","dash","empty","empty","empty"],summonLoadout:["zombie"],summonGroups:[{slot:0,type:"zombie",count:3}],summonReserve:[{type:"zombie",count:3}],minionTypes:["zombie","zombie","zombie"]};const migrated=skillMigrateSave(old);');
 assert.equal(run('migrated.learnedSkills.includes("zombie")'),false);assert.equal(run('migrated.actionLoadout[1]'),'empty');assert.equal(run('migrated.summonGroups.length'),0);assert.equal(run('migrated.summonReserve.length'),0);assert.equal(run('migrated.minionTypes.length'),0);
});
test('aprender habilidade equipável agenda orientação uma vez, melhorias e passivas não repetem',()=>{
 const run=fixture();run('setup(12,{});skillRefresh=()=>skillSync();skillInvest("zombie");');assert.equal(run('player.skillEquipTutorialPending'),'zombie');assert.equal(run('timers.length'),1);
 run('skillInvest("zombie");skillInvest("vigor");');assert.equal(run('timers.length'),1);
 run('skillEquipTutorialDone("zombie");player.skillRanks={};skillSync();skillInvest("zombie");');assert.equal(run('player.skillEquipTutorialPending'),null);assert.equal(run('timers.length'),1);
});
test('orientação não aparece para habilidade já equipada e só conclui a pendência selecionada',()=>{
 const run=fixture();run('setup(12,{zombie:1});player.actionLoadout[1]="zombie";');assert.equal(run('skillEquipTutorialQueue("zombie")'),false);assert.equal(run('skillEquipTutorialQueue("raio")'),false);
 run('player.actionLoadout[1]="empty";');assert.equal(run('skillEquipTutorialQueue("zombie")'),true);run('skillEquipTutorialDone("zombie");');assert.equal(run('player.skillEquipTutorialSeen.includes("zombie")'),true);assert.equal(run('player.skillEquipTutorialPending'),null);
});
test('save preserva orientação pendente e descarta pendência de habilidade indisponível',()=>{
 const run=fixture();run('const saved={level:12,mode:"free",skillTreeVersion:1,skillRanks:{zombie:1},skillEquipTutorialSeen:["invalida","raio"],skillEquipTutorialPending:"zombie",actionLoadout:["raio","empty","dash","empty","empty","empty"]};const valid=skillMigrateSave(saved);');assert.equal(run('valid.skillEquipTutorialPending'),'zombie');assert.equal(run('valid.skillEquipTutorialSeen.includes("invalida")'),false);
 run('valid.skillRanks={};skillMigrateSave(valid);');assert.equal(run('valid.skillEquipTutorialPending'),null);
});
