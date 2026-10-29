// Gamepad padrão: sticks com deadzone radial; sem DOM ou estado global.
export function stick(x=0,y=0){
 x=Number.isFinite(x)?x:0;y=Number.isFinite(y)?y:0;const d=Math.hypot(x,y);if(d<=.18)return {x:0,y:0};const magnitude=Math.min(1,(d-.18)/.82);return {x:x/d*magnitude,y:y/d*magnitude};
}
export function sampleGamepad(pad){
 if(!pad||pad.connected===false)return {move:{x:0,y:0},aim:{x:0,y:0},fire:false,confirm:false,pause:false,dash:false,revive:false,order:false};
 const pressed=i=>!!pad.buttons?.[i]?.pressed||(pad.buttons?.[i]?.value||0)>.3;
 const move=stick(pad.axes?.[0],pad.axes?.[1]),aim=stick(pad.axes?.[2],pad.axes?.[3]);
 if(pressed(14)||pressed(15))move.x=Number(pressed(15))-Number(pressed(14));if(pressed(12)||pressed(13))move.y=Number(pressed(13))-Number(pressed(12));
 return {move,aim,fire:pressed(7),confirm:pressed(0),pause:pressed(9),dash:pressed(10),revive:pressed(8),order:pressed(6)};
}
