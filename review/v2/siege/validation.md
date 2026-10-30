# Validação do Cerco ao Ritual

- Distribuição gerada por node v2/tools/build.cjs; obelisco e quatro torres incluem rig, idle e attack, sem recursos externos.
- 76 testes de integração aprovados (Cerco, campanha, Expedições, Conquista, horda e equipamentos). Log: integration-tests.log.
- Browser: entrada pela vila, quatro torres, melhoria, guardiões, horda Nv.24, rotas, alcance, claro/escuro, qualidade baixa, vitória, derrota; sem erros de página nem requisições remotas. browser-result.json e capturas.
- Motor real: estratégia fixa sem jogador perde na onda 8 normal, 5 couraçada e 6 rápida; build fixa Nv.24 com horda e Tiro automático vence as oito ondas nos três modificadores. simulation-result.json; não comprova todas as builds ou graus altos.
- A suíte geral registrou inicialmente 316/318 aprovados. Conferência posterior dos dois arquivos: 11/12 aprovados; Ladino/Orc passou. Permanece falha em arena.test.mjs: espera o nome Pedra do Infinito, mas a vila usa Guardião das Waves. Não foi alterada a nomenclatura existente para corrigir esse teste fora do cerco. Logs: unit-tests.log e other-failures.log.
- Saves e recursos dos testes são isolados; a vitória acelerada do navegador verifica integração e não balanceamento de partida.

## Interface por proximidade

Painel de construção e seleção de alcance desaparecem longe dos pedestais durante ondas. Até 3,2 u, o painel abre para o pedestal mais próximo; sair do raio fecha e limpa a seleção. Grade de seleção remota removida; preparação e início de onda continuam disponíveis. Dez testes do cerco aprovados; navegador offline sem erros, com aproximação, seleção automática, melhoria e afastamento, claro/escuro e qualidade baixa. Evidência nova: tower-near-dark.png; active-dark.png e active-light-low.png mostram o combate livre do painel.
