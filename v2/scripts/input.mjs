import {sampleGamepad} from './gamepad.mjs';
export function createInput(canvas,{aim,cast,pause,zoom,blur}){
 const keys=new Set(),bindings=[];
 const on=(target,type,fn,options)=>{target.addEventListener(type,fn,options);bindings.push(()=>target.removeEventListener(type,fn,options));};
 const editable=target=>target instanceof Element&&!!target.closest('input,select,textarea,button,[contenteditable]');
 on(window,'keydown',e=>{if(e.code==='Escape'){if(!e.repeat)pause();return;}if(editable(e.target))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Space'&&!e.repeat)cast();});
 on(window,'keyup',e=>keys.delete(e.code));
 on(window,'blur',()=>{keys.clear();blur();});
 on(document,'visibilitychange',()=>{if(document.hidden){keys.clear();blur();}});
 on(canvas,'pointermove',e=>aim(e.clientX,e.clientY));
 on(canvas,'pointerdown',e=>{canvas.focus({preventScroll:true});if(e.button===0){aim(e.clientX,e.clientY);cast();}});
 on(canvas,'wheel',e=>{e.preventDefault();zoom(e.deltaY);},{passive:false});
 let previous={confirm:false,pause:false},blockPad=false;
 return {read:()=>{
  let pads=[];try{pads=navigator.getGamepads?.()||[];}catch{}const pad=sampleGamepad(Array.from(pads).find(p=>p&&p.connected!==false));
  const neutral=!pad.fire&&!pad.confirm&&!pad.pause&&!pad.move.x&&!pad.move.y&&!pad.aim.x&&!pad.aim.y;if(blockPad&&neutral)blockPad=false;
  const confirm=pad.confirm&&!previous.confirm,pause=pad.pause&&!previous.pause;previous=pad;
  const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),y=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
  return {x:x||(!blockPad?pad.move.x:0),y:y||(!blockPad?pad.move.y:0),aim:!blockPad?pad.aim:null,fire:!blockPad&&pad.fire,confirm:!blockPad&&confirm,pause:!blockPad&&pause};
 },clear:()=>{keys.clear();blockPad=true;},dispose:()=>{keys.clear();bindings.forEach(off=>off());}};
}
