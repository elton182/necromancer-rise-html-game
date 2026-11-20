# Forte da Pedra Negra — 13/11/2026

## Alteração

De seis grupos e 21 inimigos previstos para 12 grupos e 66 inimigos, incluindo três reforços. Seis patrulhas novas cobrem os pátios. O limite de três integrantes cortava os magos do fim das composições: agora grupos comuns conservam quatro a cinco integrantes, e o capitão seis. Níveis 11–13, atributos individuais, loot, requisitos da grade e IDs persistidos foram preservados.

## Validação executada

- `node v2/tools/build.cjs`: HTML autocontido regenerado.
- `node --test v2/tests/itauna.test.mjs v2/tests/nilo-quest.test.mjs`: 26 testes passaram. Incluem rotas acessíveis, grupos sem duplicação, magos, reforços, abertura da grade, memória de limpeza e conclusão permanente do capitão, além do percurso da missão de João.
- `BROWSER_CHANNEL=chrome node v2/tests/fort-density-browser-check.cjs`: passou com armazenamento isolado. Confirmou 12 grupos, 66 inimigos previstos, três reforços, mago vivo no pátio leste, grade fechada/aberta e seis integrantes do capitão. Capturas em qualidade baixa, chão claro e escuro, sem erros de página.
- `BROWSER_CHANNEL=chrome node v2/tests/itauna-browser-check.cjs`: a divergência dos tipos do forte foi resolvida; passou pelo forte e pela gruta, mas o check geral terminou em timeout no critério de chegada do teleporte à vila (fora da alteração desta entrega). O resultado antigo desse check não foi sobrescrito como se fosse desta execução.

## Limites

Não houve avaliação de dificuldade em partida completa. O simulador matemático não representa o posicionamento e a navegação das patrulhas. Os checks usam teleporte, vida aumentada e conclusão injetada para conferir integração; não comprovam equilíbrio de combate.
