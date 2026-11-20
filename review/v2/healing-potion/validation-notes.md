# Poção de cura — validação

Implementação na v2: 3 goles; 50% da vida máxima no momento do uso em 5s; 10 abates válidos recarregam um gole. Estado parcial de 0 a 30 persistido por personagem. Cura não acumula e é limpa na morte e troca de cena.

O botão foi encaixado na base da moldura do orbe de vida, com tecla B, contador de goles, líquido e barra de três segmentos. Detalhes de recarga e tempo restante ficam no tooltip e no nome acessível.

## Verificações executadas

- `node v2/tools/build.cjs`: distribuição autocontida atualizada (75,4 MiB).
- `node --test v2/tests/healing-potion.test.mjs v2/tests/save-session.test.mjs v2/tests/progression.test.mjs v2/tests/combat.test.mjs v2/tests/distribution.test.mjs v2/tests/expedition.test.mjs`: 60 testes passaram.
- `$env:BROWSER_CHANNEL='chrome'; node v2/tests/healing-potion-browser-check.cjs`: passou em contexto isolado, abrindo o HTML local. Tecla B, clique, bloqueio de repetição, cura real em 5s, recarga fracionada e ausência de erros de página.
- Capturas inspecionadas em 1440×900 e 390×844; fundos claro/escuro e qualidade baixa. O botão permanece dentro do HUD, acessível ao clique e abaixo dos números de vida. Resultados em `result.json`.

## Limites

O Edge encerrou ao iniciar neste ambiente; a verificação foi concluída no Chrome. Os valores são um balanceamento inicial, sem partida completa de campanha. O simulador matemático em `balance-simulator/` representa regras legadas e não modela este novo frasco ou a decisão do jogador de beber. A regressão do HUD foca o botão; elementos preexistentes do menu superior já excedem a largura de 390 px.
