# Verificação — modelos importados da v2

28/10/2026. Primeira passagem de seis inimigos, quatro acessórios, fontes editáveis e exports incorporados ao HTML. Revisão continuada na sessão Blender aberta via MCP, em cena separada; arquivo do Rei preservado. A cena de revisão foi salva em `blender/models/v2_imported_enemies_review.blend`.

## Executado

- Auditoria Blender dos dez originais: `audit.json`.
- Export e verificação de clipes obrigatórios no empacotamento. Build final executado com sucesso; o catálogo também recebeu recursos de campanha de alterações simultâneas, fora desta entrega.
- Testes de inimigos: 22 aprovados, em `enemy-tests.log`.
- Regressão anterior: 76 cenários, em `game-check.log`.
- Conferência dos seis modelos no Edge: `browser-result.json`; matrizes finitas e movimento em todos os clipes; nenhuma requisição HTTP nem erro de página. Capturas nos dois fundos, qualidade baixa e cena com horda nesta pasta.
- Check existente de inimigos E8 executado com sucesso; resultados no destino próprio `review/v2/e8/`.
- Check geral do navegador passou também após o último empacotamento: HTML copiado offline, catálogo completo, movimento/magia, pausa, horda, reinício, saves, importação e diagnósticos. Destino próprio: `review/v2/e8/`.
- Prévias Cycles produzidas em `blender/previews/imported_enemies/`; houve alterações posteriores de empunhadura, portanto essas prévias são registros de iteração. Revisão posterior das poses/caminhada também ocorreu no MCP e nas capturas finais do jogo.

## Limitações

A suíte completa passou inicialmente com 137 testes. Na repetição posterior, após alterações simultâneas de campanha/consumíveis, ficou em 134 aprovados e três falhas em `gear.test.mjs`: catálogo e importação passaram a incluir `recall_scroll`, e a compra teve mudança de regra. Resultado atual em `tests.log`. Esses arquivos de consumíveis não foram alterados nesta entrega para corrigir expectativas da campanha.

Os clipes são uma primeira passagem, sem aprovação artística final de dedos, tecidos e todos os apoios. Os atributos dos três tipos novos usam o Guerreiro como base provisória. Não foi feito benchmark em máquina de referência nem balanceamento completo. A cena com grupo não comprova desempenho em todos os encontros.

## Revisão de equipamentos, altura e asas

Executada na sessão Blender via MCP: redução e reposicionamento de espada, escudo, adaga e cajado; separação de penas em duas asas com ossos independentes dos braços; encaixe nas costas fechado, fragmentos removidos e asas elevadas à linha dos ombros com repouso inclinado para cima. Fontes editáveis e GLBs reexportados; o export agora limita explicitamente a cena ativa para impedir esqueletos e clipes duplicados de objetos compartilhados entre cenas.

A medição final no navegador, em descanso, encontrou 2,2786348 u para o corpo do player e 2,2786347–2,2786351 u para cavaleiro, mago e ladrão. Equipamentos ficam fora dessa normalização e a escala do player foi preservada. O teste exige diferença relativa abaixo de 0,2%.

Verificados voo baixo com clipe `fly`, duas asas ligadas ao tronco, todos os clipes animados, dois fundos e qualidade baixa. Voo usa altura 0,85 u com oscilação 0,09 u, sombra no chão e descida na morte; não altera colisão ou vulnerabilidade. `browser-result.json` registra as alturas e os ossos. São 23 testes de inimigos aprovados em `enemy-tests.log`; a regressão do jogo anterior repetiu os 76 cenários. O check geral do navegador passou após a reexportação dos assets; a conferência final das alturas passou após o último ajuste do normalizador. HTML offline atualizado com sucesso.
