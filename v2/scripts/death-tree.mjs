// Árvore Morte (Forma de Lich): mesmo desenho dos nós do Grimório (build-simulator/model.js), sem alterar o modelo compartilhado.
// Sem importações: usada pelo Grimório estendido (full-build.mjs) e pelas regras (lich-model.mjs).
export const DEATH_SCHOOLS=[],DEATH_NODES=[];
function school(id,name,paths,rows){
 DEATH_SCHOOLS.push({tree:'death',id,name,paths});
 rows.forEach((r,i)=>DEATH_NODES.push({id:r[0],name:r[1],description:r[2],icon:r[3],effects:r[4],school:id,tree:'death',tier:i===0?0:Math.ceil(i/2),side:i===0?0:i%2===1?-1:1,max:i>=5?1:5,level:i===0?1:i<=2?6:i<=4?12:22,requires:i===0?null:rows[i<=2?0:i-2][0],exclusive:i>=5?rows[i===5?6:5][0]:null}));
}
school('scythe','Foice',['Ciclone da Morte','Executor'],[
 ['lichform','Forma da Morte','Libera a transformação em Lich, com barra de almas no lugar da mana, +25% de dano e +25% de defesa enquanto ativa. Cada ponto aumenta as almas máximas.','☠',{'Almas máximas':5}],
 ['reach','Foice Longa','Aumenta o alcance dos golpes da foice e o dano da Ceifada.','⚔',{'Alcance da foice e dano da Ceifada':6}],
 ['spinning','Foice Giratória','Libera o arremesso; cada passagem prolonga Ceifado em 1 s, até 4 s. Aumenta seu dano.','✧',{'Dano da Foice Giratória':5}],
 ['triple','Colheita Tripla','Substitui o golpe do clique por três golpes gratuitos. O finalizador aplica Ceifado; aumenta seu dano.','⚔',{'Dano da Colheita Tripla':5}],
 ['arc','Gancho do Túmulo','Puxa inimigos na linha da mira; puxa mais os Ceifados. Chefes recebem lentidão. Aumenta seu dano.','⤶',{'Dano do Gancho do Túmulo':5}],
 ['cyclone','Ciclone da Morte','Especialização: libera a órbita de 360°, que consome Ceifado para um impacto com +75% de dano por alvo. Exclui Executor.','✷',{'Dano do Ciclone da Morte':10}],
 ['executor','Executor','Especialização: o golpe final da Colheita causa dano extra em alvos com pouca vida e marca por mais tempo. Exclui Ciclone da Morte.','♱',{'Dano do golpe final em alvos fracos':50}],
]);
school('harvest','Colheita',['Ceifador de Almas','Avatar da Morte'],[
 ['harvest','Colheita de Almas','Cada espírito absorvido rende mais almas.','◇',{'Almas por espírito':8}],
 ['hunger','Fome Eterna','Reduz a drenagem passiva de almas.','◈',{'Drenagem de almas':-6}],
 ['callspirit','Chamado Espectral','Aumenta o raio em que os espíritos são absorvidos.','♧',{'Raio de absorção':.3}],
 ['vessel','Recipiente','Aumenta as almas máximas.','◈',{'Almas máximas':4}],
 ['wail','Lamento','Absorver um espírito recupera uma parte da vida máxima.','♥',{'Vida máxima por espírito (%)':.5}],
 ['reaper','Ceifador de Almas','Especialização: elites e chefes rendem o dobro de almas. Exclui Avatar da Morte.','☠',{'Almas de elites e chefes':100}],
 ['avatar','Avatar da Morte','Especialização: a forma reduz o dano recebido e a transformação é mais rápida. Exclui Ceifador de Almas.','⛨',{'Dano recebido na forma':-25,'Duração da transformação':-33}],
]);
