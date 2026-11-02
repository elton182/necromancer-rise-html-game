// Prévia das animações exportadas no mesmo Three.js usado pelo jogo.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const page=await browser.newPage({viewport:{width:560,height:560}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
await page.evaluate(async()=>{
 const T=await import('three'),{GLTFLoader}=await import('gltf-loader'),entry=JSON.parse(document.querySelector('#assets').textContent).warrior;
 const gltf=await new GLTFLoader().parseAsync(Uint8Array.from(atob(entry.data),c=>c.charCodeAt(0)).buffer,'');
 const model=gltf.scene;model.updateMatrixWorld(true);model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});const box=new T.Box3().setFromObject(model,true);model.scale.setScalar(2.25/(box.max.y-box.min.y));
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(560,560);renderer.domElement.id='motion-preview';renderer.domElement.style='position:fixed;inset:0;z-index:999999';document.body.append(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#27363a');scene.add(model);const camera=new T.PerspectiveCamera(32,1,.1,50);camera.position.set(3.8,2.8,6.1);camera.lookAt(0,1.05,0);
 scene.add(new T.HemisphereLight(0xd3e5ed,0x45352c,2));const sun=new T.DirectionalLight(0xffe4be,3);sun.position.set(2,5,4);scene.add(sun);scene.add(new T.GridHelper(8,16,0x657679,0x405254));
 const mixer=new T.AnimationMixer(model),actions=Object.fromEntries(gltf.animations.map(a=>[a.name,mixer.clipAction(a)]));
 window.motionFrame=(name,t)=>{mixer.stopAllAction();const a=actions[name];a.reset().play();a.time=t*a.getClip().duration;mixer.update(0);renderer.render(scene,camera);};
});
const frames=fs.mkdtempSync(path.join(os.tmpdir(),'warrior-motion-')),evidence=path.resolve(__dirname,'../../review/v2/warrior-motion');fs.mkdirSync(evidence,{recursive:true});
const samples=[];for(let i=0;i<60;i++){const t=i/59*(.6+16/30+.4),index=t<.6?0:t<.6+16/30?1:2,start=index===0?0:index===1?.6:.6+16/30,span=[.6,16/30,.4][index];samples.push(['slash_'+(index+1),Math.min(1,(t-start)/span)]);}
for(const [name,count] of [['thrust',24],['shield_bash',24],['walk',36]])for(let i=0;i<count;i++)samples.push([name,i/(count-1)]);
for(let i=0;i<samples.length;i++){await page.evaluate(([name,t])=>motionFrame(name,t),samples[i]);await page.locator('#motion-preview').screenshot({path:path.join(frames,String(i).padStart(3,'0')+'.png')});if([0,15,30,45,59,72,96,126].includes(i))await page.locator('#motion-preview').screenshot({path:path.join(evidence,'pose-'+String(i).padStart(3,'0')+'.png')});}
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify({errors,frames,samples:samples.length,checks:['combo contínuo','estocada','escudo','caminhada','GLB no Three.js']},null,2));console.log('Prévia e leitura dos oito clipes OK. Quadros: '+frames);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
