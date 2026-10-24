// Run with Node.js; executes the actual game functions in an isolated combat fixture.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(`${__dirname}/necromancer-canvas.html`, 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach((s, i) => new vm.Script(s, {filename: `game-script-${i}`}));
const source = scripts.join('\n');
function fn(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const end = source.indexOf('\n}', start);
  return source.slice(start, end + 2);
}
function fixture() {
  const context = vm.createContext({console});
  vm.runInContext(`
    const ABILITY_VERSION=1;
    let handsAreas=[], boltsFx=[], enemies=[], minions=[], gameState='field',minionCommand=null,commandMarker=null,pendingCommand='auto',summonWheelOpen=false,mobZones=[];
    const playerDash={time:0,cd:0};
    const TITLE={active:false,paused:false}, COMIC={active:false}, CAMP={map:false,on:false}, mouse={x:2,y:0};
    const screenToWorld=(x,z)=>({x,z});
    const toggleSummonWheel=()=>summonWheelOpen=!summonWheelOpen;
    const castChuva=()=>{},castExplosao=()=>{};
    const LEASH_DIST=8,MINION_RETURN_DIST=3;
    let strikes=0;
    const minionStrike=()=>strikes++;
    let player={hp:100,maxHp:100,mp:80,spellDmg:40,spellCooldowns:{raio:0,maos:0},barrierCd:0,learnedSkills:new Set(['raio','maos','barreira'])};
    const P={x:0,y:0,face:1,deadT:0}, STG={on:false}, cam={x:0}, FIELD_R=100, W=800,S=32;
    const innerWidth=800,innerHeight=600;
    let shake=0;
    const scene={remove:()=>{}}, gameOver=()=>{};
    const document={getElementById:()=>null,querySelectorAll:()=>[]};
    const placeCommandMarker=(x,z,type)=>commandMarker={x,z,type}, removeCommandMarker=()=>commandMarker=null;
    const updateCombatInterface=()=>{};
    const updateActionSystem=()=>{};
    const closeSummonPicker=()=>summonWheelOpen=false;
    const activateActionSlot=(i,x,y)=>castAssignedSpell(['raio','maos'][i],x,y);
    const syncSummonProgress=()=>{},renderSummonSlots=()=>{};
    const floatMsg=()=>{}, castAnim=()=>{},ring=()=>{},burst=()=>{},playSound=()=>{},updateHUD=()=>{},updateMinionPanel=()=>{},tutEvent=()=>{},spawnExplosaoFX=()=>{};
    const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
    let reinforced=false;
    const hasPassive=id=>id==='bastiao'?reinforced:player.learnedSkills.has(id), spellBonus=()=>0;
    const necroGroup={position:{x:0,z:0}};
    const mkMesh2=(x,z)=>({position:{x,z},rotation:{y:0},traverse:()=>{}});
    const dealDamageToEnemy=(e,d)=>{e.hp-=d;};
    function zombie(hp,maxHp,x=0){return {type:'zombie',hp,maxHp,x,y:0,dead:false,mesh:mkMesh2(x,0),spd:3.4,atkR:1.5,atkRate:1.2,atkTimer:0,orbitAngle:0,orbitRadius:2};}
  `, context);
  for (const name of ['abilityReady','castHands','handsSpeed','tickCorpseWalls','wallNearest','resetAbilities','updateAbilities','castRaio','updateBolts','sacrificeCandidate','castBarrier','migrateAbilitySave','tryReanimate','dismissMinion','dealDamageToPlayer','minionTargetAllowed','localMinionTarget','moveMinionTo','updateMinionIntent','minionStateText','setCommand','applyRightClick','combatInputAllowed','castAssignedSpell','castHotkey','castSpell','selectSpell','handlePrimaryClick','handleSecondaryClick','updateAllyLeap']) {
    vm.runInContext(fn(name), context);
  }
  return code => vm.runInContext(code, context);
}
let checks=0;
function test(name, callback) { callback(fixture()); checks++; console.log(`OK ${name}`); }
test('Raio: custo, recarga, dano, primeiro alvo e colisão com passo longo', run => {
  run(`enemies=[{x:6,y:0,hp:100,mesh:mkMesh2(6,0)},{x:3,y:0,hp:100,mesh:mkMesh2(3,0)}]; castRaio(9,0); castRaio(9,0);`);
  assert.equal(run('player.mp'),60);
  assert.equal(run('boltsFx.length'),1);
  run('updateBolts(.5)');
  assert.equal(run('enemies[0].hp'),100);
  assert.equal(run('enemies[1].hp'),60);
  assert.equal(run('boltsFx.length'),0);
});
test('Raio: distância de viagem limitada a 9', run => {
  run('castRaio(50,0); const bolt=boltsFx[0]; updateBolts(2)');
  assert.equal(run('bolt.mesh.position.x'),9);
  assert.equal(run('boltsFx.length'),0);
});
test('Muralha: alcance inválido não cobra, duração e custo corretos, sem lentidão antiga', run => {
  run('castHands(10,0)'); assert.equal(run('player.mp'),80);
  run('castHands(2,0); const e={x:2,y:0};');
  assert.equal(run('player.mp'),45);
  assert.equal(run('handsSpeed(e)'),1);
  assert.equal(run('handsAreas[0].half*2'),5);
  run('handsAreas.push({...handsAreas[0]})'); assert.equal(run('handsSpeed(e)'),1);
  run('e.x=12'); assert.equal(run('handsSpeed(e)'),1);
  run('updateAbilities(5)'); assert.equal(run('handsAreas.length'),0);
  assert.equal(run('player.spellCooldowns.maos'),7);
});
test('Escudo: sacrifica menor proporção de HP e usa HP máximo', run => {
  run('minions=[zombie(60,130),zombie(10,180)]; castBarrier()');
  assert.equal(run('player.barrier'),126);
  assert.equal(run('player.mp'),65);
  assert.equal(run('minions[0].dead'),false);
  assert.equal(run('minions[1].sacrificed'),true);
  assert.equal(run('minions[1].deadTimer'),20);
  assert.equal(run('player.barrierT'),8);
  run('castBarrier()'); assert.equal(run('player.mp'),65);
});
test('Escudo: empate por distância e Carne Reforçada explícita', run => {
  run('minions=[zombie(65,130,5),zombie(65,130,1)]; reinforced=true; castBarrier()');
  assert.equal(run('minions[1].dead'),true);
  assert.equal(run('player.barrier'),130);
});
test('Escudo sem zumbi: custo de vida, absorção e proteção contra morte', run => {
  run('player.hp=15; castBarrier()'); assert.equal(run('player.mp'),80);
  assert.equal(run('player.hp'),15);
  run('player.hp=16; castBarrier()'); assert.equal(run('player.hp'),1);
  assert.equal(run('player.barrier'),25);
  assert.equal(run('player.mp'),65);
});
test('Mana insuficiente não sacrifica nem começa recarga', run => {
  run('player.mp=14; minions=[zombie(1,180)]; castBarrier(); castRaio(1,0); castHands(1,0)');
  assert.equal(run('minions[0].dead'),false);
  assert.equal(run('player.barrierCd'),0);
  assert.equal(run('player.spellCooldowns.raio'),0);
});
test('Migração da campanha: desbloqueios, reembolso e idempotência', run => {
  run(`let d={mode:'campaign',camp:{unlocked:3},learnedSkills:['nova','bastiao'],activeSpell:'nova',souls:10,spellUpgradeCount:{nova_d:2,raio_d:1}}; migrateAbilitySave(d)`);
  assert.equal(run('d.souls'),127);
  assert.equal(run('d.skillPoints'),1);
  assert.equal(run('d.camp.summon'),true);
  assert.equal(run('d.learnedSkills.includes("maos")'),true);
  assert.equal(run('d.learnedSkills.includes("barreira")'),false);
  assert.equal(run('d.activeSpell'),'raio');
  assert.equal(run('d.spellUpgradeCount.raio_d'),1);
  run('migrateAbilitySave(d)'); assert.equal(run('d.souls'),127);
});
test('Migração de modo livre mantém a habilidade adquirida no antigo slot 2', run => {
  run(`let d={mode:'free',learnedSkills:['nova','raio','chuva'],activeSpell:'raio'}; migrateAbilitySave(d)`);
  assert.equal(run('d.learnedSkills.includes("maos")'),true);
  assert.equal(run('d.learnedSkills.includes("chuva")'),true);
});
test('Reset remove áreas, proteção e recargas temporárias', run => {
  run('castHands(1,0); castBarrier(); resetAbilities()');
  assert.equal(run('handsAreas.length'),0);
  assert.equal(run('player.barrier'),0);
  assert.equal(run('player.spellCooldowns.maos'),0);
});
test('Sacrifício não permite reanimar com R nem dispensar para liberar capacidade', run => {
  run('minions=[zombie(1,180)]; castBarrier(); tryReanimate(); dismissMinion(0)');
  assert.equal(run('minions.length'),1);
  assert.equal(run('minions[0].dead'),true);
  assert.equal(run('minions[0].deadTimer'),20);
  assert.equal(run('player.mp'),65);
});
test('Absorção aplica apenas o excedente à vida e não acumula escudo', run => {
  run('minions=[zombie(1,180)]; castBarrier(); dealDamageToPlayer(150)');
  assert.equal(run('player.hp'),76);
  assert.equal(run('player.barrier'),0);
  run('player.barrierCd=0; castBarrier()');
  assert.equal(run('player.barrier'),25);
});
test('Progressão concede Raio, invocação, Mãos e Escudo nas quatro fases', run => {
  const match = source.match(/const CAMP_STAGES=(\[[\s\S]*?\n\]);/);
  assert.ok(match);
  const stages = vm.runInNewContext(match[1]);
  assert.deepEqual(Array.from(stages.slice(1), s=>s.grant), ['raio','summon','maos','barreira']);
});
test('Horda ignora inimigos fora da região de Zephyr', run=>{
  run('const m=zombie(130,130,2); enemies=[{mesh:mkMesh2(30,0)}]; updateMinionIntent(m,0,.05,necroGroup.position)');
  assert.equal(run('m.target'),null);
  assert.ok(run('Math.hypot(m.mesh.position.x,m.mesh.position.z)')<3);
});
test('Retorno continua após cruzar o limite, sem readquirir alvo até chegar perto', run=>{
  run('const m=zombie(130,130,9); enemies=[{mesh:mkMesh2(7,0)}]; updateMinionIntent(m,0,.1,necroGroup.position)');
  assert.equal(run('m.returning'),true);
  run('for(let i=0;i<4;i++) updateMinionIntent(m,0,.1,necroGroup.position)');
  assert.ok(run('m.mesh.position.x')<8);
  assert.equal(run('m.returning'),true);
  assert.equal(run('m.target'),null);
  run('for(let i=0;i<20&&m.returning;i++) updateMinionIntent(m,0,.1,necroGroup.position)');
  assert.equal(run('m.returning'),false);
  assert.ok(run('m.mesh.position.x')<=3);
});
test('Alvo que sai da região é abandonado; inimigo próximo continua sendo atacado', run=>{
  run('const m=zombie(130,130,5); const e={mesh:mkMesh2(5.5,0)}; enemies=[e]; m.target=e; updateMinionIntent(m,0,.1,necroGroup.position)');
  assert.equal(run('strikes'),1);
  run('e.mesh.position.x=10; updateMinionIntent(m,0,.1,necroGroup.position)');
  assert.equal(run('m.returning'),true);
  assert.equal(run('m.target'),null);
});
test('Comando distante de ataque não autoriza perseguir fora da região', run=>{
  run("const m=zombie(130,130,2); enemies=[{mesh:mkMesh2(20,0)}]; minionCommand={type:'attack',x:20,z:0}; updateMinionIntent(m,0,.1,necroGroup.position)");
  assert.equal(run('m.target'),null);
  assert.ok(run('m.mesh.position.x')<3);
});
test('Ponto de reunião distante é limitado à região do personagem', run=>{
  run("const m=zombie(130,130,2); minionCommand={type:'rally',x:100,z:0}; for(let i=0;i<100;i++)updateMinionIntent(m,0,.05,necroGroup.position)");
  assert.ok(run('m.mesh.position.x')<=7);
  assert.ok(run('m.mesh.position.x')>3);
});
test('Retorno acompanha Zephyr em movimento e alcança sua formação', run=>{
  run('const m=zombie(130,130,-9); for(let i=0;i<100;i++){necroGroup.position.x+=.2;updateMinionIntent(m,0,.05,necroGroup.position)}');
  assert.ok(run('Math.abs(m.mesh.position.x-necroGroup.position.x)')<4);
});
test('Textos diferenciam morte, sacrifício e retorno', run=>{
  run('const m=zombie(0,130); m.dead=true; m.deadTimer=12;');
  assert.match(run('minionStateText(m)'),/V: 30 MP/);
  run('m.sacrificed=true');
  assert.match(run('minionStateText(m)'),/Sacrificado/);
  assert.doesNotMatch(run('minionStateText(m)'),/V:/);
});
test('Comando manual permanece ativo depois de restaurar o modo automático do cursor', run=>{
  run("pendingCommand='attack'; applyRightClick(5,0)");
  assert.equal(run('pendingCommand'),'auto');
  assert.equal(run('minionCommand.type'),'attack');
  assert.equal(run('commandMarker.type'),'attack');
  run("setCommand('auto')");
  assert.equal(run('minionCommand'),null);
});
test('Clique de reunião distante mantém seu marcador dentro do limite', run=>{
  run("applyRightClick(50,0)");
  assert.equal(run('minionCommand.x'),7);
  assert.equal(run('commandMarker.x'),7);
});
test('Mouse 1 sempre dispara Raio, mesmo após usar Mãos', run=>{
  run("player.activeSpell='maos'; handlePrimaryClick({clientX:2,clientY:0})");
  assert.equal(run('boltsFx.length'),1);
  assert.equal(run('handsAreas.length'),0);
  assert.equal(run('player.mp'),60);
});
test('Mouse 2 lança Mãos sem precisar de minions', run=>{
  run("player.activeSpell='raio'; handleSecondaryClick({clientX:2,clientY:0,preventDefault(){}})");
  assert.equal(run('handsAreas.length'),1);
  assert.equal(run('minionCommand'),null);
  assert.equal(run('player.mp'),45);
});
test('Shift + Mouse 2 comanda a horda sem lançar magia', run=>{
  run("minions=[zombie(130,130)]; handleSecondaryClick({clientX:2,clientY:0,shiftKey:true,preventDefault(){}})");
  assert.equal(run('minionCommand.type'),'rally');
  assert.equal(run('handsAreas.length'),0);
  assert.equal(run('player.mp'),80);
});
test('Atalhos lançam diretamente e bloqueiam efeitos durante a pausa', run=>{
  run("castHotkey('maos')");
  assert.equal(run('handsAreas.length'),1);
  run("TITLE.paused=true; castHotkey('raio'); handleSecondaryClick({clientX:2,clientY:0,preventDefault(){}})");
  assert.equal(run('boltsFx.length'),0);
  assert.equal(run('player.mp'),45);
});
test('Fechar invocação com o mouse não dispara uma magia acidentalmente', run=>{
  run('summonWheelOpen=true; handlePrimaryClick({clientX:2,clientY:0})');
  assert.equal(run('summonWheelOpen'),false);
  assert.equal(run('player.mp'),80);
  assert.equal(run('boltsFx.length'),0);
});

