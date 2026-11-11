# Sinergias entre habilidades — 09/11/2026

Revisão das seis classes após a solicitação de sinergias, com coeficiente de **2% do dano base por ponto nas outras habilidades do mesmo ramo**, escolhido pelo usuário.

## Abrangência

- Necromante: mantidas as sinergias explícitas existentes (Tiro/Chuva, carne, explosões e grupos), sem sobrepor a regra genérica.
- Guerreiro: Espada e Escudo; Veterano mantém suas interações próprias.
- Druida: Tempestade, Natureza e Selvagem.
- Arqueira: Arco e Caça.
- Mercenário: Besta e Pólvora/Armadilhas.
- Mago: Fogo, Gelo e Arcano, sem misturar elementos.

[coverage.json](coverage.json) cataloga os 167 nós das seis classes, seus máximos, progressão descrita, ramos e referências de código. Essa classificação não afirma que todos os nós sejam ações de dano ou precisem de cinco pontos: há suporte, atributos gerais, variantes e especializações com escala herdada.

## Implementação

O cálculo usa ranks diretos limitados ao máximo de cada nó, excluindo o próprio, passivas gerais e doações duplicadas de variantes. Não lê bônus de equipamento nem resultados de outras sinergias. Soma-se ao bônus próprio, sem realimentação. A interface mostra o bônus recebido, fontes e ganhos próprios por ponto; nos nós de suporte, mostra a contribuição para as outras habilidades.

Incluídos os caminhos de dano de projéteis, áreas, pulsos, queimadura, sangramento, Familiar, cristais, Golem, Clone, falcão, lobos, planta, ondas e reflexão. Vida e controle não recebem automaticamente uma sinergia de dano. As interações condicionais anteriores continuam (Estilhaçar, marca, Ímpeto, posturas, transformação etc.).

Regra completa e exemplos em [docs/habilidades/sinergias.md](../../../docs/habilidades/sinergias.md). Catálogo, guia gerado, guias das classes e mapa de fontes atualizados. Nenhum novo campo de save; os ranks existentes passam a produzir a sinergia ao carregar.

## Verificação executada

- `node v2/tools/build.cjs`: distribuição autocontida regenerada.
- 200 testes aprovados de regras, classes, integração, combate, ficha, árvore gerada, slots, saves e redistribuição. [Log](tests.log).
- Cenários novos em `v2/tests/skill-synergies.test.mjs`: soma ao bônus próprio, isolamento por elemento/classe, exclusão dos próprios pontos, variantes, fontes de contribuição, dano contínuo, invocações, reflexão e sinergias anteriores do Necromante.
- Conferência em Edge/WebGL 2, `file://`, perfis isolados: cinco classes, percentuais de escola no painel, habilidades em combate e capturas em chão claro/escuro com qualidade baixa. [Resultado das cinco classes](browser-result.json).
- Após o ajuste final de texto e ganho próprio por ponto no painel, repetida a conferência do Mago, incluindo suporte contribuindo sem mostrar dano inexistente. [Resultado final do Mago](browser-result-mage.json).
- Capturas nesta pasta; o painel do Mago foi inspecionado visualmente. Sem erros de página/console nem requisições HTTP(S) nos cenários de navegador.

Para reproduzir a conferência nesta pasta, na raiz do projeto: definir `NR_SKILL_REVIEW_DIR=../../review/v2/skill-synergies` e executar `node v2/tests/skill-ideas-revision-browser-check.cjs`.

## Limites

Não foi jogada uma campanha completa para medir equilíbrio entre builds. O simulador de balanceamento não modela todas essas rotações; a revisão não o apresenta como validação de IA. Sinergias podem tornar builds concentradas significativamente mais fortes; os percentuais são iniciais e estão explícitos no catálogo e no painel.
