// Ferramenta visual opcional; escolha transitória, sem alterar equipamento ou save.
if(new URLSearchParams(location.search).get('playerModel')!=='necromancer_1'){
  const weapons={none:null,original:'playerStaff'};
  const test=window.RiggedPlayerTest={weapon:'original',setWeapon(id){
    if(!Object.prototype.hasOwnProperty.call(weapons,id))return false;
    this.weapon=id;if(this.select)this.select.value=id;return true;
  }};
  const previousSpriteDraw=spriteDraw;
  spriteDraw=function(sheet,col,row,dx,dy,size){
    previousSpriteDraw(sheet,col,row,dx,dy,size);
    const key=weapons[test.weapon];
    if(sheet===SPR.sheets.necro&&key&&SPR.ready(key))
      previousSpriteDraw(SPR.sheets[key],col,row,dx,dy,size);
  };
  if(new URLSearchParams(location.search).get('playerModel')==='purple_mage'){
  const panel=document.createElement('label');
  panel.style.cssText='position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:10000;background:#15151ee8;color:#eee;padding:8px 12px;border:1px solid #595366;border-radius:6px;font:14px system-ui;';
  panel.textContent='Arma do teste: ';
  for(const event of ['pointerdown','mousedown','mouseup','click','keydown','keyup'])
    panel.addEventListener(event,e=>e.stopPropagation());
  const select=document.createElement('select');select.setAttribute('aria-label','Arma do teste');
  for(const [value,label] of [['original','Cajado original'],['none','Sem cajado']]){
    const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);
  }
  select.addEventListener('change',()=>test.setWeapon(select.value));
  panel.append(select);document.body.append(panel);test.select=select;
  }
}
