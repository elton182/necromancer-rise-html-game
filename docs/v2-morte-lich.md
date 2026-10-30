# V2 — Árvore da Morte e Forma de Lich

Estado: **proposta; a etapa de assets (modelo e animações do Lich) foi entregue em 29/10/2026** — veja a seção 5 e [blender/notes/lich_v2.md](../blender/notes/lich_v2.md). As etapas de regras (seção 9) e de integração (seção 10) foram entregues: a Forma da Morte é jogável na v2. **Falta** balanceamento em partidas reais, acabamento visual, gamepad e a conferência por teste de navegador automatizado. Este documento define o comportamento observável e o plano de entrega; os números são pontos de partida para balancear, não regras vigentes. Escopo: v2 (jogo principal). As regras atuais do Grimório estão em [v2-grimorio.md](v2-grimorio.md), o das magias em [v2-magias.md](v2-magias.md) e o da horda em [v2-horda.md](v2-horda.md).

Decisões já tomadas com o usuário (29/10/2026): a transformação é uma **habilidade de slot**; a barra de almas **drena com o tempo e as habilidades especiais custam almas**; na forma, o jogador usa uma **barra própria fixa** de habilidades; a primeira entrega é este documento.

## Revisão implementada — foice (29/10/2026)

As regras desta seção substituem os valores do desenho inicial abaixo nos
pontos indicados. Os IDs persistidos `triple`, `arc` e `arco` são mantidos.

- Colheita Tripla aprendida substitui a Ceifada no clique/slot 1. É gratuita
  (sem mana nem almas) e não tem recarga entre combos. Cada clique avança um
  golpe após terminar o anterior, na janela de 0,6 s. Expirar a janela reinicia
  a sequência, sem penalidade de recarga. Q/3 permanece como atalho do combo;
  seu botão duplicado fica oculto no HUD. Antes de aprender, o clique é Ceifada.
- As maestrias de dano, alcance e ritmo da Ceifada continuam valendo no
  combo que a substitui. A maestria de ritmo da Colheita acelera os golpes
  (preparação e contato juntos), em vez de reduzir uma recarga inexistente.
- Foice Longa amplia o alcance de todas as habilidades da foice; mantém o
  bônus de dano da Ceifada. Não muda os custos das especiais.
- O finalizador aplica Ceifado por 2 s (4 s com Executor), com a lentidão e
  bônus de almas anteriores. A Giratória prolonga a marca em 1 s por passagem,
  com teto de 4 s restantes.
- Arco Ceifador foi substituído por **Gancho do Túmulo**. Custa 25 almas,
  recarga de 8 s, alcance base de 8 u e dano ×1,1 por perna. A foice avança
  em linha e volta; cada alvo é atingido uma vez por perna. A ida puxa até
  2 u, ou 4 u em alvos Ceifados, parando a 1,5 u de Zephyr e respeitando
  sólidos. Chefes ficam imóveis e recebem lentidão de 25% por 2 s.
- Ciclone consome Ceifado para causar +75% de dano naquele impacto, uma única
  vez por alvo e execução, além das passagens normais. Executor permanece
  como especialização alternativa de dano no finalizador contra alvos fracos.

Assim, a Colheita prepara marcas; a Giratória as mantém à distância; o Gancho
agrupa; o Ciclone encerra a preparação com dano em grupo. Sem Ciclone, Executor
favorece terminar inimigos feridos com a própria Colheita.

Teste de regras: `node --test v2/tests/lich.test.mjs v2/tests/lich-integration.test.mjs`.
Teste de navegador: `node v2/tests/combat-rework-browser-check.cjs`.
Evidências em `review/v2/combat-rework/`. Os valores ainda precisam de
balanceamento em partidas reais. O restante deste guia preserva o desenho
inicial e o histórico de entrega.

## 1. Nomes e árvores

| Árvore no Grimório | Nome atual | Novo nome | ID interno |
| --- | --- | --- | --- |
| Evocações | Minions | **Senhor dos Mortos** | `minions` (inalterado) |
| Magias | Profana | **Carne e Ossos** | `spells` (inalterado) |
| Nova | — | **Morte** | `death` |

