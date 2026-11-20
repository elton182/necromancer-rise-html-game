# Diário e atlas da região — 11/11/2026

## Entrega

O diário agora tem índice de missões abertas/concluídas, seleção com destaque, responsável, próximo passo, barra de progresso e linha de etapas. Em tela estreita, o índice fica acima dos detalhes. Nenhuma regra de missão, prêmio ou save foi alterada.

O atlas em M foi redesenhado como carta em pergaminho, com terreno, água, vegetação, construções, estradas, marcos, nomes, rosa dos ventos e escala. Os dados vêm das coordenadas e do terreno existentes. A coluna lateral traz destinos, lista de lugares e legenda. Controles ampliam/reduzem, restauram a visão geral e localizam o jogador. Rótulos e símbolos aumentam proporcionalmente em telas estreitas.

O mapa fica acima do HUD, e M continua funcionando após usar os botões. Campos de edição e seletores conservam sua entrada normal. O minimapa e o atlas das fases antigas permanecem com suas apresentações existentes.

## Verificação executada

Na raiz do repositório:

```powershell
node v2/tools/build.cjs
node --test v2/tests/quest-journal.test.mjs v2/tests/campaign-world.test.mjs v2/tests/nilo-quest.test.mjs v2/tests/itauna.test.mjs
node v2/tests/journal-map-browser-check.cjs
```

Build autocontido concluído. Os 40 testes de regras e integração passaram. A conferência no Edge usa contexto novo com armazenamento isolado e cobre seleção de missão ativa/concluída, etapas, M para abrir/fechar, pausa, controles de ampliação, localização e destaque de lugar. O resultado final é registrado em [result.json](result.json), incluindo erros de página e requisições externas.

Capturas: [diário ativo](journal-active.png), [registro concluído](journal-completed.png), [diário em 390 px](journal-mobile.png), [Jacarandá](map-jacaranda.png), [Itaúna](map-itauna.png), [gruta](map-itauna-cave.png), [forte](map-itauna-fort.png), [Itavera](map-itavera.png), [personagem ampliado](map-player-zoom.png), [marco selecionado](map-selected-mine.png), [fundo claro e qualidade baixa](map-light-low.png) e [atlas em 390 px](map-mobile.png).

## Limites

A conferência visual usa estados controlados de campanha e viagens diretas entre regiões; não é um percurso completo de combate nem uma avaliação de balanceamento. A cartografia é esquemática: não representa cada objeto GLB e não calcula rotas automáticas. A navegação por controles físicos não foi testada nesta entrega.
