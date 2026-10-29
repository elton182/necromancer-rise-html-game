# V2 — dano, Tiro de Osso e Dash (E4)

Fontes da v2: `v2/scripts/combat.mjs`, `training-model.mjs` e `session.mjs`.
Empacotamento: `v2/tools/build.cjs` e `combat-source.cjs`.
Os caminhos deste parágrafo são relativos à raiz do projeto.

## Escopo entregue

A magia de área experimental foi substituída por Tiro de Osso. Dash e o caminho
comum de dano estão integrados ao treino. Mana, recargas e proteção aparecem no
HUD. No checkpoint da E4 o personagem usava atributos básicos do nível 1; desde a E7 eles
vêm do nível, da árvore e dos equipamentos ([progressão](v2-progressao.md)). Horda, inimigos e boss mantêm atributos
e IA de treinamento até suas respectivas etapas de migração.

Movimento normal passa dos 5 u/s experimentais para os **4 u/s básicos atuais**,
obtidos de `EquipmentModel.moveSpeed()`. Isso é uma migração explícita da regra,
não uma alteração feita pelo redesenho visual. Vida 100, mana 80, regeneração
de mana 4/s e dano mágico 40 correspondem à base atual sem equipamentos.

## Fonte única das regras

`combat-source.cjs` lê funções específicas do HTML atual e o literal de
`COMBAT_TUNING` em `scripts/skill-trees.js`. Ele verifica âncoras de colisão e
falha claramente se a implementação mudar. Não executa o runtime do jogo antigo.

O build gera `v2/scripts/combat-rules.mjs`. Não editar esse arquivo isoladamente:
alterar a fonte canônica e, se sua estrutura mudar, o adaptador.
O manifesto de empacotamento registra hashes das fontes usadas.

`v2/scripts/shared-equipment.mjs` também é gerado a partir de
`scripts/equipment-model.js`, expondo somente `defenseReduction`, `spellDamage`
e `moveSpeed`. A v2 usa essas implementações sem manter fórmulas paralelas.
O teste compara os parâmetros gerados com a leitura atual das fontes.

## Tiro de Osso

| Regra básica | Valor |
| --- | --- |
| ID da ação | `raio` |
| Custo | 5 MP no nível 1, subindo linearmente (arredondado) até 20 MP no nível máximo (60) — `boltCost` em `combat.mjs` |
| Recarga | 0,5 s |
| Dano no nível 1 sem bônus | 20, piso de 40 × 0,5 |
| Velocidade | 14 u/s |
| Percurso máximo | 9 u |
| Alvos por projétil básico | Primeiro alvo atingido |

O lançamento é imediato. A pose de conjuração acompanha a apresentação, sem
adicionar preparação ao dano. A mira define a direção; clicar além de 9 u não
estende o percurso nem transforma o tiro numa magia de área.

A colisão verifica o segmento percorrido a cada atualização, com a distância
de contato de **1,095 u** e ordenação por projeção no segmento da fonte atual.
Não usa somente o ponto final. Essa tolerância de contato é independente dos
raios físicos de movimentação; um alvo pode ser tocado na borda do percurso.
Cadáveres são ignorados e cada projétil respeita seu limite de perfuração.

**Sólidos do cenário não bloqueiam o tiro**, conforme `updateBolts` atual.
O Dash e os atores colidem com esses sólidos. Não introduzir cobertura de
projéteis nesta migração sem uma mudança de regra explicitamente documentada.

Infraestrutura para Perfuração e Estilhaços está pronta: bônus de alvos e
três projéteis separados por 0,26 rad compartilham uma única lista de acertos.
Um inimigo recebe no máximo um acerto por disparo, inclusive se tocar vários
estilhaços. Esses bônus são exercitados por testes; sua ativação pelo Grimório
fica em E6. Não foram concedidos gratuitamente ao personagem do treino.

Mana insuficiente, recarga, pausa, morte ou coordenadas não finitas impedem o
lançamento sem cobrar recursos. Uma mira exatamente no centro do personagem
também é recusada sem custo, evitando criar um projétil parado.

O osso inteiro foi criado em Blender por `blender/scripts/v2_bone.py`, com cena
editável `blender/models/v2_bone.blend` e export `blender/exports/v2_bone.glb`.
Os estilhaços reutilizam `blender/exports/bone_shard.glb`. Ambos estão embutidos
no HTML. O osso e seu rastro têm prioridade visual sobre os modelos para não
sumirem dentro de uma horda densa, mantendo a posição lógica do voo. Rastros e
impactos são visuais e não aplicam um segundo dano.

## Dash