Só os rótulos mudam: IDs de árvores, escolas e nós permanecem, e os saves não precisam de migração por causa do renome. Os rótulos vivem em `v2/scripts/grimoire-panel.mjs` (abas) e nos textos de interface que citam "Minions"/"Profana"; o resto do jogo e a versão legada continuam com os nomes antigos, pois o modelo canônico `build-simulator/model.js` é compartilhado com ela.

A aba **Morte** é a terceira aba de árvore, antes de Maestrias. Segue as regras do Grimório: 3 pontos por nível, nível mínimo por linha (1, 6, 12, 22), cada ligação exige 2 pontos no nó anterior, especializações finais mutuamente exclusivas, devolução por 20 de ouro por ponto.

## 2. Forma de Lich

### Entrar e sair

- **Forma da Morte** é uma habilidade de slot (como Chuva de Ossos), liberada pelo nó raiz da árvore Morte. Entrar custa **50 de mana**, tem recarga de **20 s** depois de sair e exige estar vivo e fora de outra forma.
- Ao ativar: animação `transform` de ~0,9 s, durante a qual Zephyr não sofre dano (mesma regra de evasão do Dash). A mana é paga ao iniciar; se a ativação for cancelada por morte ou troca de cena, nada é devolvido nem fica preso.
- Entra com **40 de 100 almas**. A barra de mana some do HUD e dá lugar à barra de almas; a mana restante fica **suspensa** (não regenera) e **volta ao valor anterior ao sair**, sem bônus acumulado.
- Sai por: almas em 0, habilidade **Libertar Forma** (último slot), morte do jogador, troca de cena, pausa para menu de personagem ou início de outra cena. Sair reverte o modelo, restaura a barra de habilidades normal e limpa foices em voo, espíritos e bônus da forma.
- Vida e defesa de Zephyr permanecem as mesmas; o lich **não cura** ao transformar nem ao sair.
- A forma não é gravada no save. Só os pontos da árvore Morte persistem (campo novo em `ranks`, com valor padrão vazio para saves antigos).

### Almas

- Barra com máximo **100** (cresce com a árvore). Unidade: pontos de alma; tempo em segundos, atualizado por `dt`.
- **Drenagem**: 1,5 almas/s enquanto transformado. Zerou, volta a Zephyr.
- **Espíritos**: todo inimigo que morre enquanto o jogador está na forma deixa um espírito visível (azul/ciano, conforme o guia visual) no local da morte, por **8 s**. O Lich o absorve quando chega a **3,0 u** dele; espíritos mais próximos de 6 u aceleram em direção ao Lich. Valor: comum **4**, elite **12**, chefe **40**. Mortes causadas por aliados, magias ou efeitos periódicos também deixam espírito; mortes de aliados, não.
- Espírito não absorvido some ao fim do tempo ou ao sair da forma. Absorver não cura, não concede XP e não conta como abate; o crédito de abate (XP, ouro, loot, maestria) continua sendo o do caminho de dano existente (`onEnemyDeath`).
- Absorver acima do máximo é perdido (sem bônus de excesso, nesta versão).
- Espíritos aparecem só na forma, para evitar poluição visual no jogo normal.

### Barra de habilidades na forma

Os seis slots são substituídos por esta barra fixa; ao sair, a barra do jogador volta intacta (não é regravada). O Dash (`C`) continua disponível, com as regras normais. Os comandos da horda ficam bloqueados na forma; os aliados seguem sua IA automática e suas habilidades automáticas.

| Slot | Habilidade | Entrada |
| --- | --- | --- |
| 1 | Ceifada | clique esquerdo / `1` |
| 2 | Foice Giratória | clique direito / `2` |
| 3 | Colheita Tripla | `Q` / `3` |
| 4 | Arco Ceifador | `E` / `4` |
| 5 | Ciclone da Morte | `R` / `5` |
| 6 | Libertar Forma | `T` / `6` |

Habilidades ainda não liberadas pela árvore aparecem apagadas, como no Relicário.

## 3. Habilidades da foice

