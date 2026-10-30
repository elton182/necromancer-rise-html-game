# V2 — Expedições (E10b)

A **Expedição** é o modelo de waves padrão (`settings.waveMode = 'expedition'`). Abre-se pela
Pedra do Infinito, na aba **Waves** da vila, junto da [Arena clássica](v2-arena.md): ambos
compartilham recorde, desbloqueios, seleção de wave e personagem. A [Conquista de Valdoria](v2-conquista.md)
(E10c) reaproveita este mapa, os dormentes e os portais.

> **Boss provisório:** o jogo antigo usa o **Guardião de Almas** (`soul-warden-model.js`), que
> não existe na v2 (sem modelo, clipes nem IA). A Expedição usa o **Rei Caído** já portado, com
> vida, dano e XP de `R.boss` × a escala da wave (a mesma conta do encontro de treino). Ele usa o
> modelo, as poses, o corte, o salto e a invocação reais do Rei, mas **não é o chefe do original**.

## Fontes

| Regra | Fonte |
| --- | --- |
| Traçado, 12 grupos de 6–8 inimigos, raridades e pesos de loot | `scripts/expedition-model.js`, via `shared-expedition.mjs` |
| Sorteio dos adereços, brasas, avanço de wave, portais, mochila cheia | `scripts/expedition.js` |
| Escala por wave, recompensa e recorde | Iguais à Arena clássica (`waveStats`, `3+2w` de ouro, `20+8w` de XP) |

Arquivos: `expedition-map.mjs` (dados do mapa), `expedition-scene.mjs` (visual procedural),
`expedition.mjs` (corrida, boss e portais), `tickSleep` em `enemies.mjs`.

## Regras

- **Mapa:** campo de 156 × 80 u por wave, determinístico, com uma trilha livre da entrada à saída
  e áreas laterais. O bioma segue o ciclo cemitério, floresta, deserto, tundra e vila. O sorteio
  usa a mesma sequência do jogo antigo; adereços sólidos (árvores, rochas, cactos, colunas, casas,
  gelo, ruínas) ficam fora da trilha, da entrada, da saída e dos grupos.
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

## Limites

- **Rei Caído no lugar do Guardião de Almas**, como dito acima. O balanço de vida/dano do boss
  segue a escala do treino, não a do Guardião, e **não foi balanceado**.
- Cenário provisório: geometria simples, sem iluminação dinâmica; no cemitério e nos demais biomas
  a vegetação vem da floresta. Sem oclusão e sem acabamento (E11).
- As tendências de dificuldade, o desempenho com 85 personagens e o comportamento da horda em um
  mapa tão grande não foram medidos. FPS lido no navegador integrado (aba em segundo plano) não vale.
- Os biomas pântano, rio e montanha pertencem à [Conquista](v2-conquista.md); a Expedição usa os cinco do ciclo.

## Verificação

`node --test v2/tests/expedition.test.mjs` (mapa, 85 dormentes, sono/alerta, conclusão única, avanço
com a horda como estava, mochila cheia, saída/morte, wave 1000, loot do boss) e a suíte completa
`node --test v2/tests/*.test.mjs`; `node v2/tools/build.cjs` regenera o HTML. Conferência manual no
navegador integrado, sem erros de console: entrada pela Pedra, boss derrotado no cemitério com
recorde gravado, G no portal final levando à wave 2 (floresta), grupo acordando por proximidade.
Playwright não está instalado; os `*-browser-check.cjs` não foram reexecutados.
Evidências em [review/v2/e10/](../review/v2/e10/).

Acesso na vila: aproxime-se do **Guardião das Waves** (Arena e Expedições) ou da **Emissária de Valdoria** e pressione **G**. Cada NPC abre seu próprio painel; esses acessos não aparecem mais como abas do Relicário. Os NPCs reutilizam modelos animados existentes.
