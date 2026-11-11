# Progressão e sinergias de habilidades

Revisão de 09/11/2026, aprovada com **+2% do dano base por ponto nas outras habilidades do mesmo ramo**. A progressão própria dos nós continua existindo: investir em Meteoro melhora Meteoro e também ajuda as outras magias de Fogo.

## Abrangência das seis classes

| Classe | Progressão e sinergias |
|---|---|
| Necromante | Preserva as sinergias explícitas: Tiro de Osso ↔ Chuva de Ossos (+4% por ponto direto), Carne Instável nas explosões, Abominação/Zumbis e bônus compartilhados dos grupos. As especializações de um ponto transformam habilidades cuja progressão vem dos nós de origem. Não recebe a regra genérica por cima dessas regras. |
| Guerreiro | Sinergia de 2% entre os nós de Espada e, separadamente, entre os de Escudo. Cortes, Estocada, giro, ondas, Impacto, Rastro, tornados menores, Arremesso e reflexão recebem o bônus nos caminhos de dano correspondentes. Veterano mantém as relações próprias de Postura/Brado. |
| Druida | Sinergia de 2% em Tempestade, Natureza e Selvagem, cada qual independente. Inclui raios, ventos, garras, sangramento, lobos e Planta Carnívora. |
| Arqueira | Sinergia de 2% entre habilidades de Arco; outra entre as de Caça. Inclui projéteis, ondas, queimadura, explosões, mergulhos do falcão e penas. |
| Mercenário | Sinergia de 2% em Besta e em Pólvora e Armadilhas. Inclui tiros, bombas, pulsos do Molotov, minas, rede e Armadilha de Urso. |
| Mago | Sinergia de 2% em Fogo, Gelo e Arcano, sem misturar elementos. Inclui impacto, chão em chamas, queimaduras, Familiar, cristais, Golem e dano copiado pelo Clone. |

Os nós de atributos gerais, no ramo Passivas, mantêm seus efeitos próprios de dano, vida, recurso etc.; não são doadores adicionais de escola. Habilidades de suporte do ramo também contribuem: investir em cura, controle ou proteção pode fortalecer as ações de dano da mesma escola. A interface distingue contribuição de suporte e bônus recebido pelas habilidades de dano.

## Cálculo

Para uma habilidade de dano comum:

`dano = dano base × (1 + bônus próprio + 0,02 × pontos nas outras habilidades do ramo)`

As sinergias usam somente ranks investidos, limitados ao máximo de cada nó. Não contam o próprio nó, habilidades de outra classe/ramo, dados desconhecidos, bônus de equipamento nem resultados de outra sinergia. Não há realimentação entre habilidades. Bônus condicionais já existentes (marca do falcão, Estilhaçar, Ímpeto, Postura, forma de lobo etc.) continuam nas etapas próprias do combate.

Exemplos com máximos reais do catálogo:

- **Meteoro com 5 pontos** contribui +10% do dano base para as outras magias de Fogo.
- **Bola de Fogo com 3 pontos** contribui +6% para Meteoro, Muralha, Familiar e demais fontes de Fogo.
- **Meteoro com 5 pontos, Bola de Fogo com 3 e Combustão com 5:** +40% próprio e +16% de sinergia; total +56%, sem multiplicar um bônus pelo outro. Base de 320% passa a 499,2%, antes de atributos e outros modificadores.
- **Pontos em Gelo** não fortalecem diretamente uma Bola de Fogo. A interação condicional de Estilhaçar com fogo/arcano continua separada.

## Aperfeiçoamentos, invocações e variantes

- Nova de Gelo e Chuva de Fogo continuam desbloqueios de um ponto, usando os ranks de Rajada/Meteoro. Seus pontos não criam uma doação duplicada para a escola; recebem a mesma sinergia da habilidade de origem.
- Eco Arcano já aprimora diretamente o dano do Teleporte em 25% por ponto. Esse investimento não soma mais 2% ao próprio Teleporte; fortalece as outras ações de Arcano.
- Familiar e cristais usam a escola e os ranks da evocação de origem. O Golem ganha dano com Gelo, mas não vida extra pela sinergia de dano. O mesmo vale para lobos e planta.
- O Clone recebe a sinergia de Arcano no dano copiado, somada sobre sua fração base de 50%; o feitiço repetido mantém sua própria escola. O cálculo usa os ranks originais, sem um clone gerar outro ou realimentar bônus. A cópia de 90% no quinto rank é o valor antes das sinergias.
- Cura, duração, quantidade de invocações, alcance, custo e recarga não crescem automaticamente com uma sinergia de dano. Mantêm suas regras próprias.

## Progressão e saves

As habilidades ofensivas antes limitadas a um ponto nas cinco classes já receberam progressão própria na revisão anterior. Permanecem habilidades de três ou cinco pontos conforme o catálogo; desbloqueios de variante, postura e especializações podem ter um ponto com escala herdada ou função de transformação. Portanto, **um ponto no nó não significa necessariamente dano sem progressão**.

Não há novos campos de save: o bônus é recalculado pelos ranks atuais. Os ids e pontos salvos permanecem. Builds existentes recebem as novas sinergias ao carregar; não recebem pontos gratuitos. Os valores são de balanceamento inicial e ainda precisam de campanha completa jogada.

## Fontes e verificação

- [Catálogo](arvores.json) e [guia gerado](arvores.md): ranks, descrições e ramos.
- `v2/scripts/skill-synergy.mjs`: cálculo de escola e contribuições, sem DOM ou armazenamento.
- Modelos/runtime de cada classe: aplicação ao dano, inclusive invocações e efeitos contínuos. O painel usa as mesmas regras.
- `node --test v2/tests/skill-synergies.test.mjs`: isolamento entre escolas/classes, soma sem realimentação, variantes, queimadura, familiares, golem, clone, lobos, planta, reflexão e preservação das sinergias do Necromante.
- `node v2/tests/skill-ideas-revision-browser-check.cjs`: árvores e combate em Edge/WebGL 2, arquivo local e perfil isolado. Evidências desta revisão em [review/v2/skill-synergies](../../review/v2/skill-synergies/).
