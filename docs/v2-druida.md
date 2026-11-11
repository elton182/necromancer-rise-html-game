# Druida (Flora) — primeira versão jogável

Implementado na v2. Novo Jogo oferece seis classes, incluindo a Druida, com saves e progresso por personagem. Saves anteriores sem classe continuam Necromantes.

A Druida luta a distância com raios e plantas e, quando os inimigos chegam perto, vira lobisomem. A decisão central do combate é **quando trocar de forma**: a forma humana tem controle e dano em área, mas é frágil; a forma de lobo aguenta mais e anda mais rápido, mas consome mana a cada segundo e só se sustenta acertando as garras.

## Ações

O recurso é a mana existente no save. A barra muda inteira com a forma: na humana é montável desde 08/11/2026 (clique num slot do HUD, como nos atiradores; `skill-loadout.mjs`, campo `character.skillLoadout`), com Faísca e Esquiva sempre presentes; na de lobo continua fixa. Animações não aplicam dano: o efeito acontece no instante de liberação de cada ação, pelo caminho comum de dano, morte e recompensa. Paredes bloqueiam todos os acertos (`lineClear`). A esquiva (C ou slot 4) reutiliza a [esquiva básica](v2-combate.md#esquiva-básica) nas duas formas e cancela a ação em andamento.

### Forma humana

Durante as magias a Druida pode continuar andando; a pose da magia substitui a caminhada.

| Slot / tecla | Ação | Regra inicial |
|---|---|---|
| Clique / 1 | **Faísca** | Sempre disponível. Sem custo, recarga 0,55 s, ação de 0,45 s com liberação em 0,17 s. Raio instantâneo no primeiro inimigo cujo corpo cruza a linha da mira (meia largura 0,45 + raio do alvo) até 10 u; sem alvo, o raio para no alcance ou na primeira parede. 45% do poder natural, +6% por ponto em Faísca. |
| Botão direito / 2 | **Corrente de Raios** | Requer um ponto. 22 mana, recarga 4 s, liberação em 0,2 s. Primeiro alvo: o inimigo visível mais próximo do ponto mirado (até 2,5 u dele e 10 u da Druida); sem ninguém ali, o primeiro da linha. Salta para o inimigo visível mais próximo em até 5 u, ainda não atingido: 1 salto + 1 por ponto (2 a 4 saltos). 120% do poder, ×0,8 a cada salto. |
| 3 / Q | **Raízes** | Requer um ponto. 18 mana, recarga 4 s, liberação em 0,33 s (golpe do cajado no chão). Área de raio 2,4 no ponto mirado (até 10 u). 80% do poder (+10% por ponto) e prende por 2 s (+0,3 s por ponto): o inimigo não anda, mas **ainda ataca quem estiver ao alcance**. Chefes recebem o dano e não ficam presos. |
| 4 / E | Esquiva | Igual às outras classes. |
| 5 / R | **Tempestade** | Nível 6, requer Corrente. 35 mana, recarga 4 s, liberação em 0,4 s. Nuvem fixa de raio 3,5 no ponto mirado por 4 s: a cada 0,5 s até 3 inimigos dentro da área recebem um raio de 60% do poder. A borda e a sombra no chão mostram onde a nuvem age; sair da área evita os raios. |
| 6 / T | **Rejuvenescer** | Nível 6, requer Raízes. 25 mana, recarga 4 s. Cura 30% da vida máxima ao longo de 5 s. Mudar de forma não interrompe a cura. |
| F / Select | **Forma de Lobo** | Requer um ponto. Fora dos seis slots; veja abaixo. |

### Forma de lobo

| Slot / tecla | Ação | Regra inicial |
|---|---|---|
| Clique / 1 | **Garras** | Sem custo, recarga 0,42 s, impacto em 0,2 s. Arco de 130°, alcance 2,3 + raio do alvo. 75% do poder, +8% por ponto em Forma de Lobo. Golpes alternam as duas mãos. Um golpe que acerta pelo menos um inimigo devolve 3 de mana. |
| Botão direito / 2 | **Salto Feroz** | Nível 4, requer Forma de Lobo. 15 mana, recarga 4 s, ação de 0,6 s. Avança até 6 u (buscando cair a 0,6 u da mira) entre 0,1 e 0,45 s, com colisão contínua: não atravessa paredes. Em 0,47 s causa 150% do poder em raio 2,2. Não concede invulnerabilidade. |
| 3 / Q | **Uivo** | Nível 8, requer Forma de Lobo. Sem custo, recarga 4 s, efeito em 0,25 s. Inimigos em 6 u ficam 35% mais lentos por 3 s (os presos pelas Raízes continuam presos) e as garras causam +25% por 6 s; um anel laranja sob a Druida marca o frenesi. |
| 4 / E | Esquiva | Igual à forma humana. |

Garras, Salto e Uivo prendem a Druida no lugar durante a ação, como os golpes do Guerreiro.

**Regras da forma.** F alterna as formas, com recarga de 2 s e 0,35 s sem agir após a troca. Entrar exige pelo menos 10 de mana. Na forma de lobo:

- Não há magias da forma humana nem regeneração de mana.
- A forma consome 4 mana/s (−1/s por ponto em Coração Selvagem, mínimo 1/s).
- Dano recebido −20% e movimento +35%.
- Sem mana, a Druida volta sozinha à forma humana ao terminar a ação em curso e espera 4 s para se transformar de novo.

Morte e troca de cena devolvem a forma humana. A troca de forma usa o mecanismo do renderizador que recria o corpo quando `actor.model` muda (`druid` ↔ `druidWolf`).

### Vento e golpes do lobo (08/11/2026)

Desde 08/11/2026 as magias e golpes existentes da Druida recarregam em 4 s (antes: Corrente 6, Raízes 7, Tempestade 14, Rejuvenescer 15, Tornado 12, Salto 6, Uivo 16, Corte 6 e Garra 8 s); Faísca e Garras mantêm o ritmo do ataque básico. A redução de recarga dos itens continua valendo. Com 4 s, a Tempestade (4 s de duração) e o Rejuvenescer (5 s) podem ser renovados antes de acabar: a nuvem nova se soma, e a cura nova substitui a anterior.

Desenhados em [docs/habilidades/arvores.json](habilidades/README.md) a partir das ideias da árvore. Números iniciais, sem balanceamento de campanha.

| Ação | Forma / slot | Custo / recarga | Efeito |
|---|---|---|---|
| Turbilhão | Humana, barra montável | 12 mana / 4 s | Avança 9 u em linha reta a 10 u/s, solta em 0,2 s. Atravessa inimigos: 60% do dano em cada um (uma vez) e empurrão de 0,6 u para o lado; para em paredes. +8% de dano por ponto (até 5). Arcos de vento (`windarc`) e um anel no chão mostram a posição real. |
| Tornado | Humana, barra montável | 30 mana / 4 s | No ponto mirado (até 10 u), por 4 s: anda 1,2 u/s na direção da mira, puxa para o centro quem está a até 1,8 u (1,6 u/s; chefes e presos pelas Raízes não) e fere 25% a cada 0,4 s. Para em paredes. |
| Furacão | Aperfeiçoamento do Tornado | — | O Tornado passa a ter raio 2,7 e 6 s; ao terminar, explode com 120% do dano em raio 2,7 e empurra 1,5 u para fora (chefes só recebem o dano). |
| Corte Sangrento | Lobo, R / 5 (fixo) | 12 mana / 4 s | Garra em semicírculo de 180° até 4,6 u, 90% do dano. Os atingidos sangram: 15% do dano a cada 0,5 s por 4 s; um novo corte renova, sem somar. Anel vermelho sob quem sangra. |
| Garra de Gelo | Lobo, T / 6 (fixo) | 15 mana / 4 s | Garra em cone de 81° até 3 u, 130% do dano e 50% de lentidão por 2,5 s (chefes só recebem o dano). Anel azul-claro sob quem foi gelado. |

Na árvore: Turbilhão (Tempestade, nível 2, até 5 pontos), Tornado (nível 6, requer Turbilhão), Furacão (nível 12, requer Tornado), Corte Sangrento (Selvagem, nível 6, requer Salto Feroz) e Garra de Gelo (nível 8, requer Salto Feroz). Testes em `v2/tests/class-ideas.test.mjs`; navegador em `v2/tests/class-ideas-browser-check.cjs` (evidências em `review/v2/class-ideas/`).

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

A revisão atual usa `blender/models/flora_wolf_dynamic.blend` e
`blender/exports/flora_wolf_dynamic.glb`, gerados por `blender/scripts/flora_wolf_motion.py -- --dynamic`.
As cenas e os exports `flora_wolf_revised` da passagem anterior também estão preservados.
O modelo anterior `flora_tripo_wolf.blend` permanece intacto como entrada do gerador.
A revisão não altera o modelo humano, os strides do lobo (2,55 e 1,51), a altura registrada,
o dano, a colisão ou as regras de deslocamento.

O rig mantém seus 65 ossos originais e acrescenta `Tail1`, `Tail2` e `HeadJaw` (68 no total).
A cauda deixa de receber peso das coxas; dois segmentos seguem o quadril com atraso e
recolhem a ponta quando o uivo a aproxima do chão. A região central da juba deixa de
acompanhar os braços. A mandíbula abre discretamente no uivo e nas garras.
A postura de repouso dos ossos existentes continua preservada.

O galope reaproveita a base anterior. As duas garras foram reconstruídas com o quadril
iniciando a preparação, o tórax girando na execução e a cabeça compensando para manter
o olhar no alvo. A pelve recua e abaixa na preparação, avança e cruza o peso no golpe,
enquanto a perna de impulso gira sobre a ponta da pata e levanta o calcanhar. A pata
dianteira e a traseira opostas ficam fixas. A garra direita corta para baixo; a esquerda
varre para cima. Há continuidade do braço e do tronco antes de recuperar a guarda.
A excursão medida do tórax é aproximadamente 55 graus; a pelve percorre 0,153 unidade
da fonte e o tornozelo de impulso, cerca de 0,07. O pivô conserva a posição horizontal
da ponta da pata. Essas medidas verificam a articulação e os contatos; não são uma
simulação física do centro de massa.

A revisão mede a malha real das patas para corrigir penetrações e assenta as quatro
patas em repouso. O uivo se ergue sobre as traseiras, agora fixas no piso. A esquiva
parte da guarda baixa e recolhe o corpo; a morte foi reconstruída como colapso lateral
da postura quadrúpede, seguido de acomodação e imobilidade. A correção de piso da morte
usa a malha inteira, incluindo cauda e juba. Os clipes são in-place; o motor aplica o
deslocamento real de corrida, esquiva e Salto Feroz.

| Action (prefixo `AN_FloraWolf_`) | Frames | Duração a 30 FPS | Poses e eventos |
|---|---|---|---|
| `idle` | 1–85 | 2,8 s | Quatro apoios, respiração e cauda; ciclo |
| `walk` | 1–22 | 0,7 s | Impulsão traseira, suspensão e recepção dianteira; ciclo |
| `strafe_left`, `strafe_right` | 1–25 | 0,8 s | Deslocamentos laterais; ciclos |
| `claw_1` | 1–14 | 0,433 s | Preparar a direita, cortar para frente/baixo e recuperar; impacto visual no frame 7 |
| `claw_2` | 1–14 | 0,433 s | Preparar a esquerda, varrer para cima e recuperar; impacto visual no frame 7 |
| `leap` | 1–19 | 0,6 s | Comprimir, estender, receber nas dianteiras e recuperar; impacto no frame 15 |
| `howl` | 1–22 | 0,7 s | Erguer peito e focinho, abrir mandíbula e voltar; emissão nos frames 8–9 |
| `dodge` | 1–16 | 0,5 s | Recolher patas dianteiras e tronco, recuperar |
| `death` | 1–37 | 1,2 s | Ceder, tombar de lado, acomodar e manter |

Os frames são referências visuais: a simulação mantém impactos de garras em 0,20 s,
salto em 0,47 s e uivo em 0,25 s. Os nomes NLA/GLB continuam os mesmos; exportação amostrada
a cada frame, sem animar escala. Os controles finais são FK, com solução analítica dos
apoios durante a autoria; não há adaptação a terrenos irregulares em tempo real.

Na raiz do projeto:

```powershell
blender --background --python blender/scripts/flora_wolf_motion.py -- --dynamic --blocking
# Conferir poses CONSTANT em blender/backups/blocking/flora_wolf_dynamic_blocking.blend.
blender --background --python blender/scripts/flora_wolf_motion.py -- --dynamic
blender --background blender/models/flora_wolf_dynamic.blend --python blender/scripts/flora_wolf_review.py -- --dynamic
python blender/scripts/pack_flora_wolf_review.py --dynamic
node v2/tools/build.cjs
$env:NR_DRUID_REVIEW_DIR='../../review/v2/flora-wolf-dynamic/game'
node v2/tests/druid-wolf-motion-browser-check.cjs
```

Prancha, GIFs e relatório em `blender/previews/flora_wolf_dynamic/`; `attacks.gif` mostra
as duas garras em velocidade de autoria, com uma pausa na guarda. A auditoria percorre
todos os frames e verifica pesos, piso, fechamento dos ciclos, apoios opostos, pivô dos
dedos, excursão do tronco/quadril/perna, traseiras fixas no uivo e elevação no salto.
Os renders são prévias PBR em Eevee.
Essas medidas e a inspeção visual não comprovam ausência de toda interpenetração da
juba, cauda e membros, nem substituem uma campanha completa jogada.

#### Base de galope anterior (preservada)

Em repouso, o lobo se apoia nas quatro patas. Ao correr, as traseiras impulsionam o corpo e as dianteiras recebem o peso em quatro batidas. O tronco flexiona ao recolher as pernas e há dois intervalos de suspensão por ciclo. Frente e ré usam 2,55 unidades por ciclo, e o deslocamento lateral usa 1,51. A prévia do galope está em [corrida.gif](../review/v2/lobo-galope/corrida.gif). O apoio é animado em piso plano no Blender.

Na primeira garra, a pata direita sobe, corta para a frente e desce. Na segunda, a esquerda varre de baixo para cima. A pata dianteira oposta sustenta o corpo. Cada golpe libera em 0,20 s. No Salto Feroz, as traseiras impulsionam o corpo e as dianteiras recebem o pouso no impacto de 0,47 s. O Uivo parte do apoio quadrúpede e atinge a pose de emissão aos 0,25 s.

Prévias e medição da altura das garras ficam em [review/v2/lobo-quadrupede](../review/v2/lobo-quadrupede/). O cenário de navegador é `node v2/tests/druid-wolf-motion-browser-check.cjs`.

### Base humana atual — pose T

A revisão atual usa `blender/models/flora_human_revised.blend` e
`blender/exports/flora_human_revised.glb`, produzidos por `blender/scripts/flora_human_motion.py`.
A base anterior `flora_tripo_druid_t.blend` continua preservada e é a entrada do gerador;
o GLB T original e a forma de lobo também foram preservados.

O rig mantém seus 65 ossos e recebe dois controles de capa (`SpineCapeLeft` e
`SpineCapeRight`). O capuz acima de 0,70 na escala da fonte recebe peso rígido da cabeça;
a região posterior da capa deixa de acompanhar os braços e ganha atraso de movimento.
As solas recebem pesos corrigidos e as poses compensam penetrações no chão. A marcha e
os passos laterais reutilizam a base já revisada, com os mesmos strides de 1,9 e 1,12.

Os gestos humanos foram revistos: `cast` prepara, aponta o cajado e projeta a mão livre;
`cast_up` ergue cajado e mão para invocar; `slam` eleva e assenta a base da haste no solo.
Os pés permanecem apoiados durante esses gestos (variação dos tornozelos abaixo de 0,001
unidade da fonte na auditoria). Esquiva retorna à guarda e morte recebe correção de altura.
Os clipes usam solução analítica na autoria e chaves FK exportáveis; não há IK de terreno no jogo.

| Action (prefixo `AN_FloraHuman_`) | Frames | Duração a 30 FPS | Eventos e poses |
|---|---|---|---|
| `idle` | 1–97 | 3,2 s | Respiração e movimento sutil de capa; ciclo |
| `walk` | 1–27 | 0,867 s | Contato, passagem, impulso e troca de apoio; ciclo |
| `strafe_left`, `strafe_right` | 1–25 | 0,8 s | Passos laterais; ciclos |
| `cast` | 1–15 | 0,467 s | Preparação, extensão na região dos frames 6–7, recuperação |
| `cast_up` | 1–22 | 0,7 s | Elevação e invocação no frame 13, recuperação |
| `slam` | 1–19 | 0,6 s | Elevar, contato da haste no frame 11, recuperar |
| `dodge` | 1–16 | 0,5 s | Abaixar, recolher o cajado, recuperar |
| `death` | 1–37 | 1,2 s | Desequilíbrio, queda e pose final mantida |

As durações acima são as Actions, incluindo a quantização para frames inteiros.
As regras de liberação continuam em 0,17 s (Faísca), 0,20 s (Corrente), 0,33 s
(Raízes) e 0,40 s (Tempestade). Os frames são referências visuais; não criam um segundo
caminho de dano. O GLB exporta nove faixas NLA com nomes de clipe compatíveis, amostragem
a cada frame e sem chaves de escala. A pose T de repouso dos ossos existentes foi mantida.

Pipeline, a partir da raiz do projeto:

```powershell
blender --background --python blender/scripts/flora_human_motion.py -- --blocking
# Conferir poses CONSTANT em blender/backups/blocking/flora_human_blocking.blend.
blender --background --python blender/scripts/flora_human_motion.py
blender --background blender/models/flora_human_revised.blend --python blender/scripts/flora_human_review.py
python blender/scripts/pack_flora_human_review.py
node v2/tools/build.cjs
```

O script de revisão faz a auditoria antes dos renders PBR em Eevee. Verifica pesos,
fechamento dos ciclos, rigidez do cajado, apoios e piso em todos os frames. O relatório,
a prancha e os GIFs ficam em `blender/previews/flora_human_review/`. Isso não comprova
ausência de toda interpenetração entre folhas, braços e corpo. Não houve campanha completa.

Para salvar novas capturas de navegador sem substituir as históricas:

```powershell
$env:NR_DRUID_REVIEW_DIR='../../review/v2/flora-human-review/game'
node v2/tests/druid-browser-check.cjs
$env:NR_DRUID_REVIEW_DIR='../../review/v2/flora-human-review/walk'
node v2/tests/druid-walk-posture-browser-check.cjs
```

#### Base T anterior (preservada)

A Flora humana usa `blender/reference/flora-tripo/druid-t-source.glb`, fornecido
em pose T, sem cajado e com o rosto frontal. Cena atual:
`blender/models/sources/flora_tripo_druid_t.blend`; export:
`_to_delete/blender-models/exports/flora_tripo_druid_t.glb`. O gerador `flora_tripo_motion.py`
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

- Fontes: `_to_delete/blender-models/models/flora_druid.blend` e `_to_delete/blender-models/models/flora_werewolf.blend` (estudo visual descrito em `blender/notes/FLORA-PROTOTYPE.md`).
- Exports: `_to_delete/blender-models/exports/flora_druid.glb` (id `druid`, altura 2,9 com cajado e galhos) e `_to_delete/blender-models/exports/flora_werewolf.glb` (id `druidWolf`, altura 2,55), registrados em `v2/assets/models.json`.
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
- Só a barra da forma humana é personalizável; a da forma de lobo é fixa.
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

## Natureza: lobos e Planta Carnívora (09/11/2026)

- **Lobo:** ação equipável na forma humana, 30 MP, recarga 8 s (reduzida pelos itens), liberação em 0,35 s. Evoca um lobo com 65% da vida máxima e 45% do dano mágico da Druida, atacando a cada 1 s. Do segundo ao quinto ponto: +10% de vida e dano por ponto. Sem duração limite. Modelo animado `cryptHound` com tinta natural.
- **Mordida Pesada:** passiva automática. A cada 6 s, o próximo ataque de cada lobo causa 180% do dano da mordida; o segundo e terceiro pontos acrescentam 20 pontos percentuais cada, até 220%. A mordida tem preparação visível e verifica novamente distância e parede no impacto.
- **Alcateia:** +1 lobo por ponto, até quatro. Conjurar Lobo preenche vagas novas ou repõe mortos; não cura nem substitui os vivos. Com todas as vagas vivas, conjurar é recusado sem gastar mana. Os lobos continuam ativos durante a transformação da Druida.
- **Planta Carnívora:** aperfeiçoamento de Raízes, sem tecla/custo adicional. Nasce no ponto mirado por 8 s, com 60% da vida máxima da Druida e 45% do dano mágico por ataque, a cada 1,4 s, até 4,5 u. É fixa, pode ser destruída e não ataca através de paredes. No máximo uma; novas Raízes a substituem. Usa GLB próprio em `blender/exports/carnivorous_plant.glb`, com `idle`, `attack` e `death`.

Lobos feridos e mortos são preservados ao salvar e trocar de mapa (`character.druidPack`, proporções de vida); não renascem automaticamente. A morte da Druida desfaz a alcateia. Plantas, sangramentos e demais efeitos temporários são limpos na morte ou troca de cena. O Corte Sangrento revisado usa alcance 4,6 u e semicírculo de 180°, preservando dano e renovação sem empilhar.

Verificação de regras: `node --test v2/tests/skill-ideas-revision.test.mjs`. Conferência no navegador: `node v2/tests/skill-ideas-revision-browser-check.cjs` (Playwright, Edge/WebGL 2, perfil isolado). Evidências em [review/v2/skill-ideas-revision](../review/v2/skill-ideas-revision/). Números iniciais, sem campanha completa jogada.

## Progressão por pontos corrigida (09/11/2026)

Tempestade, Salto Feroz, Tornado, Furacão, Garra de Gelo, Corte Sangrento e Planta Carnívora agora aceitam cinco pontos. O primeiro conserva os números descritos nas tabelas; cada ponto depois dele soma +10% do dano base, até +40%. Corte Sangrento aumenta impacto e sangramento; a Planta aumenta dano e vida, mantendo o limite de uma planta e a duração de 8 s.

Os ranks extras de Tornado e Furacão somam bônus, sem multiplicá-los entre si: até +80% do dano base nos pulsos e na explosão com ambos no máximo. O primeiro ponto em Furacão mantém a transformação atual (área, duração e explosão).

Rejuvenescer e Uivo também aceitam cinco pontos: a cura total cresce de 30% para 50% da vida máxima (+5 pontos percentuais após o primeiro); o bônus de dano do Uivo cresce de +25% para +45% pelo mesmo critério. Custos, recargas e durações são preservados. Pontos antigos continuam válidos sem conceder ranks gratuitamente. Evidências em [review/v2/skill-rank-scaling](../review/v2/skill-rank-scaling/).

## Sinergias de escola (09/11/2026)

Além da progressão própria, cada ponto investido em uma habilidade do ramo fortalece em **2% do dano base** as outras habilidades de dano desse mesmo ramo. Os bônus são somados aos próprios, sem realimentação, sem contar passivas gerais ou bônus de equipamento. Dano contínuo e invocações recebem a escola correspondente; vida, custos, recargas e controle preservam suas regras. A árvore mostra o bônus recebido e suas fontes, ou a contribuição dos nós de suporte. A [regra completa de progressão e sinergias](habilidades/sinergias.md) descreve variantes e exceções. Essa mudança é de balanceamento e passa a beneficiar os ranks já investidos nos saves.

## Calamidade, Floresta, Escudo e Líder (10/11/2026)

Quatro novas ações da **barra montável humana**, acrescentadas ao final da tabela sem alterar os índices anteriores. Todas exigem um ponto no próprio nó. F continua alternando a transformação. Os efeitos já lançados continuam ao transformar; a morte e a troca de cena removem os efeitos temporários. A Esquiva cancela a preparação antes da liberação, mantendo o custo e a recarga. A redução de recarga dos equipamentos continua limitada a 50%.

| Habilidade | Nível e pré-requisitos | Mana / recarga | Regra |
|---|---|---|---|
| Calamidade | 18; Tempestade e Furacão | 55 / 24 s | Prepara 0,55 s e cria um furacão de raio 4 até 10 u. Dura 8 s e avança a 0,8 u/s na direção escolhida. Vento causa 30% do dano mágico a cada 0,5 s; raios causam 65% a até duas presas a cada 1 s. Recebe sinergia de Tempestade. |
| Floresta Tropical | 16; Planta Carnívora | 45 / 20 s | Prepara 0,45 s e evoca cinco plantas por 10 s numa região de raio 4,5 até 10 u. Cada planta usa vida, dano e pontos da Planta Carnívora. |
| Escudo de Folhas | 6; Rejuvenescer | 25 / 18 s | Prepara 0,3 s e protege por até 8 s, absorvendo dano equivalente a 35% da vida máxima no instante da conjuração. |
| Líder da Matilha | 12; Alcateia | 20 / 12 s | Aprender o nó fortalece um lobo vivo. A ação prepara 0,25 s e comanda a matilha contra uma presa por 6 s. |

**Calamidade:** o funil visual, a nuvem e o círculo acompanham a posição real. Os pulsos atingem apenas inimigos dentro da área com linha de visão a partir dela. Paredes interrompem o deslocamento; alvos atrás delas não recebem dano. Inimigos comuns são puxados a até 1,2 u/s; chefes e presas imobilizadas pelas Raízes não são puxados. O furacão termina sem a explosão final do Furacão básico. Uma mira obstruída não gasta mana nem inicia recarga.

**Floresta Tropical:** as cinco posições ficam fora dos sólidos, separadas entre si e visíveis a partir do centro. Sem espaço para cinco posições válidas, a conjuração é recusada sem custo nem recarga. Uma nova Floresta remove as cinco plantas anteriores, incluindo corpos; a planta produzida pelas Raízes tem limite separado e continua disponível. Assim, podem coexistir cinco plantas da Floresta e uma das Raízes. Todas podem ser destruídas, atacam até 4,5 u a cada 1,4 s, têm preparação de 0,4 s e verificam paredes antes do impacto. Usam o mesmo GLB animado da Planta Carnívora. O contorno verde acompanha a região enquanto houver plantas vivas.

**Escudo de Folhas:** a absorção acontece no caminho central de dano, depois da defesa e das proteções anteriores. Somente o dano restante consome sua resistência; o excedente reduz a vida. Golpes evitados pela Esquiva não consomem o Escudo. Nova conjuração substitui a resistência, sem somar escudos. Não altera a barreira de outros sistemas nem cura. A quantidade de folhas orbitando o corpo diminui com a resistência, e o slot mostra a absorção restante. Continua durante Rejuvenescer e transformação; termina quando a resistência chega a zero, o tempo acaba, a Druida morre ou sai da cena.

**Líder da Matilha:** o lobo vivo com menor índice da alcateia assume a liderança, fica visualmente maior e recebe um anel dourado e +30% de dano. Vida e colisão são preservadas. Se morrer, o próximo vivo assume sem ser curado. O comando escolhe uma presa visível a até 3,5 u da mira e 12 u da Druida. Sem presa ou lobo vivo, é recusado sem custo nem recarga. Os lobos priorizam a presa marcada, percorrem as rotas normais e mantêm suas recargas; o primeiro ataque do líder em cada comando usa Garras do Líder de 160% do dano dele, sem consumir a Mordida Pesada disponível. O golpe verifica novamente distância e paredes ao acertar. A marca não aumenta dano de outras fontes e termina ao expirar, a presa morrer ou a cena ser limpa.

Os pontos e os quatro ids de ação são persistidos pelos contratos existentes. Resistência do Escudo, plantas da Floresta, Calamidade e presa comandada são transitórios. A liderança é recalculada a partir dos lobos vivos ao carregar; somente as proporções de vida da alcateia continuam no save.

Verificações desta entrega: `node --test v2/tests/druid-expansion.test.mjs` e regressões dos sistemas afetados; `node v2/tests/druid-expansion-browser-check.cjs` para Edge/WebGL 2 com armazenamento isolado. Evidências em [review/v2/druid-expansion](../review/v2/druid-expansion/). Valores iniciais, sem balanceamento de campanha completa.
