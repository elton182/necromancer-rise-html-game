// Áudio procedural da v2, portado de necromancer-canvas.html (AUDIO ENGINE e MÚSICA PROCEDURAL).
// Sem arquivos: efeitos e música saem de osciladores e ruído do Web Audio. Sem DOM; o contexto é injetável.
const SCALES={
 min:[0,2,3,5,7,8,10],dor:[0,2,3,5,7,9,10],phr:[0,1,3,5,7,8,10],pdom:[0,1,4,5,7,8,10],pent:[0,3,5,7,10,12,15]
};
export const THEMES={
 title:{bpm:66,root:45,sc:'min',prog:[0,5,2,6],pad:1,padO:0,bass:'x...............',arp:{p:'x.x.x.x.x.x.x.x.',o:1,v:.05,pl:'tri'},lead:{p:.35,o:2,v:.05},cut:900},
 map:{bpm:72,root:50,sc:'dor',prog:[0,3,5,3],pad:1,padO:0,bass:'x.......x.......',arp:{p:'x...x...x...x...',o:1,v:.045,pl:'tri'},lead:{p:.22,o:2,v:.04},cut:1100},
 story:{bpm:54,root:43,sc:'min',prog:[0,6,5,6],pad:1,padO:0,bass:'x...............',arp:null,lead:{p:.3,o:2,v:.04},cut:700},
 hub:{bpm:70,root:40,sc:'phr',prog:[0,0,6,5],pad:1,padO:0,bass:'x.......x.......',arp:{p:'..x...x...x...x.',o:2,v:.03,pl:'sine'},lead:{p:.18,o:2,v:.035},cut:800},
 village:{bpm:84,root:50,sc:'dor',prog:[0,4,3,4],pad:1,padO:0,bass:'x.....x.x.....x.',arp:{p:'x.x.x.x.x.x.x.x.',o:1,v:.05,pl:'pluck'},lead:{p:.3,o:2,v:.045,pl:'tri'},cut:1500,kick:'x.......x.......'},
 crypt:{bpm:68,root:37,sc:'phr',prog:[0,1,0,6],pad:1,padO:0,bass:'x...............',arp:null,drip:.28,heart:true,cut:600},
 forest:{bpm:98,root:45,sc:'min',prog:[0,5,2,6],pad:1,padO:0,bass:'x.x.x.x.x.x.x.x.',arp:{p:'..x...x...x..x..',o:2,v:.035,pl:'saw'},lead:{p:.2,o:2,v:.04},cut:1000,kick:'x...x...x...x...',hat:'..x...x...x...x.'},
 strip:{bpm:112,root:52,sc:'min',prog:[0,2,5,4],pad:1,padO:0,bass:'x.xxx.xxx.xxx.x.',arp:{p:'x.x.x.x.x.x.x.x.',o:2,v:.03,pl:'saw'},lead:{p:.25,o:2,v:.045},cut:1300,kick:'x...x...x...x...',hat:'..x...x...x...x.',snare:'....x.......x...'},
 boss:{bpm:132,root:38,sc:'pdom',prog:[0,0,5,4],pad:1,padO:0,bass:'xxx.xxx.xxx.xx..',arp:{p:'x.xx.x.xx.xx.x.x',o:2,v:.04,pl:'saw'},lead:{p:.4,o:2,v:.05,pl:'saw'},cut:1800,kick:'x..xx..xx.x.x..x',hat:'x.x.x.x.x.x.x.x.',snare:'....x.......x...',stab:true},
 endless:{bpm:120,root:42,sc:'min',prog:[0,5,3,6],pad:1,padO:0,bass:'x.xx.xx.x.xx.xx.',arp:{p:'x.x.x.x.x.x.x.x.',o:2,v:.035,pl:'saw'},lead:{p:.3,o:2,v:.045},cut:1400,kick:'x...x...x...x...',hat:'..x...x...x...x.',snare:'....x.......x...'},
 field:{bpm:96,root:40,sc:'min',prog:[0,6,5,6],pad:1,padO:0,bass:'x.x.x.x.x.x.x.x.',arp:{p:'..x...x...x..x..',o:2,v:.03,pl:'tri'},lead:{p:.2,o:2,v:.04},cut:950,kick:'x.......x.......',hat:'..x...x...x...x.'}
};
export const SOUND_NAMES=['click','maos','raio','chuva','explosao','hit','enemyDeath','minionDeath','revive','levelUp','waveStart','playerHurt','gameOver','portal','summon','pickupHp','pickupMp'];
export const STORAGE_KEY='necromancer_v2_audio';
export const PAUSE_DUCK=.35;
const MUSIC_BASE=.34,THROTTLE_MS=45,DEFAULTS={volume:.55,music:.7,muted:false};
const clamp01=n=>Math.max(0,Math.min(1,Number(n)));
const midi=m=>440*Math.pow(2,(m-69)/12);
const degree=(th,d,oct)=>{const s=SCALES[th.sc],n=s.length,o=Math.floor(d/n),i=((d%n)+n)%n;return th.root+s[i]+12*(o+(oct||0));};
function defaultContext(){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)throw Error('Web Audio indisponível.');return new C();}
function loadPrefs(storage){
 try{const raw=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');return {volume:Number.isFinite(raw?.volume)?clamp01(raw.volume):DEFAULTS.volume,music:Number.isFinite(raw?.music)?clamp01(raw.music):DEFAULTS.music,muted:raw?.muted===true};}
 catch{return {...DEFAULTS};}
}
// Bytes de um arquivo de áudio embutido em base64, prontos para decodeAudioData.
export function base64Bytes(data){const bin=atob(data),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return bytes.buffer;}
// O volume fica fora do save do personagem: é preferência do aparelho, não progresso.
// tracks: {id: () => ArrayBuffer | Promise<ArrayBuffer>} troca a trilha procedural do tema por um arquivo em loop;
// se o arquivo não decodificar, o tema procedural assume.
export function createAudio({createContext=defaultContext,storage=null,now=()=>performance.now(),tracks={}}={}){
 const prefs=loadPrefs(storage),counts={},lastPlayed={};
 const decoded={};
 let ctx=null,master=null,noiseBuffer=null,bus=null,theme=null,current=null,step=0,next=0,duck=1,timer=null,broken=false,disposed=false;
 const save=()=>{try{storage?.setItem(STORAGE_KEY,JSON.stringify(prefs));}catch{}};
 const masterLevel=()=>prefs.muted?0:prefs.volume;
 const musicLevel=()=>prefs.music*MUSIC_BASE*duck;

 // ── Primitivas ──────────────────────────────────────────
 function gain(value,fade=0){
  const g=ctx.createGain();g.gain.value=value;
  if(fade)g.gain.setTargetAtTime(0,ctx.currentTime+fade,.1);
  g.connect(master);return g;
 }
 function osc(type,freq,g,start,dur){
  const o=ctx.createOscillator();o.type=type;o.frequency.value=freq;
  o.connect(g);o.start(ctx.currentTime+start);o.stop(ctx.currentTime+start+dur);return o;
 }
 function noiseBuf(){
  if(!noiseBuffer){const buf=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.5),ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;noiseBuffer=buf;}
  return noiseBuffer;
 }
 function noise(g,start,dur){
  const src=ctx.createBufferSource();src.buffer=noiseBuf();src.loop=true;
  src.connect(g);src.start(ctx.currentTime+start);src.stop(ctx.currentTime+start+dur);
 }
 // Envelope exponencial a partir do nível inicial, como nos efeitos do jogo anterior.
 const decay=(g,level,t,dur)=>{g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);};
 const filtered=(type,freq,q)=>{const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;if(q!==undefined)f.Q.value=q;return f;};
 const sweep=(type,from,to,t,dur,through,g)=>{
  const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(to,t+dur);
  let out=o;if(through){o.connect(through);out=through;}out.connect(g);o.start(t);o.stop(t+dur);return o;
 };

 // ── Efeitos ─────────────────────────────────────────────
 const SFX={
  click(){const g=gain(.12,.05);osc('sine',880,g,0,.005);osc('sine',660,g,.005,.04);},
  maos(){
   const t=ctx.currentTime,g=gain(.3);decay(g,.3,t,.6);
   sweep('sawtooth',80,40,t,.6,filtered('bandpass',300,2),g);
   const g2=gain(.15);decay(g2,.15,t,.5);sweep('sine',880,440,t,.5,null,g2);
  },
  raio(){
   const t=ctx.currentTime,g=gain(.25);decay(g,.25,t,.3);
   sweep('sawtooth',1200,200,t,.3,filtered('highpass',1200),g);
   const ng=gain(.12);decay(ng,.12,t,.2);
   const nf=filtered('bandpass',3000,1);ng.connect(nf);nf.connect(master);noise(ng,0,.2);
  },
  chuva(){
   const t=ctx.currentTime;
   for(let i=0;i<7;i++){
    const delay=i*.06+Math.random()*.04,g=gain(.08);decay(g,.08,t+delay,.15);
    const f=filtered('bandpass',800+Math.random()*400,3);g.connect(f);f.connect(master);noise(g,delay,.15);
    const g2=gain(.1);decay(g2,.1,t+delay,.08);osc('triangle',300+Math.random()*200,g2,delay,.08);
   }
  },
  explosao(){
   const t=ctx.currentTime,g=gain(.5);decay(g,.5,t,1.2);
   const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(60,t);o.frequency.exponentialRampToValueAtTime(20,t+1);o.connect(g);o.start(t);o.stop(t+1.2);
   const ng=gain(.3);decay(ng,.3,t,.8);
   const nf=filtered('lowpass',500);ng.connect(nf);nf.connect(master);noise(ng,0,.8);
   const g3=gain(.2);decay(g3,.2,t+.1,.9);osc('sine',440,g3,.1,.9);osc('sine',554,g3,.1,.9);
  },
  hit(){
   const t=ctx.currentTime,g=gain(.15);decay(g,.15,t,.12);
   const f=filtered('bandpass',600,2);g.connect(f);f.connect(master);noise(g,0,.12);
   osc('triangle',180,gain(.1,.1),0,.1);
  },
  enemyDeath(){
   const t=ctx.currentTime,g=gain(.18);decay(g,.18,t,.4);
   sweep('sawtooth',220,55,t,.4,null,g);
   const ng=gain(.1);decay(ng,.1,t,.25);noise(ng,0,.25);
  },
  minionDeath(){const t=ctx.currentTime,g=gain(.2);decay(g,.2,t,.6);sweep('sine',150,60,t,.6,null,g);},
  revive(){
   const t=ctx.currentTime;
   [110,138.6,165,220].forEach((f,i)=>{
    const g=gain(.12);decay(g,.12,t+i*.1,.3);osc('sine',f,g,i*.1,.3);
    osc('triangle',f*2,gain(.05,.3),i*.1,.25);
   });
  },
  levelUp(){
   const t=ctx.currentTime;
   [261.6,329.6,392,523.3].forEach((f,i)=>{
    const g=gain(.18);decay(g,.18,t+i*.1,.4);osc('sine',f,g,i*.1,.4);
    osc('triangle',f,gain(.08,.4),i*.1,.35);
   });
   const gf=gain(.15);decay(gf,.15,t+.4,.5);osc('sine',1046.5,gf,.4,.5);
  },
  waveStart(){
   const t=ctx.currentTime,g=gain(.25);g.gain.setValueAtTime(.01,t);g.gain.linearRampToValueAtTime(.25,t+.2);g.gain.exponentialRampToValueAtTime(.001,t+1.5);
   const f=filtered('lowpass',400),o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(55,t);o.frequency.setValueAtTime(55,t+.8);o.frequency.linearRampToValueAtTime(46,t+1.5);
   o.connect(f);f.connect(g);o.start(t);o.stop(t+1.5);
   osc('sine',27.5,gain(.2,1.5),0,1.5);
  },
  playerHurt(){
   const t=ctx.currentTime,g=gain(.3);decay(g,.3,t,.2);sweep('square',200,80,t,.2,null,g);
   const ng=gain(.2);decay(ng,.2,t,.15);
   const nf=filtered('bandpass',400,1);ng.connect(nf);nf.connect(master);noise(ng,0,.15);
  },
  gameOver(){
   const t=ctx.currentTime;
   [220,185,165,138.6,110].forEach((f,i)=>{const g=gain(.22);decay(g,.22,t+i*.35,.8);osc('sine',f,g,i*.35,.8);});
  },
  portal(){
   const t=ctx.currentTime,g=gain(.2);g.gain.setValueAtTime(.01,t);g.gain.linearRampToValueAtTime(.2,t+.15);g.gain.exponentialRampToValueAtTime(.001,t+.7);
   sweep('sine',200,800,t,.7,null,g);
   osc('triangle',400,gain(.1,.6),.1,.5);osc('sine',600,gain(.08,.5),.2,.4);
  },
  summon(){
   const t=ctx.currentTime;
   [55,69.3,82.4].forEach((f,i)=>{
    const g=gain(.15);decay(g,.15,t+i*.05,.6);osc('sawtooth',f,g,i*.05,.6);
    osc('sine',f*2,gain(.08,.5),i*.05,.5);
   });
   const g2=gain(.1);decay(g2,.1,t+.3,.6);osc('sine',440,g2,.3,.6);
  },
  pickupHp(){
   const t=ctx.currentTime;
   [330,440,523.3].forEach((f,i)=>{const g=gain(.14);decay(g,.14,t+i*.07,.25);osc('sine',f,g,i*.07,.25);});
  },
  pickupMp(){
   const t=ctx.currentTime;
   [440,554,659,880].forEach((f,i)=>{const g=gain(.12);decay(g,.12,t+i*.06,.2);osc('triangle',f,g,i*.06,.2);});
  }
 };

 // ── Música ──────────────────────────────────────────────
 function makeBus(){
  const g=ctx.createGain();g.gain.value=0;
  const rev=ctx.createConvolver(),len=Math.floor(ctx.sampleRate*2.2),rb=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let ch=0;ch<2;ch++){const d=rb.getChannelData(ch);for(let j=0;j<len;j++)d[j]=(Math.random()*2-1)*Math.pow(1-j/len,2.6);}
  rev.buffer=rb;
  const rg=ctx.createGain();rg.gain.value=.45;const dry=ctx.createGain();dry.gain.value=.8;
  const inp=ctx.createGain();inp.connect(dry);inp.connect(rev);rev.connect(rg);dry.connect(g);rg.connect(g);g.connect(master);
  return {g,inp,nodes:[g,inp,rev,rg,dry]};
 }
 function note(b,type,f,t,dur,vol,cut,att,rel){
  const o=ctx.createOscillator(),o2=type==='saw'?ctx.createOscillator():null,e=ctx.createGain(),lp=ctx.createBiquadFilter();
  o.type=type==='saw'?'sawtooth':type==='tri'||type==='pluck'?'triangle':type;o.frequency.value=f;
  lp.type='lowpass';lp.frequency.value=cut||1200;
  if(type==='pluck'){lp.frequency.setValueAtTime((cut||1200)*2.5,t);lp.frequency.exponentialRampToValueAtTime(Math.max(200,(cut||1200)*.5),t+dur);}
  att=att||.01;rel=rel||.15;
  e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(vol,t+att);e.gain.setTargetAtTime(0,t+Math.max(att,dur-rel),rel/3);
  o.connect(lp);if(o2){o2.type='sawtooth';o2.frequency.value=f*1.006;o2.connect(lp);o2.start(t);o2.stop(t+dur+rel);}
  lp.connect(e);e.connect(b.inp);o.start(t);o.stop(t+dur+rel+.1);
 }
 function kick(b,t,v){const o=ctx.createOscillator(),e=ctx.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(40,t+.14);decay(e,v,t,.22);o.connect(e);e.connect(b.g);o.start(t);o.stop(t+.25);}
 function hat(b,t,v,hp,dur){const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),e=ctx.createGain();s.buffer=noiseBuf();f.type='highpass';f.frequency.value=hp;decay(e,v,t,dur);s.connect(f);f.connect(e);e.connect(b.inp);s.start(t);s.stop(t+dur+.02);}
 function schedule(){
  if(!theme||!bus)return;
  const th=theme,sp=60/th.bpm/4;
  while(next<ctx.currentTime+.35){
   const t=Math.max(next,ctx.currentTime),i=step,s16=i%16,bar=Math.floor(i/16),ch=th.prog[bar%th.prog.length],at=p=>p&&p[s16]==='x';
   if(s16===0&&th.pad){
    [0,2,4].forEach(k=>note(bus,'saw',midi(degree(th,ch+k,th.padO)),t,sp*16*1.02,.05,th.cut*.55,1.2,1.4));
    note(bus,'sine',midi(degree(th,ch,-1)),t,sp*16,.09,400,.8,1.2);
   }
   if(at(th.bass))note(bus,'saw',midi(degree(th,ch,-2)),t,sp*(th.bass.indexOf('xx')>=0?1.6:3.2),.12,320,.01,.2);
   if(th.arp&&at(th.arp.p)){const ar=[0,2,4,2,5,4,2,0],k=ar[(i>>1)%ar.length];note(bus,th.arp.pl||'tri',midi(degree(th,ch+k,th.arp.o)),t,sp*1.8,th.arp.v,th.cut*1.8,.005,.25);}
   if(th.lead&&s16%4===0&&Math.random()<th.lead.p){const k=[0,2,4,1,3,5,6][Math.floor(Math.random()*7)];note(bus,th.lead.pl||'sine',midi(degree(th,ch+k,th.lead.o)),t,sp*(3+Math.floor(Math.random()*5)),th.lead.v,th.cut*2.2,.04,.5);}
   if(th.drip&&s16%2===0&&Math.random()<th.drip)note(bus,'sine',midi(degree(th,[0,2,4,7][Math.floor(Math.random()*4)],2)),t,.5,.035,3000,.003,.4);
   if(th.heart&&(s16===0||s16===3))kick(bus,t,s16===0?.5:.3);
   if(th.kick&&at(th.kick))kick(bus,t,.55);
   if(th.snare&&at(th.snare))hat(bus,t,.22,1500,.14);
   if(th.hat&&at(th.hat))hat(bus,t,.07,7000,.05);
   if(th.stab&&s16===0&&bar%2===1)[0,2,4].forEach(k=>note(bus,'saw',midi(degree(th,ch+k,1)),t,sp*3,.05,2400,.005,.3));
   step++;next+=sp;
  }
 }
 function applyMusic(){if(bus)bus.g.gain.setTargetAtTime(musicLevel(),ctx.currentTime,.15);}
 // Troca de trilha com fade: a anterior some em 1,6 s e a nova entra em 2 s.
 function startTheme(id){
  const old=bus;
  if(old){old.g.gain.cancelScheduledValues(ctx.currentTime);old.g.gain.setValueAtTime(old.g.gain.value,ctx.currentTime);old.g.gain.linearRampToValueAtTime(0,ctx.currentTime+1.6);setTimeout(()=>{try{old.source?.stop();}catch{}try{old.nodes.forEach(n=>n.disconnect());}catch{}},2200);}
  theme=null;bus=null;
  if(tracks[id]){playTrack(id);return;}
  theme=THEMES[id]||null;if(!theme)return;
  procedural();
 }
 function procedural(){
  bus=makeBus();step=0;next=ctx.currentTime+.1;
  bus.g.gain.setValueAtTime(0,ctx.currentTime);bus.g.gain.linearRampToValueAtTime(musicLevel(),ctx.currentTime+2);
 }
 // Trilha de arquivo: o fade começa já, o som entra quando a decodificação (única por trilha) termina.
 function playTrack(id){
  const mine=bus=(()=>{const g=ctx.createGain();g.gain.value=0;g.connect(master);return {g,nodes:[g],source:null};})();
  mine.g.gain.setValueAtTime(0,ctx.currentTime);mine.g.gain.linearRampToValueAtTime(musicLevel(),ctx.currentTime+2);
  const buffer=decoded[id]||(decoded[id]=Promise.resolve().then(()=>tracks[id]()).then(bytes=>ctx.decodeAudioData(bytes)));
  buffer.then(data=>{
   if(disposed||bus!==mine)return;
   const source=ctx.createBufferSource();source.buffer=data;source.loop=true;source.connect(mine.g);source.start();mine.source=source;mine.nodes.push(source);
  }).catch(error=>{
   console.warn('Trilha indisponível, usando a procedural:',id,error?.message||error);
   if(disposed||bus!==mine)return;
   try{mine.nodes.forEach(n=>n.disconnect());}catch{}
   theme=THEMES[id]||null;bus=null;if(theme)procedural();
  });
 }
 function tick(){
  if(!ctx||ctx.state!=='running'||disposed)return;
  if(prefs.muted||prefs.music<=0){next=Math.max(next,ctx.currentTime);return;}
  schedule();
 }

 // ── Interface ───────────────────────────────────────────
 // O navegador só libera o áudio após um gesto do jogador; chamar de novo é seguro.
 function unlock(){
  if(disposed||broken)return false;
  try{
   if(!ctx){
    ctx=createContext();master=ctx.createGain();master.gain.value=masterLevel();master.connect(ctx.destination);
    timer=setInterval(tick,90);timer.unref?.();
    if(current!==null)startTheme(current);
   }
   if(ctx.state==='suspended')ctx.resume();
   return true;
  }catch(error){broken=true;console.warn('Áudio indisponível:',error.message||error);return false;}
 }
 function play(name){
  if(prefs.muted||!SFX[name]||!unlock())return false;
  const t=now();if(t-(lastPlayed[name]||-Infinity)<THROTTLE_MS)return false;lastPlayed[name]=t;
  try{SFX[name]();counts[name]=(counts[name]||0)+1;return true;}catch(error){console.warn('Som falhou:',name,error.message||error);return false;}
 }
 // null mantém a trilha atual; um id desconhecido silencia a música.
 function setMusic(id){
  if(id===null||id===undefined||id===current)return;
  current=id;if(ctx)startTheme(id);
 }
 function setDuck(value){if(value===duck)return;duck=value;if(ctx)applyMusic();}
 function setVolume(v){prefs.volume=clamp01(v);if(master)master.gain.value=masterLevel();save();}
 function setMusicVolume(v){prefs.music=clamp01(v);applyMusic();save();}
 function setMuted(value){
  prefs.muted=!!value;if(master)master.gain.value=masterLevel();
  if(ctx&&!prefs.muted)next=Math.max(next,ctx.currentTime);
  save();return prefs.muted;
 }
 // Aba em segundo plano não deve soar nem acumular notas agendadas.
 function suspend(hidden){if(!ctx)return;try{if(hidden)ctx.suspend();else if(!prefs.muted)ctx.resume();}catch{}}
 function dispose(){disposed=true;clearInterval(timer);try{ctx?.close();}catch{}}
 return {play,unlock,setMusic,setDuck,setVolume,setMusicVolume,setMuted,toggleMute:()=>setMuted(!prefs.muted),suspend,dispose,
  get volume(){return prefs.volume;},get music(){return prefs.music;},get muted(){return prefs.muted;},get theme(){return current;},get ready(){return !!ctx&&!broken;},counts,tick};
}
