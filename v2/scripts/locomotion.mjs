// Passada do jogador, que mira no cursor enquanto anda: mistura walk e strafe_* conforme o deslocamento em relação à mira. Só visual: não altera velocidade nem colisão.
const REVERSE_ON=-.2,REVERSE_OFF=-.05,BLEND_TIME=.07;
// O modelo olha para (sen a, cos a) e tem a esquerda em (cos a, -sen a). Andar de ré toca o ciclo ao contrário; nele, strafe_right invertido é o passo para a esquerda.
export function gaitTarget(stepX,stepY,angle,reverse=false){
 const length=Math.hypot(stepX,stepY);if(length<1e-9)return{walk:1,left:0,right:0,reverse};
 const forward=(stepX*Math.sin(angle)+stepY*Math.cos(angle))/length,side=(stepX*Math.cos(angle)-stepY*Math.sin(angle))/length;
 // Histerese: mirar perto da perpendicular não pode alternar o sentido do ciclo a cada quadro.
 const back=reverse?forward<REVERSE_OFF:forward<REVERSE_ON,lateral=side*side,toLeft=back?side<0:side>0;
 return{walk:forward*forward,left:toLeft?lateral:0,right:toLeft?0:lateral,reverse:back};
}
export function blendGait(current,target,dt){
 const k=dt>0?1-Math.exp(-dt/BLEND_TIME):0;
 return{walk:current.walk+(target.walk-current.walk)*k,left:current.left+(target.left-current.left)*k,right:current.right+(target.right-current.right)*k,reverse:target.reverse};
}
// Esquiva: o personagem olha para onde vai e, ao terminar, volta para a mira. A regra troca o ângulo de uma vez; aqui o corpo vira em um instante curto, em vez de estalar.
const DODGE_TURN_TIME=.09;
export function dodgeYaw(state,angle,dodging,dt){
 if(dodging!==!!state.dodging){state.dodging=dodging;state.turnFrom=state.yaw??angle;state.turnLeft=DODGE_TURN_TIME;}
 state.turnLeft=Math.max(0,(state.turnLeft||0)-dt);
 if(state.turnLeft<=0)return state.yaw=angle;
 const u=1-state.turnLeft/DODGE_TURN_TIME,delta=Math.atan2(Math.sin(angle-state.turnFrom),Math.cos(angle-state.turnFrom));
 return state.yaw=state.turnFrom+delta*u*u*(3-2*u);
}
// Passadas têm comprimentos diferentes; a fase acumula o avanço para não saltar quando a mistura muda.
export function advanceGaitPhase(phase,distance,gait,stride,strafeStride=stride){
 const cycles=distance*(gait.walk/stride+(gait.left+gait.right)/strafeStride);
 return((phase+(gait.reverse?-cycles:cycles))%1+1)%1;
}
