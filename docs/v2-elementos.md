# Elementos, Lua Prateada e ritmo de conjuração

Regras atuais da v2. Esta revisão substitui os custos/recargas anteriores dos guias da Druida e do Mago. Valores iniciais, verificados em treino; ainda sem uma campanha completa de balanceamento.

## Forma de lobo

- Vida máxima +40%, preservando a proporção de vida ao entrar e sair da forma. Alternar não cura; equipamento e nível recalculam o bônus corretamente.
- Dano recebido reduzido em 40%, antes da defesa dos equipamentos.
- Regeneração adicional de 0,7% da vida máxima por segundo, inclusive em combate.
- Garras básicas recuperam 1,2% da vida máxima ao acertar pelo menos um inimigo, uma vez por golpe; conservam a recuperação de 3 mana. Errar não cura.
- Corte Sangrento: alcance real de 6 u, três riscos vermelhos e sangramento existente. O impacto inicial cura 12% da vida realmente retirada, limitado a 5% da vida máxima por uso. Sangramento e escudos absorvidos não geram cura.
- Garra de Gelo: alcance real de 4,5 u, três riscos azuis com partículas geladas e uma carga de gelo por inimigo atingido. Conserva sua lentidão própria.

## Acúmulos elementais comuns

`dealDamage` recebe o elemento explícito da origem. Apenas perda real de vida aplica cargas: esquiva, bloqueio e absorção total não aplicam. Fogo/gelo de projéteis, explosões, áreas, armas imbuídas, companheiros, torres e golpes hostis identificados usam esse caminho comum. Explosões físicas de fragmentação continuam físicas.

**Fogo:** até cinco cargas, renovadas por 4 s. A cada 0,5 s, cada carga causa 4% do dano bruto do ataque mais forte que aplicou a queimadura (8% por segundo). Melhorias já existentes, como Imbuir e Flecha de Fogo, podem reforçar essa potência. O dano periódico usa o caminho comum de defesa/morte/crédito, não cria novas cargas e não ignora esquiva ou escudos. Sair da área não remove a queimadura. Texto “Fogo N/5” e anel laranja mostram as cargas.

**Gelo:** até cinco cargas, renovadas por 4 s; cada uma aplica 8% de lentidão (2% em chefes). A quinta congela por 1,5 s, ou 0,5 s nos chefes. Durante o congelamento não há movimento nem novos ataques/conjurações; projéteis e áreas já lançados continuam. A trava não é prolongada por novos acertos: após descongelar há 1 s de imunidade a outro congelamento, ou 3 s nos chefes. A lentidão própria de uma habilidade pode ser maior. Texto “Gelo N/5”/“Congelado” e anel azul mostram o estado.

Vida zerada, reinício e mudança de cena limpam os acúmulos. Não entram no save. O relógio da simulação controla duração e pulsos, inclusive com passos longos; a pausa congela esse relógio.

## Lua Prateada

Selo do ramo Selvagem, nível 12, um ponto, requer Garra de Gelo. Na forma de lobo, **Y**, **7** ou o botão junto à transformação: 50 mana, recarga de 8 s, preparação de 0,3 s e duração de 30 s. G continua reservado à interação com NPCs. Renovar substitui a duração; não acumula bênçãos.

Cada ataque ofensivo liberado na forma de lobo (Garras, Corte Sangrento, Garra de Gelo ou Salto Feroz) evoca um meteoro, mesmo sem acertar o golpe inicial. O cruzado conta como um ataque. O meteoro cai na presa à frente mais próxima da mira, ou no ponto mirado dentro do alcance da ação. Impacto após 0,5 s, raio 1,8 u, 65% do poder natural com bônus de lobo e uma carga de gelo. Paredes bloqueiam os acertos em área. Meteoros não evocam outros meteoros.

Uma lua crescente acima da personagem e o contador no botão indicam a bênção. Ficar humano impede novos meteoros, mas não remove os segundos restantes. Meteoros já evocados resolvem mesmo se a bênção expirar. Morte ou troca de cena remove bênção e quedas pendentes. Nada disso é persistido.

## Custos e recargas atuais

A mana limita a frequência de uso; a redução de recarga dos itens continua valendo. As variantes do Mago conservam as recargas compartilhadas. Faísca, Seta Arcana e Garras continuam sem custo.

### Druida — ambas as formas

| Habilidade | Mana | Recarga base (s) |
| --- | ---: | ---: |
| Faísca | 0 | 0,55 |
| Corrente de Raios | 26 | 1,5 |
| Raízes | 24 | 2 |
| Esquiva | 0 | 3 |
| Tempestade | 42 | 3 |
| Rejuvenescer | 30 | 4 |
| Turbilhão | 18 | 1,5 |
| Tornado | 40 | 3 |
| Lobo | 40 | 3 |
| Calamidade | 70 | 6 |
| Floresta Tropical | 60 | 6 |
| Escudo de Folhas | 35 | 5 |
| Líder da Matilha | 25 | 3 |
| Garras | 0 | 0,42 |
| Salto Feroz | 20 | 1,5 |
| Uivo | 10 | 3 |
| Corte Sangrento | 18 | 1,2 |
| Garra de Gelo | 22 | 1,5 |
| Lua Prateada | 50 | 8 |

### Mago

| Habilidade | Mana | Recarga base (s) |
| --- | ---: | ---: |
| Seta Arcana | 0 | 0,45 |
| Bola de Fogo | 24 | 1,2 |
| Rajada de Gelo | 26 | 2 |
| Esquiva | 0 | própria |
| Teleporte | 20 | 3 |
| Meteoro | 50 | 2,5 |
| Setas Perseguidoras | 26 | 2 |
| Esfera de Gelo | 38 | 2,5 |
| Familiar de Fogo | 50 | 5 |
| Golem de Gelo | 60 | 6 |
| Muralha de Fogo | 40 | 3 |
| Imbuir Fogo | 35 | 4 |
| Imbuir Gelo | 35 | 4 |
| Nova de Gelo | 35 | 2 |
| Chuva de Fogo | 65 | 3 |
| Avalanche | 75 | 5 |
| Raio Arcano | 15 | 2 |
| Clone Arcano | 70 | 6 |
| Big Bang | 65 | 3 |
| Escudo Arcano | 20 | 4 |

O Raio Arcano consome ainda 18 mana/s enquanto canalizado. Teleporte reduz a recarga em 0,25 s por ponto do selo, além da redução por equipamento. Evocações continuam com seus limites de quantidade; recarga menor não permite duplicar golem ou clone.

## Fontes e verificação

- `v2/scripts/elements.mjs` e `combat.mjs`: cargas, pulsos, defesa e limpeza.
- `druid.mjs`, `druid-model.mjs`, `marksman-model.mjs` e `marksman.mjs`: habilidades e balanceamento.
- `docs/habilidades/arvores.json`: catálogo e novo selo; o build regenera `skill-tree-data.mjs`.
- `v2/tests/elements-lunar.test.mjs`: dano aplicado, cargas, expiração, congelamento, cura, alcance, lua e resistência do lobo.
- `v2/tests/elements-moon-browser-check.cjs`: interface real, árvore, botão e Y, efeitos em ambos os fundos, qualidade baixa, fogo e congelamento do Mago, erros de página e requisições remotas.
- Evidências: `review/v2/elements-moon/`, incluindo custos/recargas em `balance.json`.

O teste do servidor do editor de mapas depende de conexões HTTP locais, indisponíveis neste ambiente; está separado das verificações de combate.
