// Roda os *.test.* das pastas indicadas: node v2/tools/run-tests.cjs v2/tests [--test-reporter=dot]
// Existe porque `node --test` não aceita a mesma forma no Node 20 (pasta, sem glob) e no 22
// (glob, sem pasta), e o cmd do Windows, usado pelo npm, não expande `*`.
'use strict';
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'../..'),args=process.argv.slice(2);
const flags=args.filter(arg=>arg.startsWith('-')),folders=args.filter(arg=>!arg.startsWith('-'));
const files=folders.flatMap(folder=>fs.readdirSync(path.join(repo,folder)).filter(name=>/\.test\.[cm]?js$/.test(name)).map(name=>path.join(folder,name)));
if(!files.length){console.error('Nenhum teste encontrado em: '+(folders.join(', ')||'(nenhuma pasta indicada)'));process.exit(1);}
const {status,error}=spawnSync(process.execPath,['--test',...flags,...files],{cwd:repo,stdio:'inherit'});
if(error)throw error;
process.exitCode=status??1;
