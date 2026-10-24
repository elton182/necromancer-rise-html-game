'use strict';
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'../necromancer-canvas.html');
let html=fs.readFileSync(file,'utf8');
const begin='<!-- SKILL_VFX_BEGIN -->',end='<!-- SKILL_VFX_END -->';
const block=begin+'\n<script>\n'+fs.readFileSync(path.join(__dirname,'skill-vfx.js'),'utf8')+'\n</script>\n'+end+'\n';
const a=html.indexOf(begin),b=html.indexOf(end);
if(a>=0&&b>a)html=html.slice(0,a)+block+html.slice(b+end.length).replace(/^\r?\n/,'');
else {if(!html.includes('</head>'))throw Error('Missing head');html=html.replace('</head>',()=>block+'</head>');}
const pending=file+'.vfx.tmp';fs.writeFileSync(pending,html);fs.renameSync(pending,file);
console.log('Embedded skill VFX updated.');