Todas usam a posição e a mira do jogador, aplicam dano por `dealDamage` (mesmo caminho de dano, proteções, crédito de abate e maestria) e atingem cada inimigo **uma vez por execução** (ou por perna, no arremesso). Alcances em unidades de mundo (Tiro de Osso: 9 u). Dano = `spellDamage × multiplicador`, com bônus da árvore e de equipamentos como nas magias. Todas têm alcance claramente maior que o de um golpe corpo a corpo comum: a foice é uma arma de área.

| Habilidade | Forma | Alcance | Dano | Custo | Recarga | Notas |
| --- | --- | --- | --- | --- | --- | --- |
| **Ceifada** (básica) | Arco frontal de 120° | 3,4 u | ×0,9 | 0 | 0,55 s | Contato a ~0,2 s do início; é a única habilidade sem custo de almas |
| **Foice Giratória** | Foice arremessada em linha, gira, atinge na ida e volta ao Lich | 11 u de ida; hitbox 1,4 u | ×1,2 por perna | 15 almas | 6 s | Ida ~0,5 s, volta ~0,5 s; antes do retorno, a Ceifada fica indisponível (máx. 1,0 s); a volta persegue o Lich se ele se mover; sai da forma → foice recolhida |
| **Colheita Tripla** (combo) | 3 golpes: arco, arco invertido, giro final | 3,4 / 3,4 / 4,2 u | ×1,0 / ×1,1 / ×2,0 | 10 almas ao iniciar | 4 s | Cada golpe seguinte exige novo clique em até 0,6 s (senão o combo termina). **Finalizador**: onda de foice de 6 u à frente e marca **Ceifado** (2 s, +50% de almas nos espíritos desses inimigos e lentidão de 30%) |
| **Arco Ceifador** (180°) | Foice arremessada em semicírculo à frente (da esquerda para a direita), volta à mão | raio 5,5 u | ×1,3 por perna | 25 almas | 8 s | Duração ~0,9 s, trajetória e hitbox desenhadas no chão |
| **Ciclone da Morte** (360°) | Foice orbita o Lich em círculo completo | raio 4,5 u, 1,4 s | ×0,8 por passagem (≈2 passagens) | 40 almas | 14 s | O Lich pode se mover devagar (−40%) durante o ciclone; ele **não** é imune a dano |
| **Libertar Forma** | Retorno a Zephyr | — | — | 0 | 1 s | Também é a saída automática com 0 almas |

Regras comuns:

- **Preparação, execução e recuperação** são estados explícitos; o clipe visual segue o estado real. O impacto acontece uma vez, no instante de contato registrado por clipe (nunca ao iniciar, nunca duas vezes em quadros longos). A varredura de colisão é feita ao longo da trajetória da foice (não só no ponto final) e respeita sólidos e muralhas; uma Muralha de Corpos aliada não bloqueia a foice.
- Morte do jogador, saída da forma ou troca de cena cancelam golpes, devolvem a foice à mão e removem áreas e marcas Ceifado.
- Bônus da árvore (alcance, dano, almas) se aplicam recalculados a cada mudança de perfil, nunca acumulados.

## 4. Árvore Morte (rascunho)

Duas escolas, no padrão de 7 nós (raiz, quatro nós, duas especializações exclusivas), nos níveis 1, 6, 12 e 22.

**Escola Foice**

| Nó | Efeito |
| --- | --- |
| `lichform` — Forma da Morte (raiz) | Libera a habilidade de slot; +5 almas máximas por ponto |
| `reach` — Foice Longa | +6% de alcance e dano da Ceifada por ponto |
| `spinning` — Foice Giratória | Libera a habilidade; +5% de dano por ponto |
| `triple` — Colheita Tripla | Libera o combo; +5% de dano por ponto |
| `arc` — Arco Ceifador | Libera o arco de 180°; +5% de dano por ponto |
| `cyclone` — Ciclone da Morte (especialização) | Libera o 360°; exclui Executor |
| `executor` — Executor (especialização) | Finalizador da Colheita causa dano extra em alvos abaixo de 25% de vida e marca por mais tempo; exclui Ciclone |

**Escola Colheita**

