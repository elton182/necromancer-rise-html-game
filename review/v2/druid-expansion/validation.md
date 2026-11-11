# Expansão da Druida — 10/11/2026

Implementadas as quatro ideias do catálogo: Calamidade, Floresta Tropical, Escudo de Folhas e Líder da Matilha. Todas equipáveis na barra humana; F continua com a transformação. Catálogo JSON, Markdown gerado, ficha e guia da classe atualizados. Fontes anteriores, modelos GLB e mudanças locais preservados.

## Verificações executadas

- `node v2/tools/build.cjs`: distribuição autocontida regenerada com módulos e 56 GLBs locais incorporados.
- `node --test v2/tests/druid-expansion.test.mjs v2/tests/druid.test.mjs v2/tests/class-ideas.test.mjs v2/tests/skill-ideas-revision.test.mjs v2/tests/skill-tree-data.test.mjs v2/tests/skill-loadout.test.mjs v2/tests/skill-synergies.test.mjs v2/tests/combat.test.mjs v2/tests/archer-expansion.test.mjs v2/tests/mage-new-skills.test.mjs`: 109 testes passaram; saída em `tests.log`.
- `node v2/tests/druid-expansion-browser-check.cjs`: Edge/WebGL 2, perfil temporário isolado, distribuição aberta por `file://`. Resultado em `result.json`: árvore, seletor, dano/efeitos, cinco plantas mais a planta das Raízes, consumo da resistência, comando da alcateia, save e limpeza ao voltar ao menu; sem erros de página/console nem requisições HTTP externas.
- Capturas inspecionadas no tamanho 1440 × 900: Calamidade contra grupo em chão escuro, Floresta em chão claro/qualidade baixa, Escudo danificado e alcateia com líder. O teste captura as quatro habilidades em chão escuro/qualidade alta e claro/qualidade baixa, além da árvore.

Os testes específicos cobrem duração e pulsos com diferentes passos de tempo, paredes, custo recusado por alvo/espaço inválido, limite independente das plantas, defesa/barreira/esquiva antes da absorção, transformação, sucessão sem cura ou ressurreição, ataque especial do líder, pontos, barra e estado transitório.

## Limites

Valores iniciais: não houve campanha completa nem avaliação exaustiva de equilíbrio entre builds e modos. O simulador de balanceamento existente extrai regras da versão legada e não representa estas ações da Druida da v2; não foi usado para afirmar equilíbrio de combate. A validação visual usa os modelos animados já existentes e o campo de treino, sem alteração de mapas ou da borda do bioma.
