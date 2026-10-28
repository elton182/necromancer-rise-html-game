// Contrato persistido independente do mundo, DOM e armazenamento.
export const FORMAT='necromancer-rise-3d',VERSION=1;
export const SAVE_KEY='necromancer_rise_3d_save',BACKUP_KEY=SAVE_KEY+'_backup',LEGACY_KEY='necromancer_v2';
export const MAX_BYTES=5*1024*1024;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const copy=v=>JSON.parse(JSON.stringify(v));
function record(v,name){if(!object(v))throw Error(name+' inválido.');return v;}
function number(v,fallback,name,max=Number.MAX_SAFE_INTEGER){if(v===undefined)return fallback;if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max)throw Error(name+' inválido.');return v;}
export function validateLegacy(raw){
 record(raw,'Save antigo');
 if(!Number.isInteger(raw.level)||raw.level<1||raw.level>60||!Number.isFinite(raw.maxHp)||raw.maxHp<=0||!Array.isArray(raw.learnedSkills)||raw.learnedSkills.some(id=>typeof id!=='string'))throw Error('Este arquivo não parece um save válido do Necromancer.');
 return copy(raw);
}
export function normalizeSave(raw){
 record(raw,'Save');if(raw.format!==FORMAT)throw Error('Formato de save da v2 desconhecido.');if(raw.version!==VERSION)throw Error('Versão de save não suportada. O arquivo foi preservado.');
 const p=record(raw.character??{},'Personagem'),s=record(raw.settings??{},'Opções');
 const level=number(p.level,1,'Nível',60);if(!Number.isInteger(level)||level<1)throw Error('Nível inválido.');
 const horde=number(s.horde,6,'Horda',64);if(![6,16,32,64].includes(horde))throw Error('Horda inválida.');
 if(s.ground!==undefined&&!['dark','light'].includes(s.ground)||s.quality!==undefined&&!['high','low'].includes(s.quality))throw Error('Opções inválidas.');
 const result={...copy(raw),format:FORMAT,version:VERSION,savedAt:number(raw.savedAt,0,'Data'),character:{...copy(p),level,exp:number(p.exp,0,'Experiência'),gold:number(p.gold,0,'Ouro'),mode:p.mode??'free'},settings:{...copy(s),horde,ground:s.ground??'dark',quality:s.quality??'high'}};
 if(!['free','campaign'].includes(result.character.mode))throw Error('Modo de personagem inválido.');
 if(raw.legacy!==undefined){record(raw.legacy,'Arquivo antigo preservado');if(raw.legacy.key!==LEGACY_KEY)throw Error('Origem do arquivo antigo inválida.');result.legacy={...copy(raw.legacy),data:validateLegacy(raw.legacy.data)};}
 return result;
}
export function freshSave(){return normalizeSave({format:FORMAT,version:VERSION});}
export function importSave(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)throw Error('Arquivo de save muito grande (limite de 5 MB).');
 let raw;try{raw=JSON.parse(text);}catch{throw Error('Arquivo inválido: não é JSON.');}
 if(object(raw)&&Object.hasOwn(raw,'format'))return normalizeSave(raw);
 const data=validateLegacy(raw);
 return normalizeSave({format:FORMAT,version:VERSION,character:{level:data.level,exp:data.exp??0,gold:data.gold??0,mode:data.mode??'free'},legacy:{key:LEGACY_KEY,data}});
}
export function serializeSave(save){const text=JSON.stringify(normalizeSave(save),null,2);if(new TextEncoder().encode(text).length>MAX_BYTES)throw Error('Save excede o limite de 5 MB.');return text;}

// Storage injetável: o módulo pode ser testado sem usar armazenamento pessoal.
export function createSaveStore(storage){
 function load(){try{const raw=storage.getItem(SAVE_KEY);if(raw===null)return {status:'empty'};try{return {status:'ok',save:normalizeSave(JSON.parse(raw))};}catch(error){return {status:'invalid',message:'Save da v2 inválido e preservado. '+error.message};}}catch{return {status:'unavailable',message:'O navegador não permitiu acessar os saves. Use exportar para guardar um arquivo.'};}}
 function save(value,{backup=false}={}){try{
  const text=serializeSave(value),previous=storage.getItem(SAVE_KEY);
  if(previous!==null){if(!backup){try{normalizeSave(JSON.parse(previous));}catch{return {ok:false,message:'O save existente é inválido e foi preservado. Use a importação com prévia para substituí-lo; ela guarda uma cópia anterior.'};}}
   // Na importação, preservar inclusive o conteúdo inválido antes da substituição.
   if(backup)storage.setItem(BACKUP_KEY,previous);
  }
  storage.setItem(SAVE_KEY,text);return {ok:true};
 }catch(error){return {ok:false,message:'Não foi possível gravar o save. O save anterior foi preservado. '+(error.message||'')};}}
 function legacy(){try{const raw=storage.getItem(LEGACY_KEY);if(!raw)return {ok:false,message:'Nenhum save antigo acessível nesta página. Exporte o JSON no jogo anterior e importe o arquivo aqui.'};return {ok:true,save:importSave(raw)};}catch(error){return {ok:false,message:error.message};}}
 function backup(){try{return storage.getItem(BACKUP_KEY);}catch{return null;}}
 return {load,save,legacy,backup};
}
