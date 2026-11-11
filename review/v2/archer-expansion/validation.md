# Expansão da Arqueira — 10/11/2026

Implementados na v2: Marca do Caçador (evolução de F), Disparo Preciso, Rasante Relâmpago, Saraivada Múltipla (cinco flechas para cada um de até cinco alvos), Chuva Explosiva, Emboscada em Dupla, Impacto Feroz e raio por ponto na Chuva básica. Catálogo JSON atualizado e Markdown regenerado pelo gerador do editor. Fontes e regras no guia `docs/v2-arqueira-mercenario.md`.

## Verificação executada

- `node v2/tools/build.cjs`: HTML autocontido gerado, módulos e 56 GLBs locais incorporados.
- `node --test v2/tests/archer-expansion.test.mjs v2/tests/marksman-new-skills.test.mjs v2/tests/marksman-skills.test.mjs v2/tests/skill-tree-data.test.mjs v2/tests/skill-synergies.test.mjs v2/tests/skill-loadout.test.mjs v2/tests/combat.test.mjs v2/tests/mage-new-skills.test.mjs`: 79 testes passaram; saída em `tests.log`.
- `node v2/tests/archer-expansion-browser-check.cjs`: Edge, perfil temporário isolado, HTML aberto por `file://`. Conferidos painel, barra, comando F, dano, movimento do falcão, efeitos das sete habilidades e persistência dos pontos. Resultado em `result.json`: sem erros de página/console nem requisições HTTP externas.
- Capturas inspecionadas: árvore de talentos, Saraivada Múltipla contra grupo, falcão e Chuva Explosiva em chão claro com qualidade baixa. O teste também capturou chão escuro, preparação do Disparo, Marca, Emboscada e penas do Impacto Feroz.

## Limites e ocorrência separada

Na regressão adicional de `v2/tests/mage.test.mjs`, o teste “Rajada de Gelo: cone de 70°, dano e lentidão; Estilhaçar aumenta fogo e arcano nos lentos” falha (69 contra 81 esperado). O cenário solicita `{frost:1,imbuirGelo:1,shatter:3}` sem `icenova`, exigido por Imbuir Gelo no catálogo já existente; a normalização remove Imbuir e Estilhaçar. Essa cadeia do Mago não foi alterada nesta entrega.

O simulador em `balance-simulator/source.js` extrai a versão legada e não modela estas ações da Arqueira da v2. Não foi usado como validação de balanceamento. Valores iniciais precisam de avaliação em campanha completa; capturas de treino não comprovam o equilíbrio de todas as builds ou modos. Não houve alteração de fontes canônicas compartilhadas ou de modelos Blender nesta entrega.