| Nó | Efeito |
| --- | --- |
| `harvest` — Colheita de Almas (raiz) | +8% de almas por espírito por ponto |
| `hunger` — Fome Eterna | −6% na drenagem passiva por ponto |
| `reach_souls` — Chamado Espectral | +0,3 u de raio de absorção por ponto |
| `vessel` — Recipiente | +4 almas máximas por ponto |
| `wail` — Lamento | Ao absorver um espírito, +0,5% de vida máxima por ponto de nível do nó (sem sobrecura) |
| `reaper` — Ceifador de Almas (especialização) | Elite e chefe rendem o dobro de almas; exclui Avatar |
| `avatar` — Avatar da Morte (especialização) | Forma com +25% de defesa e transformação mais rápida; exclui Ceifador de Almas |

Nós da escola Colheita só têm efeito dentro da forma, mas podem receber pontos antes dela; a interface informa "Requer Forma da Morte". Os IDs são estáveis a partir da implementação.

### Maestrias

A decisão de dar maestria às habilidades da foice fica para depois do primeiro balanceamento. Enquanto isso, a forma não concede XP de maestria para as ações dos slots normais (que não estão equipadas na forma).

## 5. Modelos e animações

Arquivos fornecidos (cópias não feitas ainda; origem `Downloads`):

| Arquivo | Conteúdo | Pontos de atenção |
| --- | --- | --- |
| `skeleton knight 3d model.glb` | Malha de 14 810 vértices, 1 skin de **65 juntas** (nomes `mixamorig:*`, a mesma estrutura dos humanoides importados da v2), textura embutida, **sem animações**, pose de descanso, altura normalizada em 1,0 | Aferir pose, pesos de dedos e capa/tecidos antes de animar |
| `fantasy weapon 3d model.glb` | Foice rígida, 11 967 vértices, sem skin, 3 texturas, eixo longo no Y (0 a 1) | Escalar para ~2,5 u de comprimento no jogo, fixar na mão direita com ponto de empunhadura, e eventualmente separar do corpo para o arremesso |

Entregue (primeira passagem, sem acabamento manual): fontes copiadas para `blender/reference/lich/` (com hashes), gerador `blender/scripts/lich.py`, `blender/models/v2_lich.blend`, `blender/exports/v2_lich.glb` (corpo, foice no osso `Scythe` e 13 clipes) e `blender/exports/v2_lich_scythe.glb` (foice solta na escala de jogo, ≈ 2,5 u). Registrados em `v2/assets/models.json` como `lich` (altura 2,6; clipes `idle`, `walk`, `slash`, `combo_1`, `combo_2`, `combo_3`, `throw`, `catch`, `sweep`, `spin`, `transform`, `hit`, `death`) e `lichScythe`. Diferenças em relação ao plano: não há `revert` (a saída reproduz `transform` ao contrário) e foi acrescentado `catch` (foice voltando à mão). Detalhes, mapeamento clipe → habilidade e limitações em [blender/notes/lich_v2.md](../blender/notes/lich_v2.md).

Pendências de assets: instantes de contato/emissão por clipe dependem das regras; acabamento de dedos, capa e pés; conferência no jogo com o ator do Lich; redução do tamanho do GLB se o carregamento sofrer.

## 6. Integração no código

| Área | Arquivo | Mudança |
| --- | --- | --- |
| Regras da forma, almas, espíritos, foice | `v2/scripts/lich-model.mjs` (novo, sem DOM/Three) | Estado `w.lich`, drenagem, espíritos, execução das habilidades, limpeza; testes isolados |
| Ligação ao combate | `v2/scripts/combat.mjs`, `spells.mjs`, `actions.mjs` | Bloquear Tiro de Osso/magias na forma; habilidade de slot `lich`; gancho de morte para espírito; caminho único de dano |
| Árvore | `v2/scripts/grimoire.mjs`, `grimoire-panel.mjs` e um módulo de nós da árvore Morte | Aba nova e rótulos novos; nós adicionados sem alterar o modelo canônico compartilhado com a versão legada |
| HUD | `game-ui.mjs`, `v2/tools/ui-layout.html`, `ui.css` (`shared-hud.css` é gerado) | Barra de almas no lugar da de mana; barra fixa de seis slots |
| Entrada | `input.mjs`, `gamepad.mjs` | Mapear slots da forma; `T`/6 sai da forma |
| Renderização | `renderer.mjs`, `vfx.mjs`, `vfx-events.mjs` | Trocar o modelo do jogador, espíritos, foice em voo, trilhas e áreas |
| Registro e build | `v2/assets/models.json`, `v2/tools/build.cjs` | Novo modelo e módulo |
| Save | `save-model.mjs` | Normalização dos novos `ranks` com padrão vazio; forma não persistida |

