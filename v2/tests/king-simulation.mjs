// Simulação headless do Rei Caído com o motor real da v2 (session/training/fallen-king).
// Uso: node v2/tests/king-simulation.mjs [--runs 6] [--out review/v2/king-balance]
// O bot mira e lança o Tiro de Osso; a política "esquiva" também sai dos avisos do Rei e das chamas.
// Limites: sem comandos da horda, Muralha, Escudo, maldições nem posicionamento inteligente; não substitui jogar.
import fs from 'node:fs';
import path from 'node:path';
import {createSession,stepSession,useProfile,castSession,dashSession,transition} from '../scripts/session.mjs';
import {TEST_PROFILE,equipGroup} from '../scripts/horde.mjs';
import King from '../scripts/shared-fallen-king.mjs';
import {V2_KING} from '../scripts/fallen-king.mjs';

const args=Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map(s=>s.trim().split(/\s+/)).map(([k,v])=>[k,v??true]));
const RUNS=Number(args.runs||6),OUT=path.resolve(args.out||'review/v2/king-balance'),ONLY=args.only?String(args.only).split(','):null;
// Reis de Expedição e treino recebem V2_KING.hp, como no jogo; --hpmult N multiplica por cima (a Fase 4 usa a vida do Capitão).
const HPMULT=Number(args.hpmult||1),PROFILE_ONLY=args.profiles?String(args.profiles).split(','):null;

// Perfis: nível e árvore. "medio" corta a árvore do perfil de teste pela metade.
const PROFILES={
 medio:{...TEST_PROFILE,level:12,ranks:{zombie:2,vigor:2,skeleton:2,armor:2,archer:2,shot:1}},
 forte:TEST_PROFILE,
 // Mesmo nível e árvore do forte, sem grupos equipados: mede a ameaça do Rei contra o jogador.
 solo:TEST_PROFILE,
};
const HORDE=['raio','skeleton','zombie','abom','archer','dash'],LOADOUTS={medio:HORDE,forte:HORDE,solo:['raio','empty','dash','empty','empty','empty']};
// Atributos do Rei como cada modo os cria (ver campaign.mjs, expedition.mjs e training-model.mjs).
const wave=n=>({hp:1.12**(n-1),dmg:1.08**(n-1)});
const ENCOUNTERS={
 'fase4':{hp:20000,dmg:Math.round(35.75*1.3),spd:2},
 'expedicao-w5':{hp:Math.round(350*wave(5).hp),dmg:Math.round(19.5*wave(5).dmg),spd:1.6},
 'expedicao-w12':{hp:Math.round(350*wave(12).hp),dmg:Math.round(19.5*wave(12).dmg),spd:1.6},
 'treino':{hp:1000,dmg:19.5,spd:1.6},
};
for(const [k,e]of Object.entries(ENCOUNTERS))if(k!=='fase4')e.hp=Math.round(e.hp*V2_KING.hp*HPMULT);
const POLICIES=['parado','esquiva'];

