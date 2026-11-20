# Revisão do forte e do Passo do Cedro — 13/11/2026

## Resultado

| Área | Antes | Depois | Grupos atuais |
| --- | ---: | ---: | ---: |
| Forte da Pedra Negra | 66 inimigos | 212 inimigos | 20 |
| Passo do Cedro | 124 inimigos | 355 inimigos | 37 |

Totais do percurso incluindo levas programadas, não população simultânea. A reserva condicional de quatro soldados de Bento é adicional. Vida e dano individuais, níveis de área e recompensas de missão seguem as regras anteriores; há mais XP/loot por haver mais abates.

O forte recebe oito pontos novos nas rotas centrais e ligações dos pátios, grupos de oito integrantes (dez na guarda do capitão) e seis encontros com duas levas. O Cedro recebe doze patrulhas novas, grupos de sete a dez integrantes e três levas nos dois bloqueios principais. Ambos ativam os encontros mais cedo e as tropas avançam imediatamente. Reforços chegam após 4,5 s por uma posição diferente, sem repetir os líderes únicos. Os gatilhos e callbacks dos outros modos foram preservados: a chamada adicional de onRelease só acontece quando há reinforcementEntry.

A bússola do forte segue entrada → barracas do oeste → treino do leste, com contador 0/3 e marcadores de espadas cruzadas nomeando as posições. G explica as condições. As posições só são tomadas depois de vencer suas levas; a grade abre automaticamente. Após o capitão e sua guarda, o HUD guia contrato na mesa → bolsa no depósito leste. As duas coletas mantêm ! e podem ser feitas em qualquer ordem. A instrução principal do assalto aparece inteira, com rolagem quando necessário. Contagem de inimigos e reforços atualiza mesmo parado.

## Verificação executada

- `node v2/tools/build.cjs`: distribuição autocontida atualizada.
- `node --test` nas suítes `assault-pacing`, `itauna`, `cedro`, `nilo-quest`, `quest-journal`, `town-portal`, `campaign-pacing`, `map-terrain`, `prologue` e `distribution`. As execuções finais correspondentes passaram. `assault-pacing` cobre o fluxo da bússola, o fim obrigatório das levas, entrada dos contra-ataques sem capitão duplicado, grupos novos em save anterior e diário de save antigo com provas já recuperadas.
- `node v2/tests/assault-pacing-browser-check.cjs`, Chrome headless/Playwright, arquivo local, armazenamento isolado. Leitura e troca dos objetivos, contra-ataque com espera real, contador parado, progressão das três posições, abertura da grade, contrato e bolsa por G, três levas do bloqueio de Cedro, acesso ao chefe, combate com horda, fundos claro/escuro em qualidade baixa e tela de 390 px. Sem erros de página ou requisições externas.
- Inspeção das capturas da entrada do forte, aviso de contra-ataque, povoado do Cedro e layout estreito. O objetivo principal está inteiro e o marcador de posição é diferente do marcador de coleta.
- `git diff --check` nos arquivos afetados: sem problemas de espaços.

## Limites

Abates e alguns deslocamentos da conferência são controlados; não foi medida a duração de uma partida nem validada a dificuldade nas seis classes. O simulador matemático atual, consultado em balance-simulator/README.md, não representa rotas, aproximação e aggro desses assaltos da v2. Não foi apresentado resultado matemático como validação de IA. O aumento da população eleva a pressão e a progressão por abates; dificuldade, ritmo e desempenho em outros equipamentos precisam de partidas reais. A conferência estreita não valida controles de toque ou controle físico.

Os IDs e as vitórias anteriores foram preservados. As patrulhas novas de Cedro (19–30) aparecem em saves anteriores sem reiniciar os grupos antigos; sua conclusão também fica salva. As patrulhas comuns do forte conservam a memória por saída, como antes. Mapas, colisões e horizonte visual não foram redesenhados nesta revisão.
