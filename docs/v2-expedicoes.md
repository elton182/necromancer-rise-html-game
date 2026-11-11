# V2 — Expedições (E10b)

A **Expedição** é o modelo de waves padrão (`settings.waveMode = 'expedition'`). Na praça de Jacarandá ou na Vila de Eldrin, aproxime-se do **Guardião das Ondas**, pressione **G** e escolha Expedições. A [Arena clássica](v2-arena.md) abre pelo mesmo serviço; ambos compartilham recorde, desbloqueios, seleção de wave e personagem. A [Conquista de Valdoria](v2-conquista.md) reaproveita os encontros dormentes e os portais.

> **Boss provisório:** o jogo antigo usa o **Guardião de Almas** (`soul-warden-model.js`), que
> não existe na v2 (sem modelo, clipes nem IA). A Expedição usa o **Rei Caído** já portado, com
> vida, dano e XP de `R.boss` × a escala da wave (a mesma conta do encontro de treino; a vida também leva o ×12 de `V2_KING.hp`). Ele usa o
> modelo, as poses, o corte, o salto e a invocação reais do Rei, mas **não é o chefe do original**.

## Fontes

| Regra | Fonte |
| --- | --- |
| Traçado, 12 grupos de 6–8 inimigos, raridades e pesos de loot | `scripts/expedition-model.js`, via `shared-expedition.mjs` |
| Sorteio dos adereços, brasas, avanço de wave, portais, mochila cheia | `scripts/expedition.js` |
| Escala por wave, recompensa e recorde | Iguais à Arena clássica (`waveStats`, `3+2w` de ouro, `20+8w` de XP) |

Arquivos: `expedition-map.mjs` (plano, Brejo e conversão para arena), `expedition-biomes.mjs` (cenário por bioma),
`expedition-scene.mjs` (desenho), `expedition.mjs` (corrida, boss e portais), `tickSleep` em `enemies.mjs`.

## Regras