// Minimal DOM fixture for actual menu lifecycle functions, not a browser rendering test.
class MenuElement {
  constructor(tag='div') {
    this.tagName=tag; this.children=[]; this.parentNode=null; this.style={}; this.className='';
    this.classList={
      contains:c=>this.className.split(/\s+/).includes(c),
      add:(...cs)=>{this.className=[...new Set([...this.className.split(/\s+/),...cs])].filter(Boolean).join(' ');},
      remove:(...cs)=>{this.className=this.className.split(/\s+/).filter(c=>!cs.includes(c)).join(' ');}
    };
  }
  set innerHTML(value) {this.html=value; for(const child of this.children) child.parentNode=null; this.children=[];}
  get innerHTML() {return this.html||'';}
  appendChild(child) {return this.insertBefore(child,null);}
  insertBefore(child,before) {
    if(child.parentNode) child.parentNode.children.splice(child.parentNode.children.indexOf(child),1);
    const index=before?this.children.indexOf(before):this.children.length;
    this.children.splice(index,0,child); child.parentNode=this; return child;
  }
  querySelectorAll(selector) {
    const all=this.children.flatMap(c=>[c,...c.querySelectorAll('*')]);
    if(selector==='*') return all;
    if(selector[0]==='.') return all.filter(c=>c.classList.contains(selector.slice(1)));
    return [];
  }
  querySelector(selector) {return this.querySelectorAll(selector)[0]||null;}
}
{
  const root=new MenuElement();
  const add=(id,parent=root,cls='')=>{const e=new MenuElement();e.id=id;e.className=cls;parent.appendChild(e);return e;};
  const host=add('hub-overlay'),wrap=add('tl-wrap');add('tl');
  const panels=['skills','summon','minions','upgrades'].map(id=>add('panel-'+id,host,'hub-panel'));
  const actions=add('actions',host,'hub-actions');
  const document={createElement:tag=>new MenuElement(tag),getElementById:id=>[root,...root.querySelectorAll('*')].find(e=>e.id===id)||null};
  const context=vm.createContext({document,console,setTimeout:()=>{},MenuElement});
  vm.runInContext(`
    const TITLE={paused:true},CAMP={on:false,inStage:false,map:false},PM={tab:'status',ov:false},VILLAGE_ROUTE={on:false};
    const player={level:1,hp:100,maxHp:100,mp:80,maxMp:80,exp:0,expNext:100,souls:10,gold:5,skillPoints:1};
    const gameState='hub'; const pmBar=()=>'',pmStatusHtml=()=>'<p>Status</p>',pmControlsHtml=()=>'<p>Controles</p>';
    const tBtn=()=>document.createElement('button'),tMsgEl=()=>{},setPause=()=>{},playSound=()=>{},tOptions=()=>{},VILLAGE=()=>false;
    const buildUpgradeGrid=()=>{},buildSkillTree=()=>{},buildSpellUpgradesSection=()=>{},buildRosterSection=()=>{},buildSummonGrid=()=>{},buildMinionUpgradeGrid=()=>{};
  `,context);
  for(const name of ['restoreManagementPanels','mountManagementPanel','tScreen','tPause']) vm.runInContext(fn(name),context);
  const run=code=>vm.runInContext(code,context);
  for(let i=0;i<3;i++){
    run("tPause('skills')");
    assert.notEqual(document.getElementById('panel-skills').parentNode,host);
    run("tPause('horde')");
    assert.equal(document.getElementById('panel-skills').parentNode,host);
    assert.notEqual(document.getElementById('panel-summon').parentNode,host);
    run("tPause('status')");
    assert.equal(document.getElementById('panel-summon').parentNode,host);
    assert.notEqual(document.getElementById('panel-upgrades').parentNode,host);
    run("tPause('system')");
    panels.forEach(panel=>assert.equal(panel.parentNode,host));
  }
  run("tPause('horde'); restoreManagementPanels()");
  panels.forEach(panel=>assert.equal(panel.parentNode,host));
  assert.equal(host.querySelectorAll('.hub-panel').length,4);
  assert.ok(host.children.includes(actions));
  checks++;
  console.log('OK Navegação repetida da pausa preserva os painéis, sem duplicar ou perder conteúdo');
}
function summonFixture(){
  const context=vm.createContext({console});
  vm.runInContext(`
    const SUMMON_SLOT_VERSION=1,SUMMON_SLOT_MILESTONES=['Inicial','Inicial','Inicial','Ato I','12','15','20'];
    const MINION_DEFS={zombie:{unlockLv:1},skeleton:{unlockLv:3},archer:{unlockLv:4},specter:{unlockLv:6}};
    const SW_COST={zombie:[0,20],skeleton:[15,30],archer:[15,30],specter:[30,45]};
    const CAMP={on:false,summon:true,cleared:{}};
    const player={level:1,souls:100,mp:80,minionSlots:9,learnedSkills:new Set(),summonLoadout:['zombie',null,null,null,null,null,null],summonReserve:[]};
    let minions=[],gameState='field',summonSlotsSignature='';
    const hasPassive=id=>player.learnedSkills.has(id),scene={remove:()=>{}};
    const updateHUD=()=>{},updateMinionPanel=()=>{},renderSummonSlots=()=>{},floatMsg=()=>{};
    const innerWidth=800,innerHeight=600;
    const spawnMinion=type=>{if(minions.length>=player.minionSlots)return null;const m={type,dead:false,maxHp:130,hp:130,mesh:{}};minions.push(m);return m;};
  `,context);
  for(const name of ['summonSlotCount','summonGroupSize','unlockedSummonIndices','summonAvailable','summonTypeAvailable','slotMembers','syncSummonProgress','summonGroupQuote','configureSummonSlot','clearSummonSlot','migrateSummonSlots','restoreSummonGroups','claimReservedGroup','initializeDefaultSummonGroup']) vm.runInContext(fn(name),context);
  return code=>vm.runInContext(code,context);
}
function summonTest(name,callback){callback(summonFixture());checks++;console.log('OK '+name);}
summonTest('Grupos base: 3 zumbis e 2 arqueiros ocupam um slot cada',run=>{
  assert.equal(run("summonGroupSize('zombie')"),3);
  assert.equal(run("summonGroupSize('archer')"),2);
  run('initializeDefaultSummonGroup()');
  assert.equal(run('minions.length'),3);
  assert.equal(run('minions.every(m=>m.summonSlot===0)'),true);
  assert.equal(run('player.mp'),80);
});
summonTest('Slots são liberados pelo Ato I e níveis 12, 15 e 20 sem duplicar',run=>{
  assert.equal(run('summonSlotCount()'),3);
  run('CAMP.cleared[4]=1');assert.equal(run('summonSlotCount()'),4);
  run('player.level=12');assert.equal(run('summonSlotCount()'),5);
  run('player.level=15');assert.equal(run('summonSlotCount()'),6);
  run('player.level=20');assert.equal(run('summonSlotCount()'),7);
  run('syncSummonProgress();syncSummonProgress()');assert.equal(run('summonSlotCount()'),7);
});
summonTest('Nível 12 libera seu próprio slot mesmo sem completar o Ato I',run=>{
  run('player.level=12');assert.equal(run('summonSlotCount()'),4);
  assert.equal(run('unlockedSummonIndices().includes(3)'),false);
  assert.equal(run('unlockedSummonIndices().includes(4)'),true);
});
summonTest('Invocação cobra o grupo, impede slot bloqueado e não cobra novamente grupo completo',run=>{
  assert.equal(run("configureSummonSlot(0,'zombie')"),true);
  assert.equal(run('minions.length'),3);
  assert.equal(run('player.mp'),20);
  assert.equal(run("configureSummonSlot(0,'zombie')"),true);
  assert.equal(run('player.mp'),20);
  assert.equal(run("configureSummonSlot(3,'zombie')"),false);
});
summonTest('Troca para arqueiros valida custos antes de remover o grupo antigo',run=>{
  run('initializeDefaultSummonGroup();player.level=4;player.mp=59');
  assert.equal(run("configureSummonSlot(0,'archer')"),false);
  assert.equal(run('minions.length'),3);
  run('player.mp=80');assert.equal(run("configureSummonSlot(0,'archer')"),true);
  assert.equal(run('minions.length'),2);
  assert.equal(run('player.mp'),20);
  assert.equal(run('player.souls'),70);
});
summonTest('Sacrifício impede troca e liberação de todo o slot durante a recuperação',run=>{
  run('initializeDefaultSummonGroup();minions[0].sacrificed=true;minions[0].dead=true;player.level=4');
  assert.equal(run("configureSummonSlot(0,'archer')"),false);
  assert.equal(run('clearSummonSlot(0)'),false);
  assert.equal(run('minions.length'),3);
});
summonTest('Árvore amplia grupos e reforça somente as unidades que faltam',run=>{
  run("initializeDefaultSummonGroup();player.learnedSkills.add('horda_zumbi')");
  assert.equal(run("summonGroupQuote(0,'zombie').count"),1);
  run("configureSummonSlot(0,'zombie')");
  assert.equal(run('minions.length'),4);
  assert.equal(run('player.mp'),60);
  run("player.learnedSkills.add('horda_arqueiro')");
  assert.equal(run("summonGroupSize('archer')"),3);
});
summonTest('Migração preserva criaturas, reserva excedentes e reembolsa uma única vez',run=>{
  run("let d={level:6,camp:{},souls:10,minionTypes:['zombie','zombie','zombie','zombie','zombie','archer','archer','specter'],upgradeCount:{slots:2,sppool:1},minionUpgradeCount:{p_cost:1}};migrateSummonSlots(d)");
  assert.equal(run('d.summonGroups.reduce((s,g)=>s+g.count,0)+d.summonReserve.reduce((s,g)=>s+g.count,0)'),8);
  assert.equal(run('d.summonReserve.length'),1);
  assert.equal(run('d.souls'),391);
  run('migrateSummonSlots(d)');assert.equal(run('d.souls'),391);
  run('player.level=6;restoreSummonGroups(d)');
  assert.equal(run('minions.length'),7);
  run('clearSummonSlot(1);claimReservedGroup(1,0)');
  assert.equal(run('player.summonReserve.length'),0);
  assert.equal(run("slotMembers(1)[0].type"),'specter');
});
summonTest('Redefinir a árvore ajusta tamanho do grupo preservando o sacrificado',run=>{
  run("player.learnedSkills.add('horda_zumbi');configureSummonSlot(0,'zombie',true);minions[3].sacrificed=true;player.learnedSkills.delete('horda_zumbi');syncSummonProgress()");
  assert.equal(run('minions.length'),3);
  assert.equal(run('minions.some(m=>m.sacrificed)'),true);
});
summonTest('Tipos adicionais ficam disponíveis na campanha após concluir o Ato I',run=>{
  run('CAMP.on=true;player.level=9');
  assert.equal(run("summonTypeAvailable('archer')"),false);
  run('CAMP.cleared[4]=1');
  assert.equal(run("summonTypeAvailable('archer')"),true);
  assert.equal(run("configureSummonSlot(3,'archer')"),true);
  assert.equal(run('slotMembers(3).length'),2);
});
summonTest('Save de grupo preserva HP e recuperação do sacrifício',run=>{
  run("restoreSummonGroups({summonLoadout:['zombie',null,null,null,null,null,null],summonGroups:[{slot:0,type:'zombie',count:2,members:[{hp:0,dead:true,sacrificed:true,deadTimer:17},{hp:40,dead:false}]}]})");
  assert.equal(run('minions[0].deadTimer'),17);
  assert.equal(run('minions[0].sacrificed'),true);
  assert.equal(run('minions[1].hp'),40);
  assert.equal(run("configureSummonSlot(0,'zombie')"),false);
});
summonTest('Carregar save mantém o zumbi detonado indisponível pelo tempo restante',run=>{
  run("restoreSummonGroups({summonLoadout:['zombie',null,null,null,null,null,null],summonGroups:[{slot:0,type:'zombie',count:3,members:[{hp:0,dead:true,exploded:true,deadTimer:8},{hp:130,dead:false},{hp:130,dead:false}]}]})");
  assert.equal(run('minions[0].exploded'),true);
  assert.equal(run('minions[0].dead'),true);
  assert.equal(run('minions[0].deadTimer'),8);
  assert.equal(run("configureSummonSlot(0,'zombie')"),false);
  assert.equal(run('clearSummonSlot(0)'),false);
});
{
  // Static story rendering should retain display density even when gameplay
  // reduces its adaptive resolution. This does not alter gameplay's DPR.
  for(const [density,expected] of [[1,1],[1.5,1.5],[2,2],[3,2]]){
    const context=vm.createContext({window:{devicePixelRatio:density},QUAL:{dpr:1}});
    vm.runInContext(fn('storyPixelRatio'),context);
    assert.equal(vm.runInContext('storyPixelRatio()',context),expected);
  }
  checks++;console.log('OK História usa densidade da tela independentemente da qualidade do combate');
}
{
  const path=require('node:path'),crypto=require('node:crypto');
  const manifestPath=path.join(__dirname,'assets/story/manifest.json');
  const entries=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const embedded=new Map([...html.matchAll(/\{title:'([^']+)',src:'data:image\/webp;base64,([^']+)'/g)].map(m=>[m[1],m[2]]));
  assert.equal(entries.length,23);assert.equal(embedded.size,23);
  for(const entry of entries){
    for(const [file,hash] of [[entry.original,entry.original_sha256],[entry.enhanced,entry.enhanced_sha256]]){
      const content=fs.readFileSync(path.join(__dirname,file));
      assert.equal(crypto.createHash('sha256').update(content).digest('hex'),hash);
    }
    assert.deepEqual(entry.enhanced_size,entry.original_size.map(n=>n*3));
    assert.ok(entry.mean_encoding_error_0_255<2);
    const embeddedHash=crypto.createHash('sha256').update(Buffer.from(embedded.get(entry.title),'base64')).digest('hex');
    assert.equal(embeddedHash,entry.enhanced_sha256,entry.title);
  }
  checks++;console.log('OK 23 painéis ampliados em 3x, originais intactos e imagens aprimoradas integradas');
}
function combatSkillsFixture(){
  const context=vm.createContext({console});
  const abilities=source.match(/const MOB_ABILITIES=(\{[\s\S]*?\n\});/);
  assert.ok(abilities);
  vm.runInContext('const MOB_ABILITIES='+abilities[1],context);
  vm.runInContext(`
    let mobZones=[],eshots=[],minions=[],particles=[],solids=[],gameState='field',sceneMode='field',summonWheelOpen=false,shake=0;
    const playerDash={time:0,cd:0,dx:1,dy:0},player={hp:100,maxHp:100,mp:80,barrierT:0,barrier:0};
    const P={x:0,y:0,deadT:0,face:1,phase:0},keys={},PAD={mx:0,mz:0},mouse={x:10,y:0};
    const TITLE={active:false,paused:false},COMIC={active:false},CAMP={map:false};
    const STG={on:false,clamp:q=>{q.x=Math.min(2,q.x);},clampE:q=>{q.x=Math.max(-20,Math.min(20,q.x));}};
    const HUB_R=18,FIELD_R=100,innerWidth=800,innerHeight=600,document={getElementById:()=>null};
    const ring=()=>{},burst=()=>{},playSound=()=>{},floatMsg=()=>{},updateHUD=()=>{},gameOver=()=>{},tutEvent=()=>{};
    const screenToWorld=(x,z)=>({x,z}),rnd=(a,b)=>(a+b)/2;
    const firstWallHit=()=>null;
    const dashPassives=new Set(),hasPassive=id=>dashPassives.has(id);
    const nearestMinion=(x,y)=>minions.filter(m=>!m.dead).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]||null;
    const dealDamageToMinion=(m,d)=>{m.hp-=d;if(m.hp<=0)m.dead=true;};
    function enemy(name,x=-5,y=0){return {x,y,type:{name,sc:1},def:{sc:1},dmg:20,dead:false,face:1,atkTimer:0,abilityCd:0};}
  `,context);
  for(const name of ['collide','castDash','updateDashMovement','mobSkillTarget','clampMobLanding','mobAreaDamage','updateMobAbility','updateMobZones','segmentHitTime','updateHostileProjectile','dealDamageToPlayer'])vm.runInContext(fn(name),context);
  return code=>vm.runInContext(code,context);
}
function combatTest(name,callback){callback(combatSkillsFixture());checks++;console.log('OK '+name);}
combatTest('Dash básico percorre 4,5 unidades sem mana e respeita recarga',run=>{
  assert.equal(run('castDash()'),true);
  run('updateDashMovement(.18)');
  assert.ok(Math.abs(run('P.x')-4.5)<1e-8);
  assert.equal(run('player.mp'),80);
  assert.equal(run('castDash()'),false);
  run('updateDashMovement(3)');assert.equal(run('castDash()'),true);
});
combatTest('Dash usa direção do movimento e bloqueia pausa, morte e mapas',run=>{
  run('keys.w=true;castDash();updateDashMovement(.18)');
  assert.ok(Math.abs(run('P.y')+4.5)<1e-8);
  assert.equal(run('P.x'),0);
  run('playerDash.cd=0;TITLE.paused=true');assert.equal(run('castDash()'),false);
  run('TITLE.paused=false;P.deadT=1');assert.equal(run('castDash()'),false);
  run('P.deadT=0;CAMP.map=true');assert.equal(run('castDash()'),false);
});
combatTest('Dash não atravessa obstáculos nem limites de fase',run=>{
  run('solids=[{x:2,y:0,r:.7}];castDash();updateDashMovement(.18)');
  assert.ok(run('P.x')<1.1);
  assert.equal(run('playerDash.time'),0);
  run('solids=[];P.x=0;playerDash.cd=0;STG.on=true;castDash();updateDashMovement(.18)');
  assert.ok(run('P.x')<=2);
});
combatTest('Invulnerabilidade do dash termina junto com o deslocamento',run=>{
  run('castDash();dealDamageToPlayer(100)');assert.equal(run('player.hp'),100);
  run('updateDashMovement(.18);dealDamageToPlayer(20)');assert.equal(run('player.hp'),80);
});
combatTest('Arqueiro prepara tiro forte com direção fixa e dano ampliado',run=>{
  run("const e=enemy('Arqueiro');updateMobAbility(e,.01);updateMobAbility(e,.5)");
  assert.equal(run('eshots.length'),0);
  run('P.y=3;updateMobAbility(e,.4)');
  assert.equal(run('eshots.length'),1);
  assert.equal(run('eshots[0].dmg'),38);
  assert.equal(run('eshots[0].vy'),0);
  assert.equal(run('e.abilityCd'),7);
  run('updateHostileProjectile(eshots[0],1)');assert.equal(run('player.hp'),100);
});
combatTest('Projétil rápido atinge só o primeiro alvo no trajeto',run=>{
  run('P.x=8;minions=[{x:2,y:0,hp:100,dead:false}];const sh={x:0,y:0,vx:20,vy:0,life:1,dmg:30,kind:"arrow"};updateHostileProjectile(sh,1)');
  assert.equal(run('minions[0].hp'),70);
  assert.equal(run('player.hp'),100);
  run('updateHostileProjectile(sh,1)');assert.equal(run('minions[0].hp'),70);
});
combatTest('Mago causa impacto de fogo e três pulsos na área; sair evita os pulsos',run=>{
  run("const e=enemy('Mago Vivo');updateMobAbility(e,.01);updateMobAbility(e,1)");
  assert.equal(run('player.hp'),76);
  assert.equal(run('mobZones[0].element'),'fire');
  run('updateMobZones(1)');assert.equal(run('player.hp'),70);
  run('P.x=10;updateMobZones(2)');assert.equal(run('player.hp'),70);
  assert.equal(run('mobZones.length'),0);
});
combatTest('Bruto salta para local avisado e causa dano em área só ao cair',run=>{
  run("const e=enemy('Bruto');updateMobAbility(e,.01);P.x=10;minions=[{x:0,y:0,hp:100,dead:false}];updateMobAbility(e,.85)");
  assert.equal(run('e.ability.phase'),'air');
  assert.equal(run('minions[0].hp'),100);
  run('updateMobAbility(e,.2)');assert.ok(run('e.jumpZ')>0);
  run('updateMobAbility(e,.25)');
  assert.equal(run('minions[0].hp'),60);
  assert.equal(run('player.hp'),100);
  assert.equal(run('e.jumpZ'),0);
  assert.equal(run('e.ability'),null);
});
combatTest('Golpe pesado pode ser evitado saindo da área; bosses e dummies preservam IA própria',run=>{
  run("const e=enemy('Guerreiro',-1,0);updateMobAbility(e,.01);P.x=8;updateMobAbility(e,.65)");
  assert.equal(run('player.hp'),100);
  assert.equal(run('e.abilityCd'),7);
  run("const boss=enemy('Bruto');boss.isBoss=true;const dummy=enemy('Arqueiro');dummy.dummy=true;");
  assert.equal(run('updateMobAbility(boss,1)'),false);
  assert.equal(run('updateMobAbility(dummy,1)'),false);
});
combatTest('Inimigo morto durante a preparação não dispara sua habilidade',run=>{
  run("const e=enemy('Arqueiro');updateMobAbility(e,.01);e.dead=true;updateMobAbility(e,2)");
  assert.equal(run('eshots.length'),0);
});
function unifiedFixture(){
  const context=vm.createContext({console});
  const catalog=source.match(/const ACTION_SKILLS=(\{[\s\S]*?\n\});/);assert.ok(catalog);
  vm.runInContext('const ACTION_SKILLS='+catalog[1],context);
  vm.runInContext(`
    const DEFAULT_ACTION_LOADOUT=['raio','maos','zombie','abom','archer','dash'];
    const SUMMON_SLOT_MILESTONES=['Inicial','Inicial','Inicial','Ato I','12','15','20'];
    const MINION_DEFS={zombie:{name:'Zumbi',unlockLv:1},archer:{name:'Arqueiro',unlockLv:4},abom:{name:'Abominação',unlockLv:1}};
    const SW_COST={zombie:[0,20],archer:[15,30],abom:[0,25]},MINION_REVIVE_TIME=12,LEASH_DIST=8;
    const player={level:20,hp:100,mp:1000,souls:1000,minionSlots:21,learnedSkills:new Set(['raio','maos','aura','zombie_burst','archer_power','abom_slam']),summonLoadout:Array(7).fill(null),summonReserve:[],actionLoadout:['raio','maos','empty','empty','empty','dash'],minionSkillCooldowns:{zombie:0,archer:0,abom:0}};
    const P={x:0,y:0,deadT:0},CAMP={on:false,cleared:{4:1},map:false,summon:true},TITLE={active:false,paused:false},COMIC={active:false},STG={on:false};
    const playerDash={time:0,cd:0},mouse={x:3,y:0},necroGroup={position:{x:0,z:0}};
    let minions=[],enemies=[],eshots=[],handsAreas=[],particles=[],gameState='field',summonWheelOpen=false,actionSignature='',actionAvailabilitySignature='',summonSlotsSignature='',magicCasts=[],dashCasts=0;
    const innerWidth=800,innerHeight=600,FIELD_R=100,scene={remove:()=>{}},document={getElementById:()=>null};
    const renderActionSlots=()=>{},renderSummonSlots=()=>{},updateHUD=()=>{},updateMinionPanel=()=>{},floatMsg=()=>{},playSound=()=>{},ring=()=>{},burst=()=>{},collide=()=>{};
    const screenToWorld=(x,z)=>({x,z}),hasPassive=id=>player.learnedSkills.has(id),rnd=(a,b)=>a;
    const dealDamageToEnemy=(e,d)=>{e.hp-=d;if(e.hp<=0)e.dead=true;},dealDamageToPlayer=d=>player.hp-=d,dealDamageToMinion=(m,d)=>m.hp-=d;
    const castDash=()=>{dashCasts++;return true;},castBarrier=()=>{},castAssignedSpell=id=>magicCasts.push(id);
    const localMinionTarget=(x,y)=>enemies.filter(e=>!e.dead&&Math.hypot(e.x,e.y)<=8).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]||null;
    const spawnMinion=type=>{if(minions.length>=player.minionSlots)return null;const m={type,def:MINION_DEFS[type],hp:130,maxHp:130,dmg:20,spd:3,atkR:1.5,atkRate:1.2,spCost:20,x:0,y:0,face:1,dead:false,deadTimer:0,mesh:{traverse:()=>{}}};minions.push(m);return m;};
    function enemy(x=0,y=0){return {x,y,type:{sc:1},def:{sc:1},hp:1000,dead:false};}
  `,context);
  for(const name of ['summonSlotCount','summonGroupSize','unlockedSummonIndices','summonAvailable','summonTypeAvailable','slotMembers','syncSummonProgress','summonGroupQuote','configureSummonSlot','clearSummonSlot','claimReservedGroup','actionSkillAvailable','actionGroupIndex','actionGroup','groupCannotLeave','parkActionGroup','reconcileActionSummons','loadActionState','equipActionSkill','activateEquippedSkill','activateActionSlot','activateSummonSkill','updateAllyLeap','updateFriendlyProjectile','wallNearest','tickCorpseWalls','blockByCorpseWalls','firstWallHit','segmentHitTime','updateHostileProjectile','killMinion','tryReanimate','dismissMinion','clampMobLanding'])vm.runInContext(fn(name),context);
  return code=>vm.runInContext(code,context);
}
function unifiedTest(name,callback){callback(unifiedFixture());checks++;console.log('OK '+name);}
unifiedTest('Seis slots podem trocar de posição sem duplicar a habilidade ou evocar novamente',run=>{
  assert.equal(run("equipActionSkill(0,'dash')"),true);
  assert.equal(run("player.actionLoadout[0]"),'dash');
  assert.equal(run("player.actionLoadout[5]"),'raio');
  assert.equal(run('player.mp'),1000);
  run('activateActionSlot(0);activateActionSlot(5)');
  assert.equal(run('dashCasts'),1);assert.equal(run('magicCasts[0]'),'raio');
});
unifiedTest('Alocar Zumbi, Arqueiro e Abominação evoca respectivamente 3, 2 e 1',run=>{
  run("equipActionSkill(2,'zombie');equipActionSkill(3,'archer');equipActionSkill(4,'abom')");
  assert.equal(run("actionGroup('zombie').length"),3);
  assert.equal(run("actionGroup('archer').length"),2);
  assert.equal(run("actionGroup('abom').length"),1);
  assert.equal(run('player.mp'),855);
  assert.equal(run('player.souls'),970);
});
unifiedTest('Cada ativação detona exatamente um zumbi e o grupo inteiro espera renascer',run=>{
  run("equipActionSkill(2,'zombie');enemies=[enemy()]");
  for(let n=1;n<=3;n++){
    run("player.minionSkillCooldowns.zombie=0;activateActionSlot(2)");
    assert.equal(run("actionGroup('zombie').filter(m=>m.dead).length"),n);
  }
  assert.equal(run("actionGroup('zombie').length"),3);
  assert.equal(run("actionGroup('zombie').every(m=>m.exploded&&m.deadTimer===12)"),true);
  run('player.minionSkillCooldowns.zombie=0');
  assert.equal(run('activateActionSlot(2)'),false);
  assert.equal(run("equipActionSkill(2,'empty')"),false);
  assert.equal(run("configureSummonSlot(actionGroupIndex('zombie'),'zombie')"),false);
});
unifiedTest('Detonados não podem ser dispensados nem reanimados para contornar o respawn',run=>{
  run("equipActionSkill(2,'zombie');activateActionSlot(2);const oldMp=player.mp;tryReanimate();dismissMinion(0)");
  assert.equal(run('minions.length'),3);
  assert.equal(run('minions[0].dead'),true);
  assert.equal(run('player.mp===oldMp'),true);
});
unifiedTest('Habilidades das evocações exigem árvore; ataques básicos continuam disponíveis',run=>{
  run("equipActionSkill(2,'zombie');player.learnedSkills.delete('zombie_burst')");
  assert.equal(run('activateActionSlot(2)'),false);
  assert.equal(run('minions.every(m=>!m.dead)'),true);
});
unifiedTest('Comando do grupo de arqueiros lança dois tiros fortes e respeita recarga',run=>{
  run("equipActionSkill(3,'archer');enemies=[enemy(4,0)];activateActionSlot(3)");
  assert.equal(run('eshots.length'),2);
  assert.equal(run('eshots.every(s=>s.locked&&s.strong&&s.dmg===38)'),true);
  assert.equal(run('activateActionSlot(3)'),false);
  assert.equal(run('eshots.length'),2);
});
unifiedTest('Abominação equipada salta e só aplica o impacto ao aterrissar',run=>{
  run("equipActionSkill(3,'abom');enemies=[enemy(3,0)];activateActionSlot(3);const m=actionGroup('abom')[0]");
  assert.equal(run('enemies[0].hp'),1000);
  run('updateAllyLeap(m,.2)');assert.ok(run('m.jumpZ')>0);
  run('updateAllyLeap(m,.25)');assert.equal(run('enemies[0].hp'),956);
  assert.equal(run('m.allyLeap'),null);
});
unifiedTest('Muralha causa dano de contato, bloqueia inimigos e intercepta tiros',run=>{
  run('handsAreas=[{x:2,y:0,ux:0,uy:1,half:2.5,width:.65,life:5,tick:0,dmg:16}];const e=enemy(2,0);enemies=[e];tickCorpseWalls(.1);blockByCorpseWalls(e,.3)');
  assert.equal(run('e.hp'),984);
  assert.ok(Math.abs(run('e.x')-2)>=.625);
  assert.ok(run('firstWallHit(0,0,4,0)')!==null);
  run('enemies=[];P.x=4;const sh={x:0,y:0,vx:12,vy:0,dmg:30,kind:"arrow",life:1};updateHostileProjectile(sh,.5)');
  assert.equal(run('player.hp'),100);assert.equal(run('sh.life'),0);
  run('tickCorpseWalls(5)');assert.equal(run('handsAreas.length'),0);
});
unifiedTest('Trocar uma evocação por magia remove o grupo; não existe invocação fora dos slots',run=>{
  run("equipActionSkill(2,'zombie');equipActionSkill(2,'empty')");
  assert.equal(run("actionGroup('zombie').length"),0);
  assert.equal(run('minions.length'),0);
});
unifiedTest('Migração de slots aceita somente seis habilidades conhecidas e mantém o padrão seguro',run=>{
  run("loadActionState({actionLoadout:['raio','maos','zombie','abom','archer','dash']})");
  assert.equal(run('player.actionLoadout[5]'),'dash');
  run("loadActionState({actionLoadout:['unknown']})");
  assert.equal(run('player.actionLoadout.length'),6);
  assert.equal(run('player.actionLoadout[0]'),'raio');
});
{
  const context=vm.createContext({console});
  vm.runInContext(`
    const VILLAGE_ROUTE={on:false,completed:false,token:0},CAMP={on:false,inStage:false,noWaves:false,cleared:{4:1}},STG={on:false},STRIP={L:150,YT:-3.4,YB:3,zones:[]};
    const P={x:0,y:0},cam={},player={level:9,hp:200},TITLE={paused:false};
    const W=1000,S=36,innerWidth=1000,innerHeight=700;
    let enemies=[],currentMission=null,gameState='hub',wave=5,waveActive=false,spawnQueue=[],awards=0,saves=0;
    const document={getElementById:()=>({style:{},textContent:''})};
    const resetFieldState=()=>{enemies=[];currentMission=null;},clearHubScene=()=>{},campReviveMinions=()=>{},showWaveBanner=()=>{},floatMsg=()=>{};
    const STAGE_KINDS={strip:{setup:()=>{STG.on=true;P.x=2.5;wave=0;}}};
    const ENEMY_TYPES=[0,1,2,3].map(i=>({name:'Guard '+i,hp:40,dmg:10}));
    const spawnEnemy=(type,x,y)=>{const e={type,x,y,dead:false};enemies.push(e);return e;};
    const onMissionComplete=()=>{awards++;currentMission=null;},VILLAGE=()=>true,closeHubOverlay=()=>{},vilClose=()=>{},setPause=()=>{},campMapOpen=()=>{CAMP.map=true;},saveGame=()=>saves++;
    const enterHub=()=>{VILLAGE_ROUTE.on=false;gameState='hub';saves++;};
  `,context);
  for(const name of ['startVillageRoute','spawnVillageRouteWave','updateVillageRoute','openCampaignFromVillage'])vm.runInContext(fn(name),context);
  const run=code=>vm.runInContext(code,context);
  run("startVillageRoute({label:'Trilha',enemyMult:1,boss:{name:'Chefe',hp:200,dmg:20}})");
  assert.equal(run('CAMP.on'),false);assert.equal(run('VILLAGE_ROUTE.on'),true);assert.equal(run('wave'),0);
  run('P.x=24;updateVillageRoute(.1);updateVillageRoute(.6)');
  assert.ok(run('enemies.length')>0);assert.equal(run('STRIP.lockX'),24);
  run("const bossZone={x:110,wi:0,waves:[['boss']]};spawnVillageRouteWave(bossZone)");
  assert.equal(run('enemies[enemies.length-1].routeBoss'),true);
  run('STRIP.zones.forEach(z=>{z.done=true;z.active=false;});P.x=149;updateVillageRoute(.1);updateVillageRoute(.1)');
  assert.equal(run('awards'),1);assert.equal(run('VILLAGE_ROUTE.completed'),true);
  assert.equal(run('gameState'),'hub');assert.equal(run('VILLAGE_ROUTE.on'),false);
  run("gameState='hub';openCampaignFromVillage()");
  assert.equal(run('CAMP.map'),true);assert.equal(run('CAMP.cleared[4]'),1);assert.equal(run('player.level'),9);assert.equal(run('saves'),2);
  checks++;console.log('OK Missão lateral da vila tem emboscadas, chefe, recompensa única e retorno ao mapa preservando progresso');
}
combatTest('Ramo do Dash reduz recarga e aumenta distância sem alterar custo de mana',run=>{
  run("dashPassives.add('dash_cooldown');dashPassives.add('dash_distance');castDash()");
  assert.equal(run('playerDash.cd'),2.4);
  run('updateDashMovement(.18)');
  assert.ok(Math.abs(run('P.x')-6)<.001);
  assert.equal(run('player.mp'),80);
});
test('Ramo da Muralha aplica duração e dano próprios',run=>{
  run("player.learnedSkills.add('wall_duration');player.learnedSkills.add('wall_damage');castHands(2,0)");
  assert.equal(run('handsAreas[0].life'),7);
  assert.equal(run('handsAreas[0].dmg'),24);
});
unifiedTest('Ramo do Zumbi aumenta explosão mantendo um único consumo por ativação',run=>{
  run("equipActionSkill(2,'zombie');player.learnedSkills.add('zombie_burst_damage');enemies=[enemy()];activateActionSlot(2)");
  assert.equal(run('enemies[0].hp'),940);
  assert.equal(run("actionGroup('zombie').filter(m=>m.dead).length"),1);
});
unifiedTest('Ramos de Arqueiro e Abominação melhoram somente seus comandos',run=>{
  run("equipActionSkill(3,'archer');player.learnedSkills.add('archer_power_damage');enemies=[enemy(4,0)];activateActionSlot(3)");
  assert.equal(run('eshots[0].dmg'),53);
  run("equipActionSkill(4,'abom');player.learnedSkills.add('abom_impact');activateActionSlot(4);enemies=[enemy(7.5,0)];updateAllyLeap(actionGroup('abom')[0],.45)");
  assert.equal(run('enemies[0].hp'),943);
});
{
  const context=vm.createContext({console});
  for(const name of ['SKILL_NODES','ACTION_SKILLS']){
    const match=source.match(new RegExp('const '+name+' =? ?(\\{[\\s\\S]*?\\n\\});'))||source.match(new RegExp('const '+name+'=(\\{[\\s\\S]*?\\n\\});'));
    assert.ok(match,name);vm.runInContext('const '+name+'='+match[1],context);
  }
  const branches=source.match(/const SKILL_BRANCHES=(\[[\s\S]*?\n\]);/);assert.ok(branches);
  vm.runInContext('const SKILL_BRANCHES='+branches[1],context);
  vm.runInContext(`
    class Element{
      constructor(){this.children=[];this.style={};this.attributes={};this.classList={remove:()=>{},add:()=>{}};}
      appendChild(child){this.children.push(child);return child;}
      set innerHTML(value){this.html=value;this.children=[];}
      get innerHTML(){return this.html||'';}
      setAttribute(key,value){this.attributes[key]=value;}
    }
    const roots={},document={createElement:()=>new Element(),getElementById:id=>roots[id]||(roots[id]=new Element())};
    const player={skillPoints:10,learnedSkills:new Set(['raio']),activeSpell:'raio',spellUpgradeCount:{},souls:1000};
    const CAMP={on:false},CAMP_GATE={},available=new Set(['dash','zombie','archer','abom']);
    const actionSkillAvailable=id=>available.has(id),SPELL_UPGRADES={raio:[{id:'raio_d',name:'Dano',desc:'+12',icon:'',baseCost:50,mult:1.7,max:5}]};
    let selectedSkillBranch='raio',selectedGraphNode=null;
    const respecAllSkills=()=>{},unlearnSkill=()=>{},buySpellUpgrade=()=>{},playSound=()=>{},floatMsg=()=>{},showHubOverlay=()=>{};
    const innerWidth=800,innerHeight=600;
  `,context);
  for(const name of ['skillNodeRequirementMet','skillGraphEntries','skillGraphLayout','renderSkillGraph','buildSkillTree','mkSkillNode','mkConnector','buildSpellUpgradesSection','learnSkill'])vm.runInContext(fn(name),context);
  const run=code=>vm.runInContext(code,context);
  assert.equal(run('new Set(SKILL_BRANCHES.flatMap(b=>b.nodes)).size'),run('Object.keys(SKILL_NODES).length'));
  assert.equal(run('SKILL_BRANCHES.flatMap(b=>b.nodes).length'),run('Object.keys(SKILL_NODES).length'));
  assert.equal(run("SKILL_BRANCHES.filter(b=>b.id!=='horde').every(b=>b.nodes.every(id=>!SKILL_NODES[id].req||b.nodes.includes(SKILL_NODES[id].req)))"),true);
  run("learnSkill('archer_power')");
  assert.equal(run("player.learnedSkills.has('archer_power')"),true);
  assert.equal(run('player.skillPoints'),9);
  assert.equal(run("player.learnedSkills.has('aura')"),false);
  run("available.delete('zombie');learnSkill('zombie_burst')");
  assert.equal(run("player.learnedSkills.has('zombie_burst')"),false);
  run("learnSkill('dash_distance')");assert.equal(run('player.skillPoints'),9);
  run("learnSkill('dash_cooldown');learnSkill('dash_distance')");assert.equal(run('player.skillPoints'),7);
  run('buildSkillTree();buildSpellUpgradesSection()');
  assert.equal(run("roots['skill-tree'].children[0].className"),'grimoire-heading');
  assert.equal(run("roots['skill-tree'].children[2].children.length"),10);
  assert.equal(run("roots['spell-upgrades-section'].children.length"),0);
  assert.equal(run("skillGraphEntries(SKILL_BRANCHES[0]).length"),2);
  assert.equal(run("skillGraphEntries(SKILL_BRANCHES[0])[1].parent"),'raio');
  run("const zombieBranch=SKILL_BRANCHES.find(b=>b.id==='zombie');const graph=skillGraphEntries(zombieBranch);const positions=skillGraphLayout(graph).positions");
  assert.equal(run("graph.find(e=>e.id==='zombie_burst_damage').parent"),'zombie_burst');
  assert.equal(run("graph.find(e=>e.id==='horda_zumbi_2').parent"),'horda_zumbi');
  assert.ok(run("positions.get('horda_zumbi_2').y>positions.get('horda_zumbi').y"));
  assert.notEqual(run("positions.get('horda_zumbi').x"),run("positions.get('zombie_burst').x"));
  run("roots['skill-tree'].children[2].children[2].onclick()");
  assert.equal(run('selectedSkillBranch'),'zombie');
  assert.equal(run("roots['spell-upgrades-section'].children.length"),0);
  run('buildSkillTree()');assert.equal(run("roots['skill-tree'].children.length"),4);
  assert.equal(run("player.learnedSkills.has('archer_power')"),true);
  run("const panel=roots['skill-tree'].children[3];const workspace=panel.children[3];const board=workspace.children[0].children[0];const runes=board.children.slice(1);const damageRune=runes[graph.findIndex(e=>e.id==='zombie_burst_damage')];damageRune.onclick()");
  assert.equal(run('selectedGraphNode'),'zombie_burst_damage');
  assert.equal(run('player.skillPoints'),7);
  assert.equal(run("damageRune.attributes['aria-pressed']"),'true');
  assert.equal(run("workspace.children[1].children[0].textContent"),'💥 Carne Instável');
  assert.ok(run("board.children[0].innerHTML.includes('<path')"));
  checks++;console.log('OK Ramos desenham pré-requisitos, evoluções e detalhes sem gastar pontos ao selecionar um símbolo');
}
{
  for(const [kind,village,expected] of [['strip',true,'village'],['strip',false,'map'],['arena',true,'map']]){
    const context=vm.createContext({console,kind,village});
    vm.runInContext(`
      const CAMP={on:true,inStage:true,stage:3,cleared:village?{4:1}:{},unlocked:3,map:false};
      const CAMP_STAGES=Array(5),TUT={on:true},player={souls:0,gold:0,skillPoints:0};
      let waveActive=true,spawnQueue=[1],timers=[],destination='',xp=0,saves=0,stories=[];
      const stageOf=()=>({kind,rew:{souls:30,gold:20,xp:10,sp:1}}),syncSummonProgress=()=>{},renderSummonSlots=()=>{},gainExp=n=>xp+=n;
      const playSound=()=>{},showWaveBanner=()=>{},saveGame=()=>saves++,VILLAGE=()=>village;
      const document={getElementById:()=>({style:{}}),body:{classList:{remove:()=>{}}}};
      const setTimeout=f=>timers.push(f),playStory=(id,done)=>{stories.push(id);done();};
      const campMapOpen=()=>{destination='map';CAMP.map=true;},campMapClose=()=>{CAMP.map=false;},enterHub=()=>{destination='village';saves++;};
    `,context);
    for(const name of ['campStageComplete','returnToVillageAfterStage'])vm.runInContext(fn(name),context);
    const run=code=>vm.runInContext(code,context);
    run('campStageComplete();campStageComplete()');
    assert.equal(run('player.souls'),30);assert.equal(run('player.gold'),20);assert.equal(run('xp'),10);
    assert.equal(run('timers.length'),1);
    run('timers.shift()()');assert.equal(run('destination'),expected);
    assert.equal(run('CAMP.cleared[3]'),1);
    if(expected==='village')assert.equal(run('CAMP.on'),false);
    run("destination='';CAMP.on=true;CAMP.map=false;CAMP.inStage=true;campStageComplete();CAMP.stage=4;timers.shift()()");
    assert.equal(run('destination'),'');
  }
  checks++;console.log('OK Trilhas da campanha retornam à vila liberada, preservam história inicial e ignoram transições antigas');
}
{
  const context=vm.createContext({console});
  vm.runInContext(`
    let currentMission={id:'route',route:true,rewardSouls:50,rewardExp:25},waveActive=true,bossEnemy={},missionWave=2;
    const player={souls:0,gold:0},gainExp=n=>player.xp=n,playSound=()=>{},showWaveBanner=()=>{};
    let timers=0;const setTimeout=()=>timers++;
  `,context);
  vm.runInContext(fn('onMissionComplete'),context);vm.runInContext('onMissionComplete()',context);
  assert.equal(vm.runInContext('player.souls',context),50);
  assert.equal(vm.runInContext('player.xp',context),25);
  assert.equal(vm.runInContext('timers',context),0);
  checks++;console.log('OK Missão lateral concede recompensa sem agendar aviso de retorno manual ou história atrasada');
}
console.log(`${checks} cenários aprovados; ${scripts.length} scripts com sintaxe válida.`);
