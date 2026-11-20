# Passo do Cedro — validação

Implementação de 13/11/2026. Fontes e regras em [campanha](../../../docs/v2-campanha.md#passo-do-cedro--romper-o-cerco-13112026).

## Executado

- Build: `node v2/tools/build.cjs`, HTML autocontido com 75,4 MiB.
- Testes Node: `cedro`, `nilo-quest`, `itauna`, `quest-journal`, `town-portal`, `campaign-world`, `combat`, `enemies`, `save-session`, `distribution`, `journey-model` e `map-model`, em `v2/tests/*.test.mjs`. Todos passaram nas execuções finais correspondentes. Os testes da campanha receberam os novos campos padrão e o fluxo anterior de João agora percorre o cerco antes de Itavera. Fixtures anteriores ao Selo de Jacarandá foram ajustadas para representar o selo já recebido quando o teste trata de outra missão.
- Chrome headless/Playwright: `$env:BROWSER_CHANNEL='chrome'; node v2/tests/cedro-browser-check.cjs`. Caminho do HTML aberto por `file:`, contexto e armazenamento isolados. Aceitação pela interface, viagem, atlas, abates pelo caminho comum de dano, objetivos opcionais, abertura dos portões, checkpoint, combate do chefe, horda real de zumbis, retorno à vila, prêmio e liberação de Itavera. Sem erros de página e sem requisições HTTP/HTTPS.
- Capturas com zoom máximo, borda do mapa, fundos claro/escuro e qualidade baixa; conversa em 390 px. Inspeção das capturas de borda, combate e horda. Piso e bioma continuam além do limite jogável.
- Conferência adicional em Node: saída de Jacarandá para Cedro em (82, 94) livre de colisor e capaz de solicitar a viagem.

O Edge não iniciou neste ambiente (fechamento do processo durante launch). A conferência completa foi feita no Chrome.

## Limites

As viagens e os abates do roteiro de navegador são controlados. Não foi realizada uma partida completa com cada classe. A duração de 30–45 minutos e a dificuldade ainda precisam de playtest; os números não passaram pelo simulador de balanceamento. Bento reutiliza provisoriamente o soldado GLB animado com espada, escala e tinta próprias; a alabarda e um modelo exclusivo não foram produzidos. O ultimato é narrado pelo vigia Rafael e por João, sem cinemática de Bento diante da vila. Não há cronômetro global nem ataque simulado contra a vila.
