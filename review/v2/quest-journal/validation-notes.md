# Missões por NPC e diário — 11/11/2026

## Comportamento verificado

- Joaquim oferece o resgate de Bruno; fechar a conversa não inicia o pedido. Aceitar inicia o HUD e o diário sem conceder recompensa.
- Bruno avança a missão da mina para a forja. A conclusão libera a oferta de madeira por Joaquim; depois das três pilhas e da entrega, Marta oferece a busca de João.
- Resgatar João conclui a busca. A missão da carta começa ao aceitar o pedido dele na vila. Bolsa e provas mantêm progresso parcial independente.
- Viagem a Itavera, entrega a Helena, convite, retorno e revisita preservam o progresso. Ao concluir o percurso, o diário apresenta sete missões concluídas e nenhuma em aberto.
- Saves antigos preservam progresso efetivo e conclusões. As antigas missões automáticas sem progresso viram ofertas; novas aceitações persistem mesmo antes do primeiro objetivo.

## Execução

Na raiz do repositório:

```powershell
node v2/tools/build.cjs
node --test --test-concurrency=2 v2/tests/quest-journal.test.mjs v2/tests/campaign-world.test.mjs v2/tests/nilo-quest.test.mjs v2/tests/prologue.test.mjs v2/tests/save-session.test.mjs v2/tests/itauna.test.mjs v2/tests/character-saves.test.mjs v2/tests/campaign-pacing.test.mjs v2/tests/journey-model.test.mjs
$env:NR_REVIEW_DIR='review/v2/quest-journal'
node v2/tests/act-one-letter-browser-check.cjs
```

Build autocontido concluído. Os 79 testes passaram; saída em [unit-tests.tap](unit-tests.tap). Percurso no Edge com armazenamento isolado aprovado, sem erros de página ou requisições externas: [result.json](result.json).

Conferência visual: [oferta acima do NPC](arrival-quest-offer.png), [diário com missão ativa](journal-smith-active.png), [histórico concluído](journal-complete.png) e [diário em 390 px](journal-mobile.png). A oferta da carta também foi registrada em [letter-quest-offer.png](letter-quest-offer.png).

## Limites

O percurso usa encerramento controlado de encontros para verificar etapas, diálogos, recompensas e recargas do save. Não comprova dificuldade de combate ou balanceamento de todas as classes. O Ato II continua indisponível após o convite.
