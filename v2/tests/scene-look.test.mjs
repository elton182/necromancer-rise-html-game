import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const threeUrl=new URL('../../tools/3d-lab/vendor/three.module.js',import.meta.url).href;
const THREE=await import(threeUrl);
async function load(name,extra={}){
 let source=await readFile(new URL('../scripts/'+name+'.mjs',import.meta.url),'utf8');
 for(const [from,to]of Object.entries({'three':threeUrl,...extra}))source=source.replaceAll("from '"+from+"'","from '"+to+"'");
 return 'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
}
const {applySceneLook,sceneLookKey}=await import(await load('scene-look'));
test('vila e floresta personalizada compartilham luz; sair restaura tone mapping',()=>{
 const state=key=>{const renderer={},scene={},sun=new THREE.DirectionalLight(),hemisphere=new THREE.HemisphereLight(),texture={};applySceneLook(renderer,scene,sun,hemisphere,key,()=>texture);return {renderer,scene,sun,hemisphere,texture};};
 const village=state('village'),forest=state(sceneLookKey({custom:true,biome:'forest',theme:'expedition'}));
 assert.deepEqual(forest.renderer,village.renderer);assert.equal(forest.sun.intensity,village.sun.intensity);assert.equal(forest.sun.color.getHex(),village.sun.color.getHex());assert.equal(forest.hemisphere.intensity,village.hemisphere.intensity);assert.equal(forest.scene.environment,forest.texture);
 applySceneLook(forest.renderer,forest.scene,forest.sun,forest.hemisphere,'expedition',()=>{throw Error('não deve gerar ambiente');});
 assert.equal(forest.renderer.toneMapping,THREE.NoToneMapping);assert.equal(forest.scene.environment,null);assert.equal(forest.scene.environmentIntensity,0);
});
const {kitFamily}=await import(await load('village-kit',{'./forest-scene.mjs':await load('forest-scene',{'./painted-ground.mjs':await load('painted-ground')})}));
test('famílias do kit isolam cor, transparência e descarte de material',()=>{
 const material=new THREE.MeshStandardMaterial({color:0xffffff}),node=new THREE.Mesh(new THREE.BoxGeometry(),material);node.name='kit_probe';const scene=new THREE.Group();scene.add(node);
 const a=kitFamily({scene},'probe',[{x:0,z:0}])[0],b=kitFamily({scene},'probe',[{x:1,z:1}])[0];
 a.material.color.set(0xff0000);a.material.transparent=true;a.material.dispose();
 assert.notEqual(a.material,b.material);assert.notEqual(a.material,material);assert.equal(b.material.color.getHex(),0xffffff);assert.equal(b.material.transparent,false);assert.equal(material.transparent,false);
});
