# Gruta e velocidade de teste — 13/11/2026

- Gruta das Tecelãs: 18 grupos, 94 inimigos previstos com reforços; antes, 13 grupos e 44 inimigos. Mantidos os níveis, dano individual, loot e memória de limpeza.
- Testes: velocidade de caminhada entre 1× e 5×, em passos de 0,5×. Temporária na sessão, sem persistência no save; carregar um personagem volta a 1×.
- Build executado: `node v2/tools/build.cjs`.
- Passaram: `node --test v2/tests/itauna.test.mjs v2/tests/test-tools.test.mjs v2/tests/training-model.test.mjs` (39 testes).
- Passaram no Chrome com contexto isolado: `v2/tests/test-tools-browser-check.cjs` (canal substituído em memória para Chrome) e `BROWSER_CHANNEL=chrome node v2/tests/cave-density-browser-check.cjs`. O Edge fechou na inicialização neste ambiente.
- Conferidos no HTML offline: painel em desktop e 390 px, ajuste/reabertura/reset do controle, composição integrada da gruta, inimigos ativos e capturas em qualidade baixa com chão claro e escuro; sem erros de página nos checks específicos.
- A verificação geral `v2/tests/itauna-browser-check.cjs`, também tentada no Chrome, parou antes da gruta: esperava tipos `[0,1,3,6,9]` no forte, mas a edição publicada resultou em `[0,1,6,9]`. O forte não foi alterado nesta entrega; a gruta foi validada pelo check específico.
- Não foi validada a dificuldade de uma partida completa. O simulador matemático não reproduz a navegação e o posicionamento dos grupos no mapa.