- **Mapa:** campo de 156 × 80 u por wave, determinístico, com uma trilha livre da entrada à saída
  e áreas laterais. O bioma segue o ciclo cemitério, floresta, deserto, tundra e vila. Trilha e grupos
  vêm do plano do jogo antigo; o cenário é gerado no formato dos mapas do editor (como a Várzea de Itaúna),
  ver [Cenário por bioma](#cenário-por-bioma).
- **Encontros:** 12 grupos (84 inimigos) e o boss, todos dormentes no ponto de origem. O inimigo
  **acorda** quando o jogador está a menos de 11 u, um aliado a menos de 7 u, ou ao sofrer
  dano. **Perde o alerta** além de 30 u sem ninguém por perto e volta ao ponto de origem. Dano
  causado de mais de 30 u não acorda, como no original. Não há nascimentos periódicos.
- **Raridades:** mágico vida ×1,9, dano ×1,3, velocidade ×1,08, XP ×2, 55% de equipamento (mágico
  ou melhor); raro vida ×3,4, dano ×1,65, velocidade ×1,12, XP ×4, equipamento garantido
  (raro 85%, épico 15%); comum 16% de equipamento. Aplicados sobre a escala da wave, uma vez.
  Elites mágicos e raros têm círculo rúnico azul/dourado, rótulo com a raridade, modelo maior e ponto colorido no
  minimapa ([efeitos visuais](v2-efeitos-visuais.md#elites-de-expedição-mágicos-e-raros)).
- **Boss:** derrotá-lo conclui a wave: recorde, `3+2w` de ouro e `20+8w` de XP, uma vez, e abre
  o portal final. Garante equipamento raro (75%) ou épico (25%). Não é preciso matar os outros
  grupos. A barra e a música de chefe só aparecem depois que ele acorda.
- **Portais:** **G** no portal inicial encerra a corrida (resumo como aviso; o que foi ganho fica).
  Com o boss derrotado, **G no portal final** vai para a wave seguinte; na wave 1000 devolve à vila.
- **Transição:** jogador e horda seguem com a vida, os atributos e as recargas que tinham; ninguém
  é curado ou reanimado. Equipamentos permitidos pelo filtro são recolhidos antes da troca; se não
  couberem na mochila, o avanço é recusado com aviso. Peças abaixo do filtro não bloqueiam e se perdem.
  Efeitos, projéteis e áreas do mapa anterior são removidos; as recargas das magias não são zeradas.
- **Morte/saída:** como na Arena: devolve à vila, limpa o campo e mantém o recorde. Nada do encontro
  entra no save.

## Cenário por bioma

`expedition-biomes.mjs` monta, para cada wave, um documento de mapa com relevo, água, trilha pintada, peças do kit
do Blender e estilo de luz; `toArena` (editor) o converte e `expedition-map.mjs` o desloca para o referencial do plano.

| Bioma | Luz e chão | Relevo e água | Lugares |
| --- | --- | --- | --- |
| Cemitério | Noite fria, névoa | Vale com encostas, uma lagoa escura | Cemitérios murados, mausoléu, santuário, acampamento; pinheiros escuros e árvores mortas |
| Floresta | Manhã quente | Colinas, duas lagoas | Acampamentos, ruínas com arco, ninho de aranhas, santuário; mata fechada, troncos e tocos |
| Deserto | Seca, areia | Dunas, encostas altas, oásis | Ruínas, carroças abandonadas, acampamento, santuário; afloramentos rochosos e ossadas |
| Tundra | Inverno, neve | Encostas altas | Acampamento, posto de vigia, círculos de pedras, ruínas; pinheiros com geada |
| Vila | Entardecer | Colinas baixas, lagoa | Sítios em ruína (casa, cerca, poço ou carroça), feira, pomar; placas na estrada |
| Pântano (Conquista) | Charco, névoa | Charcos rasos espalhados | Santuário, cabanas, lápides musgosas; árvores mortas |
| Rio (Conquista) | Meio-dia | Rio fundo na margem com mais espaço, píer | Acampamentos, ruínas, sítio |
| Montanha (Conquista) | Névoa fria, pedra | Encostas de penhasco | Posto de vigia, círculos de pedras, ruínas; afloramentos |

- **Garantias** (testadas em todos os biomas e no Brejo): o relevo é aplainado e seco a até 4,5 u da trilha, do desvio e das
  patrulhas, a 6 u dos grupos, na entrada e na clareira do chefe. Peças com colisão ficam a mais de 4,8 u da trilha,
  5,6 u do centro dos grupos, 7 u da entrada e 11 u do chefe; todos os inimigos, patrulhas, chefe e portal final são
  alcançáveis a pé a partir da entrada. A trilha não tem água nem lentidão.
- **Mudança de regra:** fora da trilha agora há relevo, água rasa (−40% de velocidade, como nos mapas do editor),
  água funda e encostas que bloqueiam, e terreno alto (+20% de dano em quem está abaixo). Os colisores sorteados
  mudaram de posição e de tipo (o sorteio do jogo antigo deixou de ser usado). A trilha e os encontros são os mesmos.
- **Borda infinita:** o chão pintado continua além do campo, e a mata de borda (`forest-border.mjs`) usa a mistura e o
  tom do bioma; o deserto fica só com a areia e as encostas rochosas.
- **Visual:** vegetação do kit da natureza com tom por bioma (geada na tundra, verde gasto no cemitério e na montanha,
  mato seco no deserto) e a receita de luz dos mapas de floresta (`scene-look.mjs`), ajustada pelo estilo do bioma.

## Limites

- **Rei Caído no lugar do Guardião de Almas**, como dito acima. O balanço de vida/dano do boss
  segue a escala do treino, não a do Guardião, e **não foi balanceado**.
- Cactos, gelo e lápides simples do gerador antigo não são mais usados (não há peças do kit para eles); o deserto e a
  tundra se apoiam em rochedos, ossadas, ruínas e acampamentos. Sem iluminação dinâmica.
- O equilíbrio com o relevo novo (água, encostas e terreno alto fora da trilha) não foi testado em partida real.
- As tendências de dificuldade, o desempenho com 85 personagens e o comportamento da horda em um
  mapa tão grande não foram medidos. FPS lido no navegador integrado (aba em segundo plano) não vale.
- Os biomas pântano, rio e montanha pertencem à [Conquista](v2-conquista.md); a Expedição usa os cinco do ciclo.

## Verificação

`node --test v2/tests/expedition-biomes.test.mjs` (oito biomas e o Brejo: trilha seca e livre, alcance a pé de todos os
inimigos, patrulhas, chefe e portal, estilo e relevo próprios, determinismo) e `node v2/tests/expedition-biomes-browser-check.cjs`
(lançamento real das waves 1 a 5 pela vila, biomas da Conquista, capturas da entrada, do meio, do chefe, da borda com zoom
máximo e de fundo claro com qualidade baixa; evidências em [review/v2/expedition-biomes/](../review/v2/expedition-biomes/)).
No Edge com WebGL (Intel Iris Xe, 1440 × 900): 157 a 182 chamadas de desenho e 437 mil a 597 mil triângulos na entrada.

`node --test v2/tests/expedition.test.mjs` (mapa, 85 dormentes, sono/alerta, conclusão única, avanço
com a horda como estava, mochila cheia, saída/morte, wave 1000, loot do boss) e a suíte completa
`node --test v2/tests/*.test.mjs`; `node v2/tools/build.cjs` regenera o HTML. Conferência manual no
navegador integrado, sem erros de console: entrada pela Pedra, boss derrotado no cemitério com
recorde gravado, G no portal final levando à wave 2 (floresta), grupo acordando por proximidade.
Na entrega original (E10b), Playwright não estava instalado e os `*-browser-check.cjs` não foram reexecutados.
Evidências em [review/v2/e10/](../review/v2/e10/).

Acesso na vila: aproxime-se do **Guardião das Ondas** (Arena e Expedições) ou da **Cartógrafa de Valdoria** e pressione **G**. Cada NPC abre seu próprio painel; esses acessos não aparecem mais como abas do Relicário. Os NPCs reutilizam modelos animados existentes.

Os serviços também estão na praça de Jacarandá, no mundo contínuo: G com o Guardião abre ondas/expedições, com a Cartógrafa abre a Conquista e com o Mestre do Cerco abre defesa de torres. Basta alcançar a vila; não é necessário marcar o Ato I como concluído. Os NPCs têm nome e modo indicados sobre o personagem. Sair de uma tentativa retorna à praça e preserva as quests.
