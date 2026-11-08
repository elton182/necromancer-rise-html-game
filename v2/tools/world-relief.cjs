'use strict';
// Aplica o relevo gerado (v2/scripts/world-relief.mjs) na edição publicada do mundo de Jacarandá, sem apagar o que foi esculpido à mão:
// alturas editadas ficam com a maior das duas, superfícies pintadas e rios da edição continuam. Guarda uma cópia em blender/backups/.
// Rodar de novo parte do terreno da cópia: alterações de relevo feitas no editor depois da primeira aplicação seriam substituídas.
// Uso, na raiz: node v2/tools/world-relief.cjs
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{formatMap}=require('./map-editor-server.cjs');
const root=path.resolve(__dirname,'../..'),file=path.join(root,'v2/assets/maps/campaign-world.json');
const mod=name=>import(pathToFileURL(path.join(root,'v2/scripts',name)).href);
(async()=>{
 const [{worldRelief,mergeRelief},{openGrid,closeGrid,blankTerrain},{resolveMap,normalizeMap}]=await Promise.all([mod('world-relief.mjs'),mod('map-terrain.mjs'),mod('map-model.mjs')]);
 const raw=fs.readFileSync(file,'utf8'),doc=JSON.parse(raw),backup=path.join(root,'blender/backups/campaign-world.before-relief.json');
 fs.mkdirSync(path.dirname(backup),{recursive:true});if(!fs.existsSync(backup))fs.writeFileSync(backup,raw);
 // Rodar de novo parte do terreno guardado na cópia (a edição sem relevo), mantendo peças, grupos e o resto do mapa atuais.
 const source=fs.existsSync(backup)?JSON.parse(fs.readFileSync(backup,'utf8')):doc;
 const {map:flat}=resolveMap(normalizeMap(doc).map,()=>null),terrain=source.terrain||blankTerrain(flat.size),rivers=(doc.terrain||terrain).rivers||[];
 const edited=openGrid(terrain),generated=worldRelief({rivers,paths:flat.objects.filter(o=>o.type==='path')});
 if(edited.cols!==generated.cols||edited.rows!==generated.rows)throw Error('Grade da edição diferente da gerada: ajuste o tamanho do mundo no editor.');
 doc.terrain=closeGrid(mergeRelief(generated,edited),rivers);doc.updated=Date.now();
 fs.writeFileSync(file,formatMap(doc));
 console.log('Relevo aplicado em',path.relative(root,file),'· cópia anterior em',path.relative(root,backup));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
