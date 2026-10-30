// Táticas de posicionamento dos inimigos da v2. Só decide ONDE o inimigo quer estar; ataque, dano, alcance e recarga
// continuam em enemies.mjs. Sem DOM nem Three.js. Unidades de mundo, tempos em segundos, ângulos em radianos
// (aqui `atan2(dy, dx)` no plano do chão, não o `angle` de direção usado pelos modelos).
//
// Papéis:
//  • front  — Guerreiro, Bruto, Orc: avançam pela frente, em leque, e esperam a vez numa roda ao redor do alvo.
//  • flank  — Cão, Ladrão, Aranha: contornam o alvo em arco e só avançam quando chegam pelas costas.
//  • ranged — Arqueiro, Mago, Harpia (penas), Ladino Arqueiro: ficam à distância, espalhados em leque, recuam se pressionados e
//             trocam de lado entre os disparos.
export const ROLES={0:'front',2:'front',10:'front',4:'flank',6:'flank',8:'flank',1:'ranged',3:'ranged',7:'ranged',9:'ranged',5:'ranged'};
export const TUNING={
 meleeSlots:{player:3,other:2},   // atacantes pela frente ao mesmo tempo por alvo; os demais esperam na roda
 waitRing:2,                       // a roda de espera fica a `alcance + waitRing` do alvo
 waitSpeed:.5,                     // fração da velocidade enquanto contorna a roda
 waitLimit:6,                      // depois disso o inimigo que espera entra mesmo sem vaga
 flankRadius:4.5,                  // raio do arco do flanqueador
 flankCommit:2.3,                  // ~130°: ângulo em relação ao eixo da frente em que o flanqueador investe
 flankLead:.5,                     // quanto o ponto de contorno anda à frente do flanqueador
 flankClose:1.2,                   // já a `alcance + flankClose` do alvo, investe sem contornar
 flankLimit:5,                     // tempo máximo de contorno em órbita (a aproximação não conta)
 holdRatio:.85,                    // distância preferida do atirador, como fração do alcance
 minRatio:.5,                      // abaixo disso o atirador recua
 slotSpacing:.8,                   // abertura angular entre atiradores do leque
 slotTolerance:.3,                 // desvio angular do lugar no leque que ainda é aceito
 strafeSpeed:.45,strafeTime:[1.2,2],
 separation:1.1,separationPush:1.3 // vizinhos mais perto que isso empurram o ponto de destino para os lados
};
const TAU=Math.PI*2,wrap=a=>{a=(a+Math.PI)%TAU;if(a<0)a+=TAU;return a-Math.PI;};
const polar=(c,a,r)=>({x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r});
// Ponto de órbita à frente de quem contorna: fica na tangente do círculo atual, para o raio não encolher a cada passo.
const orbit=(c,a,side,lead,r)=>polar(c,a+side*lead,r/Math.cos(lead));
export const roleOf=typeIndex=>ROLES[typeIndex]||'front';
const angleOf=(from,to)=>Math.atan2(to.y-from.y,to.x-from.x);
// Estado persistido no próprio inimigo (`e.tac`); nunca vai para o save. Recomeça quando o alvo muda.
function state(e,t){
 if(!e.tac||e.tac.target!==t.id)e.tac={target:t.id,mode:'approach',side:e.id%2?1:-1,circle:0,wait:0,token:false,strafe:0};
 return e.tac;
}
// Empurra o destino para longe de companheiros muito próximos, para que não se empilhem.
function spread(e,goal,mates){
 let x=0,y=0;
 for(const m of mates){if(m===e)continue;const dx=e.x-m.x,dy=e.y-m.y,d=Math.hypot(dx,dy);if(d<TUNING.separation&&d>1e-6){const k=(TUNING.separation-d)/d;x+=dx*k;y+=dy*k;}}
 return {x:goal.x+x*TUNING.separationPush,y:goal.y+y*TUNING.separationPush};
}
// Eixo da frente: de onde vem a linha de ataque, visto do alvo. Quem já tem vaga na frente o define (quem espera gira e
// o faria tremer); sem eles, toda a linha de frente; sem ela, todos.
export function frontAxis(t,mates,fallback){
 const fronts=mates.filter(m=>roleOf(m.typeIndex)==='front'),held=fronts.filter(m=>m.tac&&m.tac.token),pool=held.length?held:fronts.length?fronts:mates;if(!pool.length)return fallback;
 const c={x:pool.reduce((s,m)=>s+m.x,0)/pool.length,y:pool.reduce((s,m)=>s+m.y,0)/pool.length};
 return Math.hypot(c.x-t.x,c.y-t.y)<.8?fallback:angleOf(t,c);
}
/**
 * Decide o destino do inimigo neste quadro.
 * @param e       inimigo (usa x, y, id, typeIndex, tac)
 * @param t       alvo atual
 * @param mates   inimigos vivos e acordados perto do alvo (inclui `e`)
 * @param ctx     {range: alcance de ataque, shoot: alcance de tiro (atiradores), ready: ataque pronto,
 *                 lineOk: linha livre até o alvo, dt}
 * @returns {{goal:{x,y}|null, speed:number, mode:string}} `goal` nulo = ficar parado.
 */
