import * as THREE from 'three';

// Continuação visual do piso: não entra em colisões, navegação ou limites do mapa.
export function buildMapHorizon(source){
 source.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(source),width=box.max.x-box.min.x,depth=box.max.z-box.min.z;
 const geometry=new THREE.PlaneGeometry(width+2048,depth+2048).rotateX(-Math.PI/2);
 const center=box.getCenter(new THREE.Vector3()),p=geometry.attributes.position,uv=geometry.attributes.uv;
 // Chão de ladrilhos (painted-ground.mjs): o próprio material continua a grama e escurece com a distância.
 if(source.userData.paintedGround){
  const mesh=new THREE.Mesh(geometry,source.material);
  mesh.name='map-horizon';mesh.position.set(center.x,box.min.y-.018,center.z);mesh.receiveShadow=true;mesh.renderOrder=-4;mesh.userData.horizonSource=source;
  return mesh;
 }
 for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+width/2)/width,1-(p.getZ(i)+depth/2)/depth);
 const material=new THREE.MeshStandardMaterial({map:source.material.map,color:source.material.color,roughness:source.material.roughness});
 const tint=new THREE.Color(1,1,1),image=source.material.map?.image;
 if(image?.getContext){
  const ctx=image.getContext('2d'),w=image.width,h=image.height,sum=[0,0,0];let count=0;
  for(let i=0;i<64;i++)for(const [x,y] of [[Math.floor(i*(w-1)/63),0],[Math.floor(i*(w-1)/63),h-1],[0,Math.floor(i*(h-1)/63)],[w-1,Math.floor(i*(h-1)/63)]]){
   const pixel=ctx.getImageData(x,y,1,1).data;for(let c=0;c<3;c++)sum[c]+=pixel[c];count++;
  }
  tint.setRGB(...sum.map(v=>v/count/255)).convertSRGBToLinear();
 }
 // O sampler prolonga o último texel, sem repetir ruas ou objetos pintados no piso.
 material.onBeforeCompile=shader=>{
  shader.uniforms.uHorizonTint={value:tint};shader.uniforms.uHorizonSize={value:new THREE.Vector2(width,depth)};
  shader.vertexShader='varying vec2 vHorizonUv;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n vHorizonUv=uv;');
  shader.fragmentShader='varying vec2 vHorizonUv;uniform vec3 uHorizonTint;uniform vec2 uHorizonSize;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
   vec4 sampledDiffuseColor=texture2D(map,clamp(vHorizonUv,vec2(0.001),vec2(0.999)));
   vec2 outside=max(max(-vHorizonUv,vHorizonUv-1.),vec2(0.))*uHorizonSize;
   float distanceOutside=length(outside);
   float grain=fract(sin(dot(floor(vHorizonUv*uHorizonSize*3.),vec2(12.9898,78.233)))*43758.5453);
   vec3 continuation=uHorizonTint*(.97+grain*.06)*(1.-.25*smoothstep(4.,35.,distanceOutside));
   diffuseColor*=vec4(mix(sampledDiffuseColor.rgb,continuation,smoothstep(0.,3.,distanceOutside)),sampledDiffuseColor.a);
  #endif`);
 };
 material.customProgramCacheKey=()=> 'map-horizon-v2';
 const mesh=new THREE.Mesh(geometry,material);
 mesh.name='map-horizon';mesh.position.set(center.x,box.min.y-.018,center.z);mesh.receiveShadow=true;mesh.renderOrder=-4;
 mesh.userData.horizonSource=source;
 return mesh;
}

export function updateMapHorizon(group){
 for(const o of group.children)if(o.userData.horizonSource)o.material.color.copy(o.userData.horizonSource.material.color);
}
