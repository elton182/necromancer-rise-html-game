import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudio,base64Bytes,SOUND_NAMES,THEMES,STORAGE_KEY} from '../scripts/audio.mjs';
import {createSoundObserver,musicTheme,pickupSound,CONSUMABLE_SOUNDS,SPELL_SOUNDS} from '../scripts/sound-events.mjs';
import {createSession,equipSession,transition,stepSession} from '../scripts/session.mjs';
import {SPELL_TEST_PROFILE} from '../scripts/grimoire.mjs';
import {setProfile} from '../scripts/horde.mjs';
import {castSpell} from '../scripts/spells.mjs';
import {castBolt,dealDamage} from '../scripts/combat.mjs';
import {launchStage,startCampaign} from '../scripts/campaign.mjs';
import {setPaused,dash} from '../scripts/training-model.mjs';

// Contexto de áudio falso: aceita qualquer nó do Web Audio e registra o que foi criado.
function param(value=0){return {value,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}};}
function fakeContext(){
 const made={oscillators:0,gains:0,sources:0},node=extra=>({connect(){},disconnect(){},...extra});
 const ctx={state:'suspended',currentTime:0,sampleRate:8000,destination:node(),made,resumed:0,closed:false,
  resume(){this.state='running';this.resumed++;},suspend(){this.state='suspended';},close(){this.closed=true;},
  createGain(){made.gains++;return node({gain:param(1)});},
  createOscillator(){made.oscillators++;return node({type:'sine',frequency:param(440),start(){},stop(){}});},
  createBiquadFilter(){return node({type:'lowpass',frequency:param(350),Q:param(1)});},
  createConvolver(){return node({buffer:null});},
  createBuffer(channels,length){const data=Array.from({length:channels},()=>new Float32Array(length));return {getChannelData:i=>data[i]};},
  decoded:[],decodeAudioData(bytes){return this.decodeFails?Promise.reject(Error('formato inválido')):Promise.resolve({decoded:bytes.byteLength});},
  createBufferSource(){made.sources++;const s=node({buffer:null,loop:false,started:0,stopped:0,start(){s.started++;},stop(){s.stopped++;}});made.last=s;return s;}};
 return ctx;
}
const memory=()=>{const data={};return {getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=String(v);},data};};
function engine(options={}){let t=1000;const ctx=fakeContext(),audio=createAudio({createContext:()=>ctx,now:()=>t,...options});return {audio,ctx,advance:ms=>{t+=ms;}};}

