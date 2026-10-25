#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {pathToFileURL} = require('node:url');
const driver = require('./save-combat-driver');

function options(argv) {
  const args = {runs:3,seed:182,seconds:180,profiles:['hold','kite'],out:'balance-simulator/reports/save-current'};
  const known = new Set(['save','runs','seed','seconds','waves','profiles','out','frontline-damage-taken','game']);
  for(let i=0;i<argv.length;i+=2) {
    const key=argv[i].replace(/^--/,'');
    if(!argv[i].startsWith('--')||!known.has(key)||!argv[i+1]||argv[i+1].startsWith('--'))throw Error('Argumento inválido: '+argv[i]);
    args[key]=argv[i+1];
  }
  if(!args.save)throw Error('Uso: node scripts/simulate-save.js --save caminho/save.json [--waves 24,27] [--runs 3] [--profiles hold,kite]');
  for(const key of ['runs','seed','seconds']){args[key]=Number(args[key]);if(!Number.isSafeInteger(args[key])||args[key]<1)throw Error('Valor inválido: --'+key);}
  if(args.runs>100||args.seconds>1800)throw Error('Limites: 100 execuções, 1800 segundos por encontro.');
  if(typeof args.profiles==='string')args.profiles=args.profiles.split(',');
  if(args.profiles.some(p=>!['hold','kite'].includes(p)))throw Error('Perfis válidos: hold,kite.');
  if(args.waves){args.waves=args.waves.split(',').map(Number);if(args.waves.some(w=>!Number.isInteger(w)||w<1||w>1000))throw Error('Waves válidas: 1–1000.');}
  if(args['frontline-damage-taken']!==undefined){args.frontlineDamageTaken=Number(args['frontline-damage-taken']);delete args['frontline-damage-taken'];if(!Number.isFinite(args.frontlineDamageTaken)||args.frontlineDamageTaken<=0||args.frontlineDamageTaken>1)throw Error('Multiplicador de dano recebido deve estar entre 0 e 1, excluindo zero.');}
  return args;
}
function validateSave(save) {
  if(!save||!Number.isInteger(save.level)||save.level<1||!save.skillRanks||!save.equipment||!Array.isArray(save.actionLoadout)||!Array.isArray(save.summonGroups))
    throw Error('Exporte um save atual em Pausa → Sistema → Exportar save.');
  return save;
}
function summarize(results) {
  const groups=new Map();
  for(const r of results){const key=r.wave+'/'+r.profile;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
  return [...groups.values()].map(rows=>{
    const mean=fn=>rows.reduce((s,r)=>s+fn(r),0)/rows.length;
    return {wave:rows[0].wave,profile:rows[0].profile,runs:rows.length,clears:rows.filter(r=>r.outcome==='clear').length,
      meanSeconds:mean(r=>r.seconds),meanMinionDeaths:mean(r=>r.deaths.length),
      runsWithMinionDeaths:rows.filter(r=>r.deaths.length).length,
      firstMinionDeathSeconds:rows.some(r=>r.deaths.length)?rows.filter(r=>r.deaths.length).reduce((s,r)=>s+r.deaths[0].seconds,0)/rows.filter(r=>r.deaths.length).length:null,
      hordeDamagePercent:mean(r=>100*r.damage.horde/Math.max(1,r.damage.player+r.damage.horde)),
      meanKills:mean(r=>r.kills),meanSurroundedSeconds:mean(r=>r.surroundedSeconds),
      hordeDps:mean(r=>r.damage.horde/r.seconds),minionDeathsPerMinute:mean(r=>r.deaths.length*60/r.seconds)};
  });
}
async function main() {
  const args=options(process.argv.slice(2)),raw=fs.readFileSync(path.resolve(args.save),'utf8');
  const save=validateSave(JSON.parse(raw));
  args.waves||=[save.waveProgress?.selected||1];
  const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  const sourcePaths=['necromancer-canvas.html','scripts/save-combat-driver.js','scripts/simulate-save.js'];
  const sources=Object.fromEntries(sourcePaths.map(p=>[p,hash(path.resolve(__dirname,'..',p))]));
  // Keep relative asset paths intact while freezing the HTML for this run.
  const gameSource=fs.readFileSync(args.game?path.resolve(args.game):path.resolve(__dirname,'../necromancer-canvas.html'));
  sources['necromancer-canvas.html']=crypto.createHash('sha256').update(gameSource).digest('hex');
  const gameSnapshot=path.resolve(__dirname,'../.save-simulation-'+crypto.randomUUID()+'.html');
  function checkSources(){for(const [p,h]of Object.entries(sources))if(p!=='necromancer-canvas.html'&&hash(path.resolve(__dirname,'..',p))!==h)throw Error('Fonte mudou durante a simulação; repita para manter a comparação válida: '+p);}
  const {chromium}=require('playwright');
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const results=[];
  try {
    fs.writeFileSync(gameSnapshot,gameSource,{flag:'wx'});
    for(const wave of args.waves)for(const profile of args.profiles)for(let run=0;run<args.runs;run++) {
      checkSources();
      const context=await browser.newContext({viewport:{width:1280,height:800}});
      try {
        // Fresh storage for every attempt; never connect to the user's browser.
        await context.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
        const page=await context.newPage(),errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.goto(pathToFileURL(gameSnapshot).href,{waitUntil:'load'});
        const result=await page.evaluate(driver,{save,seed:args.seed+run,wave,profile,seconds:args.seconds,frontlineDamageTaken:args.frontlineDamageTaken});
        if(errors.length)throw Error(errors.join('\n'));
        results.push(result);
        console.log(`Wave ${wave} / ${profile} / seed ${args.seed+run}: ${result.outcome}, ${result.seconds}s, ${result.kills} kills, ${result.deaths.length} mortes da horda`);
      } finally {await context.close();}
    }
  } finally {await browser.close();if(fs.existsSync(gameSnapshot))fs.unlinkSync(gameSnapshot);}
  checkSources();
  const report={version:1,saveSha256:crypto.createHash('sha256').update(raw).digest('hex'),
    sources,
    liveGameChangedDuringRun:hash(path.resolve(__dirname,'../necromancer-canvas.html'))!==sources['necromancer-canvas.html'],
    settings:{...args,save:path.basename(args.save)},summary:summarize(results),results};
  const out=path.resolve(args.out);fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(out,'game-source.html'),gameSource);
  const lines=['# Simulação do save exportado','',`Personagem: nível ${save.level}. Motor real do jogo, passo de 1/60 s. Save original preservado.`,
    '', '| Wave | Perfil | Vitórias | Tempo médio | Mortes da horda | Primeiro aliado cai | Dano da horda | Abates |',
    '|---|---|---|---|---|---|---|---|'];
  for(const s of report.summary)lines.push(`| ${s.wave} | ${s.profile} | ${s.clears}/${s.runs} | ${s.meanSeconds.toFixed(1)} s | ${s.meanMinionDeaths.toFixed(1)} | ${s.firstMinionDeathSeconds===null?'—':s.firstMinionDeathSeconds.toFixed(1)+' s'} | ${s.hordeDamagePercent.toFixed(1)}% | ${s.meanKills.toFixed(1)} |`);
  lines.push('', '## Limites', '', 'Hold fica parado e atira; kite escolhe uma direção a cada 0,2 s para evitar inimigos e a borda, atira e usa Dash quando ameaçado. Ambos usam apenas habilidades equipadas. Não usam poções, reanimação manual, Escudo de Carne ou comandos ativos de grupo. As habilidades automáticas da horda, colisões, esquivas, projéteis, drops e evolução de nível continuam ativos. A execução termina na primeira morte, conclusão da wave ou limite de tempo. Não reproduz decisões humanas nem mede dificuldade absoluta. A primeira queda considera somente execuções em que houve mortes da horda; — indica nenhuma. Atividade por tipo soma segundos de todos os integrantes. Alcance da horda usa o padrão de 16 unidades; preferências do navegador não fazem parte do save.', '', 'O JSON registra sementes, hashes das fontes e do save, estado inicial recalculado pelo jogo, dano efetivo separado entre jogador/horda, mortes e amostras a cada 5 s. Não inclui a mochila nem o save integral.');
  fs.writeFileSync(path.join(out,'README.md'),lines.join('\n')+'\n');
  console.log('Relatório: '+path.join(out,'README.md'));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={options,validateSave,summarize};
