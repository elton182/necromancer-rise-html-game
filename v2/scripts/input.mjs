import {sampleGamepad} from './gamepad.mjs';
export function createInput(canvas,{aim,cast,beginCast,releaseCast,cancelCast,dash,slot,releaseSlot,revive,order,pause,zoom,blur,inventory,consumable,interact,help,barrier,map,stance}){
 const keys=new Set(),bindings=[];let mouseFire=false;
 const on=(target,type,fn,options)=>{target.addEventListener(type,fn,options);bindings.push(()=>target.removeEventListener(type,fn,options));};
 const editable=target=>target instanceof Element&&!!target.closest('input,select,textarea,button,[contenteditable]');
 on(window,'keydown',e=>{if(e.target instanceof Element&&e.target.closest('input,textarea,[contenteditable]'))return;if(e.code==='Escape'){if(!e.repeat&&pause()===true)e.preventDefault();return;}if(/^F[1-5]$/.test(e.code)){const used=!e.repeat&&consumable?.(Number(e.code[1])-1);if(used||e.repeat)e.preventDefault();return;}if(e.code==='KeyH'){if(!e.repeat)help?.();return;}if(editable(e.target))return;if(e.code==='KeyM'){if(!e.repeat)map?.();return;}if(e.code==='Space'){e.preventDefault();if(!e.repeat)barrier?.();return;}if(e.code==='KeyG'){if(!e.repeat)interact?.();return;}if(e.code==='KeyI'){if(!e.repeat)inventory?.();return;}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);const slots={Digit1:0,Digit2:1,Digit3:2,Digit4:3,Digit5:4,Digit6:5,KeyQ:2,KeyE:3,KeyR:4,KeyT:5};if(!e.repeat&&e.code in slots){if(slot)slot(slots[e.code]);else if(e.code==='Digit1')cast();}if(e.code==='KeyV'&&!e.repeat)revive?.();if(e.code==='KeyF'&&!e.repeat)stance?.();if(e.code==='KeyC'&&!e.repeat)dash?.({x:Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),y:Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))});});
 on(window,'keyup',e=>{keys.delete(e.code);const pairs=[['Digit1'],['Digit2'],['Digit3','KeyQ'],['Digit4','KeyE'],['Digit5','KeyR'],['Digit6','KeyT']];pairs.forEach((codes,i)=>{if(codes.includes(e.code)&&!codes.some(c=>keys.has(c)))releaseSlot?.(i);});});
 on(window,'blur',()=>{keys.clear();mouseFire=false;cancelCast?.();blur();});
 on(document,'visibilitychange',()=>{if(document.hidden){keys.clear();mouseFire=false;cancelCast?.();blur();}});
 on(canvas,'pointerup',e=>{if(e.button===0)releaseSlot?.(0);if(e.button===2)releaseSlot?.(1);});
 on(canvas,'pointermove',e=>aim(e.clientX,e.clientY));
 on(canvas,'pointerdown',e=>{canvas.focus({preventScroll:true});aim(e.clientX,e.clientY);if(e.button===0){mouseFire=true;canvas.setPointerCapture?.(e.pointerId);if(!beginCast?.())cast();}else if(e.button===2){if(e.shiftKey)order?.();else slot?.(1);}});
 on(canvas,'pointerup',e=>{if(e.button===0){mouseFire=false;aim(e.clientX,e.clientY);releaseCast?.();}});
 on(canvas,'pointercancel',()=>{mouseFire=false;cancelCast?.();});
 on(canvas,'contextmenu',e=>e.preventDefault());
 on(canvas,'wheel',e=>{e.preventDefault();zoom(e.deltaY);},{passive:false});
 let previous={confirm:false,pause:false,dash:false,revive:false,order:false},blockPad=false;
 return {read:()=>{
  let pads=[];try{pads=navigator.getGamepads?.()||[];}catch{}const pad=sampleGamepad(Array.from(pads).find(p=>p&&p.connected!==false));
  const neutral=!pad.fire&&!pad.confirm&&!pad.pause&&!pad.dash&&!pad.revive&&!pad.order&&!pad.move.x&&!pad.move.y&&!pad.aim.x&&!pad.aim.y;if(blockPad&&neutral)blockPad=false;
  const confirm=pad.confirm&&!previous.confirm,pause=pad.pause&&!previous.pause,dashPressed=pad.dash&&!previous.dash,revivePressed=pad.revive&&!previous.revive,orderPressed=pad.order&&!previous.order;previous=pad;
  const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),y=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
  return {x:x||(!blockPad?pad.move.x:0),y:y||(!blockPad?pad.move.y:0),aim:!blockPad?pad.aim:null,fire:!blockPad&&pad.fire,hold:mouseFire||keys.has('Digit1'),confirm:!blockPad&&confirm,pause:!blockPad&&pause,dash:!blockPad&&dashPressed,revive:!blockPad&&revivePressed,order:!blockPad&&orderPressed};
 },clear:()=>{keys.clear();mouseFire=false;cancelCast?.();blockPad=true;},dispose:()=>{keys.clear();bindings.forEach(off=>off());}};
}