test('todos os efeitos do jogo anterior existem e tocam sem erro', () => {
 const {audio,advance}=engine();
 for(const name of SOUND_NAMES){assert.equal(audio.play(name),true,name);advance(100);}
 assert.deepEqual(Object.keys(audio.counts).sort(),[...SOUND_NAMES].sort());
 assert.equal(audio.play('inexistente'),false);
});
test('o mesmo efeito não dispara de novo em menos de 45 ms', () => {
 const {audio,advance}=engine();
 assert.equal(audio.play('hit'),true);advance(30);assert.equal(audio.play('hit'),false);assert.equal(audio.play('raio'),true);advance(20);assert.equal(audio.play('hit'),true);
 assert.equal(audio.counts.hit,2);
});
test('o áudio só nasce no primeiro gesto e retoma o contexto suspenso', () => {
 const {audio,ctx}=engine();
 assert.equal(audio.ready,false);audio.unlock();assert.equal(audio.ready,true);assert.equal(ctx.state,'running');
 ctx.state='suspended';audio.unlock();assert.equal(ctx.resumed,2);
});
test('sem Web Audio o jogo segue em silêncio, sem lançar erro', () => {
 const warn=console.warn;console.warn=()=>{};
 try{const audio=createAudio({createContext(){throw Error('sem suporte');}});assert.equal(audio.play('click'),false);audio.setMusic('field');audio.setVolume(.3);assert.equal(audio.ready,false);}
 finally{console.warn=warn;}
});
test('mudo bloqueia os efeitos e a preferência volta na próxima abertura', () => {
 const storage=memory(),{audio}=engine({storage});
 audio.setVolume(.25);audio.setMusicVolume(.4);assert.equal(audio.toggleMute(),true);
 assert.equal(audio.play('click'),false);
 const saved=JSON.parse(storage.data[STORAGE_KEY]);assert.deepEqual(saved,{volume:.25,music:.4,muted:true});
 const again=engine({storage}).audio;assert.equal(again.volume,.25);assert.equal(again.music,.4);assert.equal(again.muted,true);
});
test('preferência corrompida ou armazenamento indisponível cai nos valores padrão', () => {
 const broken={getItem(){throw Error('bloqueado');},setItem(){throw Error('bloqueado');}};
 const a=engine({storage:broken}).audio;assert.equal(a.volume,.55);assert.equal(a.music,.7);assert.equal(a.muted,false);a.setVolume(.9);
 const b=engine({storage:{getItem:()=>'{"volume":"x","music":9,"muted":1}',setItem(){}}}).audio;assert.equal(b.volume,.55);assert.equal(b.music,1);assert.equal(b.muted,false);
 a.setVolume(7);assert.equal(a.volume,1);a.setVolume(-3);assert.equal(a.volume,0);
});
test('cada trilha agenda notas, troca com fade e silencia quando mudo', () => {
 for(const id of Object.keys(THEMES)){
  const {audio,ctx}=engine();audio.setMusic(id);audio.unlock();
  const before=ctx.made.oscillators;ctx.currentTime=2;audio.tick();
  assert.ok(ctx.made.oscillators>before,'trilha '+id+' deveria agendar notas');
 }
 const {audio,ctx}=engine();audio.unlock();audio.setMusic('field');ctx.currentTime=1;audio.setMuted(true);
 const before=ctx.made.oscillators;ctx.currentTime=5;audio.tick();assert.equal(ctx.made.oscillators,before);
 audio.setMuted(false);ctx.currentTime=5.1;audio.tick();assert.ok(ctx.made.oscillators>before);
 assert.equal(audio.theme,'field');audio.setMusic(null);assert.equal(audio.theme,'field');audio.setMusic('boss');assert.equal(audio.theme,'boss');
});
test('trilha escolhida antes do primeiro gesto começa quando o áudio é liberado', () => {
 const {audio,ctx}=engine();audio.setMusic('title');assert.equal(ctx.made.gains,0);
 audio.unlock();ctx.currentTime=1;audio.tick();assert.ok(ctx.made.oscillators>0);
});
const settle=()=>new Promise(r=>setTimeout(r,0));
test('efeito em arquivo usa cache, toca uma vez sem loop e respeita mudo', async () => {
 let loads=0;const {audio,ctx,advance}=engine({effects:{portal:()=>{loads++;return base64Bytes('SUQz');}}});
 audio.play('portal');await settle();assert.equal(ctx.made.sources,1);assert.equal(ctx.made.last.loop,false);assert.equal(ctx.made.last.started,1);
 advance(100);audio.play('portal');await settle();assert.equal(loads,1);assert.equal(ctx.made.sources,2);
 advance(100);audio.play('portal');audio.setMuted(true);await settle();assert.equal(ctx.made.sources,2);
 audio.dispose();
});
test('efeito inválido usa procedural e descarte impede reprodução pendente', async () => {
 const warn=console.warn;console.warn=()=>{};
 try{const {audio,ctx}=engine({effects:{portal:()=>base64Bytes('SUQz')}});ctx.decodeFails=true;audio.play('portal');await settle();assert.ok(ctx.made.oscillators>0);audio.dispose();
 const other=engine({effects:{portal:()=>base64Bytes('SUQz')}});other.audio.play('portal');other.audio.dispose();await settle();assert.equal(other.ctx.made.sources,0);
 }finally{console.warn=warn;}
});
test('base64Bytes devolve os bytes originais do arquivo embutido', () => {
 assert.deepEqual([...new Uint8Array(base64Bytes(Buffer.from([73,68,51,255,0]).toString('base64')))],[73,68,51,255,0]);
});
test('trilha em arquivo toca em loop no lugar da procedural e não agenda notas', async () => {
 const {audio,ctx}=engine({tracks:{title:()=>base64Bytes('SUQz')}});audio.setMusic('title');audio.unlock();await settle();
 assert.equal(ctx.made.sources,1);assert.equal(ctx.made.last.loop,true);assert.equal(ctx.made.last.started,1);assert.deepEqual(ctx.made.last.buffer,{decoded:3});
 const before=ctx.made.oscillators;ctx.currentTime=2;audio.tick();assert.equal(ctx.made.oscillators,before);
});
test('a trilha em arquivo é decodificada uma vez e para ao trocar de tema', async () => {
 let loads=0;const {audio,ctx}=engine({tracks:{title:()=>{loads++;return base64Bytes('SUQz');}}});audio.unlock();
 audio.setMusic('title');await settle();const first=ctx.made.last;audio.setMusic('field');audio.setMusic('title');await settle();
 assert.equal(loads,1);assert.equal(ctx.made.sources,2);assert.notEqual(ctx.made.last,first);
 assert.equal(audio.theme,'title');
});
test('trocar de tema antes de a decodificação terminar não inicia a trilha antiga', async () => {
 const {audio,ctx}=engine({tracks:{title:()=>base64Bytes('SUQz')}});audio.unlock();audio.setMusic('title');audio.setMusic('field');await settle();
 assert.equal(ctx.made.sources,0);
});
test('arquivo que não decodifica cai na trilha procedural do tema', async () => {
 const warn=console.warn;console.warn=()=>{};
 try{
  const {audio,ctx}=engine({tracks:{title:()=>base64Bytes('SUQz')}});ctx.decodeFails=true;audio.unlock();audio.setMusic('title');await settle();
  const before=ctx.made.oscillators;ctx.currentTime=2;audio.tick();assert.ok(ctx.made.oscillators>before);
 }finally{console.warn=warn;}
});
test('descartar o áudio fecha o contexto e interrompe o agendamento', () => {
 const {audio,ctx}=engine();audio.unlock();audio.dispose();assert.equal(ctx.closed,true);
 const count=ctx.made.oscillators;ctx.state='running';audio.setMusic('field');ctx.currentTime=3;audio.tick();assert.equal(ctx.made.oscillators,count);
});

