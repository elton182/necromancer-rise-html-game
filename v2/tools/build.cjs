'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'..');
const read=p=>fs.readFileSync(p,'utf8');
function data(source){return 'data:text/javascript;base64,'+Buffer.from(source).toString('base64');}
function one(source,marker,value){if(source.split(marker).length!==2)throw Error('Marcador ausente ou duplicado: '+marker);return source.replace(marker,()=>value);}
const vendor=path.join(repo,'tools/3d-lab/vendor');
const imports={},provenance=[];
function record(file,buffer){provenance.push({path:path.relative(repo,file).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(buffer).digest('hex')});}
for(const [name,key]of Object.entries({'three.core':'three-core','three.module':'three',BufferGeometryUtils:'geometry-utils',GLTFLoader:'gltf-loader',SkeletonUtils:'skeleton-utils'})){
 const file=path.join(vendor,name+'.js'),source=read(file);record(file,source);
 imports[key]=data(source.replaceAll("'./three.core.js'","'three-core'").replaceAll("'../utils/BufferGeometryUtils.js'","'geometry-utils'"));
}
for(const [name,key]of Object.entries({terrain:'v2-terrain',gamepad:'v2-gamepad','training-model':'v2-model',renderer:'v2-renderer',input:'v2-input','save-model':'v2-save',session:'v2-session',app:'v2-app'})){
 const file=path.join(root,'scripts',name+'.mjs'),source=read(file);record(file,source);imports[key]=data(source.replaceAll("'./training-model.mjs'","'v2-model'").replaceAll("'./save-model.mjs'","'v2-save'").replaceAll("'./terrain.mjs'","'v2-terrain'").replaceAll("'./gamepad.mjs'","'v2-gamepad'"));
}
const manifestPath=path.join(root,'assets/models.json'),definitions=JSON.parse(read(manifestPath)),assets={};record(manifestPath,read(manifestPath));
for(const [key,entry]of Object.entries(definitions)){
 const file=path.resolve(repo,entry.path),relative=path.relative(repo,file);
 if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Asset fora do repositório: '+entry.path);
 const buffer=fs.readFileSync(file);if(buffer.subarray(0,4).toString()!=='glTF'||buffer.readUInt32LE(4)!==2)throw Error('GLB inválido: '+entry.path);
 const gltf=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());
 for(const section of ['buffers','images'])for(const resource of gltf[section]||[])if(resource.uri&&!resource.uri.startsWith('data:'))throw Error('GLB depende de recurso externo: '+entry.path);
 for(const animation of entry.requiredAnimations)if(!gltf.animations?.some(a=>a.name===animation))throw Error('Animação ausente: '+key+'/'+animation);
 record(file,buffer);assets[key]={...entry,data:buffer.toString('base64')};
}
let html=read(path.join(__dirname,'template.html'));
record(path.join(__dirname,'template.html'),html);const css=['game.css','save.css'].map(name=>{const file=path.join(root,'scripts',name),source=read(file);record(file,source);return source;}).join('\n');
html=one(html,'/*STYLES*/',css);html=one(html,'<!--IMPORTS-->','<script type="importmap">'+JSON.stringify({imports})+'</script>');
html=one(html,'<!--ASSETS-->','<script id="assets" type="application/json">'+JSON.stringify(assets).replaceAll('<','\\u003c')+'</script>');
fs.writeFileSync(path.join(root,'necromancer-3d.html'),html);
fs.writeFileSync(path.join(root,'assets/build-manifest.json'),JSON.stringify({stage:'E3',threeVersion:'0.180.0',inputs:provenance},null,2)+'\n');
// Licença acompanha a distribuição e as fontes da v2; biblioteca continua canônica no laboratório.
fs.copyFileSync(path.join(vendor,'LICENSE'),path.join(root,'assets/three-license.txt'));
console.log('v2/necromancer-3d.html gerado: quatro GLBs e módulos locais incorporados.');
