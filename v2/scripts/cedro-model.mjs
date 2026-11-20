// Cerco do Ato I. Progresso persistido separado dos IDs históricos de João.
export const CEDRO_POINTS={
 exit:{x:-130,y:142,name:'Estrada de Jacarandá'},
 road:{x:-90,y:90,name:'Estrada das Carroças'},
 village:{x:0,y:5,name:'Povoado do Cedro'},
 captain:{x:10,y:-42,name:'Capitão dos reforços'},
 signal:{x:-86,y:-22,name:'Posto de sinalização'},
 supplies:{x:68,y:25,name:'Estoque incendiário'},
 prisoners:{x:-53,y:25,name:'Moradores capturados'},
 camp:{x:80,y:-72,name:'Acampamento da Colina'},
 boss:{x:80,y:-119,name:'Bento Ferraz'}
};
export const CEDRO_GROUPS=['cedro-road','cedro-captain','cedro-signal','cedro-supplies','cedro-prisoners','cedro-bento',
 ...Array.from({length:31},(_,i)=>'cedro-patrol-'+i),'cedro-shortcut','cedro-fuel'];
export const cedroStage=p=>['itavera','invitation','complete'].includes(p?.nilo)?'done':p?.nilo!=='done'?'locked':
 ['offered','active','return','done'].includes(p?.cedro)?p.cedro:'offered';
export const cedroWon=p=>p?.cleared?.includes('cedro-bento');
export const cedroAllowed=p=>['active','return','done'].includes(cedroStage(p));
export const CEDRO_REWARD={gold:450,xp:1400};
export const CEDRO_GATES=[
 {id:'cedro-main',x:80,y:-87,width:8,depth:1,height:4.4,requires:['cedro-road','cedro-captain']},
 {id:'cedro-side',x:42,y:-87,width:6,depth:1,height:4.4,requires:['cedro-shortcut']}
];
export function cedroObjectives(p){
 const done=id=>p?.cleared?.includes(id),base={questId:'cedro-siege',title:'Romper o Cerco'};
 if(cedroWon(p))return [{...base,text:'Bento caiu e o cerco foi rompido. Volte a Jacarandá e avise João.',target:CEDRO_POINTS.exit}];
 const target=!done('cedro-road')?CEDRO_POINTS.road:!done('cedro-captain')?CEDRO_POINTS.captain:CEDRO_POINTS.boss;
 return [{...base,target,text:!done('cedro-road')?'Estrada — Rompa o bloqueio e seus dois contra-ataques na Estrada das Carroças. João permanece protegido na vila.':!done('cedro-captain')?'Povoado — Atravesse o povoado ocupado e derrote as três levas do capitão dos reforços. Os desvios enfraquecem a defesa final.':'Acampamento — A passagem está aberta. Tome o acampamento e derrote Bento Ferraz e sua guarda. A entrada da colina é seu ponto de retomada.'},
 ...[['cedro-signal','Silenciar os sinais','Elimine os sentinelas para impedir os reforços da corneta.',CEDRO_POINTS.signal],
 ['cedro-fuel','Destruir o estoque','Tome o depósito e destrua o combustível (G) para impedir os ataques incendiários de Bento.',CEDRO_POINTS.supplies],
 ['cedro-shortcut','Libertar os moradores','Derrote os captores e liberte os moradores (G). Eles conhecem uma entrada lateral.',CEDRO_POINTS.prisoners]]
 .filter(([id])=>!done(id)).map(([,title,text,target])=>({title,text,target}))];
}
