'use strict';

// Serialized into an isolated browser page by simulate-save.js. Uses the game's
// loaded functions, including migrations, AI, projectiles, evasion and abilities.
module.exports = function simulateSaveCombat({save, seed, wave: selectedWave, profile, seconds, frontlineDamageTaken}) {
  let randomState = seed >>> 0;
  Math.random = () => {
    randomState += 0x6D2B79F5;
    let n = randomState;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
  // Timers and animation frames must not advance combat outside the fixed step.
  window.setTimeout = () => 0;
  window.setInterval = () => 0;
  if(frontlineDamageTaken!==undefined)COMBAT_TUNING.frontlineDamageTaken=frontlineDamageTaken;
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  if (!loadGame()) throw Error('O jogo não conseguiu carregar o save.');
  TITLE.active = false; TITLE.paused = false; COMIC.active = false;
  CAMP.on = false; CAMP.map = false; CAMP.noWaves = false;
  player.waveProgress.selected = selectedWave;
  // Disable presentation only; combat and loot/progression continue normally.
  playSound = floatMsg = showWaveBanner = burst = ring = () => {};
  // New game modes must not silently change an arena regression scenario.
  if(typeof setEndlessMode==='function')setEndlessMode('classic');
  startEndless();
  P.deadT = 0;
  // The village heals before a normal attempt. Preserve the exported HP rather
  // than silently normalizing it; restoreSummonGroups already restored allies.
  minions.forEach((m, i) => {
    m.x = P.x + Math.cos(i * 2.4) * 2;
    m.y = P.y + Math.sin(i * 2.4) * 2;
  });
  const initial = {
    level: player.level, hp: player.hp, maxHp: player.maxHp, mp: player.mp,
    loadout: [...player.actionLoadout],
    minions: minions.map(m => ({type:m.type,hp:m.hp,maxHp:m.maxHp,damage:m.dmg,interval:m.atkRate})),
    waveStats: EquipmentModel.waveStats(selectedWave),frontlineDamageTaken:COMBAT_TUNING.frontlineDamageTaken??1
  };
  const stats = {damage:{player:0,horde:0},taken:0,kills:0,deaths:[],timeline:[],surroundedSeconds:0,noMeleeSeconds:0,
    revivals:[],postReviveDeaths:[],maxFireZones:0,
    incomingDamage:{player:{basic:0,mageImpact:0,mageProjectile:0,fireGround:0,otherArea:0},horde:{basic:0,mageImpact:0,mageProjectile:0,fireGround:0,otherArea:0}},
    minionActivity:Object.fromEntries(minions.map(m=>[m.type,{aliveSeconds:0,deadSeconds:0,returningSeconds:0,inAttackRangeSeconds:0,
      chasingSeconds:0,targetlessSeconds:0,evadingSeconds:0,hazardWaitSeconds:0,obstacleContactSeconds:0,basicAttacks:0,abilities:0,damageTaken:0}]))};
  let elapsed = 0, source = 'player', died = false, finished = false;
  let incomingSource='basic';
  function incoming(original,category){return function(...args){const previous=incomingSource;incomingSource=typeof category==='function'?category(...args):category;try{return original(...args);}finally{incomingSource=previous;}};}
  updateMobAbility=incoming(updateMobAbility,e=>e.type.name==='Mago Vivo'?'mageImpact':'otherArea');
  updateMobZones=incoming(updateMobZones,'fireGround');
  updateHostileProjectile=incoming(updateHostileProjectile,sh=>sh.kind==='magic'?'mageProjectile':'basic');
  const life=new Map(minions.map(m=>[m,{dead:m.dead,revivedAt:null}])),obstacleContacts=new Set();
  function recordRevive(m){const state=life.get(m);if(state.dead&&!m.dead){state.dead=false;state.revivedAt=elapsed;stats.revivals.push({type:m.type,seconds:elapsed});}}
  const originalDamage = dealDamageToEnemy;
  dealDamageToEnemy = function(e, damage) {
    const before = Math.max(0, e.hp);
    const result = originalDamage(e, damage);
    stats.damage[source] += Math.max(0, before - Math.max(0, e.hp));
    return result;
  };
  // Attribute synchronous melee/abilities and delayed friendly arrows separately.
  function attributed(original) {
    return function(...args) {
      const previous = source; source = 'horde';
      try { return original(...args); } finally { source = previous; }
    };
  }
  const strike=attributed(minionStrike);minionStrike=function(m,...args){stats.minionActivity[m.type].basicAttacks++;return strike(m,...args);};
  const ability=attributed(castMinionAbility);castMinionAbility=function(m,...args){const result=ability(m,...args);if(result)stats.minionActivity[m.type].abilities++;return result;};
  updateFriendlyProjectile = attributed(updateFriendlyProjectile);
  const evade=minionEvade;minionEvade=function(m,index,dt,npos){const wasEvading=!!m._evade,result=evade(m,index,dt,npos);if(result)stats.minionActivity[m.type][wasEvading||m._evade?'evadingSeconds':'hazardWaitSeconds']+=dt;return result;};
  const collision=collide;collide=function(entity,...args){const x=entity.x,y=entity.y,result=collision(entity,...args);if(life.has(entity)&&Math.hypot(entity.x-x,entity.y-y)>.001)obstacleContacts.add(entity);return result;};
  const minionDamage=dealDamageToMinion;dealDamageToMinion=function(m,damage){recordRevive(m);const hp=m.hp,result=minionDamage(m,damage),taken=Math.max(0,hp-Math.max(0,m.hp));stats.minionActivity[m.type].damageTaken+=taken;stats.incomingDamage.horde[incomingSource]+=taken;return result;};
  const originalKill = killMinion;
  killMinion = function(m) {
    if (!m.dead) {
      recordRevive(m);const state=life.get(m);
      stats.deaths.push({seconds: Number(elapsed.toFixed(2)), type:m.type, sacrificed:!!m.sacrificed, exploded:!!m.exploded});
      if(state.revivedAt!==null)stats.postReviveDeaths.push({type:m.type,secondsAlive:elapsed-state.revivedAt});
      state.dead=true;state.revivedAt=null;
    }
    return originalKill(m);
  };
  const originalPlayerDamage = dealDamageToPlayer;
  dealDamageToPlayer = function(damage) {
    const before = player.hp;
    const result = originalPlayerDamage(damage);
    const taken=Math.max(0,before-player.hp);stats.taken+=taken;stats.incomingDamage.player[incomingSource]+=taken;
    return result;
  };
  const originalEnemyKill = killEnemy;
  killEnemy = function(e,...args) { if (!e.dead) stats.kills++; return originalEnemyKill(e,...args); };
  // Stop at the first death/clear, before the village reset or another wave.
  gameOver = () => { died = true; player.hp = 0; P.deadT = .001; };
  const originalEnd = endWave;
  endWave = function() { finished = true; return originalEnd(); };
  startWave();
  if(!currentMission?.endless||!waveActive||spawnQueue.length<1)throw Error('A simulação esperava uma wave da arena clássica com fila de inimigos.');
  initial.mode='classic';
  initial.waveComposition=Object.fromEntries(ENEMY_TYPES.map(type=>[type.name,spawnQueue.filter(t=>t.name===type.name).length]));
  const step = 1/60;
  let nextSample = 0;
  for (let tick = 0; tick < Math.ceil(seconds / step) && !died && !finished; tick++) {
    elapsed = tick * step;
    const living = enemies.filter(e => !e.dead && e.spawnT <= 0);
    const closest = living.reduce((a,e) => !a || Math.hypot(e.x-P.x,e.y-P.y)<Math.hypot(a.x-P.x,a.y-P.y) ? e : a, null);
    keys.w = keys.a = keys.s = keys.d = false;
    if (profile === 'kite') {
      // One heading decision every 0.2 s, eight keyboard directions. Avoid nearby
      // enemies and the arena edge; no teleporting or manual position changes.
      if (tick % 12 === 0) {
        let best = -Infinity, heading = 0;
        for (let i=0;i<8;i++) {
          const a=i*Math.PI/4, x=P.x+Math.cos(a)*2, y=P.y+Math.sin(a)*2;
          const edge=Math.max(0,Math.hypot(x,y)-(FIELD_R-4));
          let score=-edge*15;
          for (const e of living) score-=12/Math.max(.4,Math.hypot(e.x-x,e.y-y))**2;
          // Gently prefer a circular route when threats are distant.
          score+=(Math.cos(a)*(-P.y)+Math.sin(a)*P.x)*.005;
          if(score>best){best=score;heading=i;}
        }
        globalThis.saveSimulationHeading=heading;
      }
      const a=globalThis.saveSimulationHeading*Math.PI/4;
      keys.d=Math.cos(a)>.38;keys.a=Math.cos(a)<-.38;
      keys.s=Math.sin(a)>.38;keys.w=Math.sin(a)<-.38;
      if (closest && Math.hypot(closest.x-P.x,closest.y-P.y)<2.8 && player.actionLoadout.includes('dash'))
        castDash(P.x+Math.cos(a)*6,P.y+Math.sin(a)*6);
    }
    // Hold attacks at the nearest target. Only equipped player spells are used;
    // no commanded detonation, shield sacrifice, potions or manual revival.
    if (closest && Math.hypot(closest.x-P.x,closest.y-P.y)<=9 && player.actionLoadout.includes('raio'))
      castRaio(closest.x,closest.y);
    obstacleContacts.clear();update(step);
    stats.maxFireZones=Math.max(stats.maxFireZones,mobZones.length);
    elapsed=(tick+1)*step;
    const live=minions.filter(m=>!m.dead);
    for(const m of minions){
      const activity=stats.minionActivity[m.type];
      recordRevive(m);
      activity[m.dead?'deadSeconds':'aliveSeconds']+=step;
      if(!m.dead&&m.returning)activity.returningSeconds+=step;
      if(!m.dead&&m.target&&!m.target.dead&&Math.hypot(m.x-m.target.x,m.y-m.target.y)<=m.atkR+.3*(m.target.type.sc||1))activity.inAttackRangeSeconds+=step;
      if(!m.dead&&!m.returning&&!m._evade){
        if(!m.target||m.target.dead)activity.targetlessSeconds+=step;
        else if(Math.hypot(m.x-m.target.x,m.y-m.target.y)>m.atkR+.3*(m.target.type.sc||1))activity.chasingSeconds+=step;
      }
      if(obstacleContacts.has(m))activity.obstacleContactSeconds+=step;
    }
    if (!live.some(m=>m.type!=='archer')) stats.noMeleeSeconds+=step;
    if (enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<3).length>=3) stats.surroundedSeconds+=step;
    if(elapsed>=nextSample || died || finished) {
      stats.timeline.push({seconds:Number(elapsed.toFixed(1)),hp:died?0:Math.round(player.hp),alive:live.length,enemies:enemies.filter(e=>!e.dead).length,queued:spawnQueue.length});
      nextSample+=5;
    }
  }
  return {seed,wave:selectedWave,profile,initial,outcome:died?'death':finished?'clear':'timeout',seconds:Number(elapsed.toFixed(2)),hpRemaining:died?0:player.hp,levelAfter:player.level,...stats};
};
