'use strict';
// Servidor local do editor de mapas: só para desenvolvimento, sem dependências e acessível apenas nesta máquina.
// Entrega as fontes sem etapa de build, grava os mapas em v2/assets/maps/ e abre o jogo real com os mapas atuais.
// Uso (raiz do projeto): node v2/tools/map-editor-server.cjs [porta]
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFile}=require('node:child_process');
const repo=path.resolve(__dirname,'../..');
const ID=/^[a-z0-9][a-z0-9_-]{0,47}$/i,MAX_BODY=16e6,MAX_TESTS=8,DEFAULT_PORT=4177,BUILD_TIMEOUT=600000;
const DEFAULT_MAPS=path.join(repo,'v2/assets/maps'),DEFAULT_GAME=path.join(repo,'v2/necromancer-3d.html'),MAPS_BLOCK='<script id="campaign-maps" type="application/json">';
const MIME={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.glb':'model/gltf-binary'};
const PUBLIC=['v2/map-editor.html','v2/scripts/','v2/assets/models.json','blender/exports/','tools/3d-lab/vendor/'];
const isCampaign=id=>id.startsWith('campaign-');
const fileFor=(dir,id)=>path.join(...(isCampaign(id)?[dir,id+'.json']:[dir,'custom',id+'.json']));

// Uma peça ou grupo por linha: o Git mostra exatamente o que mudou no mapa.
function formatMap(doc){
 const entries=Object.entries(doc).map(([key,value])=>{
  const name=JSON.stringify(key);
  if(Array.isArray(value)&&value.length&&typeof value[0]==='object')return ' '+name+':[\n  '+value.map(v=>JSON.stringify(v)).join(',\n  ')+'\n ]';
  return ' '+name+':'+JSON.stringify(value);
 });
 return '{\n'+entries.join(',\n')+'\n}\n';
}
function readFolder(dir){
 let names=[];try{names=fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort();}catch(error){if(error.code!=='ENOENT')throw error;}
 const maps=[],problems=[];
 for(const name of names){try{maps.push(JSON.parse(fs.readFileSync(path.join(dir,name),'utf8')));}catch(error){problems.push(name+': '+error.message);}}
 return {maps,problems};
}
// Edições da campanha que vão para a distribuição: o build e o Testar leem daqui. Arquivo inválido interrompe, para não publicar menos do que está no disco.
function readCampaignBundle(dir){
 const {maps,problems}=readFolder(dir);if(problems.length)throw Error('Mapa inválido em '+dir+': '+problems.join('; '));
 return {maps:maps.filter(m=>m.campaign)};
}
// Troca os mapas embutidos e, em um teste, entra direto no mapa ao terminar de carregar. O jogo em si não muda.
const safeJson=value=>JSON.stringify(value).replaceAll('<','\\u003c');
function gameWithMaps(html,bundle,doc=null){
 const open=MAPS_BLOCK,start=html.indexOf(open),end=start<0?-1:html.indexOf('</script>',start);
 if(end<0)throw Error('A distribuição não tem o bloco de mapas: rode node v2/tools/build.cjs.');
 let out=html.slice(0,start+open.length)+safeJson(bundle)+html.slice(end);
 if(doc){
  const at=out.lastIndexOf('</body>'),boot='<script>window.__mapTest='+safeJson(doc)+';(function wait(){if(document.body.dataset.ready===\'true\'&&window.NecromancerV2?.playMap)NecromancerV2.playMap(window.__mapTest);else setTimeout(wait,100);})();</script>';
  out=at<0?out+boot:out.slice(0,at)+boot+out.slice(at);
 }
 return out;
}
// Só o editor usa estes módulos: mudar um deles não deixa o jogo desatualizado.
const EDITOR_ONLY=new Set(['map-editor-app.mjs','map-disk-store.mjs']);
function newestSource(){
 let newest=0;for(const name of fs.readdirSync(path.join(repo,'v2/scripts')))if(!EDITOR_ONLY.has(name))newest=Math.max(newest,fs.statSync(path.join(repo,'v2/scripts',name)).mtimeMs);return newest;
}

function embeddedMaps(html){
 const start=html.indexOf(MAPS_BLOCK),end=start<0?-1:html.indexOf('</script>',start);if(end<0)return [];
 return JSON.parse(html.slice(start+MAPS_BLOCK.length,end)).maps||[];
}
// O mesmo build da linha de comando, em outro processo: o editor continua respondendo e uma falha não derruba o servidor.
function runBuild(){
 return new Promise(resolve=>{
  execFile(process.execPath,[path.join(repo,'v2/tools/build.cjs')],{cwd:repo,timeout:BUILD_TIMEOUT,maxBuffer:64e6,windowsHide:true},(error,stdout,stderr)=>{
   if(!error)return resolve({ok:true});
   const lines=String(stderr||'').split(/\r?\n/).filter(l=>/error|erro|inválido/i.test(l));
   resolve({ok:false,message:(lines[0]||error.message).trim().slice(0,400)});
  });
 });
}

// `publish` só tem padrão nas pastas reais do projeto: com outra pasta (testes), o build não pode tocar a distribuição.
function createEditorServer({mapsDir=DEFAULT_MAPS,gameFile=DEFAULT_GAME,publish=mapsDir===DEFAULT_MAPS&&gameFile===DEFAULT_GAME?runBuild:null}={}){
 const tests=new Map();let port=0,cached=null,publishing=null;
 function game(){
  const mtime=fs.statSync(gameFile).mtimeMs;if(cached?.mtime!==mtime)cached={mtime,html:fs.readFileSync(gameFile,'utf8')};return cached.html;
 }
 const isStale=()=>{try{return newestSource()>fs.statSync(gameFile).mtimeMs;}catch{return false;}};
 // Compara com o que está de fato embutido no jogo: data de arquivo não diz se um mapa restaurado saiu da distribuição.
 function publishStatus(){
  const base={ok:true,available:!!publish,changed:[],stale:false};
  if(publishing)return {...base,publishing:true};
  let disk;try{disk=readCampaignBundle(mapsDir).maps;}catch(error){return {...base,stale:isStale(),invalid:error.message};}
  let inGame=[];try{const html=game();cached.maps??=embeddedMaps(html);inGame=cached.maps;}catch{}
  const before=new Map(inGame.map(m=>[m.id,JSON.stringify(m)])),changed=disk.filter(m=>before.get(m.id)!==JSON.stringify(m)).map(m=>({id:m.id,name:m.name}));
  for(const m of inGame)if(!disk.some(d=>d.id===m.id))changed.push({id:m.id,name:m.name,removed:true});
  return {...base,changed,stale:isStale()};
 }
 function send(res,status,body,type='application/json; charset=utf-8'){
  const data=Buffer.isBuffer(body)?body:Buffer.from(typeof body==='string'?body:JSON.stringify(body));
  res.writeHead(status,{'Content-Type':type,'Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
 }
 const fail=(res,status,message)=>send(res,status,{ok:false,message});
 function readBody(req){
  return new Promise((resolve,reject)=>{
   const chunks=[];let size=0;
   req.on('data',c=>{size+=c.length;if(size>MAX_BODY){reject(Object.assign(Error('Corpo grande demais.'),{status:413}));req.destroy();return;}chunks.push(c);});
   req.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));req.on('error',reject);
  });
 }
 async function readJson(req){try{return JSON.parse(await readBody(req));}catch(error){if(error.status)throw error;throw Object.assign(Error('JSON inválido.'),{status:400});}}
 function writeMap(doc){
  const file=fileFor(mapsDir,doc.id),temp=file+'.'+process.pid+'.tmp';
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(temp,formatMap(doc));fs.renameSync(temp,file);
 }
 async function api(req,res,url){
  if(url==='/api/maps'&&req.method==='GET'){
   const campaign=readFolder(mapsDir),custom=readFolder(path.join(mapsDir,'custom'));
   return send(res,200,{ok:true,maps:[...campaign.maps,...custom.maps],problems:[...campaign.problems,...custom.problems]});
  }
  const match=/^\/api\/maps\/([^/]+)$/.exec(url);
  if(match){
   const id=decodeURIComponent(match[1]);if(!ID.test(id))return fail(res,400,'Id de mapa inválido.');
   if(req.method==='PUT'){
    const doc=await readJson(req);if(doc?.id!==id)return fail(res,400,'O id do documento não confere com o endereço.');
    writeMap(doc);return send(res,200,{ok:true});
   }
   if(req.method==='DELETE'){fs.rmSync(fileFor(mapsDir,id),{force:true});return send(res,200,{ok:true});}
  }
  if(url==='/api/play'&&req.method==='POST'){
   const {doc}=await readJson(req);if(!doc||typeof doc!=='object'||!Array.isArray(doc.objects))return fail(res,400,'Documento de mapa inválido.');
   const token=crypto.randomBytes(8).toString('hex');tests.set(token,doc);while(tests.size>MAX_TESTS)tests.delete(tests.keys().next().value);
   return send(res,200,{ok:true,url:'/play/'+token,stale:isStale()});
  }
  if(url==='/api/publish'&&req.method==='GET')return send(res,200,publishStatus());
  if(url==='/api/publish'&&req.method==='POST'){
   if(!publish)return fail(res,409,'Publicar só funciona com a pasta de mapas e o jogo do projeto.');
   if(!publishing){
    // Arquivo inválido para aqui, antes de o build regenerar qualquer coisa. Dois pedidos seguidos esperam o mesmo build.
    try{readCampaignBundle(mapsDir);}catch(error){return fail(res,409,error.message);}
    publishing=Promise.resolve().then(publish).catch(error=>({ok:false,message:error.message})).finally(()=>{publishing=null;});
   }
   const result=await publishing;if(!result.ok)return fail(res,500,result.message||'O build falhou.');
   return send(res,200,publishStatus());
  }
  return fail(res,404,'Rota desconhecida.');
 }
 function serveFile(res,url){
  let name;try{name=decodeURIComponent(url).replace(/^\/+/,'');}catch{return fail(res,400,'Endereço inválido.');}
  const file=path.resolve(repo,name),relative=path.relative(repo,file).replaceAll('\\','/');
  if(relative.startsWith('..')||path.isAbsolute(relative)||!PUBLIC.some(p=>p.endsWith('/')?relative.startsWith(p):relative===p)||!MIME[path.extname(file)])return fail(res,404,'Arquivo não disponível.');
  fs.readFile(file,(error,data)=>error?fail(res,404,'Arquivo não encontrado.'):send(res,200,data,MIME[path.extname(file)]));
 }
 const server=http.createServer(async(req,res)=>{
  try{
   // Só atende esta máquina pelo próprio endereço: um site aberto no navegador não alcança a gravação.
   const host=req.headers.host||'',url=req.url.split('?')[0];
   if(host!=='127.0.0.1:'+port&&host!=='localhost:'+port)return fail(res,403,'Endereço não permitido.');
   if(!['GET','HEAD'].includes(req.method)){
    if(req.headers['x-map-editor']!=='1')return fail(res,403,'Pedido sem a marca do editor.');
    const origin=req.headers.origin;if(origin&&origin!=='http://'+host)return fail(res,403,'Origem não permitida.');
   }
   if(url==='/')return res.writeHead(302,{Location:'/v2/map-editor.html'}).end();
   if(url.startsWith('/api/'))return await api(req,res,url);
   const play=/^\/play(?:\/([0-9a-f]+))?$/.exec(url);
   if(play){
    const doc=play[1]?tests.get(play[1]):null;if(play[1]&&!doc)return fail(res,404,'Teste expirado: use Testar de novo no editor.');
    if(publishing)await publishing;
    return send(res,200,gameWithMaps(game(),readCampaignBundle(mapsDir),doc),MIME['.html']);
   }
   return serveFile(res,url);
  }catch(error){
   if(!res.headersSent)fail(res,error.status||500,error.message);else res.destroy();
  }
 });
 return {server,listen:(wanted=DEFAULT_PORT)=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(wanted,'127.0.0.1',()=>{server.removeListener('error',reject);port=server.address().port;resolve(port);});}),close:()=>new Promise(resolve=>{server.closeAllConnections?.();server.close(()=>resolve());})};
}
module.exports={createEditorServer,readCampaignBundle,formatMap,gameWithMaps};
if(require.main===module){
 const wanted=Number(process.argv[2]||process.env.PORT)||DEFAULT_PORT;
 createEditorServer().listen(wanted).then(port=>console.log('Editor de mapas: http://localhost:'+port+'/ (Ctrl+C encerra)')).catch(error=>{
  console.error(error.code==='EADDRINUSE'?'A porta '+wanted+' já está em uso: o editor pode já estar aberto. Indique outra, como node v2/tools/map-editor-server.cjs 4178.':error.message);process.exitCode=1;
 });
}