function seeded(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
// Atribui cada perda de vida pela pilha de chamadas: Corte (cone), Queda (area), chamas (zona do Rei) ou outro.
function watchHp(actor,onLoss){let value=actor.hp;Object.defineProperty(actor,'hp',{configurable:true,enumerable:true,get:()=>value,set:v=>{if(v<value)onLoss(value-v,new Error().stack);value=v;}});}
function sourceOf(stack,w,t,boss){
 if(/fallen-king\.mjs/.test(stack)){if(/\bcone\b/.test(stack))return 'corte';if(/\barea\b/.test(stack))return 'queda';if(/\bring\b/.test(stack))return 'giro';if(/\bline\b/.test(stack))return 'brasas';return 'rei';}
 if(/tickHostiles|hostile/i.test(stack)&&w.hostileZones.some(z=>z.source===boss.id&&Math.hypot(t.x-z.x,t.y-z.y)<=z.radius))return 'chamas';
 return 'outro';
}
function bossSource(stack){if(/horde\.mjs/.test(stack))return 'horda';if(/combat\.mjs|spells\.mjs/.test(stack))return 'jogador';return 'outro';}

function run(profileId,encounterId,policy,seed){
 const s=createSession();s.save.settings.armyMode='groups';s.save.settings.horde=0;
 transition(s,'training');useProfile(s,PROFILES[profileId]);for(const [i,id]of LOADOUTS[profileId].entries())if(id!=='empty')equipGroup(s.world,i,id,{preparation:true});
 const w=s.world;w.random=seeded(seed);
 const stats=ENCOUNTERS[encounterId],boss=w.boss;
 // Só o Rei: os zumbis de treino saem da arena.
 w.actors=w.actors.filter(a=>a.team!=='enemy'||a===boss);
 Object.assign(boss,{hp:stats.hp,maxHp:stats.hp,dmg:stats.dmg,spd:stats.spd,x:0,y:-10,king:null,kingCd:null});
 const p=w.player;p.hp=p.maxHp;p.mp=p.maxMp;for(const a of w.actors)if(a.team==='ally')a.hp=a.maxHp;
 const m={profile:profileId,encounter:encounterId,policy,seed,level:PROFILES[profileId].level,playerHp:p.maxHp,bossHp:stats.hp,bossDmg:stats.dmg,allies:w.actors.filter(a=>a.team==='ally').length,
  taken:{corte:0,queda:0,giro:0,brasas:0,chamas:0,rei:0,outro:0},hitsOnPlayer:{corte:0,queda:0,giro:0,brasas:0},allyTaken:{corte:0,queda:0,giro:0,brasas:0,chamas:0,rei:0,outro:0},allyDeaths:0,bossDamage:{horda:0,jogador:0,outro:0},
  attacks:{slash:0,leap:0,summon:0,spin:0,embers:0},minHpPct:1,phase2At:null,dashes:0,time:0,won:false,dead:false};
 watchHp(p,(n,st)=>{const k=sourceOf(st,w,p,boss);m.taken[k]+=n;if(m.hitsOnPlayer[k]!==undefined)m.hitsOnPlayer[k]++;});
 const watched=new Set();
 const watchAllies=()=>{for(const a of w.actors)if(a.team==='ally'&&!watched.has(a)){watched.add(a);watchHp(a,(n,st)=>{m.allyTaken[sourceOf(st,w,a,boss)]+=n;});}};
 watchAllies();
 watchHp(boss,(n,st)=>{m.bossDamage[bossSource(st)]+=n;});
 let lastKind=null,deadAllies=new Set();const dt=1/30;
 while(m.time<300){
  watchAllies();
  const k=boss.king?.kind||boss.kingV2?.kind||null;
  if(k&&!boss._counted){m.attacks[k]=(m.attacks[k]||0)+1;boss._counted=true;}if(!k)boss._counted=false;lastKind=k;
  if(boss.kingPhase2&&m.phase2At===null)m.phase2At=+m.time.toFixed(1);
  const input={x:0,y:0};
  w.aim={x:boss.x,y:boss.y};castSession(s);
  if(policy==='esquiva'){
   // Perigo: avisos do Rei que causam dano e chamas no chão.
   const danger=[...w.effects.filter(f=>f.kingWarning===boss.id&&!f.harmless),...w.hostileZones.filter(z=>z.source===boss.id).map(z=>({...z,progress:1}))];
   let fx=0,fy=0,threat=false;
   for(const d of danger){const vx=p.x-d.x,vy=p.y-d.y,dist=Math.hypot(vx,vy)||1e-3;if(dist<=d.radius+.6){
    if(d.arc){const dir=d.direction,cx=Math.cos(dir),cy=Math.sin(dir),dot=(vx*cx+vy*cy)/dist;if(dist>.6&&dot<Math.cos(d.arc/2))continue;fx+=-cy*Math.sign(vx*-cy+vy*cx||1)+vx/dist;fy+=cx*Math.sign(vx*-cy+vy*cx||1)+vy/dist;}
    else{fx+=vx/dist;fy+=vy/dist;}
    threat=true;if((d.progress??0)>.7&&!d.hostileZone&&dashSession(s,toInput(fx,fy)))m.dashes++;}}
   const bx=p.x-boss.x,by=p.y-boss.y,bd=Math.hypot(bx,by)||1;
   if(!threat){if(bd<5.5){fx=bx/bd;fy=by/bd;}else if(bd>9){fx=-bx/bd;fy=-by/bd;}else{fx=-by/bd;fy=bx/bd;}}
   Object.assign(input,toInput(fx,fy));
  }
  stepSession(s,dt,input);m.time+=dt;
  for(const a of w.actors)if(a.team==='ally'&&a.dead&&!deadAllies.has(a)){deadAllies.add(a);m.allyDeaths++;}
  for(const a of deadAllies)if(!a.dead)deadAllies.delete(a);
  m.minHpPct=Math.min(m.minHpPct,Math.max(0,p.hp)/p.maxHp);
  if(s.scene==='dead'||p.hp<=0){m.dead=true;break;}
  if(boss.hp<=0){m.won=true;break;}
 }
 m.time=+m.time.toFixed(1);m.bossHpLeftPct=+(Math.max(0,boss.hp)/stats.hp).toFixed(3);
 for(const o of [m.taken,m.allyTaken,m.bossDamage])for(const k in o)o[k]=Math.round(o[k]);
 return m;
}
// Converte uma direção do mundo para o eixo de entrada da câmera isométrica (mx=x+y, my=y-x).
function toInput(dx,dy){const l=Math.hypot(dx,dy);if(l<1e-6)return {x:0,y:0};dx/=l;dy/=l;let x=(dx-dy)/2,y=(dx+dy)/2;const n=Math.hypot(x,y);return {x:x/n,y:y/n};}

const results=[];
for(const profile of Object.keys(PROFILES))for(const encounter of Object.keys(ENCOUNTERS))for(const policy of POLICIES){
 if(ONLY&&!ONLY.includes(encounter)||PROFILE_ONLY&&!PROFILE_ONLY.includes(profile))continue;
 for(let i=0;i<RUNS;i++)results.push(run(profile,encounter,policy,101+i*7919));
}
const pct=(a,q)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(q*(s.length-1)+.5))];};
const groups={};for(const r of results)(groups[`${r.profile}|${r.encounter}|${r.policy}`]||=[]).push(r);
const summary=Object.entries(groups).map(([key,list])=>{const [profile,encounter,policy]=key.split('|'),sum=f=>list.reduce((t,r)=>t+f(r),0)/list.length;
 return {profile,encounter,policy,runs:list.length,winRate:+(list.filter(r=>r.won).length/list.length).toFixed(2),deathRate:+(list.filter(r=>r.dead).length/list.length).toFixed(2),
  timeP50:pct(list.map(r=>r.time),.5),minHpP50:+pct(list.map(r=>r.minHpPct),.5).toFixed(2),
  takenAvg:Object.fromEntries(Object.keys(list[0].taken).map(k=>[k,Math.round(sum(r=>r.taken[k]))])),
  playerHp:list[0].playerHp,hitsAvg:Object.fromEntries(Object.keys(list[0].hitsOnPlayer).map(k=>[k,+sum(r=>r.hitsOnPlayer[k]).toFixed(1)])),
  attacksAvg:Object.fromEntries(Object.keys(list[0].attacks).map(k=>[k,+sum(r=>r.attacks[k]).toFixed(1)])),
  allyTakenAvg:Object.fromEntries(Object.keys(list[0].allyTaken).map(k=>[k,Math.round(sum(r=>r.allyTaken[k]))])),allyDeathsAvg:+sum(r=>r.allyDeaths).toFixed(1),allies:list[0].allies,hordeShare:+sum(r=>r.bossDamage.horda/Math.max(1,r.bossDamage.horda+r.bossDamage.jogador)).toFixed(2),
  phase2AtP50:pct(list.map(r=>r.phase2At??Infinity),.5),bossHp:list[0].bossHp,bossDmg:list[0].bossDmg};
});
fs.mkdirSync(OUT,{recursive:true});
fs.writeFileSync(path.join(OUT,'king-simulation.json'),JSON.stringify({config:{runs:RUNS,hpMult:HPMULT,profiles:PROFILES,encounters:ENCOUNTERS,policies:POLICIES,kingSkills:King.skills},summary,results},null,2));
const rows=summary.map(r=>`${r.profile.padEnd(6)} ${r.encounter.padEnd(14)} ${r.policy.padEnd(8)} vit ${String(r.winRate).padEnd(4)} morte ${String(r.deathRate).padEnd(4)} t50 ${String(r.timeP50).padStart(6)}s  vidaMín ${String(r.minHpP50).padEnd(4)} dano(${r.playerHp}) c${r.takenAvg.corte}/q${r.takenAvg.queda}/g${r.takenAvg.giro}/b${r.takenAvg.brasas}/f${r.takenAvg.chamas}/o${r.takenAvg.outro}  ataques s${r.attacksAvg.slash}/l${r.attacksAvg.leap}/c${r.attacksAvg.summon}/g${r.attacksAvg.spin}/b${r.attacksAvg.embers}  aliados c${r.allyTakenAvg.corte}/q${r.allyTakenAvg.queda}/g${r.allyTakenAvg.giro}/b${r.allyTakenAvg.brasas}  horda ${r.hordeShare} mortesAliadas ${r.allyDeathsAvg}/${r.allies} f2@${r.phase2AtP50}`);
console.log(rows.join('\n'));
