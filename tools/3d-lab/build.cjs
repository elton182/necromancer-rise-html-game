// Empacota o experimento para abrir por file://, sem servidor ou CDN.
const fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const modules={};
for(const name of ['three.core','three.module','BufferGeometryUtils','GLTFLoader','SkeletonUtils']){
 let source=fs.readFileSync(path.join(root,'vendor',name+'.js'),'utf8');
 source=source.replaceAll("'./three.core.js'","'three-core'").replaceAll("'../utils/BufferGeometryUtils.js'","'geometry-utils'");
 const key=({'three.core':'three-core','three.module':'three',BufferGeometryUtils:'geometry-utils',GLTFLoader:'gltf-loader',SkeletonUtils:'skeleton-utils'})[name];
 modules[key]='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
}
const assets={};
const sources={necromante:'exports/lab_player_current.glb',mob_skeleton:'reference/skeleton.glb',mob_zombie:'exports/lowpoly_zombie.glb',fallen_king:'exports/lab_fallen_king_v4.glb'};
for(const [name,file] of Object.entries(sources)) assets[name]=fs.readFileSync(path.join(root,'../../blender',file)).toString('base64');
let html=fs.readFileSync(path.join(root,'template.html'),'utf8');
html=html.replace('<!--IMPORTS-->', '<script type="importmap">'+JSON.stringify({imports:modules})+'</script>');
html=html.replace('<!--ASSETS-->','<script id="assets" type="application/json">'+JSON.stringify(assets)+'</script>');
html=html.replace('/*RUNTIME*/',fs.readFileSync(path.join(root,'runtime.js'),'utf8'));
fs.writeFileSync(path.join(root,'../necromancer-3d-lab.html'),html);
console.log('Gerado tools/necromancer-3d-lab.html');
