# V2 — Conquista de Valdoria (E10c)

A **Conquista** é o terceiro modo da E10: o território **Pântano da Febre Negra**, com mapa de 17 rotas, influência,
maldições, tenentes e fortaleza. Abre-se na **Vila de Eldrin** pela aba **Valdoria** do Relicário (também pelo botão
**Conquistar Valdoria · Pântano** da aba [Waves](v2-arena.md)). O modelo de regras é o do jogo antigo, sem alterações
(`scripts/endgame-model.js`, gerado como `shared-endgame.mjs`); as regras vigentes estão no
[guia do jogo atual](mecanicas/conquista-valdoria.md). Este documento registra o que a v2 implementa e **o que não**.

## O que existe

| Parte | Onde |
| --- | --- |
| Progresso (`character.conquest`: semente, influência, tenentes, conquista, fragmento, dificuldade, ofertas, rotas) | `save-model.mjs`; normalizado por `Endgame.normalize` |
| Corrida de rota (mapa, encontros, boss, portais, conclusão) | `expedition.mjs` (`launchConquest`, `finishConquest`, `portalAction`) |
| Mapas por bioma (pântano, rio, montanha, além dos cinco da Expedição) | `expedition-map.mjs`, `expedition-scene.mjs` |
| Maldições, poças, Podridão, loot regional | `progression.mjs`, `horde.mjs`, `combat.mjs`, `enemies.mjs`, `rewards.mjs` |
| Aba Valdoria e mapa de rotas (Canvas 2D) | `conquest-panel.mjs`, `conquest.css` |

- **Acesso:** só a partir da vila; sem exigir o fim da campanha (a vila já exige o Ato I na v2). Dificuldade, até três
  maldições entre quatro ofertas e a rota são escolhidas na aba; **Entrar na rota** inicia a tentativa. O modelo
  valida rota, influência, tenentes e dificuldade; erros voltam como mensagem na aba, sem consumir tentativa.
- **Rotas:** as expedições usam o mapa amplo da Expedição, com o bioma da rota, **8 grupos** (tenentes: 4; fortaleza: 6)
  e um líder. Inimigos dormentes, portais e saída seguem a [Expedição](v2-expedicoes.md). Com o líder derrotado, **G** em
  qualquer portal volta à vila e reabre a aba Valdoria. Não altera o recorde nem a seleção da Arena.
- **Escala:** vida, dano e XP pela dificuldade regional (`combatScale`), nível de loot `4 + 6×(D−1) + patamar`;
  chefe × `encounters[kind].hp`. Um a cada cinco inimigos é **infectado** e deixa uma poça ao morrer (aviso de 1,5 s).
  Na expedição comum há quatro poças permanentes junto aos primeiros grupos.
- **Poças:** áreas no chão com aviso (cor clara, sem dano) e depois dano a cada segundo em Zephyr e na horda.
  Usam a mesma lista de zonas hostis das habilidades de inimigos, portanto a horda as evita como as demais.
- **Maldições:** multiplicam vida máxima, regeneração de vida e de mana, movimento, dano causado a inimigos e vida
  das invocações. Valem só na tentativa; o mundo recriado ao voltar à vila as remove (a vida volta cheia, como nas
  demais saídas de encontro da v2).
- **Recompensas e progresso:** conclusão concede ouro, XP, influência (`20 + 2×intensidade`), rotas liberadas e, na
  fortaleza, o **Fragmento da Pestilência** (uma vez) e a dificuldade seguinte. O chefe garante peça rara ou épica
  (chance de épico pelo patamar) e, com intensidade 4+, pode largar o cajado **Osso Carcomido**.
- **Osso Carcomido:** equipado, os acertos do Tiro de Osso aplicam **Podridão**: até 5 cargas, 5 s renovados por acerto,
  um pulso por segundo de 12% do dano bruto do maior projétil por carga, creditado a Zephyr. Vale em todos os modos.
  A propriedade especial é preservada ao salvar e importar; o nome da peça ganha o prefixo "Osso Carcomido".

## Limites e diferenças em relação ao jogo antigo

