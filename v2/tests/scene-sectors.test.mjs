import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const threeUrl=new URL('../../tools/3d-lab/vendor/three.module.js',import.meta.url).href;
const THREE=await import(threeUrl);
const source=(await readFile(new URL('../scripts/scene-sectors.mjs',import.meta.url),'utf8')).replaceAll("from 'three'","from '"+threeUrl+"'");
const {splitSceneIntoSectors}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

function family(positions,extra=()=>{}){
 const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial(),positions.length),m=new THREE.Matrix4();
 positions.forEach(([x,z],i)=>{m.makeTranslation(x,0,z);mesh.setMatrixAt(i,m);mesh.setColorAt(i,new THREE.Color(i/positions.length,0,0));});
 extra(mesh);return mesh;
}
const grid=(n,step)=>{const out=[];for(let x=0;x<n;x++)for(let z=0;z<n;z++)out.push([(x-n/2)*step,(z-n/2)*step]);return out;};
const placed=group=>group.children.flatMap(mesh=>Array.from({length:mesh.count},(_,i)=>{const m=new THREE.Matrix4(),c=new THREE.Color();mesh.getMatrixAt(i,m);mesh.getColorAt(i,c);return [m.elements[12],m.elements[14],+c.r.toFixed(4)].join();})).sort();

test('dividir não some, duplica nem muda nenhuma instância',()=>{
 const group=new THREE.Group(),big=family(grid(40,5),m=>{m.name='arvores';m.renderOrder=2;m.castShadow=true;m.receiveShadow=true;m.userData.forestBorder=true;});group.add(big);
 const before=placed(group);splitSceneIntoSectors(group);
 assert.ok(group.children.length>4,'virou vários setores: '+group.children.length);assert.deepEqual(placed(group),before);
 for(const part of group.children){assert.equal(part.geometry,big.geometry);assert.equal(part.material,big.material,'mesmo material: paleta e vento continuam valendo');assert.equal(part.name,'arvores');assert.equal(part.renderOrder,2);assert.equal(part.castShadow,true);assert.equal(part.receiveShadow,true);assert.equal(part.userData.forestBorder,true);assert.ok(part.boundingSphere);}
});
test('a câmera descarta os setores fora da tela',()=>{
 const group=new THREE.Group();group.add(family(grid(100,4)));splitSceneIntoSectors(group);
 const camera=new THREE.OrthographicCamera(-15,15,10,-10,.1,120);camera.position.set(22,28,22);camera.lookAt(0,0,0);camera.updateMatrixWorld();camera.updateProjectionMatrix();
 const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));group.updateMatrixWorld(true);
 const visible=group.children.filter(m=>frustum.intersectsObject(m)).reduce((n,m)=>n+m.count,0),total=group.children.reduce((n,m)=>n+m.count,0);
 assert.equal(total,10000);assert.ok(visible>0);assert.ok(visible<total*.25,'só uma fração vai para a placa: '+visible+' de '+total);
});
test('família pequena, camada plana e peça comum ficam inteiras',()=>{
 const group=new THREE.Group(),small=family(grid(10,20)),flat=family(grid(30,10),m=>{m.material.depthTest=false;}),plain=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()),near=family(grid(20,1).map(([x,z])=>[x+11,z+11]));
 group.add(small,flat,plain,near);splitSceneIntoSectors(group);
 assert.ok(group.children.includes(small),'poucas instâncias não compensam mais desenhos');assert.ok(group.children.includes(flat),'a ordem da camada plana é o desenho');assert.ok(group.children.includes(plain));assert.ok(group.children.includes(near),'tudo no mesmo setor não divide');
});
