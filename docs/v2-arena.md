# V2 — Arena Infinita (E10a)

A **Arena clássica** é o primeiro dos três modos da E10. Abre-se na **Vila de Eldrin** pela
**Pedra do Infinito** (monólito ao sul da praça, tecla **G**), que leva à aba **Waves** do
Relicário. A vila só existe depois do Ato I; sem ela a arena não abre. As [Expedições](v2-expedicoes.md) (modelo padrão da aba) estão na E10b; a
**Conquista de Valdoria** ainda não foi portada (veja [limites](#limites)).

## Fontes

| Regra | Fonte |
| --- | --- |
| Quantidade de inimigos, ritmo e fim da wave | `startWave`, `endWave` e o bloco "Modo Infinito" de `necromancer-canvas.html` |
| Escala por wave, progresso, desbloqueio e preço | `scripts/equipment-model.js` (`waveStats`, `progress`, `complete`), via `shared-equipment.mjs` |
| Composição por tipo | `composition()` de `enemies.mjs`, a mesma da campanha |
| Seleção de wave | `gearSelectWave` / `gearRenderWaves` de `scripts/equipment.js` |

Regras calculáveis em `v2/scripts/arena-model.mjs`; integração com o mundo em
`campaign.mjs` (`launchArena`, `tickArena`, `returnAdventure`); tela em `waves-panel.mjs` e
`waves.css`. Nada em `arena-model.mjs` conhece DOM, Three.js ou armazenamento.

## Regras

- **Seleção:** qualquer wave de 1 até a maior liberada (`recorde + 1`, máximo 1000).
  A escolha é gravada e só vale na vila.
- **Corrida:** começa na wave escolhida e sobe uma wave por vez, sem fim, até concluir a 1000.
  Há 3 s antes da primeira wave e 5 s entre as seguintes.
- **Tamanho:** `piso((4 + 2w + piso(w/3)) × 1)`, no máximo 60 inimigos.
  Nascem de 0,6 a 1,2 s uns dos outros, num anel de raio 16 u, a pelo menos 9 u do jogador
  quando possível. A wave só termina com a fila vazia e nenhum inimigo vivo.
- **Escala:** vida ×1,12ᵂ⁻¹, dano ×1,08ᵂ⁻¹ e XP ×1,04ᵂ⁻¹ (com o acréscimo de XP das waves 10+),
  aplicados uma vez em `spawnEnemy`. O nível do loot e das armaduras é a wave atual.
- **Recompensa por wave concluída:** `3 + 2w` de ouro e `20 + 8w` de XP, além dos abates.
  Paga uma vez por conclusão, mesmo ao repetir waves antigas.
- **Recorde:** gravado a cada wave concluída (não ao sair). Repetir waves anteriores mantém o
  recorde; concluir a maior liberada libera a seguinte e a seleciona.
- **Mercador:** na vila vende peças do nível da maior wave liberada (`relicLevel`). Fora da vila
  continua valendo `settings.gearLevel`, a configuração explícita do treino.
- **Saída:** **G** no portal de entrada (a posição de partida) ou o botão da interface
  encerram a corrida; o que foi ganho fica. Morrer também encerra e devolve à vila; o resumo
  aparece como aviso. Equipamentos no chão seguem a regra de coleta ao sair; ao morrer se perdem.
  O campo é limpo (inimigos, projéteis, áreas, drops) e nenhuma entidade entra no save.

## Save

`character.waveProgress` (`best`, `unlocked`, `selected`) e `settings.waveMode`
(`expedition` ou `classic`; padrão `expedition`, como no jogo antigo). Saves anteriores
recebem os padrões. Valores fora de faixa são limitados; `waveProgress` que não seja objeto é
rejeitado. A importação do arquivo antigo aproveita `waveProgress` e o recorde antigo
`camp.eb`, valendo o maior.

## Limites

- Campo aberto de 40 × 40 u, sem cenário próprio nem obstáculos: o jogo antigo sorteava um
  bioma por corrida. O acabamento visual fica para a E11.
- Sem a Conquista de Valdoria: a aba Valdoria, a Pedra do Infinito como ponto de acesso a ela
  e os loots regionais não existem ainda.
- A cadência especial de 4 s do Cão da Cripta na wave 4 do jogo antigo não foi reproduzida; os
  nascimentos usam sempre 0,6–1,2 s.
- Dificuldade em partida longa, desempenho com 60 inimigos e a IA em waves altas não foram
  medidos. Os testes injetam abates para percorrer as waves.

## Verificação

Na raiz: `node --test v2/tests/arena.test.mjs` (regras, seleção, pagamento único, repetição,
saída/morte, save e importação, mercador) e `node --test v2/tests/*.test.mjs` para a suíte
completa; `node v2/tools/build.cjs` regenera o HTML. Conferência manual no navegador integrado
(servidor local, armazenamento da página, sem erros de console): Pedra do Infinito → aba Waves →
wave 1 concluída com recorde gravado → G no portal; wave 13 escolhida com vida ×3,90 e loot nível 13.
Playwright não está instalado, então os `*-browser-check.cjs` não foram reexecutados.
Evidências em [review/v2/e10/](../review/v2/e10/).
