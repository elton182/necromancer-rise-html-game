const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('./model.js');
const fresh=(level=30)=>({version:1,level,ranks:{}});
test('3 pontos por subida de nível, sem orçamento compartilhado duplicado',()=>{
 const s=fresh(2);M.invest(s,'zombie');M.invest(s,'bolt');M.invest(s,'dash');
 assert.equal(M.spent(s.ranks),3);assert.throws(()=>M.invest(s,'shield'),/Sem pontos/);assert.equal(M.budget(1),0);
});
test('bifurcações só abrem com nível e dois pontos no pai',()=>{
 const s=fresh(5);M.invest(s,'zombie');M.invest(s,'zombie');assert.throws(()=>M.invest(s,'vigor'),/nível 6/);
 M.setLevel(s,6);M.invest(s,'vigor');M.invest(s,'burst');assert.equal(s.ranks.vigor,1);assert.equal(s.ranks.burst,1);
 assert.throws(()=>M.invest(s,'abom'),/nível 12/);
});
test('as duas rotas intermediárias coexistem, finais da escola são exclusivos',()=>{
 const s=M.validate({version:1,level:30,ranks:{zombie:2,vigor:2,burst:2,abom:2,unstable:2}});
 M.invest(s,'colossus');assert.throws(()=>M.invest(s,'plague'),/Incompatível/);
 M.refund(s,'colossus');M.invest(s,'plague');assert.equal(s.ranks.plague,1);
});
test('as 12 especializações finais abrem no nível 22, mantendo pré-requisitos',()=>{
 const finals=M.nodes.filter(n=>n.tier===3);assert.equal(finals.length,12);
 for(const n of finals){
  const s=fresh(21);for(let id=n.requires;id;id=M.byId[id].requires)s.ranks[id]=2;
  assert.equal(n.level,22);
  assert.throws(()=>M.invest(s,n.id),/nível 22/);
  M.setLevel(s,22);M.invest(s,n.id);assert.equal(s.ranks[n.id],1);M.validate(s);
  assert.match(M.reason(n,{},22),/Requer 2 pontos/);
 }
});
test('remover pré-requisito devolve descendentes, preservando outra bifurcação',()=>{
 const s=M.validate({version:1,level:30,ranks:{zombie:2,vigor:2,burst:2,abom:3,unstable:2,colossus:1}});
 assert.equal(M.refund(s,'vigor'),5);assert.equal(s.ranks.abom,undefined);assert.equal(s.ranks.colossus,undefined);assert.equal(s.ranks.unstable,2);M.validate(s);
});
test('diminuir nível remove skills indisponíveis e respeita o novo orçamento',()=>{
 const p=M.presets.hybrid,s=M.validate({version:1,level:p.level,ranks:p.ranks});M.setLevel(s,6);M.validate(s);assert.ok(M.spent(s.ranks)<=15);
 M.setLevel(s,1);assert.deepEqual(s.ranks,{});
});
test('sinergia de Zumbi afeta Abominação; pontes de explosão somam sem recursão',()=>{
 const e=M.effective({zombie:5,abom:3,unstable:2,ritual:3,nova:2,burst:1});
 assert.equal(e['Dano total da Abominação'],50);assert.equal(e['Dano total da Explosão Necrótica'],64);assert.equal(e['Dano total da explosão de Zumbi'],84);
});
test('códigos inválidos não aceitam excesso de pontos, skills falsas ou pré-requisitos ausentes',()=>{
 assert.throws(()=>M.validate({version:1,level:1,ranks:{zombie:1}}),/excede/);
 for(const ranks of [{abom:1},{zombie:6},{zombie:-1},{zombie:1.5},{constructor:1},{qualquer:1}])assert.throws(()=>M.validate({version:1,level:30,ranks}));
 assert.throws(()=>M.validate({version:1,level:30,ranks:{zombie:2,vigor:2,burst:2,abom:2,unstable:2,colossus:1,plague:1}}),/Incompatível/);
});
test('as cinco builds de exemplo sobrevivem a exportação e importação',()=>{
 for(const p of Object.values(M.presets)){const s={version:1,level:p.level,ranks:p.ranks};assert.deepEqual(M.validate(JSON.parse(Buffer.from(Buffer.from(JSON.stringify(s)).toString('base64'),'base64').toString())),s);}
});
test('sequência de compras, devoluções e mudanças de nível mantém todas as builds válidas',()=>{
 const s=fresh(60);let seed=21;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<1500;i++){const n=M.nodes[Math.floor(rand()*M.nodes.length)];if(i%29===0)M.setLevel(s,1+Math.floor(rand()*60));else if(rand()<.4)M.refund(s,n.id);else try{M.invest(s,n.id);}catch(e){}M.validate(s);}
});