// ── Observador de eventos ──────────────────────────────────
function arena(loadout=['chuva','explosao','maos','barreira','maldicao','dash']){
 const s=createSession();setProfile(s.world,SPELL_TEST_PROFILE);loadout.forEach((id,i)=>assert.ok(equipSession(s,i,id).ok));
 transition(s,'training');const w=s.world;Object.assign(w.player,{maxHp:400,hp:400,maxMp:400,mp:400,spellDamage:40,x:0,y:8});w.aim={x:0,y:5};w.random=()=>.5;
 for(const e of w.actors)if(e.team==='enemy'){e.x=12;e.y=-12;e.timer=999;e.hp=e.maxHp=10000;}
 return s;
}
const enemyOf=w=>w.actors.find(a=>a.team==='enemy'&&a!==w.boss);
function frames(s,ob,count=1,dt=1/60){const out=[];for(let i=0;i<count;i++){stepSession(s,dt,{});out.push(...ob.observe(s));}return out;}
test('o primeiro quadro só cria a referência e não soa', () => {
 const s=arena(),ob=createSoundObserver();assert.deepEqual(ob.observe(s),[]);assert.deepEqual(frames(s,ob,5),[]);
});
test('Tiro de Osso e Dash soam ao disparar; o impacto soa ao acertar', () => {
 const s=arena(),ob=createSoundObserver(),w=s.world;ob.observe(s);
 const e=enemyOf(w);e.x=0;e.y=3;w.aim={x:0,y:3};
 assert.ok(castBolt(w));assert.ok(frames(s,ob,1).includes('raio'));
 assert.ok(frames(s,ob,30).includes('hit'));
 w.dash.cooldown=0;w.dash.remaining=0;frames(s,ob,1);assert.ok(dash(w,{x:1,y:0}));assert.ok(frames(s,ob,1).includes('raio'));
});
test('um quadro longo não perde o tiro nem o acerto', () => {
 const s=arena(),ob=createSoundObserver(),w=s.world;ob.observe(s);
 const e=enemyOf(w);e.x=0;e.y=3;w.aim={x:0,y:3};assert.ok(castBolt(w));
 const out=[];stepSession(s,.25,{});out.push(...ob.observe(s));stepSession(s,.25,{});out.push(...ob.observe(s));
 assert.ok(out.includes('raio'));assert.ok(out.includes('hit'));
});
test('cada magia toca o som do jogo anterior ao ser conjurada', () => {
 for(const id of ['explosao','chuva','maos','barreira','maldicao']){
  const s=arena(),ob=createSoundObserver(),w=s.world;ob.observe(s);w.aim={x:0,y:5};
  assert.ok(castSpell(w,id),id);assert.ok(frames(s,ob,1).includes(SPELL_SOUNDS[id]),id);
  assert.equal(frames(s,ob,3).includes(SPELL_SOUNDS[id]),false,'sem repetir '+id);
 }
});
test('morte de inimigo, do chefe e dano ao jogador têm sons próprios', () => {
 const s=arena(),ob=createSoundObserver(),w=s.world;ob.observe(s);
 const e=enemyOf(w);dealDamage(w,e,e.hp,w.player);assert.ok(frames(s,ob,1).includes('enemyDeath'));
 dealDamage(w,w.boss,w.boss.hp,w.player);assert.ok(frames(s,ob,1).includes('explosao'));
 dealDamage(w,w.player,10,e);assert.ok(frames(s,ob,1).includes('playerHurt'));
});
test('aliado que cai e renasce toca morte e reanimação', () => {
 const s=arena(['chuva','zombie','maos','barreira','maldicao','dash']),ob=createSoundObserver(),w=s.world;ob.observe(s);
 const ally=w.actors.find(a=>a.groupType);assert.ok(ally,'perfil de teste deve ter grupo');
 ally.dead=true;ally.hp=0;assert.ok(frames(s,ob,1).includes('minionDeath'));
 ally.dead=false;ally.hp=ally.maxHp;assert.ok(frames(s,ob,1).includes('revive'));
});
test('subir de nível toca levelUp uma única vez', () => {
 const s=arena(),ob=createSoundObserver(),w=s.world;ob.observe(s);
 w.army.profile.level+=1;const out=frames(s,ob,2);assert.equal(out.filter(n=>n==='levelUp').length,1);
});
test('pausa e carga de save não geram sons e atualizam a referência', () => {
 const s=arena(),ob=createSoundObserver(),w=s.world;ob.observe(s);
 setPaused(w,true);w.army.profile.level+=5;w.player.hp=1;assert.deepEqual(ob.observe(s),[]);
 setPaused(w,false);assert.deepEqual(frames(s,ob,3),[],'o nível novo já virou a referência');
});
test('trocas de cena tocam portal; morte toca gameOver; menu fica em silêncio', () => {
 const s=createSession(),ob=createSoundObserver();ob.observe(s);
 transition(s,'training');assert.deepEqual(ob.observe(s),[]);
 startCampaign(s);assert.deepEqual(ob.observe(s),['portal'],'treino → mapa');
 s.world.player.hp=0;s.world.dash.remaining=0;transition(s,'dead');assert.deepEqual(ob.observe(s),['gameOver']);
 transition(s,'menu');assert.deepEqual(ob.observe(s),[]);
});
test('marcos da campanha tocam aviso de onda e conclusão', () => {
 const s=createSession();startCampaign(s);s.save.campaign.unlocked=4;const ob=createSoundObserver();
 assert.ok(launchStage(s,2));s.world.story=null;s.world.paused=false;ob.observe(s);
 const r=s.world.adventure;r.wave=1;assert.ok(ob.observe(s).includes('waveStart'));
 r.done=true;assert.ok(ob.observe(s).includes('levelUp'));
});
test('trilha acompanha cena, estágio, chefe e história', () => {
 const s=createSession();
 assert.equal(musicTheme(s),'hub');assert.equal(musicTheme(s,{title:true}),'title');
 transition(s,'training');assert.equal(musicTheme(s),'field');
 startCampaign(s);s.save.campaign.unlocked=4;s.world.story=null;assert.equal(musicTheme(s),'map');
 const themes={};for(const n of [1,2,3,4]){launchStage(s,n);s.world.story=null;s.world.boss.hp=0;themes[n]=musicTheme(s);}
 assert.deepEqual(themes,{1:'crypt',2:'forest',3:'strip',4:'boss'});
 launchStage(s,2);s.world.story=null;s.world.actors.push(s.world.boss);s.world.boss.hp=500;assert.equal(musicTheme(s),'boss');
 s.world.story={id:'x',pages:[],index:0};assert.equal(musicTheme(s),'story');
 s.world.player.hp=0;transition(s,'dead');s.world.story=null;assert.equal(musicTheme(s),null);
});
test('mapas de som de coleta e consumíveis só usam efeitos que existem', () => {
 const all=new Set(SOUND_NAMES);
 for(const name of [...Object.values(CONSUMABLE_SOUNDS),...Object.values(SPELL_SOUNDS),pickupSound({kind:'hp'}),pickupSound({kind:'gold'}),pickupSound({kind:'equipment'})])assert.ok(all.has(name),name);
 assert.equal(pickupSound({kind:'desconhecido'}),null);
});
