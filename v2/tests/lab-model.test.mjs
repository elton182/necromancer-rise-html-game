import test from 'node:test';
import assert from 'node:assert/strict';
import {createMeter,resetMeter,record,stats,tick,catalog,clipProgress,modelLabel,IDLE_STOP} from '../scripts/lab-model.mjs';

test('medidor soma golpes por origem e calcula DPS médio, janela recente e pico', () => {
 const m=createMeter();
 for(let t=0;t<10;t+=.5)record(m,t,100,t%1?'Zumbi':'Tiro de Osso');
 const s=stats(m,9.6);
 assert.equal(s.total,2000);assert.equal(s.hits,20);assert.equal(s.running,true);
 assert.ok(Math.abs(s.average-2000/9.6)<1e-9,'média sobre o tempo decorrido');
 assert.equal(s.recent,200,'janela de 5 s: dez golpes de 100');
 assert.equal(s.peak,300,'três golpes de 100 cabem numa janela de 1 s (golpes a cada 0,5 s: t=8,8.5,9 e depois 9.5 empurra o 8)');
 assert.deepEqual(s.by.map(x=>x.name).sort(),['Tiro de Osso','Zumbi']);
 assert.equal(s.by.reduce((n,x)=>n+x.total,0),2000);assert.ok(Math.abs(s.by.reduce((n,x)=>n+x.share,0)-1)<1e-9);
});

test('um golpe isolado não vira DPS gigante e a medição congela depois de 3 s sem golpes', () => {
 const m=createMeter();record(m,5,500,'Explosão');
 assert.equal(stats(m,5.1).average,500,'mínimo de 1 s de divisor');
 const frozen=stats(m,5+IDLE_STOP+10);assert.equal(frozen.running,false);assert.equal(frozen.average,500);
 record(m,20,500,'Explosão');assert.equal(stats(m,20.2).total,1000);
});

test('ignora dano inválido e zerar mantém a mesma referência', () => {
 const m=createMeter();for(const v of [0,-5,NaN,Infinity])assert.equal(record(m,1,v),false);assert.equal(m.hits,0);
 record(m,1,10);const ref=m;resetMeter(m);assert.equal(ref,m);assert.equal(m.total,0);assert.equal(m.first,null);assert.equal(stats(m,2).hits,0);
});

test('teste cronometrado começa no primeiro golpe, termina na duração e ignora golpes tardios', () => {
 const m=createMeter();resetMeter(m,10);
 assert.equal(stats(m,0).remaining,10,'ainda não começou');
 record(m,100,50,'a');record(m,105,50,'a');record(m,109.9,50,'a');
 assert.equal(stats(m,109.95).done,false);assert.ok(Math.abs(stats(m,105).remaining-5)<1e-9);
 assert.equal(record(m,110.5,9999,'a'),false,'depois do fim não conta');
 const s=stats(m,111);assert.equal(s.done,true);assert.equal(s.total,150);assert.equal(s.elapsed,10);assert.equal(s.average,15);
 assert.equal(record(m,112,10,'a'),false);assert.equal(m.total,150);
 const idle=createMeter();resetMeter(idle,5);record(idle,0,10,'a');assert.equal(tick(idle,5),true,'termina mesmo sem novos golpes');
});

test('catálogo só oferece modelos carregados, agrupados, e o progresso do clipe respeita o laço', () => {
 const groups=catalog(['warrior','zombie','player','lich','desconhecido']);
 assert.deepEqual(groups.map(g=>g.group),['Inimigos','Chefes','Lacaios','Jogador']);
 assert.deepEqual(groups[0].items,[{id:'warrior',label:'Guerreiro'}]);
 assert.equal(modelLabel('abom'),'Abominação');assert.equal(modelLabel('x'),'x');
 assert.equal(clipProgress(2.5,2,true),.25);assert.equal(clipProgress(2.5,2,false),1);assert.equal(clipProgress(-1,2,true),.5);assert.equal(clipProgress(1,0,true),0);
});
