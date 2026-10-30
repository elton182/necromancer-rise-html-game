# Lich da Forma da Morte (v2) — etapa de assets

Fontes originais preservadas em `../reference/lich/` (`skeleton_knight.glb`, `fantasy_scythe.glb`), com hashes em `manifest.json`. Nenhuma tinha animações: o corpo tem skin de 65 juntas `mixamorig:*`; a foice é uma malha rígida (eixo longo no Z, lâmina para +X).

## Reprodução

```powershell
blender --background --threads 4 --python blender/scripts/lich.py
blender --background --threads 4 --python blender/scripts/preview_lich.py
node v2/tools/build.cjs
```

`preview_lich.py` aceita `-- view=front|side|top|threeq zoom=<escala> clipe:quadro ...` e grava em `../previews/lich/`. O `.blend` é aberto e salvo por script; a cena do usuário aberta no Blender não é alterada.

## Como a foice é animada

- Osso livre `Scythe` (sem pai) com a malha da foice 100% ligada a ele, comprimento 0,95 do modelo (corpo = 1,0; a primeira passagem, com 1,25, ficou grande demais). A pose de encaixe fica deitada na altura da cintura, dentro da altura do corpo, para o renderizador medir só o corpo (`height` 2,6 em `v2/assets/models.json`).
- Cada quadro define a pose da foice (ponto do punho, guinada, elevação, giro do cabo). A mão direita vai ao punho por IK analítico de dois ossos; a esquerda vai ao ponto do cabo mais próximo do ombro. Os braços do esqueleto são curtos (≈ 0,24): quando o alvo passa do alcance a mão é limitada e pode se afastar um pouco do cabo.
- O resultado é gravado como rotações FK; o GLB não tem restrições. A escala do osso `Scythe` vai a 0,001 enquanto a foice está arremessada ou ainda se materializa.
- `v2_lich_scythe.glb` é a foice solta, na escala de jogo (≈ 2,5 u), com origem no centro do cabo, para o arremesso, o arco e o ciclone.

## Clipes (24 fps; duração = quadros/24)

| Clipe | Quadros | Loop | Uso proposto |
| --- | --- | --- | --- |
| `idle`, `walk` | 48, 24 | sim | Repouso e deslocamento no lugar |
| `slash` | 18 | não | Ceifada (contato ≈ 52%) |
| `combo_1`, `combo_2` | 18 | não | Golpes 1 e 2 da Colheita Tripla (2 com a lâmina invertida) |
| `combo_3` | 30 | não | Finalizador: foice ao alto, giro de 360° e pancada à frente |
| `throw` | 20 | não | Foice Giratória; a foice some do osso em ≈ 47% |
| `sweep` | 24 | não | Arco de 180°; foice some em ≈ 52% |
| `spin` | 24 | sim | Ciclone de 360°: braços erguidos, foice oculta (o motor a faz orbitar) |
| `catch` | 10 | não | Retorno da foice: reaparece em ≈ 55% |
| `transform` | 36 | não | Entrada na forma (agachado → erguido, foice se materializa); para sair, reproduzir ao contrário |
| `hit`, `death` | 8, 30 | não | Reação e morte; a foice cai ao chão |

Os instantes de contato/emissão acima são pontos de partida; precisam ser fixados quando as regras da forma existirem. Não há clipe `cast` nem `revert`.

## Limites

- Primeira passagem de animação: sem acabamento manual de dedos, tecido/capa, contatos dos pés (sem IK de apoio) nem revisão de interpenetrações no tecido. Prévias inspecionadas: um quadro por fase dos clipes principais; `walk`, `idle` e `spin` não foram avaliados em movimento, só em poses.
- `v2_lich.glb` tem 3,4 MB e o HTML da v2 passou de ≈ 45,5 para ≈ 51,6 MB com os dois GLBs; reduzir (menos canais amostrados, texturas) só depois de medir o tempo de carregamento.
- Conferido: o build aceita os clipes obrigatórios, os 248 testes `node --test v2/tests/*.test.mjs` passam e o jogo carrega os dois modelos com os 13 clipes. Um ator `lich` inserido na cena de treino foi renderizado, mas a conferência visual no jogo (tamanho, pés no chão, fundos claro/escuro, horda, qualidade baixa) e o teste de navegador com Playwright (não instalado nesta máquina) **não** foram feitos.

## Revisão de animação (29/10/2026)

Revisão feita no Blender aberto pelo MCP (cena separada `LichReview`, sem alterar a cena do usuário), medindo e olhando quadros de cada clipe. Mudanças em `scripts/lich.py`:

- **Foice**: encolhida de 1,25 para 0,95 e o punho passou de 45% para 40% do cabo. O IK agora leva o **centro da mão** (palma e dedos, medido nos vértices pesados ao osso) ao cabo, e não o osso do pulso; nos quadros medidos o centro da mão da direita fica a menos de 1 cm do eixo do cabo em todos os clipes com a foice na mão. Os dedos fecham em volta do cabo (eixo de curvatura = direção do cabo, sinal escolhido pelo que aproxima as pontas).
- **Pés no chão**: o quadril é ajustado a cada quadro para o pé mais baixo tocar o chão; a morte usa o osso mais baixo do corpo deitado (a malha termina a ≈ 3 cm do chão, e a foice a ≈ 1 cm).
- **Caminhada**: passada ampla (±0,5 rad), joelhos dobrando na passagem, tornozelo compensado, giro da pelve e contragiro do tronco, braço esquerdo e foice balançando, leve inclinação para a frente. A distância percorrida por ciclo continua a de `stride` 1,6.
- **Repouso**: balanço de peso do quadril, cabeça e respiração.
- **Golpes e arremessos**: passada de ataque (perna esquerda à frente), joelhos dobrados e tronco inclinado no contato; recuperação suave até o repouso.
- **Transformação**: encolhido com os punhos no peito, levantada brusca com os braços abertos, a foice se materializa na mão com leve excesso de escala e assenta.
- **Morte**: cambaleia, os joelhos cedem, o corpo tomba para trás sem atravessar o chão e a foice cai ao lado, no chão.
- Não revisados em movimento: `idle`, `spin` e `catch`; só poses.

