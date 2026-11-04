// Armazenamento da biblioteca de mapas em arquivos, com a mesma interface de `localStorage`: leitura e escrita síncronas,
// gravação em segundo plano. Cada mapa alterado vai ao servidor uma vez; falhas ficam na fila e são tentadas de novo.
const RETRY=3000;
export function createDiskStore(initial,{request,onState=()=>{},setTimer=setTimeout}={}){
 let maps=new Map(initial.map(m=>[m.id,m])),text=new Map(initial.map(m=>[m.id,JSON.stringify(m)])),busy=false,retry=null,lastError=null;
 const queue=new Map(),waiters=[];
 const state=()=>({pending:queue.size,error:lastError});
 const answer=result=>{for(const done of waiters.splice(0))done(result);};
 // `busy` muda no mesmo passo em que a fila é conferida: uma edição nova nunca encontra o laço de saída.
 async function run(){
  while(queue.size){
   const [id,doc]=queue.entries().next().value;
   try{
    await request(doc?'PUT':'DELETE','/api/maps/'+encodeURIComponent(id),doc);
    if(queue.get(id)===doc)queue.delete(id);lastError=null;onState(state());
   }catch(error){
    busy=false;lastError=error.message||String(error);onState(state());answer({ok:false,message:lastError});
    retry??=setTimer(()=>{retry=null;start();},RETRY);return;
   }
  }
  busy=false;answer({ok:true,message:null});
 }
 function start(){if(!busy){busy=true;run();}}
 return {
  getItem:()=>JSON.stringify({version:1,maps:[...maps.values()]}),
  setItem(key,body){
   const next=new Map(JSON.parse(body).maps.map(m=>[m.id,m])),nextText=new Map();
   for(const [id,m] of next){const json=JSON.stringify(m);nextText.set(id,json);if(text.get(id)!==json)queue.set(id,m);}
   for(const id of maps.keys())if(!next.has(id))queue.set(id,null);
   maps=next;text=nextText;onState(state());start();
  },
  // Resolve quando tudo o que estava na fila chegou ao disco, ou na primeira falha.
  flush(){
   if(!queue.size&&!busy)return Promise.resolve({ok:!lastError,message:lastError});
   return new Promise(done=>{waiters.push(done);start();});
  },
  pending:()=>queue.size>0
 };
}