## 7. Etapas e verificação

1. **Rótulos** — renomear as abas e textos. Teste de interface (`ui-browser-check.cjs`/`grimoire-browser-check.cjs`) e Grimório.
2. **Assets** — modelo e foice no Blender, ações, prévias e GLBs; `node v2/tests/model-revision-browser-check.cjs` ou equivalente novo para os clipes.
3. **Regras** — `lich-model.mjs` e testes `node --test`: entrada/saída, drenagem, espíritos, custo, execução única dos golpes em passos longos e curtos, cancelamento por morte/troca de cena, valores padrão de saves antigos.
4. **Integração** — Grimório, HUD, entrada, combate (sem caminho de dano próprio), save.
5. **Visual** — trajetórias e áreas desenhadas no chão, espíritos e trilhas; conferir fundo claro/escuro, grupo com horda e qualidade baixa; evidências em `review/v2/morte/`.
6. **Balanceamento** — ajuste dos números com partidas reais; registrar a mudança.

Cada etapa só é declarada concluída com testes e verificação visual executados.

## 8. Pontos em aberto

- Valores numéricos (almas por espírito, drenagem, custos, recargas, multiplicadores, alcance) são propostas.
- O Dash permanece disponível na forma; confirmar se também deve gastar almas.
- Se os espíritos devem existir fora da forma como pista visual.
- Avaliar se o Lich deveria ter vida própria (hoje compartilha a de Zephyr).
- Maestria para as habilidades da foice.
- Trocar a entrada do GitHub Pages (`index.html` da raiz) para a v2 fica fora deste escopo.

## 9. Regras implementadas (etapa 3, 29/10/2026)

Fonte: [lich-model.mjs](../v2/scripts/lich-model.mjs), sem DOM nem Three.js; testes em [lich.test.mjs](../v2/tests/lich.test.mjs) (`node --test v2/tests/lich.test.mjs`). Os valores das seções 2 a 4 foram implementados como constantes `LICH`; ajustar o balanceamento é mudar essa tabela.

**Estado e API.** `w.lich` (forma `none` | `transform` | `lich`, almas, recargas, ação em curso, combo, foice, `moveFactor`, `invuln`, `pose` e `events`) e `w.spirits`. Funções: `setLichRanks(w, ranks)`, `enterLich`, `castLich(w, id)`, `exitLich(w, motivo)`, `tickLich`, `lichSlots`, `lichStats`. As habilidades usam os IDs `ceifada`, `giratoria`, `colheita`, `arco`, `ciclone` e `libertar`; o tipo de slot de entrada ainda não existe (é `enterLich`). `DEATH_NODES` e `DEATH_SCHOOLS` descrevem a árvore no formato dos nós do Grimório, mas não estão ligados a `Build` nem ao painel.

**Ligações no motor (únicas alterações fora do modelo):**
- `combat.mjs`: `kill` chama `w.onLichKill` (espírito); `dealDamage` ignora dano durante a transformação e aplica o Avatar na forma; `castBolt` fica bloqueado na forma; `beginDash` só é bloqueado durante a transformação.
- `spells.mjs`: `castSpell` fica bloqueado na forma.
- `training-model.mjs`: `initializeLich` na criação do mundo e `tickLich` a cada passo; a velocidade do jogador multiplica `w.lich.moveFactor` (0 transformando, 0,6 no Ciclone). A morte do jogador sai da forma pelo encadeamento de `onPlayerDeath`.
- `v2/tools/build.cjs`: módulo registrado (`v2-lich-model`).

