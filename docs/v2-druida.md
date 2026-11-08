# Druida (Flora) — primeira versão jogável

Implementado na v2. Novo personagem oferece agora Necromante, Guerreiro e Druida, cada um com saves e progresso próprios. Saves anteriores sem classe continuam Necromantes.

A Druida luta a distância com raios e plantas e, quando os inimigos chegam perto, vira lobisomem. A decisão central do combate é **quando trocar de forma**: a forma humana tem controle e dano em área, mas é frágil; a forma de lobo aguenta mais e anda mais rápido, mas consome mana a cada segundo e só se sustenta acertando as garras.

## Ações

O recurso é a mana existente no save. A barra é fixa nesta versão e muda inteira com a forma. Animações não aplicam dano: o efeito acontece no instante de liberação de cada ação, pelo caminho comum de dano, morte e recompensa. Paredes bloqueiam todos os acertos (`lineClear`). A esquiva (C ou slot 4) reutiliza a [esquiva básica](v2-combate.md#esquiva-básica) nas duas formas e cancela a ação em andamento.

### Forma humana

Durante as magias a Druida pode continuar andando; a pose da magia substitui a caminhada.

| Slot / tecla | Ação | Regra inicial |
|---|---|---|
| Clique / 1 | **Faísca** | Sempre disponível. Sem custo, recarga 0,55 s, ação de 0,45 s com liberação em 0,17 s. Raio instantâneo no primeiro inimigo cujo corpo cruza a linha da mira (meia largura 0,45 + raio do alvo) até 10 u; sem alvo, o raio para no alcance ou na primeira parede. 45% do poder natural, +6% por ponto em Faísca. |
| Botão direito / 2 | **Corrente de Raios** | Requer um ponto. 22 mana, recarga 6 s, liberação em 0,2 s. Primeiro alvo: o inimigo visível mais próximo do ponto mirado (até 2,5 u dele e 10 u da Druida); sem ninguém ali, o primeiro da linha. Salta para o inimigo visível mais próximo em até 5 u, ainda não atingido: 1 salto + 1 por ponto (2 a 4 saltos). 120% do poder, ×0,8 a cada salto. |
| 3 / Q | **Raízes** | Requer um ponto. 18 mana, recarga 7 s, liberação em 0,33 s (golpe do cajado no chão). Área de raio 2,4 no ponto mirado (até 10 u). 80% do poder (+10% por ponto) e prende por 2 s (+0,3 s por ponto): o inimigo não anda, mas **ainda ataca quem estiver ao alcance**. Chefes recebem o dano e não ficam presos. |
| 4 / E | Esquiva | Igual às outras classes. |
| 5 / R | **Tempestade** | Nível 6, requer Corrente. 35 mana, recarga 14 s, liberação em 0,4 s. Nuvem fixa de raio 3,5 no ponto mirado por 4 s: a cada 0,5 s até 3 inimigos dentro da área recebem um raio de 60% do poder. A borda e a sombra no chão mostram onde a nuvem age; sair da área evita os raios. |
| 6 / T | **Rejuvenescer** | Nível 6, requer Raízes. 25 mana, recarga 15 s. Cura 30% da vida máxima ao longo de 5 s. Mudar de forma não interrompe a cura. |
| F / Select | **Forma de Lobo** | Requer um ponto. Fora dos seis slots; veja abaixo. |

### Forma de lobo

| Slot / tecla | Ação | Regra inicial |
|---|---|---|
| Clique / 1 | **Garras** | Sem custo, recarga 0,42 s, impacto em 0,2 s. Arco de 130°, alcance 2,3 + raio do alvo. 75% do poder, +8% por ponto em Forma de Lobo. Golpes alternam as duas mãos. Um golpe que acerta pelo menos um inimigo devolve 3 de mana. |
| Botão direito / 2 | **Salto Feroz** | Nível 4, requer Forma de Lobo. 15 mana, recarga 6 s, ação de 0,6 s. Avança até 6 u (buscando cair a 0,6 u da mira) entre 0,1 e 0,45 s, com colisão contínua: não atravessa paredes. Em 0,47 s causa 150% do poder em raio 2,2. Não concede invulnerabilidade. |
| 3 / Q | **Uivo** | Nível 8, requer Forma de Lobo. Sem custo, recarga 16 s, efeito em 0,25 s. Inimigos em 6 u ficam 35% mais lentos por 3 s (os presos pelas Raízes continuam presos) e as garras causam +25% por 6 s; um anel laranja sob a Druida marca o frenesi. |
| 4 / E | Esquiva | Igual à forma humana. |

Garras, Salto e Uivo prendem a Druida no lugar durante a ação, como os golpes do Guerreiro.

**Regras da forma.** F alterna as formas, com recarga de 2 s e 0,35 s sem agir após a troca. Entrar exige pelo menos 10 de mana. Na forma de lobo:

- Não há magias da forma humana nem regeneração de mana.
- A forma consome 4 mana/s (−1/s por ponto em Coração Selvagem, mínimo 1/s).
- Dano recebido −20% e movimento +35%.
- Sem mana, a Druida volta sozinha à forma humana ao terminar a ação em curso e espera 4 s para se transformar de novo.

Morte e troca de cena devolvem a forma humana. A troca de forma usa o mecanismo do renderizador que recria o corpo quando `actor.model` muda (`druid` ↔ `druidWolf`).

## Árvore, atributos e equipamentos

Quatro ramos — **Tempestade**, **Natureza**, **Selvagem** e **Passivas** —, três pontos por nível como o Guerreiro. Os 14 nós somam 44 pontos e a árvore fica completa no nível 15. Investimentos em `character.druidRanks` respeitam nível, pré-requisito e orçamento ao carregar; nós novos devem entrar sempre no fim de `DRUID_NODES` (`v2/scripts/druid-model.mjs`).

| Ramo | Nó | Máx. | Nível / requisito | Efeito |
|---|---|---|---|---|
| Tempestade | Faísca | 5 | — | +6% de dano da Faísca por ponto |
| Tempestade | Corrente de Raios | 3 | — | Libera a Corrente; +1 salto por ponto |
| Tempestade | Tempestade | 1 | 6, Corrente | Libera a Tempestade |
| Natureza | Raízes | 3 | — | Libera as Raízes; +10% de dano e +0,3 s de prisão por ponto |
| Natureza | Casca de Espinhos | 3 | 4, Raízes | Inimigos presos recebem +10% de dano por ponto, de qualquer fonte |
| Natureza | Rejuvenescer | 1 | 6, Raízes | Libera a cura |
| Selvagem | Forma de Lobo | 3 | — | Libera a forma; +8% de dano das garras e do Salto por ponto |
| Selvagem | Salto Feroz | 1 | 4, Forma de Lobo | Libera o Salto |
| Selvagem | Coração Selvagem | 3 | 6, Forma de Lobo | −1 mana/s de consumo da forma por ponto |
| Selvagem | Uivo | 1 | 8, Forma de Lobo | Libera o Uivo |
| Passivas | Vigor da floresta | 5 | — | +10% de vida máxima |
| Passivas | Sabedoria antiga | 5 | — | +10% de mana máxima |
| Passivas | Seiva | 5 | — | +0,4 vida/s |
| Passivas | Afinidade | 5 | — | +8% de poder natural (magias e garras) |

A sinergia pensada para o combate é Raízes → Tempestade/Corrente: presos não saem da nuvem, e a Casca de Espinhos amplia todo o dano neles, inclusive as garras.

**Atributos.** A base é a mesma do Necromante (nível e itens do catálogo compartilhado, sem Grimório, horda nem maestrias), com vida ×1,1 e movimento ×1,125 (4,5 u/s no nível 1). O painel mostra o poder (`spell`) como **Poder natural**; garras e Salto também usam esse valor. A tabela de Detalhes lista Faísca, Corrente, Raízes, Tempestade, Garras e Salto.

**Equipamentos.** A Druida usa o catálogo do Necromante (cajado, grimório, armaduras e anéis), loot e mercador incluídos; não equipa espada nem escudo. Afixos de horda continuam no item, sem efeito para ela. O Osso Carcomido (especial do Tiro de Osso) não é sorteado para a classe. O texto de ambientação das peças é próprio.

## Saves

`character.classId` aceita `druid`. `character.druidRanks` guarda os 14 nós (0 até o máximo de cada um), recalculados pelo nível ao carregar; saves sem o campo recebem zeros. Forma atual, ação, recargas, nuvens e cura em andamento são transitórios e não são gravados. Contrato completo em [saves](v2-saves.md).

## Modelos e animações

### Forma de lobo atual

Em repouso, o lobo se apoia nas quatro patas. Ao correr, as traseiras impulsionam o corpo e as dianteiras recebem o peso em quatro batidas. O tronco flexiona ao recolher as pernas e há dois intervalos de suspensão por ciclo. Frente e ré usam 2,55 unidades por ciclo, e o deslocamento lateral usa 1,51. A prévia do galope está em [corrida.gif](../review/v2/lobo-galope/corrida.gif). O apoio é animado em piso plano no Blender.

Na primeira garra, a pata direita sobe, corta para a frente e desce. Na segunda, a esquerda varre de baixo para cima. A pata dianteira oposta sustenta o corpo. Cada golpe libera em 0,20 s. No Salto Feroz, as traseiras impulsionam o corpo e as dianteiras recebem o pouso no impacto de 0,47 s. O Uivo parte do apoio quadrúpede e atinge a pose de emissão aos 0,25 s.

Prévias e medição da altura das garras ficam em [review/v2/lobo-quadrupede](../review/v2/lobo-quadrupede/). O cenário de navegador é `node v2/tests/druid-wolf-motion-browser-check.cjs`.

### Base humana atual — pose T

A Flora humana usa `blender/reference/flora-tripo/druid-t-source.glb`, fornecido
em pose T, sem cajado e com o rosto frontal. Cena atual:
`blender/models/flora_tripo_druid_t.blend`; export:
`blender/exports/flora_tripo_druid_t.glb`. O gerador `flora_tripo_motion.py`
mantém a pose T de repouso e compõe a descida dos braços com cada ação.
A correção facial da base antiga não se aplica a esta versão.

O cajado é uma peça separada, gerada pelo mesmo script, com pesos rígidos na
mão direita. Corpo: 18.634 triângulos; cajado: 176; três materiais no conjunto,
nenhum vértice sem peso. O corpo preserva a textura original; o cajado usa
materiais sem textura. IDs, altura registrada, regras e lobo preservados.
Fontes humanas anteriores continuam no repositório.
Evidências em `review/v2/druid-t-pose/`.

### Histórico das bases Tripo anteriores

A v2 usa agora os dois modelos fornecidos pelo usuário, preservados em
`blender/reference/flora-tripo/druid-source.glb` e `wolf-source.glb`.
As cenas atuais são `blender/models/flora_tripo_druid.blend` e
`flora_tripo_wolf.blend`; os exports correspondentes ficam em `blender/exports/`.
Os IDs `druid` e `druidWolf`, alturas e regras de combate foram preservados.

O gerador atual é `blender/scripts/flora_tripo_motion.py`, executado via MCP
com `__file__` definido, como o gerador anterior. Ele importa as fontes em cenas
separadas, gera ações no rig Mixamo de 65 ossos e exporta uma malha por forma.
Inclui novos ciclos de respiração e caminhada, morte, esquiva, três ações de
cajado e quatro ações de lobo. As ações de combate preservam as frações de
liberação usadas na simulação. As ilhas externas do cajado recebem peso rígido
na mão direita para reduzir deformação pelos pesos automáticos.

Build e 12 testes de regras aprovados; conferência de navegador aprovada, sem erros de página ou requisições remotas, incluindo ações das duas formas e chão claro em qualidade baixa.

Auditoria: 18.938 triângulos na Flora e 19.526 no lobo, um material por forma,
UV presente e nenhum vértice sem peso. Evidências desta passagem ficam em
`review/v2/druid-tripo/`. A transformação continua sem clipe próprio.

A segunda passagem de animação acrescenta contraposição de quadril/tronco,
articulação de pés e dedos na caminhada, respiração com atraso entre tronco e
cabeça, preparação mais sustentada e recuperação progressiva nos ataques.
O Salto Feroz tem agachamento, extensão e compressão no pouso. Não muda
duração, liberação, dano ou deslocamento da simulação. As passadas usam IK de duas articulações na autoria, assada nos clipes;
o jogo não adapta os pés a terrenos irregulares em tempo real.

### Estudo anterior preservado

- Fontes: `blender/models/flora_druid.blend` e `blender/models/flora_werewolf.blend` (estudo visual descrito em `blender/notes/FLORA-PROTOTYPE.md`).
- Exports: `blender/exports/flora_druid.glb` (id `druid`, altura 2,9 com cajado e galhos) e `blender/exports/flora_werewolf.glb` (id `druidWolf`, altura 2,55), registrados em `v2/assets/models.json`.
- Gerador: [flora_game_motion.py](../blender/scripts/flora_game_motion.py), executado pelo MCP na sessão do Blender sobre o `.blend` aberto. É aditivo: guarda backup em `blender/backups/`, cria ou substitui só os clipes de jogo, preserva `idle`, `walk`, `attack` e `death` do estudo, salva o `.blend` e exporta o GLB com todas as ações.
  - Flora: `cast` (cajado aponta para o alvo; Faísca e Corrente), `cast_up` (cajado erguido; Tempestade e Rejuvenescer), `slam` (golpe no chão; Raízes) e `dodge`.
  - Lobisomem: `claw_1` e `claw_2` (golpes espelhados), `leap`, `howl` e `dodge`.
  - As poses são rotações no espaço do armature, convertidas para cada osso; o tempo de cada clipe segue o progresso da regra, não os quadros.

`idle`, `walk` e `death` continuam sendo os movimentos iniciais do estudo, sem revisão de combate. As ações são in-place, exceto a subida visual do `leap`; a simulação aplica o deslocamento e a colisão do Salto.

## Efeitos visuais

Em `vfx.mjs`, ligados à posição real:

- `lightning`: trilha irregular com núcleo branco e halo azul, do cajado ao alvo ou do céu ao chão.
- `thorns`: espinhos que brotam do chão, seguram enquanto a prisão dura e afundam no fim.
- `stormCloud`: sombra fria, borda e fumaça escura da Tempestade.

Também há anéis no chão: verde sob cada inimigo preso, verde-claro sob a Druida durante Rejuvenescer e laranja durante o frenesi do Uivo. A troca de forma reutiliza `summonBurst` e o Salto reutiliza `groundBreak`. Sons usam efeitos existentes: magias tocam o som de lançamento; garras, Uivo e pouso do Salto usam `windCut`, `wolfHowl` e `heavySlam`.

## Verificação e limites

- Regras: `node --test v2/tests/druid.test.mjs`, com 12 casos: classe e save, árvore, atributos, mundo sem horda, Faísca, Corrente, Raízes/Casca, Tempestade, Rejuvenescer, forma de lobo, Salto com parede e sessão.
- Navegador: `node v2/tests/druid-browser-check.cjs`, com Playwright e Edge em perfil isolado. Cobre seleção da classe, árvore pela interface, todas as ações, forma de lobo, chão claro com qualidade baixa e volta ao esgotar a mana.
- Evidências: [review/v2/druid](../review/v2/druid/).

Limites desta versão:

- Os números são iniciais e não passaram por balanceamento numa campanha completa.
- A barra não é personalizável.
- Não há falas ou cenas de campanha próprias da classe: o roteiro continua compartilhado.
- `idle`, `walk` e `death` vêm do estudo de sprites. Há clipes de passo lateral; não há clipe de transformação, então a forma muda com um clarão de folhas.
- No controle, as ações além do slot 1, da esquiva e da troca de forma (Select) seguem sem botão próprio, como no Guerreiro.

Validação da segunda passagem: build, 12 testes de regras e conferência de navegador aprovados, sem erros de página nem requisições remotas. Capturas em review/v2/druid-motion-polish/. Pranchas de caminhada, salto e lançamento inspecionadas no Blender.

Correção de direção: rosto e capuz da Flora alinhados ao corpo na pose de repouso, com correção de 35 graus na fonte importada; clipes strafe_left/strafe_right nas duas formas ativam a mistura direcional existente no renderizador, incluindo ré. Passadas com 50% de apoio, tornozelos guiados e IK assada. Verificação específica: node v2/tests/druid-direction-browser-check.cjs.

Refino de caminhada e strafe: velocidade do pé de apoio casada ao stride do jogo, menor excursão das pernas, orientação dos pés estabilizada e transferência lateral de peso. Quadril rebaixado durante a passada para manter o alcance dos joelhos sem esticar a perna. A auditoria de altura dos tornozelos fica em review/v2/druid-gait/support-audit.json; mede os ossos na autoria e não substitui inspeção da sola da malha ou adaptação a terreno irregular.

Postura humana de marcha: tronco inclinado para a frente com contraposição da cabeça, braço livre com cotovelo flexionado e balanço amplo, cajado carregado à frente do corpo. Pés passam 25% mais próximos da linha do quadril que na pose de apresentação. Passada visual humana ajustada para 1,9 unidades por ciclo (antes 1,6), sem alterar velocidade de jogo; o lobo mantém seu ciclo.

Conferência de postura: node v2/tests/druid-walk-posture-browser-check.cjs confirma que idle perde peso ao entrar em marcha e a mistura de locomoção recebe peso completo. Build, 23 testes e navegador aprovados nesta revisão; capturas e relatório em review/v2/druid-walk-posture/.

Alinhamento facial revisado: removida a compensação de 20 graus aplicada em cada clipe. O gerador agora deforma a malha com a cabeça alinhada em 35 graus e aplica essa pose como repouso do esqueleto antes de criar as ações. Assim, a orientação corrigida também existe sem animação e é exportada nas matrizes de bind do GLB. Fonte Tripo original preservada. Conferidas vistas frontal e três quartos sem ação ativa.

Revisão da forma de lobo: guarda compartilhada entre idle, caminhada, strafe e ações, com tronco avançado e cotovelos flexionados. Garras alternadas reconstruídas com preparação do quadril/ombro, extensão do braço na liberação e recuperação até a guarda; apoio das patas durante garras e Uivo guiado por IK assada. Uivo abre o peito e eleva cabeça/pescoço antes de voltar à guarda. Salto e esquiva recebem a mesma postura de base, preservando os deslocamentos e instantes de liberação da simulação. Verificação específica: node v2/tests/druid-wolf-motion-browser-check.cjs; evidências em review/v2/druid-wolf-motion/.

Validação desta revisão do lobo: build e 23 testes aprovados; teste de navegador das duas garras, habilidades e deslocamentos nas quatro teclas aprovado, sem erros de página ou requisições remotas. O teste verifica também que idle sai da mistura durante a locomoção.

Validação da base em pose T: build e 23 testes aprovados, conferência de navegador com seleção, ações, transformação e deslocamentos aprovada sem erros de página ou requisições remotas. Prévia frontal Cycles em review/v2/druid-t-pose/front-idle.png; caminhada e lançamento inspecionados em sequência no Blender.
Na base T, o eixo do cajado atravessa a palma direita. Polegar e dedos têm poses de pegada próprias. Em repouso a ponta fica junto ao piso. Na caminhada o antebraço eleva a haste e o braço livre recua no contato do pé esquerdo. Prévia do ciclo no Blender em review/v2/flora-pegada/caminhada.gif.
Na caminhada e nos passos laterais da forma humana, o gerador orienta os joelhos para a frente durante o apoio e o balanço. A prévia de perfil e as medidas ao longo do ciclo ficam em review/v2/flora-joelho/.
