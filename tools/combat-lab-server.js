// Local development only. Run from any directory; Ctrl+C stops the server.
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  if(name==='/')name='/tools/combat-lab.html';
  const target=path.resolve(root,'.'+name),relative=path.relative(root,target);
  if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(x=>x.startsWith('.'))){res.writeHead(403).end();return;}
  if(!types[path.extname(target)]){res.writeHead(404).end();return;}
  fs.readFile(target,(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(target)],'Cache-Control':'no-store'});res.end(data);});
});
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
server.listen(4173,'127.0.0.1',()=>console.log('Ateliê: http://127.0.0.1:4173/tools/combat-lab.html'));