### Segunda revisão (29/10/2026): empunhadura e levitação

- **Antebraço × cabo.** Em vários golpes o cabo ficava quase paralelo ao antebraço direito (6° a 30°), como um espeto atravessando o braço. `keep_grip` agora afasta o cabo para, no mínimo, 60° do antebraço (no plano dos dois, girando a lâmina junto); os quadros abaixo de 35° de desvio zeraram nos clipes da mão direita.
- **Mão esquerda.** Só segura o cabo quando o braço alcança; fora do alcance (mais de 6 cm de folga) ela relaxa em vez de pairar perto do cabo.
- **Levitação.** O Lich nunca toca o chão: repouso e ataques a ≈ 0,08 do corpo (a malha fica ≈ 0,07 a 0,09 acima do piso), `spin` a ≈ 0,2, morte começa levitando e termina no chão. A **caminhada** virou um deslize: tronco levemente inclinado, pernas arrastando para trás com balanço lento, pés caídos, altura ≈ 0,2 (≈ 0,5 u no jogo) com oscilação suave. No jogo uma sombra circular fixa no chão acompanha o Lich (como na harpia), inclusive em qualidade baixa.

### Terceira revisão (29/10/2026): voo e foice telecinética

Pedido do usuário: o voo parecia caminhar no ar, os ataques ainda pareciam no chão, e a foice deveria voar controlada pela mente. `scripts/lich.py` foi refeito nesse sentido (revisão visual no Blender pelo MCP):

- **A foice nunca está na mão.** Ela flutua à direita e atrás do Lich (≈ 1,4 u ao lado no jogo), balança e gira devagar; nos golpes ela **orbita o Lich** (posição polar em torno do peito: ângulo, raio e altura por quadro, com o cabo na direção radial). As mãos só **conduzem** (apontam para a foice, ou se abrem, ou fecham em punho na transformação). Isso eliminou o IK de empunhadura e os casos de foice fora da mão.
- **Alcance visual = alcance de dano.** Com o raio de órbita de 0,85 a 0,9 e o cabo de 0,95, a ponta chega a ≈ 3,4 u, igual ao `range` da Ceifada; os alcances de dano não foram alterados.
- **Voo, não passos.** Repouso: pairando a ≈ 0,2 do chão, pernas relaxadas e penduradas juntas para trás, balanço do corpo e da cabeça. Movimento: tronco inclinado para a frente (≈ 0,2 rad), pernas arrastando, inclinação lateral lenta e oscilação vertical, sem alternar pernas.
- **Ataques no ar.** Sem passada nem agachamento: o corpo se inclina e avança (≈ 0,12 u à frente) no contato, com o torso girando para a foice; no golpe final ele sobe e gira; no arremesso e no arco a mão aponta o alvo.
- **Transformação e morte.** A transformação sobe do chão até pairar, com os braços abertos e a foice se materializando ao lado. Na morte o controle se perde: o corpo tomba e a foice cai ao chão.
- **No jogo (`renderer.mjs`).** A foice lançada sai do ponto onde flutua (inclinada na vertical) e volta a ele antes de o clipe `catch` assumir.

### Quarta revisão (29/10/2026): voo parado e referência visual

- **Pose de voo** (repouso e movimento) a partir da imagem de referência enviada: corpo na vertical, **pernas retas e juntas com os pés apontados para baixo**, braços abertos com as mãos em garra (`arms='open'`). Pés, pernas e braços não se mexem: só o corpo e a foice sobem e descem (medido: variação de 0,07 apenas em Z em pés, mãos e cabeça). Ao se mover, o tronco só se inclina um pouco (≈ 0,1 rad).
- **Efeitos no jogo** (`vfx.mjs`): aura de fiapos roxos que sobem e evaporam do corpo (mais densa na transformação); vento da foice (hélice de fiapos claros em volta da foice em voo) e três arcos finos de vento nos golpes (`windarc`), só visuais.
- **Cell shading** do Lich e da foice arremessada (`renderer.mjs`): material toon de 3 faixas, cores mais saturadas e contorno escuro por casco invertido.
- **Espíritos**: fantasmas translúcidos e turvos (corpo de revolução, cauda ondulante, olhos e boca escuros, borda mais clara), com fiapos e brilho suave.

### Quinta revisão (29/10/2026): pés ao centro, corpo etéreo e mãos

- **Pés ao centro.** As pernas convergem uma para a outra (`conv`, ≈ 0,26 rad cada), de modo que os pés se encontram no eixo central e as vestes terminam numa ponta, como na imagem de referência.
- **Mãos.** Braços abertos e um pouco para baixo, com a palma virada para a frente (torção em torno do eixo do antebraço) e os dedos abertos em leque (`hand_pose`).
- **Corpo etéreo: removido.** A dissolução da metade de baixo do corpo foi tentada e retirada a pedido do usuário; o Lich volta a ser totalmente opaco.
