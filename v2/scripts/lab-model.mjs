// Modelo puro do Laboratório: medidor de DPS do boneco de treino e catálogo de modelos para inspeção.
// Sem DOM, Three.js ou estado do mundo: o tempo vem sempre de quem chama (relógio da simulação, em segundos).
export const WINDOW=5,PEAK_WINDOW=1,IDLE_STOP=3,MAX_SAMPLES=4000;

export const createMeter=()=>({first:null,last:null,total:0,hits:0,by:{},samples:[],peak:0,test:null,done:false,saved:false});
// Zera o medidor mantendo a mesma referência (os ganchos do mundo guardam o objeto). `duration` arma um teste cronometrado.
export function resetMeter(m,duration=null){Object.assign(m,createMeter());if(duration>0)m.test={duration};return m;}

function finish(m){m.done=true;}
// Teste cronometrado: começa no primeiro golpe e termina `duration` segundos depois, tenha havido golpes ou não.
export function tick(m,now){if(m.test&&!m.done&&m.first!==null&&now-m.first>=m.test.duration)finish(m);return m.done;}
// Registra um golpe. Golpes depois do fim do teste são ignorados. `key` é o rótulo da origem (habilidade, grupo...).
export function record(m,time,amount,key='Outros'){
 if(!(amount>0)||!Number.isFinite(amount)||m.done)return false;
 if(m.first===null)m.first=time;
 if(m.test&&time-m.first>=m.test.duration){finish(m);return false;}
 m.last=time;m.total+=amount;m.hits++;
 const e=m.by[key]||(m.by[key]={total:0,hits:0});e.total+=amount;e.hits++;
 m.samples.push([time,amount]);if(m.samples.length>MAX_SAMPLES)m.samples.shift();
 let sum=0;for(let i=m.samples.length-1;i>=0&&time-m.samples[i][0]<=PEAK_WINDOW;i--)sum+=m.samples[i][1];
 m.peak=Math.max(m.peak,sum/PEAK_WINDOW);
 return true;
}
// Leitura para a tela. `average` divide o total pelo tempo de combate (mínimo de 1 s, para um golpe isolado não virar DPS enorme);
// `recent` é a média da janela de 5 s. Sem golpes por 3 s a medição congela no último golpe.
export function stats(m,now){
 const empty={dps:0,recent:0,average:0,peak:0,total:0,hits:0,elapsed:0,by:[],done:false,running:false,remaining:m.test?m.test.duration:null};
 if(m.first===null)return empty;
 tick(m,now);
 const running=!m.done&&now-m.last<IDLE_STOP,end=m.done?m.first+m.test.duration:running?now:m.last,elapsed=Math.max(0,end-m.first),span=Math.max(1,elapsed);
 let recent=0;for(let i=m.samples.length-1;i>=0&&end-m.samples[i][0]<=WINDOW;i--)if(m.samples[i][0]<=end)recent+=m.samples[i][1];
 const average=m.total/span;
 return {dps:average,average,recent:recent/Math.min(WINDOW,span),peak:m.peak,total:m.total,hits:m.hits,elapsed,done:m.done,running,
  remaining:m.test?Math.max(0,m.first+m.test.duration-now):null,
  by:Object.entries(m.by).map(([name,e])=>({name,total:e.total,hits:e.hits,share:e.total/m.total,dps:e.total/span})).sort((a,b)=>b.total-a.total)};
}

// Modelos que a tela de inspeção oferece, por grupo. Só entram os que existem no catálogo de GLBs carregado.
export const CATALOG=[
 ['Inimigos',[['warrior','Guerreiro'],['enemyArcher','Arqueiro'],['brute','Bruto'],['livingMage','Mago Vivo'],['cryptHound','Cão de Cripta'],['warAcolyte','Acólito de Guerra'],['enemyThief','Ladrão'],['enemyGriffin','Humanoide Grifo'],['enemySpider','Aranha'],['enemyRogue','Ladino Arqueiro'],['enemyOrc','Orc']]],
 ['Chefes',[['fallenKing','Rei Caído'],['lich','Lich']]],
 ['Lacaios',[['zombie','Zumbi'],['skeleton','Esqueleto'],['archer','Arqueiro Ósseo'],['specter','Espectro'],['abom','Abominação']]],
 ['Jogador',[['player','Zephyr']]],
 ['Moradores',[['npcBram','Bram'],['npcLysa','Lysa'],['npcTilda','Tilda'],['npcMerchant','Mercador']]],
];
export const catalog=available=>CATALOG.map(([group,items])=>({group,items:items.filter(([id])=>available.includes(id)).map(([id,label])=>({id,label}))})).filter(g=>g.items.length);
export const modelLabel=id=>CATALOG.flatMap(([,items])=>items).find(([key])=>key===id)?.[1]||id;
// Progresso 0..1 de um clipe: em laço volta ao início; sem laço fica no último quadro.
export const clipProgress=(time,duration,loop)=>duration>0?(loop?((time/duration)%1+1)%1:Math.max(0,Math.min(1,time/duration))):0;
export const TEST_DURATIONS=[0,10,30,60];