**Decisões tomadas na implementação** (revisáveis):
- Os golpes aplicam dano uma vez, no instante de contato registrado na tabela (Ceifada 0,28 s, golpes 1 e 2 em 0,31 s, final em 0,8 s, arremesso em 0,39 s, arco em 0,52 s); a simulação usa subpassos de 1/60 s e passos longos dão o mesmo resultado que passos curtos.
- O arco de 180° e a perna de volta contam como duas pernas: um alvo no fim do arco, ou colado em Zephyr, pode ser atingido de novo no retorno. A Foice Giratória também acerta na ida e na volta e volta ao ver um sólido.
- A foice só "pousa" (clipe `catch`) depois que o clipe do arremesso termina; enquanto está fora, Ceifada, Colheita, Arco e Ciclone ficam indisponíveis.
- A Colheita só aceita o próprio botão durante a janela de 0,6 s; qualquer outra habilidade fica bloqueada até o fim da janela ou do combo. A marca Ceifado é aplicada antes do dano do golpe final, de modo que o espírito de quem morre nele já rende +50%.
- O espírito é puxado a partir de 6 u e absorvido a 3 u (mais com Chamado Espectral). Absorver acima do máximo perde o excedente.
- Sair da forma devolve a mana guardada ao entrar (já descontados os 50 MP), zera recargas das habilidades da foice e abre 20 s de reentrada (0 em morte e troca de cena). A vida do Lich é a de Zephyr.
- `w.lich` é recriado a cada `resetWorld` mantendo os pontos da árvore; nada é gravado no save.

**Verificação executada.** 19 testes novos e as 269 provas de `node --test v2/tests/*.test.mjs` passam; o HTML foi regenerado e, no navegador, o módulo embutido entrou na forma e a Ceifada causou dano. **Não verificado:** interface e entrada (slots, barra de almas, tecla da transformação), renderização do Lich e dos espíritos, integração com o painel do Grimório, saves, desempenho e balanceamento em partidas reais.

## 10. Integração (etapa 4, 29/10/2026)

**Grimório.** `v2/scripts/full-build.mjs` estende o modelo canônico (`shared-build.mjs`, compartilhado com a versão legada, que não foi tocado) com a árvore Morte de `v2/scripts/death-tree.mjs`; validação, investimento, devolução (20 de ouro por ponto, dependentes saem junto), exclusividade e orçamento são as mesmas regras. `grimoire.mjs`, `horde.mjs` e `progression.mjs` usam o modelo estendido; `gear.mjs`, `rewards.mjs` e `save-model.mjs` continuam no canônico, de modo que **nenhum equipamento sorteia afixos da Morte** e a distribuição de loot não muda. Os pontos ficam em `horde.profile.ranks` (sem mudança de formato do save; saves antigos não têm esses nós) e `syncSkills` repassa os pontos para `setLichRanks`.

**Rótulos.** As abas do Relicário passaram a *Senhor dos Mortos*, *Carne e Ossos*, *Morte* e *Maestrias*. Só os rótulos de `grimoire-panel.mjs` mudaram; IDs `minions`/`spells`, a versão legada e os guias `docs/mecanicas/` continuam com Minions/Profana.

**Slot e entrada.** `lich` entra em `ACTIONS` (`actions.mjs`), fica disponível com 1 ponto em *Forma da Morte* e é equipado como qualquer habilidade (50 MP, recarga de 20 s). `activateSlot` (`session.mjs`) decide: com a forma ativa, os slots 1 a 6 (cliques, `1`–`6`, `Q E R T`) lançam Ceifada, Foice Giratória, Colheita Tripla, Arco Ceifador, Ciclone e Libertar Forma; transformando, nada é lançado; fora da forma, o slot `lich` entra nela. A barra equipada não é alterada. O Dash continua em `C`/Espaço.

**HUD.** Na forma, o vaso de mana vira o de **ALMAS** (roxo; `document.body.dataset.lich`), mostra almas/máximo, e os seis slots mostram a barra da foice com custo em almas, recarga e "Bloqueada" para o que a árvore ainda não liberou. Clicar num slot da barra abre o seletor de equipamento como antes (ainda não foi tratado na forma).

