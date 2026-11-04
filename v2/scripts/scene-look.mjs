// Receita compartilhada pela vila, mapas de floresta e prévia do editor.
import * as THREE from 'three';
export const VILLAGE_LOOK={exposure:1.2,env:.45,sun:3.4,sunColor:0xffd9a6,hemisphere:1.3};
export const SCENE_LOOK={village:VILLAGE_LOOK,'custom-forest':VILLAGE_LOOK};
export const sceneLookKey=arena=>arena?.custom&&arena.biome==='forest'?'custom-forest':arena?.theme;
export function createSceneEnvironment(renderer){
 const pmrem=new THREE.PMREMGenerator(renderer),sky=new THREE.Scene(),geometry=new THREE.SphereGeometry(10,32,16),colors=[],top=new THREE.Color(0x9fb4d0),horizon=new THREE.Color(0xd9c8a8),below=new THREE.Color(0x3b382e),c=new THREE.Color();
 for(let i=0;i<geometry.attributes.position.count;i++){const y=geometry.attributes.position.getY(i)/10;c.copy(horizon).lerp(y>0?top:below,Math.min(1,Math.abs(y)*(y>0?1:1.6)));colors.push(c.r,c.g,c.b);}
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide});sky.add(new THREE.Mesh(geometry,material));
 const texture=pmrem.fromScene(sky,0).texture;pmrem.dispose();geometry.dispose();material.dispose();return texture;
}
// Estilo do mapa, por cima da receita do bioma. A névoa volta ao padrão quando o mapa não tem estilo próprio.
export function applyMapStyle(scene,sun,hemisphere,style,light=false){
 scene.fog.near=32;scene.fog.far=65;if(!style)return;
 if(style.sky&&!light){scene.background.set(style.sky);scene.fog.color.copy(scene.background);}
 if(style.sun!=null)sun.intensity=style.sun;if(style.sunColor)sun.color.set(style.sunColor);if(style.ambient!=null)hemisphere.intensity=style.ambient;
 if(style.fog!=null)scene.fog.far=65-9*style.fog;
}
export function applySceneLook(renderer,scene,sun,hemisphere,key,environment){
 const look=SCENE_LOOK[key];renderer.toneMapping=look?THREE.ACESFilmicToneMapping:THREE.NoToneMapping;renderer.toneMappingExposure=look?.exposure??1;
 scene.environment=look?environment():null;scene.environmentIntensity=look?.env??0;
 if(look){sun.intensity=look.sun;sun.color.set(look.sunColor);hemisphere.intensity=look.hemisphere;}
}
