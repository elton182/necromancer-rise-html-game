// Efeitos de shader do cenário: vento na vegetação e transparência pontilhada contra oclusão.
// O cenário que fica entre a câmera e o jogador abre um círculo pontilhado (descarte por matriz de Bayer),
// sem ordenar transparências e sem tocar nas sombras. Só desenho: colisão e mira não mudam.
import * as THREE from 'three';

// Uniformes compartilhados por todos os materiais do cenário; o renderizador atualiza uma vez por quadro.
const uniforms={uSfxTime:{value:0},uSfxPlayer:{value:new THREE.Vector2(-1e4,-1e4)},uSfxDepth:{value:0},uSfxRadius:{value:0},uSfxOn:{value:0}};
const patched=new WeakSet(),point=new THREE.Vector3(),size=new THREE.Vector2();
// Raio do círculo em unidades do mundo (personagem tem 2,25 u) e altura mínima afetada: base de muros, cercas e caixotes fica.
const SEE_RADIUS=2.6,SEE_FLOOR=.9;

// `sway`: deslocamento por unidade de altura acima de `swayFrom` (0 = sem vento). `see`: participa da transparência.
export function patchScenery(material,{sway=0,swayFrom=0,see=true}={}){
 if(!material||patched.has(material))return material;patched.add(material);
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=(shader,renderer)=>{
  previous?.call(material,shader,renderer);Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='uniform float uSfxTime;\nvarying float vSfxY;\n'+shader.vertexShader
   .replace('#include <begin_vertex>',`#include <begin_vertex>
${sway?`{vec3 sfxBase=vec3(0.);
#ifdef USE_INSTANCING
sfxBase=instanceMatrix[3].xyz;
#endif
float sfxH=max(0.,transformed.y-${swayFrom.toFixed(3)}),sfxP=sfxBase.x*.37+sfxBase.z*.29;
transformed.x+=sin(uSfxTime*1.7+sfxP)*${sway.toFixed(4)}*sfxH;transformed.z+=cos(uSfxTime*1.3+sfxP*1.3)*${(sway*.6).toFixed(4)}*sfxH;}`:''}`)
   .replace('#include <project_vertex>',`#include <project_vertex>
{vec4 sfxW=vec4(transformed,1.);
#ifdef USE_INSTANCING
sfxW=instanceMatrix*sfxW;
#endif
vSfxY=(modelMatrix*sfxW).y;}`);
  if(see)shader.fragmentShader=`uniform vec2 uSfxPlayer;uniform float uSfxDepth,uSfxRadius,uSfxOn;varying float vSfxY;
float sfxBayer(vec2 p){ivec2 i=ivec2(mod(p,4.));float m[16]=float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);return (m[i.x+i.y*4]+.5)/16.;}
`+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
if(uSfxOn>.5&&vSfxY>${SEE_FLOOR.toFixed(2)}&&vViewPosition.z<uSfxDepth-.6){
 float sfxA=1.-smoothstep(uSfxRadius*.55,uSfxRadius,length(gl_FragCoord.xy-uSfxPlayer));
 if(sfxBayer(gl_FragCoord.xy)<sfxA*.88)discard;
}`);
  else shader.fragmentShader='varying float vSfxY;\n'+shader.fragmentShader;
 };
 const key=material.customProgramCacheKey?.bind(material);
 material.customProgramCacheKey=()=>(key?key():'')+`|sfx:${sway}:${swayFrom}:${see}`;
 material.needsUpdate=true;return material;
}

// Chamado antes de desenhar: posição do jogador na tela (pixels do buffer) e profundidade na câmera.
// `on` falso desliga a transparência (cenas sem cenário com o efeito, histórias, menus).
export function updateSceneryFx(renderer,camera,target,on){
 uniforms.uSfxTime.value=performance.now()/1000;uniforms.uSfxOn.value=on&&target?1:0;if(!on||!target)return;
 renderer.getDrawingBufferSize(size);point.set(target.x,1.1,target.y).project(camera);
 uniforms.uSfxPlayer.value.set((point.x+1)/2*size.x,(point.y+1)/2*size.y);
 point.set(target.x,1.1,target.y).applyMatrix4(camera.matrixWorldInverse);uniforms.uSfxDepth.value=-point.z;
 uniforms.uSfxRadius.value=SEE_RADIUS*size.y/(camera.top-camera.bottom);
}
