# V2 — efeitos visuais de combate

Revisão de efeitos da v2: invocação com círculos de runas, lançamento do Tiro de Osso, golpes e áreas dos inimigos e
as duas fases do Rei Caído. As mudanças de regra do Rei estão em [v2-inimigos.md](v2-inimigos.md#revisão-do-rei-na-v2-mudança-de-regra);
o resto é só visual e não altera dano, custo, alcance, colisão nem recarga.

## Como funciona

- `v2/scripts/vfx-events.mjs` (sem Three.js, testável em Node): a simulação registra eventos em `w.effects` com o campo
  `fx` (`impact`, `slash`, `shockwave`, `summonRune`, `summonBurst`, `dangerRune`, `fireField`, `boltCast`, `muzzle`,
  `roar`, `projectile`). Eventos pontuais têm teto de 80 simultâneos (`MAX_ONE_SHOT`); o excedente é descartado.
- `v2/scripts/vfx.mjs` (Three.js): lê esses efeitos e o estado do mundo e desenha marcas no chão (texturas procedurais de
  círculo rúnico, geradas em canvas, sem arquivos novos), colunas de luz, um único `Points` para partículas e o tremor da
  câmera. Efeitos legados (anéis simples, sem `fx`) continuam no caminho antigo do renderizador.
- O renderizador só lê. Se algo falhar no desenho, os efeitos se desativam, com um erro no console, e o jogo segue.
- Qualidade baixa reduz a densidade de partículas para 40%. Pausa congela partículas e marcas.
- `vfx.mjs` e `vfx-events.mjs` estão registrados em `v2/tools/build.cjs` (chaves `v2-vfx` e `v2-vfx-events`);
  `node v2/tools/build.cjs` na raiz gera `v2/necromancer-3d.html`.

## O que o jogador vê

| Momento | Efeito | Fonte do evento |
| --- | --- | --- |
| Invocar, equipar ou levantar integrante da horda | Dois anéis de runas girando em sentidos opostos, coluna de luz e fagulhas, na cor da habilidade do grupo; não aparece na formação inicial | `horde.mjs` (`summonFx`, em `equipGroup` e `restore`) |
| Tiro de Osso | Clarão e faíscas na mão do cajado, na direção da mira, anel rúnico sob os pés; osso deixa rastro e impacto com faíscas | `combat.mjs` (`castBolt`, `updateProjectiles`) |
| Golpe de inimigo que causa dano | Faíscas e clarão no corpo atingido, com cor por tipo de inimigo | `dealDamage` (só dano com `source.team==='enemy'` que tirou vida; Dash, barreira e escudo de osso não geram faísca) |
| Golpe corpo a corpo | Rastro em arco na direção do alvo | `enemies.mjs` (`hurt`) |
| Área de inimigo (golpe pesado, salto, erupção) | Círculo rúnico de perigo que se enche até a borda no instante do dano; onda de choque ao acertar; a erupção deixa chão em chamas | `enemies.mjs` (`mark`, `area`) |
| Disparo de arqueiro/mago | Clarão de saída, orbe e rastro no projétil | `enemies.mjs` (`shoot`, `tickHostiles`) |
| Acólito de Guerra | Círculo rúnico fixo na aura de Litania | `enemies.mjs` |
| Rei: Corte Real | Arco de fogo com faíscas e chamas na borda | `fallen-king.mjs` |
| Rei: Queda do Rei | Círculo rúnico de perigo enchendo até o pouso, onda de fogo com tremor, chão em chamas | `fallen-king.mjs` |
| Rei: Chamado da Coroa | Anel rúnico grande sob o Rei e círculos nos pontos de chegada, enchendo durante a invocação; colunas de luz na chegada | `fallen-king.mjs` |
| Rei: fase II | Rugido (círculo de perigo, pilares de fogo em anel, onda grande, tremor) e depois aura permanente com runa sob os pés e brasas | `fallen-king.mjs`, `vfx.mjs` (aura lida de `w.boss.kingPhase2`) |

### Fogo

Chamas, brasas e fumaça são partículas de uma camada própria (`vfx.mjs`). A chama é um shader procedural com ruído animado,
rampa de cor do vermelho ao amarelo quente e mistura aditiva, de modo que as labaredas se fundem em vez de formar silhuetas
isoladas. O chão em chamas (Queda do Rei, Erupção do Mago) é uma mancha queimada de borda irregular, com rachaduras
incandescentes que pulsam, labaredas, brasas e um pouco de fumaça; a mancha escura mantém a leitura em chão claro.

### Elites de Expedição (mágicos e raros)

Os multiplicadores de vida, dano, velocidade, XP e loot já existiam (ver [v2-expedicoes.md](v2-expedicoes.md)), mas não havia
nada que os mostrasse. Agora, para inimigos mágicos e raros vivos até 40 u do jogador:

- círculo rúnico sob os pés, azul (mágico) ou dourado (raro), com fagulhas; o raro solta pequenas chamas;
- rótulo flutuante "Tipo · Raridade" na cor da raridade, dentro de 26 u do jogador (também mostra a Maldição da Fraqueza);
- modelo desenhado 12% (mágico) ou 25% (raro) maior; só a aparência muda, o raio de colisão continua o lógico;
- ponto maior e colorido no minimapa.

Todo aviso que representa dano segue a geometria real: o raio desenhado é o raio aplicado, e o preenchimento acompanha o
tempo restante da preparação (`progress`). A horda continua tratando `kingWarning`, `enemyWarning` e `hostileZone` como
perigo.

## Validação

- `node --test v2/tests/combat-fx.test.mjs` cobre a simulação: raios maiores, fogo que acaba sozinho, transição única,
  relógio da fase II, corte encadeado, avisos de invocação, limpeza na morte, faíscas só com dano, círculos de invocação e o
  teto de efeitos.
- Conferência visual no navegador integrado (Chromium), carregando `v2/necromancer-3d.html` por um servidor estático local e
  avançando a simulação real quadro a quadro. Capturas em [review/v2/combat-fx/](../review/v2/combat-fx/): fundo escuro e
  claro e qualidade baixa para a Queda do Rei, claro para o Chamado da Coroa, além de invocação, Tiro de Osso, golpe de
  inimigo, Corte Real, rugido, altura do Rei e elites mágico/raro. O console mostrou só 404 de recurso, um por carga da página, vindo do servidor estático local; nenhum erro de script.
- Não foram executados: os `*-browser-check.cjs` (Playwright não está instalado neste repositório; o de inimigos teve o
  cenário do Chamado da Coroa ajustado para a fase II, pois agora a transição ocupa o Rei antes), desempenho em outras
  máquinas, nem conferência com controle físico. Sons novos não foram criados; os eventos continuam usando os sons atuais.