| Regra básica | Valor |
| --- | --- |
| ID | `dash` |
| Custo | 0 MP |
| Distância | 4,5 u |
| Duração | 0,18 s |
| Recarga | 3 s |
| Direção | Movimento; parado, usa a mira |
| Proteção | Ignora dano enquanto o deslocamento estiver ativo |

A varredura de terreno verifica todo o deslocamento e para no primeiro sólido
ou limite, sem deslizar lateralmente nem atravessar parede fina. Usa raio de
0,35 u da implementação atual do Dash. Ao terminar, a posição é regularizada
para o raio de movimento normal de 0,45 u da arena E3; essa correção pode recuar
o centro em até aproximadamente 0,1 u junto a uma superfície. A varredura é
contínua, em vez dos avanços de até 0,15 u usados no motor anterior.

O rastro, o anel ciano e o texto **Dash · protegido** acompanham a janela real.
A proteção acaba ao terminar ou encostar no obstáculo; não consome barreira ou
bloqueio ósseo durante a invulnerabilidade. Pausa congela deslocamento e recarga.
Morte, reinício, menu e aplicação de save removem o deslocamento transitório.

A infraestrutura aceita bônus de distância, redução de recarga e Véu. Pisos de
recarga de equipamento são aplicados antes do multiplicador de maestria, como
nos wrappers atuais. Esses modificadores ainda não estão conectados à build
importada; E6/E7 farão essa ligação. Não há acúmulo permanente do Véu: aplica
25% menos dano apenas durante seu temporizador.

## Caminho comum de dano

Projéteis, ataques aliados e áreas hostis usam `dealDamage`:

1. Ignora alvo morto, dano não finito ou não positivo.
2. Para o jogador: proteção do Dash, Véu, defesa pelo modelo compartilhado,
   absorção da barreira e bloqueio ósseo, nessa ordem.
3. Para aliados de linha de frente: multiplicador atual de 0,8, com um único
   arredondamento e mínimo de 1 para acertos positivos.
4. Para inimigos: piso do dano; sem empurrão por acerto comum.
5. Aplica vida e morte uma única vez e emite evento com alvo/fonte para crédito.

Áreas de perigo do treino passam por esse caminho para jogador e aliados
atingidos. Morte cancela ações pendentes e remove projéteis do jogador.
Eventos de morte não são um sistema de XP/loot: o consumo dessas recompensas
permanece em E7. O Escudo de Carne e o bloqueio ósseo têm tratamento de dano,
mas ainda não têm sua habilidade de criação/equipamento na interface da v2.

## Controles e saves

- Clique esquerdo ou `1`: Tiro de Osso.
- `C`: Dash. `Espaço` fica reservado ao futuro Escudo de Carne, conforme o jogo.
- Controle padrão: A/RT para tiro e L3 para Dash; Start mantém a pausa.
- Movimento, mira, importação e opções da E2/E3 continuam disponíveis.

Saves nativos continuam na versão 1. Mana/vida da luta, projéteis, eventos,
proteções e recargas são transitórios e não alteram o personagem arquivado.
Continuar/recomeçar abre uma arena limpa com recursos básicos completos.

## Verificação e limites

Na raiz:

```powershell
node v2/tools/build.cjs
node --test v2/tests/combat.test.mjs v2/tests/training-model.test.mjs v2/tests/save-session.test.mjs v2/tests/terrain.test.mjs
node --test scripts/equipment.test.js
node v2/tests/combat-browser-check.cjs
node v2/tests/movement-browser-check.cjs
node v2/tests/browser-check.cjs
node game_check.js
```

Exportar novamente o osso, somente se sua fonte mudar:

```powershell
blender --background --threads 4 --python blender/scripts/v2_bone.py
node v2/tools/build.cjs
```

Verificados: 41 testes da v2, 35 de equipamentos e 76 cenários do jogo atual;
Edge headless para combate, movimento e regressão de saves/cenas. Evidências
em [review/v2/e4](../review/v2/e4/), incluindo osso em voo e proteção no Dash.
Controle simulado, sem conferência com hardware físico. Visual conferido em
zoom próximo e com grupo/horda nos dois fundos e qualidade baixa.

O simulador de balanceamento anterior não foi alterado: suas regras canônicas
permanecem intactas. Esta entrega não fornece estimativa de balanceamento da
arena 3D. IA, composição e atributos completos da horda/inimigos, habilidades
restantes, equipamentos aplicados, XP e loot ficaram para as próximas etapas; a E7 entregou
os três últimos ([progressão](v2-progressao.md)).


Atualização E5: a composição e os atributos dos grupos da horda, comandos,
recuperação e seis slots foram integrados. Consulte [horda](v2-horda.md).
Os limites acima referentes à migração futura da horda descrevem o checkpoint
histórico da E4. Inimigos completos e Rei Caído foram integrados na [E8](v2-inimigos.md).
