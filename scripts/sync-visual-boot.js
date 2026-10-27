const fs=require('node:fs'),path=require('node:path');
const file=process.argv[2]?path.resolve(process.argv[2]):path.resolve(__dirname,'../necromancer-canvas.html');
let html=fs.readFileSync(file,'utf8');
const block='<!-- VISUAL_BOOT_BEGIN -->\n<script>\n'+fs.readFileSync(path.join(__dirname,'visual-boot.js'),'utf8')+'\n</script>\n<!-- VISUAL_BOOT_END -->';
if(html.includes('<!-- VISUAL_BOOT_BEGIN -->'))html=html.replace(/<!-- VISUAL_BOOT_BEGIN -->[\s\S]*?<!-- VISUAL_BOOT_END -->/,()=>block);
else{if(!/<body[^>]*>/.test(html))throw new Error('Body não encontrado');html=html.replace(/<body[^>]*>/,m=>m+'\n'+block);}
const anchor='function frame(now){';
if(!html.includes('GameVisualBoot.ready')){
 if(!html.includes(anchor))throw new Error('Loop não encontrado');
 html=html.replace(anchor,anchor+'\n  if(window.GameVisualBoot&&!GameVisualBoot.ready){_last=now;requestAnimationFrame(frame);return;}');
}
const temporary=file+'.visual-boot.tmp';fs.writeFileSync(temporary,html);
try{fs.renameSync(temporary,file);}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
console.log('Abertura visual sincronizada.');
