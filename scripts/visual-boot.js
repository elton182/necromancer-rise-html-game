// Impede que cenas e simulação comecem com assets provisórios.
(function(){
 const boot=window.GameVisualBoot={ready:false,errors:[],promise:null,completed:0,total:0,progress:0};
 const style=document.createElement('style');
 style.textContent='html.visual-loading body>:not(#visual-boot){visibility:hidden!important}#visual-boot{position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;background:#11131b;color:#ece4cf;font:18px system-ui;text-align:center}#visual-boot small{display:block;margin-top:12px;color:#a8a3b2;font-size:14px}#visual-boot progress{display:block;width:min(360px,80vw);height:12px;margin:24px auto 10px;border:0;border-radius:9px;overflow:hidden;background:#292537;accent-color:#a477e8}#visual-boot progress::-webkit-progress-bar{background:#292537;border-radius:9px}#visual-boot progress::-webkit-progress-value{background:linear-gradient(90deg,#7951b7,#bd9af2);border-radius:9px}#visual-boot output{font-size:14px;color:#c4afd9;font-variant-numeric:tabular-nums}';
 document.head.append(style);document.documentElement.classList.add('visual-loading');
 const screen=document.createElement('div');screen.id='visual-boot';screen.setAttribute('role','status');
 screen.innerHTML='Preparando Valdoria…<small>Carregando personagens e cenário</small><progress id="visual-boot-progress" max="100" value="0" aria-label="Carregamento do jogo"></progress><output aria-hidden="true">0%</output>';
 document.body.append(screen);
 const bar=screen.querySelector('progress'),percentage=screen.querySelector('output');
 function advance(){
  boot.completed++;
  boot.progress=Math.min(99,Math.floor(boot.completed/boot.total*100));
  bar.value=boot.progress;percentage.textContent=boot.progress+'%';
 }
 document.addEventListener('DOMContentLoaded',()=>{
  boot.promise=(async()=>{
   const characters=window.CharacterVisuals?.preload(),village=window.VillageEnvironment?.promise;
   const sheets=Object.values(SPR.sheets),images=[...new Set([...sheets.map(s=>s.img),...Object.values(window.VillageEnvironment?.images||{})])];
   boot.total=images.length+2;
   const jobs=[characters,village,...images.map(img=>img.decode().catch(()=>{boot.errors.push('sprite');}))];
   await Promise.all(jobs.map(job=>Promise.resolve(job).finally(advance)));
   if(!SPR.sheets.necro?.ok)throw new Error('Não foi possível carregar o personagem.');
   boot.progress=100;bar.value=100;percentage.textContent='100%';
   boot.ready=true;document.documentElement.classList.remove('visual-loading');screen.remove();
   // Retoma o relógio sem acumular tempo de combate durante a preparação.
   _last=performance.now();
  })().catch(error=>{
   boot.errors.push(error.message);screen.textContent=error.message+' Atualize a página para tentar novamente.';
  });
 },{once:true});
})();
