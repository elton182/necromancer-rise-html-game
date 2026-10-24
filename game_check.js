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
    let handsAreas=[], boltsFx=[], enemies=[], minions=[], gameState='field',minionCommand=null,commandMarker=null,pendingCommand='auto',summonWheelOpen=false;
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
    const syncSummonProgress=()=>{},renderSummonSlots=()=>{};
    const floatMsg=()=>{}, castAnim=()=>{},ring=()=>{},burst=()=>{},playSound=()=>{},updateHUD=()=>{},updateMinionPanel=()=>{},tutEvent=()=>{},spawnExplosaoFX=()=>{};
    const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
    let reinforced=false;
    const hasPassive=()=>reinforced, spellBonus=()=>0;
    const necroGroup={position:{x:0,z:0}};
    const mkMesh2=(x,z)=>({position:{x,z},rotation:{y:0},traverse:()=>{}});
    const dealDamageToEnemy=(e,d)=>{e.hp-=d;};
    function zombie(hp,maxHp,x=0){return {type:'zombie',hp,maxHp,x,y:0,dead:false,mesh:mkMesh2(x,0),spd:3.4,atkR:1.5,atkRate:1.2,atkTimer:0,orbitAngle:0,orbitRadius:2};}
  `, context);
  for (const name of ['abilityReady','castHands','handsSpeed','resetAbilities','updateAbilities','castRaio','updateBolts','sacrificeCandidate','castBarrier','migrateAbilitySave','tryReanimate','dismissMinion','dealDamageToPlayer','minionTargetAllowed','localMinionTarget','moveMinionTo','updateMinionIntent','minionStateText','setCommand','applyRightClick','combatInputAllowed','castAssignedSpell','castHotkey','castSpell','selectSpell','handlePrimaryClick','handleSecondaryClick']) {
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
test('Mãos: alcance inválido não cobra; lentidão sai e não acumula', run => {
  run('castHands(10,0)'); assert.equal(run('player.mp'),80);
  run('castHands(2,0); const e={x:2,y:0};');
  assert.equal(run('player.mp'),45);
  assert.equal(run('handsSpeed(e)'),.6);
  assert.equal(run('handsSpeed({...e,isBoss:true})'),.8);
  run('handsAreas.push({...handsAreas[0]})'); assert.equal(run('handsSpeed(e)'),.6);
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
  assert.match(run('minionStateText(m)'),/R: 30 MP/);
  run('m.sacrificed=true');
  assert.match(run('minionStateText(m)'),/Sacrificado/);
  assert.doesNotMatch(run('minionStateText(m)'),/R:/);
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
    const TITLE={paused:true},CAMP={on:false,inStage:false,map:false},PM={tab:'status',ov:false};
    const player={level:1,hp:100,maxHp:100,mp:80,maxMp:80,exp:0,expNext:100,souls:10,gold:5,skillPoints:1};
    const gameState='hub'; const pmBar=()=>'',pmStatusHtml=()=>'<p>Status</p>',pmControlsHtml=()=>'<p>Controles</p>';
    const tBtn=()=>document.createElement('button'),tMsgEl=()=>{},setPause=()=>{},playSound=()=>{},tOptions=()=>{};
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
console.log(`${checks} cenários aprovados; ${scripts.length} scripts com sintaxe válida.`);
