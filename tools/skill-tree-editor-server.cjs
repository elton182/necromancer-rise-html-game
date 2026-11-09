'use strict';
// Servidor local do editor de árvores de habilidades: só para desenvolvimento, sem dependências e acessível apenas nesta máquina.
// Entrega tools/skill-tree-editor.html e lê/grava docs/habilidades/arvores.json (fonte da verdade) e arvores.md (guia gerado).
// Uso (raiz do projeto): node tools/skill-tree-editor-server.cjs [porta]
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..');
const PAGE=path.join(repo,'tools/skill-tree-editor.html');
const DATA=path.join(repo,'docs/habilidades/arvores.json');
const GUIDE=path.join(repo,'docs/habilidades/arvores.md');
const PORT=Number(process.argv[2])||4178,MAX_BODY=8e6;

// Mesmo formato do editor: o Git mostra exatamente o campo que mudou.
const serialize=doc=>JSON.stringify(doc,null,1)+'\n';
const mtimeOf=file=>{try{return fs.statSync(file).mtimeMs;}catch{return 0;}};
function writeAtomic(file,text){const tmp=file+'.tmp';fs.writeFileSync(tmp,text);fs.renameSync(tmp,file);}
function send(res,status,body,type='application/json; charset=utf-8'){
 res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body));
}
// Recusa outros hosts (proteção contra DNS rebinding) e gravações vindas de outra origem.
const LOCAL=/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
function trusted(req){
 if(!LOCAL.test(req.headers.host||''))return false;
 const origin=req.headers.origin;if(!origin)return true;
 try{return LOCAL.test(new URL(origin).host);}catch{return false;}
}
function readBody(req){
 return new Promise((resolve,reject)=>{let size=0;const parts=[];
  req.on('data',c=>{size+=c.length;if(size>MAX_BODY){reject(Error('Corpo grande demais.'));req.destroy();}else parts.push(c);});
  req.on('end',()=>resolve(Buffer.concat(parts).toString('utf8')));req.on('error',reject);});
}
function validDoc(doc){return doc&&doc.format==='necromancer-skill-trees'&&Array.isArray(doc.classes)&&doc.classes.every(c=>c&&typeof c.id==='string'&&Array.isArray(c.nodes)&&Array.isArray(c.trees));}

const server=http.createServer(async(req,res)=>{
 try{
  if(!trusted(req))return send(res,403,{error:'Acesso permitido só a partir desta máquina.'});
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&(url.pathname==='/'||url.pathname==='/skill-tree-editor.html'))return send(res,200,fs.readFileSync(PAGE),'text/html; charset=utf-8');
  if(url.pathname==='/api/skill-trees'){
   if(req.method==='GET'){
    const text=fs.readFileSync(DATA,'utf8');
    return send(res,200,{doc:JSON.parse(text),mtime:mtimeOf(DATA),file:path.relative(repo,DATA).replaceAll('\\','/')});
   }
   if(req.method==='PUT'){
    const body=JSON.parse(await readBody(req));
    if(!validDoc(body.doc))return send(res,400,{error:'Documento inválido: esperado format "necromancer-skill-trees" com classes, árvores e nós.'});
    const current=mtimeOf(DATA);
    // Arquivo alterado fora do editor (Git, outro editor) desde a última leitura: não sobrescrever sem confirmação.
    if(!body.force&&body.baseMtime&&current&&Math.abs(current-body.baseMtime)>1)return send(res,409,{error:'O arquivo mudou no disco desde que foi aberto.',mtime:current});
    writeAtomic(DATA,serialize(body.doc));
    if(typeof body.markdown==='string')writeAtomic(GUIDE,body.markdown);
    return send(res,200,{ok:true,mtime:mtimeOf(DATA)});
   }
  }
  send(res,404,{error:'Não encontrado.'});
 }catch(error){send(res,500,{error:error.message});}
});
server.listen(PORT,'127.0.0.1',()=>console.log('Editor de árvores de habilidades: http://localhost:'+PORT+'/\nDados: '+path.relative(repo,DATA)));