export function plan(e,t,mates,{range,shoot=0,ready=false,lineOk=true,dt=0}){
 const tac=state(e,t),d=Math.hypot(e.x-t.x,e.y-t.y)||1e-6,alpha=angleOf(t,e),fa=frontAxis(t,mates,alpha),role=roleOf(e.typeIndex);
 if(role==='flank')return flank(e,t,mates,tac,{d,alpha,fa,range,dt});
 if(role==='ranged')return ranged(e,t,mates,tac,{d,alpha,fa,shoot,ready,lineOk,dt});
 return front(e,t,mates,tac,{d,alpha,range,dt});
}
function front(e,t,mates,tac,{d,alpha,range,dt}){
 const melee=mates.filter(m=>roleOf(m.typeIndex)==='front'),slots=t.team==='player'?TUNING.meleeSlots.player:TUNING.meleeSlots.other;
 // Vaga por proximidade, com folga para quem já tem a vaga não trocar de lugar a cada quadro.
 const rank=melee.map(m=>({m,s:Math.hypot(m.x-t.x,m.y-t.y)-(m.tac&&m.tac.token?1.2:0)})).sort((a,b)=>a.s-b.s||a.m.id-b.m.id).slice(0,slots);
 tac.token=rank.some(r=>r.m===e)||tac.wait>=TUNING.waitLimit;
 if(tac.token||d<=range+.6){tac.wait=0;tac.mode='engage';return {goal:spread(e,t,melee),speed:1,mode:'engage'};}
 tac.wait+=dt;const ring=range+TUNING.waitRing;
 if(d>ring+.6){tac.mode='approach';return {goal:spread(e,polar(t,alpha,ring),melee),speed:1,mode:'approach'};}
 tac.mode='wait';return {goal:spread(e,orbit(t,alpha,tac.side,.5,ring),melee),speed:TUNING.waitSpeed,mode:'wait'};
}
function flank(e,t,mates,tac,{d,alpha,fa,range,dt}){
 const off=wrap(alpha-fa);
 if(tac.mode==='commit'&&d>range+8){tac.mode='approach';tac.circle=0;}
 if(tac.mode!=='commit'){
  if(tac.mode!=='circle'){tac.mode='circle';tac.side=Math.abs(off)>.2?Math.sign(off):e.id%2?1:-1;}
  if(d<=TUNING.flankRadius+1.5)tac.circle+=dt;
  if(Math.abs(off)>=TUNING.flankCommit||d<=range+TUNING.flankClose||tac.circle>=TUNING.flankLimit)tac.mode='commit';
 }
 if(tac.mode==='commit')return {goal:spread(e,t,mates.filter(m=>roleOf(m.typeIndex)==='flank')),speed:1,mode:'commit'};
 // Espiral para dentro: o ponto de contorno anda à frente na órbita e o raio diminui até o arco.
 const r=Math.max(TUNING.flankRadius,d-3);
 return {goal:orbit(t,alpha,tac.side,TUNING.flankLead,r),speed:1,mode:'circle'};
}
function ranged(e,t,mates,tac,{d,alpha,fa,shoot,ready,lineOk,dt}){
 const archers=mates.filter(m=>roleOf(m.typeIndex)==='ranged').sort((a,b)=>a.id-b.id),n=archers.length||1,k=Math.max(0,archers.indexOf(e));
 const hold=shoot*TUNING.holdRatio,min=Math.max(3,shoot*TUNING.minRatio);
 const slotAngle=fa+(k-(n-1)/2)*TUNING.slotSpacing+(n===1&&mates.some(m=>roleOf(m.typeIndex)==='front')?tac.side*.5:0),slot=spread(e,polar(t,slotAngle,hold),archers);
 if(d>shoot||!lineOk){tac.mode='advance';return {goal:slot,speed:1,mode:'advance'};}
 if(d<min){tac.mode='retreat';return {goal:{x:e.x+(e.x-t.x)/d*3,y:e.y+(e.y-t.y)/d*3},speed:.9,mode:'retreat'};}
 // Fora da posição do leque ou da distância preferida: reacomoda sem parar de atirar.
 if(Math.abs(d-hold)>1.5||Math.abs(wrap(alpha-slotAngle))>TUNING.slotTolerance){tac.mode='reposition';return {goal:slot,speed:.65,mode:'reposition'};}
 if(ready){tac.mode='hold';return {goal:null,speed:0,mode:'hold'};}
 // Entre disparos, passos laterais em torno do alvo. O lado inverte de tempos em tempos (e ao encostar em obstáculo);
 // ao passar de uma folga, o próximo passo volta para ele.
 tac.strafe-=dt;const drift=wrap(slotAngle-alpha);if(Math.abs(drift)>TUNING.slotTolerance*.6)tac.side=Math.sign(drift);else if(tac.strafe<=0){tac.side=-tac.side;tac.strafe=TUNING.strafeTime[0]+(e.id*.37%1)*(TUNING.strafeTime[1]-TUNING.strafeTime[0]);}
 tac.mode='strafe';return {goal:spread(e,orbit(t,alpha,tac.side,.35,d+(hold-d)*.3),archers),speed:TUNING.strafeSpeed,mode:'strafe'};
}
