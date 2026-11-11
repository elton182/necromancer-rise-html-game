# Ato I — João, a carta e Itavera

Implementação em 10/11/2026. Distribuição: `v2/necromancer-3d.html`, gerada por `node v2/tools/build.cjs`.

## Escopo

Bolsa apresentada na conversa da caravana; ordens de captura ligadas à carta e ao interrogatório; carroça saqueada relatada por Marta; pista no acampamento sobre carga e fuga; revelação de João durante o resgate; bolsa e provas separadas no forte; entrega na vila; viagem à praça de Itavera; Helena recebe a denúncia; convite e conclusão do Ato I. A conclusão ativa o marcador `act1` já usado pela campanha antiga.

Saves antigos em `return` e `done` continuam sem repetir o forte ou seus pagamentos. Coletas parciais, entrega e convite persistem separadamente. A chave e a versão do save não mudam. Itavera tem recepção e retorno a Jacarandá; o Ato II continua indisponível.

## Verificações executadas

- `node v2/tools/build.cjs`: distribuição autocontida reconstruída, com o novo módulo e os GLBs locais existentes.
- Testes dos sistemas afetados: 86 aprovados; campanha, prólogo, missão de João, áreas, mapas, jornadas e saves. Resultado em `campaign-tests.tap`.
- Suíte geral da v2: 694 aprovados e quatro falhas, em `full-suite.tap`. As falhas são de Rajada de Gelo, requisitos da árvore do Guerreiro, escudo em voo e dano do combo do Guerreiro. Não foram alteradas as regras dessas classes nesta entrega.
- A primeira execução geral restrita também falhou em seis verificações do servidor do editor por acesso ao servidor temporário. Reexecutadas com acesso local, as nove verificações do arquivo passaram; a suíte geral final inclui essa execução sem falhas do editor.
- `node v2/tests/act-one-letter-browser-check.cjs`: percurso no Edge, WebGL, armazenamento isolado e arquivo local, sem erros de página/console nem buscas HTTP externas. Resultado em `result.json`.
- O percurso confere ajuda a Bruno e madeira antes da pista de Marta; livro; resgate; capitão; bolsa; recarga; provas; retorno; viagem; Helena em desktop e 390 px; recarga; convite; conclusão; retorno a Jacarandá e revisita.
- Capturas de Itavera em zoom máximo e qualidade baixa, com horda nos fundos claro e escuro; continuidade do piso e edificações além dos limites. Diálogos conferidos visualmente, incluindo entrega em 390 px.
- Links locais dos guias conferidos e diff sem erros de espaços.

## Limites

Os encontros do percurso automatizado são vencidos com dano injetado: isso verifica as condições e transições, não a dificuldade de uma partida. A curva de níveis 10–42, composições e prêmios não foram rebalanceados. Itavera é uma praça de recepção com modelos existentes, não uma cidade completa. O sequestro e a viagem final são apresentados por relato e transição; não há cinemáticas inéditas para eles nem modelo exclusivo para Helena.

Uma tentativa de conferir a abertura com o check antigo, em paralelo à suíte geral e a outro navegador, perdeu o instante da animação de queda antes da asserção do modelo. Repetido separadamente, `node v2/tests/prologue-browser-check.cjs` passou: disparo real, queda, caverna, ordens, recarga, Tomás, defesa e chegada a Jacarandá, sem erros ou buscas externas. Evidências em `../arandu-prologue/`.

O acesso a pé à bolsa e à mesa também foi conferido na edição publicada do forte, resolvendo a herança da planta: ambos os pontos estão livres e alcançáveis. Resultado em `published-map-paths.json`.

A distribuição final também foi conferida após os ajustes de apresentação: Helena usa npcTilda, Marta preserva npcLysa, Itavera aparece com o objetivo correto na lista de jornadas, e aceitar o convite ativa act1 no save e no perfil ativo. Resultado em final-distribution.json e captura em final-helena.png.
