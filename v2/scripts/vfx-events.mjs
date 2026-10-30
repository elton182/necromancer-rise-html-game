// Eventos visuais: a simulação só registra o que aconteceu (posição, cor, duração); o desenho fica em vfx.mjs.
// Nada aqui altera dano, alcance, recarga ou colisão. Os eventos entram em `w.effects` como efeitos `visual`,
// que o laço do mundo já expira sozinho, e o renderizador reconhece pelo campo `fx`.
export const MAX_ONE_SHOT=80;

// Registra um efeito de uma só vez. Em lutas muito cheias descarta os excedentes em vez de crescer sem limite.
export function fx(w,name,props={}){
 if(!w?.effects)return null;
 let live=0;for(const e of w.effects)if(e.oneShot)live++;
 if(live>=MAX_ONE_SHOT)return null;
 const e={id:w.nextId++,kind:name,fx:name,oneShot:true,visual:true,ground:true,time:0,duration:.5,...props};
 w.effects.push(e);return e;
}

// Cor e peso do impacto por origem. Física = faíscas quentes; magia = roxo; fogo = laranja.
const STYLES={
 fallenKing:{color:'#ff8a3d',size:1.7,mood:'fire'},
 warrior:{color:'#ffd9a0',size:1,mood:'blade'},
 enemyArcher:{color:'#f2e2a0',size:.8,mood:'pierce'},
 brute:{color:'#ff9a5a',size:1.35,mood:'heavy'},
 livingMage:{color:'#d08cff',size:1,mood:'magic'},
 cryptHound:{color:'#ff6a6a',size:.9,mood:'claw'},
 warAcolyte:{color:'#b58cff',size:.9,mood:'magic'},
 enemyThief:{color:'#e6e6e6',size:.8,mood:'blade'},
 enemyGriffin:{color:'#9fe8ff',size:.9,mood:'claw'},
 enemySpider:{color:'#8ee86a',size:.8,mood:'claw'},
 enemyRogue:{color:'#e6c9a0',size:.8,mood:'pierce'},
 enemyOrc:{color:'#ff9a5a',size:1.25,mood:'heavy'},
};
const FALLBACK={color:'#ffd9a0',size:1,mood:'blade'};
export const impactStyle=source=>STYLES[source?.model]||FALLBACK;

// Faíscas no corpo atingido. Só para golpes de inimigos em quem de fato perdeu vida.
export function hitFx(w,target,source,style=impactStyle(source)){
 if(!target||!source)return null;
 const dx=target.x-source.x,dy=target.y-source.y,d=Math.hypot(dx,dy)||1;
 return fx(w,'impact',{x:target.x,y:target.y,dx:dx/d,dy:dy/d,color:style.color,size:style.size,mood:style.mood,duration:.35});
}

// Rastro curvo do golpe corpo a corpo, na direção do alvo.
export function slashFx(w,source,target,{range,arc=Math.PI*.8,height=.85,sparks,duration=.3}={}){
 const dx=target.x-source.x,dy=target.y-source.y,d=Math.hypot(dx,dy)||1,style=impactStyle(source);
 return fx(w,'slash',{x:source.x,y:source.y,dx:dx/d,dy:dy/d,radius:range??Math.min(2.4,1.1+.5*(source.type?.sc??1)),arc,h:height,color:style.color,mood:style.mood,sparks,duration});
}