**Renderização.** `w.player.model` vira `lich` ao transformar e volta a `player` ao sair (na morte, o Lich cai como Lich); o renderizador já recria o ator ao mudar de modelo. `w.lich.pose` (`{anim, progress}`) escolhe e posiciona os clipes `transform`, `slash`, `combo_1..3`, `throw`, `sweep`, `spin` e `catch`, e segura o último quadro do arremesso enquanto a foice está fora. A foice solta é `models.lichScythe`, girando em `renderer.mjs`; os espíritos são esferas azuis com halo, que piscam no último 1,5 s. Rastros e impactos usam os efeitos `slash`, `impact` e `shockwave` de `vfx-events.mjs`.

**Verificação executada.** `node --test v2/tests/*.test.mjs` (275 provas, incluindo `lich.test.mjs` e `lich-integration.test.mjs`), build, e uma conferência manual no navegador integrado: as quatro abas do Relicário e a aba Morte com as duas escolas; o slot *Forma da Morte* (50 MP); entrada pela tecla `E` e pela API; barra de almas, barra da foice com recargas; Lich renderizado na cena, pose `throw` e foice em voo. Não conferi: `slash` e a Colheita visualmente, o Ciclone e o Arco em movimento, fundos claro/escuro, grupo/horda com qualidade baixa e os testes `*-browser-check.cjs` (Playwright não está instalado). Nenhuma captura foi gravada em `review/`.

**Pendências.** Gamepad (entrada de slots do Lich); tratar o clique em slots durante a forma; balanceamento (almas, custos, dano); alinhar as durações dos clipes (`v2/assets/models.json` `durations`) aos tempos das ações; acabamento dos efeitos; HQ/texto de ajuda e tutorial da forma.

## 11. Revisão de animações e efeitos (29/10/2026)

As animações foram revisadas no Blender (via MCP) e os efeitos conferidos no jogo; os detalhes e as medições estão em [blender/notes/lich_v2.md](../blender/notes/lich_v2.md). Em resumo: foice menor (0,95 do corpo, ≈ 2,5 u no jogo) e com o centro da mão sobre o cabo; pés apoiados no chão em todos os clipes; caminhada, golpes, transformação e morte refeitos. Nos efeitos, a foice arremessada ganhou um rastro, o Lich ganhou um anel de aura roxo enquanto a forma dura (maior durante a transformação) e os impactos ficaram menores. Os alcances de dano das habilidades **não** mudaram com o tamanho visual da foice; o rastro desenhado (`slash`) continua mostrando o alcance real.

**Levitação (29/10/2026).** Por pedido do usuário, o Lich flutua: nunca encosta no chão, desliza ao caminhar (sem passos) e tem uma sombra circular no chão. É só apresentação: colisão, movimento e alcance seguem os de Zephyr.

**Voo e foice telecinética (29/10/2026).** O Lich voa (sem passos, também ao atacar) e controla a foice com a mente: ela flutua ao lado dele e orbita nos golpes; as mãos apenas conduzem. O alcance visual dos golpes passou a coincidir com o `range` de dano (≈ 3,4 u). Detalhes em [blender/notes/lich_v2.md](../blender/notes/lich_v2.md). Os clipes e os instantes de contato não mudaram, então nenhuma regra foi alterada.

**Efeitos e visual do Lich (29/10/2026).** Pose de voo parada (pernas juntas apontadas para baixo, braços abertos, só sobe e desce), aura que evapora, vento nos golpes e na foice em voo, cell shading vibrante e espíritos fantasmagóricos. Tudo é apresentação (`vfx.mjs`, `renderer.mjs`, `lich.py`); nenhuma regra mudou. Detalhes em [blender/notes/lich_v2.md](../blender/notes/lich_v2.md).

**Pose de voo (ajuste 29/10/2026).** Pés juntos no centro e mãos abertas com as palmas para a frente, a partir da imagem de referência do usuário. A dissolução da metade de baixo do corpo foi testada e removida. Apenas apresentação.

### Bônus base da forma

Com a forma ativa (após a transformação), todos os golpes da foice recebem +25% de dano, multiplicando os bônus próprios das habilidades. A defesa usada na mitigação recebe +25%; isso aumenta o atributo, não concede 25% de redução direta. Defesa zero continua zero. O Avatar mantém sua redução adicional de 25% do dano recebido. Os atributos permanentes e os saves não são alterados; sair da forma encerra os bônus.