- **Boss provisório:** como na Expedição, o líder de toda rota é o **Rei Caído** (o Guardião de Almas não existe na v2).
  O jogo antigo atual também troca os líderes pelo Rei, mantendo vida, dano e loot.
- **Sem os golpes regionais** (frascos do Boticário, erupção da Guardiã, restos do Abade): no jogo antigo eles só
  existem com `?bosses=classic`. **Os caldeirões e os restos não foram portados**: não há modelo 3D para eles e, sem as
  habilidades regionais, não teriam efeito. O Boticário, a Guardiã e o Abade usam os golpes do Rei.
- **Tela:** o jogo antigo usa uma tela dedicada de tela cheia com mapa à esquerda e preparação à direita. Na v2 é uma aba
  do Relicário, com o mesmo mapa, mas sem a barra fixa de partida, o zoom do mapa e o seletor "Local do mapa" separado
  (os botões das 17 rotas fazem esse papel). O acabamento fica para a E11. Em telas largas (≥ 1300 px) a aba usa três colunas (mapa, preparação, avanço e recompensas) e cabe sem rolagem a partir de ~900 px de altura; abaixo disso, ou em telas estreitas, rola.
- **Podridão:** não mostra o rótulo "Podridão ×N" sobre o inimigo.
- **Rotas já iniciadas:** recarregar a página encerra a tentativa e preserva o progresso concluído; não restaura o mapa.
- **Maldições e "preservar a proporção de vida" ao sair:** a v2 recria o mundo ao voltar à vila, o que cura. É o
  comportamento da v2 para todo encontro, não uma regra de Valdoria.
- **Não medido:** dificuldade e equilíbrio em dificuldades altas, desempenho com mapas de 85 personagens e poças
  simultâneas, e a leitura das poças nos dois fundos.

## Verificação

`node --test v2/tests/conquest.test.mjs` (save e importação, acesso, rota/escala/infectados/poças, maldições, conclusão
única e recorde da Arena intacto, fortaleza e fragmento, poças com aviso, loot regional, Podridão, morte e recarga) e a
suíte completa `node --test v2/tests/*.test.mjs`; `node v2/tools/build.cjs` regenera o HTML. Conferência manual no
navegador integrado: aba Valdoria com o mapa renderizado, expedição no pântano (57 inimigos dormentes e 4 poças), líder
derrotado com 20% de influência e três rotas liberadas, G no portal reabrindo a aba. Playwright não está instalado; os
`*-browser-check.cjs` não foram reexecutados. Evidências em [review/v2/e10/](../review/v2/e10/).

## Piloto de percurso do Brejo

Nas rotas de tipo expedição com bioma pântano, a v2 usa uma bifurcação: a trilha direta passa por duas formações defensivas; o desvio passa por acampamentos, incluindo o grupo raro existente. Uma patrulha percorre a convergência a 65% da velocidade normal enquanto está sem alerta. Ao detectar jogador, horda ou dano, usa o combate normal; ao perder o alerta, retoma a patrulha. As duas trilhas são desenhadas no chão e livres dos adereços sólidos sorteados.

Continuam oito grupos, 56 inimigos e o chefe, com as mesmas escalas, raridades, poças, recompensas e conclusão pelo chefe. O terreno permanece aberto: as trilhas orientam, mas não obrigam o percurso. Outros biomas, tenentes, fortaleza e Expedições comuns conservam seus mapas. Não há emboscadas nem objetivo de ritual nesta primeira versão.

### Bônus de XP da v2

Abates naturais da rota (incluindo o chefe) e XP de conclusão recebem o multiplicador `(1 + 0,25 × (D − 1)) × (1 + 0,15 × intensidade)`, além da escala regional existente. Na dificuldade 4 com intensidade 6, isso rende 3,325 vezes o XP anterior. Invocações do chefe não recebem esse bônus. Ouro, maestria, loot e atributos de combate preservam os cálculos anteriores. O bônus não depende do nível do personagem e não exige migração de saves.

Acesso na vila: aproxime-se do **Guardião das Waves** (Arena e Expedições) ou da **Emissária de Valdoria** e pressione **G**. Cada NPC abre seu próprio painel; esses acessos não aparecem mais como abas do Relicário. Os NPCs reutilizam modelos animados existentes.
