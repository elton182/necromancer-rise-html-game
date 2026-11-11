# Progressão de habilidades por pontos — 09/11/2026

Correção da entrega anterior: 22 nós de Guerreiro (4), Druida (9), Arqueira (6) e Mercenário (3) passaram de um para cinco pontos. Flecha de Fogo já permitia cinco, mas não aplicava escala no código; impacto e queimadura agora recebem os ranks.

## Regra aplicada

- O primeiro ponto mantém os efeitos e danos existentes. Os novos ranks são investimentos normais, sem concessão automática nem perda dos pontos antigos.
- Habilidades ofensivas recebem +10% do dano base por ponto depois do primeiro, até +40%. Isso vale para cada flecha, pena, onda, pulso, impacto, explosão e dano contínuo correspondente.
- Corte Espacial: 230% no primeiro ponto e 322% no quinto, mantendo alcance 14 e ausência de custo/recarga própria.
- Cadência: +10% de dano nos avanços adicionais por ponto após o primeiro, sem aumentar o limite de cinco avanços e sem reaplicar o bônus como multiplicador em cada salto.
- Tornado/Furacão da Druida: somam os bônus de ranks extras, até +80% do dano base com ambos no máximo; os bônus não se multiplicam entre si.
- Planta Carnívora: vida e dano escalam; duração, quantidade e alcance permanecem.
- Rejuvenescer: cura 30% a 50% da vida máxima, +5 pontos percentuais por rank depois do primeiro.
- Uivo: bônus de dano de +25% a +45%, +5 pontos percentuais por rank depois do primeiro.
- Brado: +0,5 s de lentidão e de recuperação dobrada por rank depois do primeiro.
- Postura de Batalha continua um desbloqueio de alternância de um ponto. Nova de Gelo e Chuva de Fogo continuam variantes de um ponto porque já recebem a escala da Rajada/Meteoro. Especializações do Necromante não foram alteradas.

Catálogo e guia gerado sincronizados em [arvores.json](../../../docs/habilidades/arvores.json) e [arvores.md](../../../docs/habilidades/arvores.md). Guias das classes e números da ficha foram atualizados.

## Validação executada

- `node v2/tools/build.cjs`: distribuição autocontida atualizada.
- 190 testes aprovados: classes, habilidades, barra, árvore, combate, efeitos, progressão, saves e redistribuição. [Log](tests.log).
- Testes novos comparam ranks 1 e 5 no runtime: impacto/queimadura, sangramento, Tempestade, Tornado e explosão, planta, cura, Brado, Arremesso, ondas e avanços da Cadência.
- Edge/WebGL 2, arquivo local e perfis isolados: árvore com contadores `5/5` conferidos nas quatro classes e habilidades em combate, com capturas em chão claro/escuro e qualidade baixa. Sem erros de página/console nem requisições HTTP(S). [Resultado](browser-result-warrior-druid-archer-mercenary.json).
- Comando do navegador, na raiz, com evidências nesta pasta: definir `NR_SKILL_REVIEW_DIR=../../review/v2/skill-rank-scaling` e executar `node v2/tests/skill-ideas-revision-browser-check.cjs warrior druid archer mercenary`.

A escala foi verificada por habilidade; equilíbrio entre builds em campanha completa permanece pendente.
