// Apresentação do relevo: água animada e assentamento do cenário sobre as alturas. As regras ficam em map-terrain.mjs.
import * as THREE from 'three';
import {groundAt,fineWater,TERRAIN_RULES} from './map-terrain.mjs';

// A margem é desenhada pelo mapa de profundidade: o plano fica logo acima do chão plano e some onde não há água.
const WATER_Y=.016,PAD=2,REACH=70,matrix=new THREE.Matrix4();
// Ladrilho de água, sem emenda, gerado uma vez e compartilhado: RG = inclinação da onda, B = cristas finas (reflexos no fundo), A = manchas para quebrar a espuma.
let waterTile=null;
function buildWaterTile(){
 if(waterTile)return waterTile;
 const S=256,fbm=seedStart=>{
  let seed=seedStart;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},out=new Float32Array(S*S);
  for(const [period,amp] of [[4,.5],[8,.27],[16,.15],[32,.08]]){
   const grid=Float32Array.from({length:period*period},random),step=S/period,fade=t=>t*t*(3-2*t);
   for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const gx=x/step,gy=y/step,i=Math.floor(gx),j=Math.floor(gy),u=fade(gx-i),v=fade(gy-j),at=(a,b)=>grid[(b%period)*period+a%period];
    out[y*S+x]+=amp*((at(i,j)*(1-u)+at(i+1,j)*u)*(1-v)+(at(i,j+1)*(1-u)+at(i+1,j+1)*u)*v);
   }
  }
  return out;
 };
 const waves=fbm(11),patches=fbm(47),data=new Uint8Array(S*S*4),at=(f,x,y)=>f[((y+S)%S)*S+(x+S)%S];
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){
  const k=(y*S+x)*4,nx=(at(waves,x-1,y)-at(waves,x+1,y))*18,ny=(at(waves,x,y-1)-at(waves,x,y+1))*18,ridge=1-Math.min(1,Math.abs(at(waves,x,y)-.5)*5);
  data[k]=Math.max(0,Math.min(255,(nx*.5+.5)*255));data[k+1]=Math.max(0,Math.min(255,(ny*.5+.5)*255));data[k+2]=ridge*ridge*255;data[k+3]=Math.max(0,Math.min(255,at(patches,x,y)*255));
 }
 const texture=new THREE.DataTexture(data,S,S,THREE.RGBAFormat);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;
 return waterTile=texture;
}
const FRAGMENT=`#include <map_fragment>
{
 vec2 suv=(vWaterXZ-uWaterRect.xy)/uWaterRect.zw;
 vec4 d=texture2D(uWaterData,(suv*(uWaterSize-1.)+.5)/uWaterSize);
 float depth=d.r*4.,t=uWaterTime;
 vec2 flow=d.gb*2.-1.;
 float moving=smoothstep(.05,.3,length(flow));
 // Rio: duas fases deslizando no sentido da água, cada uma só com um deslocamento pequeno; assim as curvas não torcem o desenho. Água parada só deriva devagar.
 float phase=fract(t*.2),phaseB=fract(t*.2+.5),blend=abs(phase*2.-1.);
 vec2 drift=vec2(t*.03,-t*.019)*(1.-moving),push=flow*moving;
 vec4 wave=mix(texture2D(uWaterTile,(vWaterXZ-push*phase*3.)/10.+drift),texture2D(uWaterTile,(vWaterXZ-push*phaseB*3.)/10.+drift+.37),blend);
 vec4 fine=mix(texture2D(uWaterTile,(vWaterXZ-push*phase*4.8)/3.7-drift*1.7+.61),texture2D(uWaterTile,(vWaterXZ-push*phaseB*4.8)/3.7-drift*1.7+.13),blend);
 vec2 n=(wave.rg-.5)*.9+(fine.rg-.5)*.55;
 // Cor pela profundidade: o fundo aparece no raso e some no fundo.
 float deep=smoothstep(.04,1.3,depth);
 vec3 c=mix(uWaterShallow,uWaterDeep,deep);
 // Volume das ondas e reflexo do céu, mais forte onde a água inclina.
 c*=1.+dot(n,vec2(-.62,-.5))*.75;
 c=mix(c,uWaterSky,clamp(.08+length(n)*.42,0.,.38)*(.45+.55*deep));
 // Reflexos de luz no fundo raso e brilhos do sol nas cristas.
 c+=uWaterSun*fine.b*fine.b*(1.-deep)*.13;
 c+=uWaterSun*pow(max(dot(normalize(vec3(n*2.1,1.)),normalize(vec3(-.42,-.32,.85))),0.),150.)*.6;
 // Espuma quebrada, em ondas que batem na margem.
 float band=1.-smoothstep(.0,.13,depth),lap=sin(depth*38.-t*1.25+wave.a*9.)*.5+.5;
 float foam=smoothstep(.38,.85,band*(.35+.65*lap)+(wave.a-.5)*1.3*band+(fine.b-.3)*.25*band);
 c=mix(c,uWaterFoam,foam*.55);
 // Contorno discreto onde a água deixa de dar pé (limite real da colisão).
 float limit=1.-smoothstep(.0,.08,abs(depth-${(-TERRAIN_RULES.deep).toFixed(2)}));
 c=mix(c,c*1.2+.015,limit*.55);
 diffuseColor.rgb*=c;
 diffuseColor.a*=clamp(mix(.5,.95,smoothstep(.04,1.,depth))+foam*.3,0.,1.)*smoothstep(.0,.06,depth);
 if(diffuseColor.a<.01)discard;
}`;
// Duas passadas de média curta nas profundidades. Trabalha em cópia: a grade fina pode ser a própria grade do terreno.
function smoothDepth(b){
 const {cols,rows}=b;let from=Float32Array.from(b.h),to=new Float32Array(from.length);
 for(let pass=0;pass<2;pass++){
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)to[j*cols+i]=(from[j*cols+Math.max(0,i-1)]+from[j*cols+i]*2+from[j*cols+Math.min(cols-1,i+1)])/4;
  [from,to]=[to,from];
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)to[j*cols+i]=(from[Math.max(0,j-1)*cols+i]+from[j*cols+i]*2+from[Math.min(rows-1,j+1)*cols+i])/4;
  [from,to]=[to,from];
 }
 b.smooth=from;
}
export function buildWater(arena){
 const coarse=arena.terrain;if(!coarse?.hasWater)return null;
 // Só no desenho: grade mais fina e margem suavizada, sem degraus. A colisão segue a grade do terreno.
 const b=fineWater(coarse,coarse.cell<=1?.5:1);smoothDepth(b);
 let i0=b.cols,i1=0,j0=b.rows,j1=0;
 for(let j=0;j<b.rows;j++)for(let i=0;i<b.cols;i++)if(b.smooth[j*b.cols+i]<0){i0=Math.min(i0,i);i1=Math.max(i1,i);j0=Math.min(j0,j);j1=Math.max(j1,j);}
 if(i0>i1)return null;
 const data=new Uint8Array(b.cols*b.rows*4);
 for(let k=0;k<b.cols*b.rows;k++){data[k*4]=Math.min(255,Math.max(0,-b.smooth[k])/4*255);data[k*4+1]=(b.flow[k*2]*.5+.5)*255;data[k*4+2]=(b.flow[k*2+1]*.5+.5)*255;data[k*4+3]=255;}
 const texture=new THREE.DataTexture(data,b.cols,b.rows,THREE.RGBAFormat);texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;
 // A água não recebe a luz da cena: o estilo do mapa diz quanto ela brilha, para não ficar acesa em um mapa de noite.
 const style=arena.style,tone=style?.water?new THREE.Color(style.water):new THREE.Color(0x3f7d8c),time={value:0},glow=style&&(style.sun!=null||style.ambient!=null)?Math.max(.28,Math.min(1.1,((style.sun??3)+(style.ambient??2))/5)):1,sun=new THREE.Color(style?.sunColor||0xfff2d8).multiplyScalar(glow),sky=new THREE.Color(style?.sky||0xa9cbd6).lerp(new THREE.Color(0xbcd4dc),.35).multiplyScalar(glow);
 const uniforms={uWaterData:{value:texture},uWaterRect:{value:new THREE.Vector4(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0)},uWaterSize:{value:new THREE.Vector2(b.cols,b.rows)},uWaterTime:time,uWaterTile:{value:buildWaterTile()},uWaterShallow:{value:tone.clone().lerp(new THREE.Color(0x8fd2c4),.42).multiplyScalar(glow)},uWaterDeep:{value:tone.clone().multiplyScalar(.42*glow)},uWaterSky:{value:sky},uWaterSun:{value:sun},uWaterFoam:{value:new THREE.Color(.86,.93,.9).multiplyScalar(glow)}};
 const material=new THREE.MeshBasicMaterial({transparent:true,depthWrite:false});
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='varying vec2 vWaterXZ;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vWaterXZ=(modelMatrix*vec4(transformed,1.)).xz;');
  shader.fragmentShader='uniform sampler2D uWaterData,uWaterTile;uniform vec4 uWaterRect;uniform vec2 uWaterSize;uniform float uWaterTime;uniform vec3 uWaterShallow,uWaterDeep,uWaterSky,uWaterSun,uWaterFoam;varying vec2 vWaterXZ;\n'+shader.fragmentShader.replace('#include <map_fragment>',FRAGMENT);
 };
 material.customProgramCacheKey=()=>'map-water-v5';
 const dispose=material.dispose.bind(material);material.dispose=()=>{texture.dispose();dispose();};
 // Água que chega à borda continua além dela: a última linha do mapa de profundidade se prolonga (borda infinita).
 const x0=b.x0+i0*b.cell-(i0?PAD:REACH),x1=b.x0+i1*b.cell+(i1<b.cols-1?PAD:REACH),z0=b.y0+j0*b.cell-(j0?PAD:REACH),z1=b.y0+j1*b.cell+(j1<b.rows-1?PAD:REACH);
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0).rotateX(-Math.PI/2),material);
 mesh.name='map-water';mesh.position.set((x0+x1)/2,WATER_Y,(z0+z1)/2);mesh.renderOrder=-1;mesh.userData.noLift=true;mesh.userData.waterTime=time;mesh.userData.lightColor=new THREE.Color(1.25,1.25,1.25);
 return mesh;
}
export function updateWater(group,time){for(const o of group.children)if(o.userData.waterTime)o.userData.waterTime.value=time;}
// Assenta o cenário já montado sobre o relevo. O chão, a água, o horizonte e as peças que flutuam ficam onde estão.
export function liftScenery(objects,arena){
 if(!arena?.terrain)return;
 const skip=o=>o.userData.replacesGround||o.userData.paintedGround||o.userData.noLift||o.userData.horizonSource||o.userData.forestBorder;
 for(const o of objects){
  if(skip(o))continue;
  if(o.isInstancedMesh){
   for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);const e=matrix.elements;e[13]+=groundAt(arena,e[12],e[14]);o.setMatrixAt(i,matrix);}
   o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere();
  }else o.position.y+=groundAt(arena,o.position.x,o.position.z);
 }
}
