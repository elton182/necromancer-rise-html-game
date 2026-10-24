/* Proposta de balanceamento: independente do estado e dos saves do jogo. */
(function(root){
'use strict';
const nodes=[], schools=[];
function school(tree,id,name,paths,rows){
 schools.push({tree,id,name,paths});
 rows.forEach((r,i)=>nodes.push({id:r[0],name:r[1],description:r[2],icon:r[3],effects:r[4],school:id,tree,tier:i===0?0:Math.ceil(i/2),side:i===0?0:i%2===1?-1:1,max:i>=5?1:5,level:i===0?1:i<=2?6:i<=4?12:24,requires:i===0?null:rows[i<=2?0:i-2][0],exclusive:i>=5?rows[i===5?6:5][0]:null}));
}
school('minions','flesh','Carne',['Colosso de Carne','Horda Explosiva'],[
 ['zombie','Zumbis','Evoca 3 zumbis. Cada ponto fortalece Zumbis e Abominações.','☠',{'Dano de Zumbis e Abominações':4}],
 ['vigor','Carne Reanimada','Aumenta a vida de Zumbis e Abominações.','♥',{'Vida de Zumbis e Abominações':10}],
 ['burst','Explosão Cadavérica','Desbloqueia o comando de detonar um zumbi e aumenta seu dano.','✹',{'Dano da explosão de Zumbi':12}],
 ['abom','Abominação','Evolução do ramo Zumbi, equipada como evocação própria. Recebe as sinergias de Carne.','♜',{'Dano da Abominação':10}],
 ['unstable','Carne Instável','Sinergia entre a explosão dos Zumbis e Explosão Necrótica da árvore Profana.','✷',{'Dano das explosões de Zumbi e Necrótica':8}],
 ['colossus','Colosso de Carne','Especialização: Abominação ganha vida e o comando Salto Devastador. Exclui Horda Explosiva.','♜',{'Vida da Abominação':60,'Dano do Salto Devastador':40}],
 ['plague','Horda Explosiva','Especialização: +2 zumbis e explosões mais fortes. Exclui Colosso de Carne.','✹',{'Zumbis adicionais':2,'Dano da explosão de Zumbi':40}]
]);
school('minions','bone','Ossos',['Guarda Sepulcral','Legião de Arqueiros'],[
 ['skeleton','Esqueletos','Evoca 3 guerreiros. Pontos fortalecem guerreiros e arqueiros.','⚔',{'Dano de Esqueletos e Arqueiros':4}],
 ['armor','Armadura Óssea','Aumenta a vida dos guerreiros e arqueiros.','⛨',{'Vida de Esqueletos e Arqueiros':10}],
 ['archer','Arqueiros','Desbloqueia 2 arqueiros e aprimora seu dano.','➶',{'Dano dos Arqueiros':10}],
 ['blades','Ossos Afiados','Aprimora ataques dos dois tipos de esqueletos.','⚔',{'Dano de Esqueletos e Arqueiros':8}],
 ['shot','Tiro Sepulcral','Desbloqueia o disparo comandado dos arqueiros.','➶',{'Dano do Tiro Sepulcral':15}],
 ['guard','Guarda Sepulcral','Especialização: guerreiros ganham resistência e +1 integrante. Exclui Salva Sepulcral.','⛨',{'Vida dos Guerreiros':60,'Guerreiros adicionais':1}],
 ['salvo','Salva Sepulcral','Especialização: +2 arqueiros e tiro comandado mais forte. Exclui Guarda Sepulcral.','➶',{'Arqueiros adicionais':2,'Dano do Tiro Sepulcral':40}]
]);
school('minions','spirit','Espíritos',['Drenagem Vital','Cortejo Espectral'],[
 ['specter','Espectros','Evoca 2 espectros e aumenta seu dano mágico.','♧',{'Dano dos Espectros':8}],
 ['drain','Drenar Vida','Ataques dos espectros recuperam uma porcentagem do dano como vida própria.','♥',{'Roubo de vida dos Espectros':2}],
 ['ethereal','Essência Etérea','Aumenta a vida e o dano dos espectros.','◇',{'Vida dos Espectros':8,'Dano dos Espectros':5}],
 ['bond','Vínculo Vital','A cura produzida pelos espectros também ajuda Zephyr.','♥',{'Cura compartilhada com Zephyr':3}],
 ['step','Passo Espectral','Desbloqueia o comando de reposicionamento e aumenta sua frequência.','➤',{'Recarga do Passo Espectral':-5}],
 ['vampire','Ceifadores Vitais','Especialização: amplia a drenagem de vida. Exclui Cortejo dos Mortos.','♥',{'Roubo de vida dos Espectros':15}],
 ['procession','Cortejo dos Mortos','Especialização: +2 espectros e recuperação mais rápida. Exclui Ceifadores Vitais.','♧',{'Espectros adicionais':2,'Tempo de renascimento dos Espectros':-25}]
]);
school('spells','osso','Ossos',['Lança Perfurante','Tempestade Óssea'],[
 ['bolt','Tiro de Osso','Desbloqueia o projétil principal. Sinergia: +4% ao dano da Chuva por ponto direto.','➶',{'Dano do Tiro de Osso':10,'Dano da Chuva de Ossos':4}],
 ['pierce','Perfuração','Cada ponto permite atravessar um alvo adicional.','➳',{'Alvos perfurados adicionais':1}],
 ['rain','Chuva de Ossos','Desbloqueia dano em área. Sinergia: +4% ao dano do Tiro por ponto direto.','☄',{'Dano da Chuva de Ossos':10,'Dano do Tiro de Osso':4}],
 ['shards','Estilhaços','Melhora o dano de Tiro e Chuva de Ossos.','✧',{'Dano do Tiro de Osso':6,'Dano da Chuva de Ossos':6}],
 ['wall','Muralha de Corpos','Desbloqueia a muralha e amplia sua duração e resistência a projéteis.','▥',{'Duração da Muralha':10,'Resistência da Muralha':10}],
 ['lance','Lança Sepulcral','Especialização: projétil de alto dano. Exclui Tempestade Óssea.','➳',{'Dano do Tiro de Osso':60}],
 ['storm','Tempestade Óssea','Especialização: amplia área e dano da Chuva. Exclui Lança Sepulcral.','☄',{'Área da Chuva de Ossos':30,'Dano da Chuva de Ossos':35}]
]);
school('spells','blood','Sangue',['Bastião de Carne','Ritual de Detonação'],[
 ['shield','Escudo de Carne','Sacrifica um zumbi para proteger Zephyr. Herda o HP do zumbi aprimorado por Carne Reanimada.','⛨',{'Absorção do Escudo de Carne':8}],
 ['vitality','Vitalidade Profana','Aumenta a vida máxima de Zephyr.','♥',{'Vida de Zephyr':8}],
 ['nova','Explosão Necrótica','Desbloqueia explosão em área com mana, sem coleta de souls.','✹',{'Dano da Explosão Necrótica':12}],
 ['pact','Pacto de Sangue','Morte comum de aliado recupera vida de Zephyr. Não ativa em sacrifícios ou detonações.','♱',{'Vida máxima recuperada por morte de aliado':1}],
 ['ritual','Ritual Instável','Melhora Explosão Necrótica e Explosão Cadavérica.','✷',{'Dano das explosões de Zumbi e Necrótica':8}],
 ['bastion','Bastião de Carne','Especialização: amplia a absorção do escudo. Exclui Detonação Profana.','⛨',{'Absorção do Escudo de Carne':60}],
 ['detonation','Detonação Profana','Especialização: amplia as duas explosões. Exclui Bastião de Carne.','✹',{'Dano das explosões de Zumbi e Necrótica':40}]
]);
school('spells','shadow','Sombras',['Caminhante do Véu','Senhor da Horda'],[
 ['dash','Dash','Desbloqueia a evasão e reduz sua recarga.','➤',{'Recarga do Dash':-3}],
 ['stride','Passo Prolongado','Aumenta a distância do Dash.','➤',{'Distância do Dash':8}],
 ['meditate','Meditação Sombria','Aumenta reserva e regeneração de mana.','◈',{'Mana máxima':8,'Regeneração de mana':8}],
 ['veil','Véu Noturno','A evasão deixa uma proteção breve.','◇',{'Duração da proteção após Dash':10}],
 ['curse','Maldição da Fraqueza','Desbloqueia maldição que reduz o dano dos inimigos afetados.','☽',{'Redução de dano da Maldição':3}],
 ['walker','Caminhante do Véu','Especialização: Dash mais frequente e longo. Exclui Aura das Sombras.','➤',{'Recarga do Dash':-25,'Distância do Dash':25}],
 ['aura','Aura das Sombras','Especialização: aumenta o dano de toda a horda próxima. Exclui Caminhante do Véu.','☽',{'Dano da horda próxima':30}]
]);
const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
const budget=level=>3*(level-1), spent=r=>Object.values(r).reduce((a,b)=>a+b,0);
function reason(n,r,level){
 if(level<n.level)return `Requer nível ${n.level}.`;
 if(n.requires&&(r[n.requires]||0)<2)return `Requer 2 pontos em ${byId[n.requires].name}.`;
 if(n.exclusive&&r[n.exclusive])return `Incompatível com ${byId[n.exclusive].name}.`;
 return '';
}
function validate(state){
 if(!state||state.version!==1||!Number.isInteger(state.level)||state.level<1||state.level>60||!state.ranks||typeof state.ranks!=='object'||Array.isArray(state.ranks))throw Error('Código de build inválido.');
 const ranks={};
 for(const [id,rank] of Object.entries(state.ranks)){
  if(!Object.hasOwn(byId,id)||!Number.isInteger(rank)||rank<0||rank>byId[id].max)throw Error('Habilidade ou quantidade de pontos inválida.');
  if(rank)ranks[id]=rank;
 }
 if(spent(ranks)>budget(state.level))throw Error('A build excede os pontos do nível.');
 for(const id of Object.keys(ranks)){const error=reason(byId[id],ranks,state.level);if(error)throw Error(error);}
 return {version:1,level:state.level,ranks};
}
function invest(state,id){const n=byId[id];if(!n)throw Error('Skill inválida.');const error=reason(n,state.ranks,state.level);if(error)throw Error(error);if((state.ranks[id]||0)>=n.max)throw Error('Habilidade no máximo.');if(spent(state.ranks)>=budget(state.level))throw Error('Sem pontos disponíveis.');state.ranks[id]=(state.ranks[id]||0)+1;}
function prune(state){let changed=true;while(changed){changed=false;for(const n of nodes){if(state.ranks[n.id]&&reason(n,state.ranks,state.level)){delete state.ranks[n.id];changed=true;}}}}
function refund(state,id){const before=spent(state.ranks);if(state.ranks[id]){state.ranks[id]--;if(!state.ranks[id])delete state.ranks[id];prune(state);}return before-spent(state.ranks);}
function setLevel(state,level){state.level=Math.max(1,Math.min(60,Math.round(Number(level)||1)));prune(state);for(const n of [...nodes].reverse()){while(state.ranks[n.id]&&spent(state.ranks)>budget(state.level))refund(state,n.id);}return state;}
function effects(ranks){const out={};for(const n of nodes)for(const [key,value] of Object.entries(n.effects)){if(ranks[n.id])out[key]=(out[key]||0)+value*ranks[n.id];}return out;}
function effective(r){const e=effects(r);return {...e,'Dano total da Abominação':(e['Dano de Zumbis e Abominações']||0)+(e['Dano da Abominação']||0)+(e['Dano da horda próxima']||0),'Dano total da explosão de Zumbi':(e['Dano da explosão de Zumbi']||0)+(e['Dano das explosões de Zumbi e Necrótica']||0)+(e['Dano de Zumbis e Abominações']||0)+(e['Dano da horda próxima']||0),'Dano total da Explosão Necrótica':(e['Dano da Explosão Necrótica']||0)+(e['Dano das explosões de Zumbi e Necrótica']||0)};}
const presets={
 tank:{name:'Colosso Imortal',level:30,ranks:{zombie:5,vigor:5,abom:5,colossus:1,shield:5,vitality:5,pact:5,bastion:1,dash:2}},
 bomber:{name:'Horda Explosiva',level:30,ranks:{zombie:5,burst:5,unstable:5,plague:1,shield:2,nova:5,ritual:5,detonation:1,dash:2}},
 archer:{name:'Legião de Arqueiros',level:30,ranks:{skeleton:5,archer:5,shot:5,salvo:1,dash:5,meditate:5,curse:5,aura:1}},
 caster:{name:'Tempestade de Ossos',level:30,ranks:{bolt:5,rain:5,wall:5,storm:1,dash:5,stride:5,veil:5,walker:1,shield:2,vitality:3}},
 hybrid:{name:'Ceifador Híbrido',level:30,ranks:{zombie:4,vigor:3,abom:3,specter:5,drain:3,bond:3,vampire:1,bolt:5,rain:4,dash:3,meditate:4,curse:2,aura:1}}
};
const api={nodes,schools,byId,budget,spent,reason,validate,invest,refund,setLevel,effects,effective,presets};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BuildModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
